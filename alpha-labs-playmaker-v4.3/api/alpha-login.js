import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE='alpha_playmaker_session';
const DAYS=14;
const sign=(value,secret)=>createHmac('sha256',secret).update(value).digest('base64url');
const redirect=(res,location='/',status=303)=>{res.statusCode=status;res.setHeader('Location',location);res.end();};
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return redirect(res);
  const password=process.env.ALPHA_APP_PASSWORD;
  const secret=process.env.ALPHA_SESSION_SECRET;
  if(!password||!secret||secret.length<24){res.statusCode=503;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end('Alpha Labs login is not configured. Check Vercel environment variables and redeploy.');}
  const submitted=typeof req.body?.password==='string'?req.body.password:'';
  const actual=Buffer.from(sign(submitted,secret));
  const expected=Buffer.from(sign(password,secret));
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return redirect(res,'/?login=incorrect');
  const expiry=String(Date.now()+DAYS*86400000);
  const token=expiry+'.'+sign(expiry,secret);
  res.setHeader('Set-Cookie',`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS*86400}`);
  return redirect(res);
}
