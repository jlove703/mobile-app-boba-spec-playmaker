// Alpha Labs shared-password access gate for Vercel Edge Middleware.
// Requires ALPHA_APP_PASSWORD and ALPHA_SESSION_SECRET in Vercel environment variables.
const COOKIE = 'alpha_playmaker_session';
const DAYS = 14;
const encoder = new TextEncoder();
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
async function signature(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));
}
function html(message='', status=200) {
  const safe = message === 'incorrect' ? 'Incorrect password. Please try again.' : message === 'config' ? 'App access has not been configured. Ask the Alpha Labs administrator to set the Vercel environment variables.' : '';
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#081b10"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/icons/icon-192.png"><title>Alpha Labs • Private Access</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:#081b10;color:#f6fff0;font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;padding:22px}.card{width:min(100%,400px);border:1px solid #3c6c39;border-radius:20px;padding:30px 24px;background:#11251a;text-align:center;box-shadow:0 20px 80px #0006}img{width:145px;height:145px;object-fit:contain}h1{font-size:23px;margin:12px 0 4px;color:#b7fb56}p{color:#c3d4c2;font-size:14px}label{display:block;text-align:left;margin:24px 0 8px;font-size:13px;font-weight:700}input{width:100%;padding:15px;border-radius:10px;border:1px solid #76996b;background:#07170c;color:white;font-size:17px}button{width:100%;padding:15px;border:0;border-radius:10px;background:#b7fb56;color:#0c210b;font-weight:800;font-size:16px;margin-top:15px}.error{color:#ffaaa6;margin-top:14px}</style></head><body><div class="card"><img src="/icons/icon-192.png" alt="Alpha Labs"><h1>ALPHA LABS</h1><p>PLAYMAKER · PRIVATE ACCESS</p><form action="/_alpha_login" method="post"><label for="password">Shared password</label><input id="password" type="password" name="password" autocomplete="current-password" required autofocus><button type="submit">ENTER THE LAB</button></form>${safe?`<p class="error" role="alert">${safe}</p>`:''}</div></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
function getCookie(request,name){const cookies=request.headers.get('cookie')||'';const found=cookies.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return found?decodeURIComponent(found.slice(name.length+1)):'';}
export default async function middleware(request){
  const url=new URL(request.url);
  const password=process.env.ALPHA_APP_PASSWORD;
  const secret=process.env.ALPHA_SESSION_SECRET;
  if(!password || !secret || secret.length<24) return html('config',503);
  if(url.pathname==='/_alpha_login'){
    if(request.method!=='POST') return Response.redirect(new URL('/',url),303);
    const contentType=request.headers.get('content-type')||'';
    if(!contentType.includes('application/x-www-form-urlencoded')) return html('incorrect',400);
    const form=await request.formData();
    const supplied=String(form.get('password')||'');
    // Compare HMAC digests rather than leaking a plaintext comparison timing signal.
    const [actual,expected]=await Promise.all([signature(supplied,secret),signature(password,secret)]);
    if(actual!==expected) return html('incorrect',401);
    const expiry=Date.now()+DAYS*86400000;
    const payload=String(expiry);
    const token=payload+'.'+await signature(payload,secret);
    const response=Response.redirect(new URL('/',url),303);
    response.headers.set('Set-Cookie',`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS*86400}`);
    response.headers.set('Cache-Control','no-store');
    return response;
  }
  if(url.pathname==='/_alpha_logout'){
    const response=Response.redirect(new URL('/',url),303);
    response.headers.set('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    response.headers.set('Cache-Control','no-store');
    return response;
  }
  const token=getCookie(request,COOKIE);
  const match=/^(\d{13})\.([A-Za-z0-9_-]+)$/.exec(token);
  if(match && Number(match[1])>Date.now() && Number(match[1])<Date.now()+(DAYS+1)*86400000){
    const expected=await signature(match[1],secret);
    if(match[2]===expected) return;
  }
  // Allow the public icon so the sign-in screen can display branding.
  if(url.pathname==='/icons/icon-192.png')return;
  return html();
}
export const config={matcher:['/((?!_vercel).*)']};
