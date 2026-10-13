# Alpha Labs Playmaker V4: private installable PWA

## Deploy to Vercel
1. Upload the **contents** of this ZIP (index.html must be at the project root) to your existing Vercel project, or push them to the connected GitHub repository.
2. In Vercel Project Settings → Environment Variables, create:
   - `ALPHA_APP_PASSWORD`: your chosen shared password. Do not put it in any source file.
   - `ALPHA_SESSION_SECRET`: a unique randomly generated secret of at least 24 characters (ideally 32+). Do not reuse the shared password.
3. Set both variables for Production (and Preview if you want protected preview deployments). Redeploy the project after saving.
4. Visit your production domain in a private/incognito browser to confirm the password gate appears and that incorrect passwords cannot load the game.
5. On iPhone Safari: open the domain, sign in, tap Share → Add to Home Screen → Add. The app opens in standalone mode.

## Security and behavior
- Vercel Edge Middleware guards the game and assets with an HMAC-signed, HttpOnly, Secure, SameSite=Lax session cookie valid for 14 days.
- Password is checked on the server and is never embedded in shipped HTML or JS.
- Logout is available in the top-right corner. Changing the session secret revokes existing sessions. Changing only the password does not revoke already-issued sessions.
- This is a shared-password private beta, not per-user accounts. Anyone with the password can sign in. Rate limiting and advanced abuse protection are not implemented; use a strong password and consider Vercel WAF for wider distribution.
- Online connectivity is required. No offline service worker is installed, deliberately, so private game files are not cached for unauthenticated offline use.
- PWA installs are supported by iOS Safari and compatible browsers, but are not App Store apps.
- V3.3 `app.js`, `mobile.js`, `mobile.css`, `styles.css` and original game assets are preserved unchanged.

## Verification
Test a deployment before sharing the URL. In particular, verify the `middleware.js` executes in your Vercel project's framework/build configuration. A static host that ignores Vercel middleware will NOT provide password protection.

## V4.1 login correction
The password form now submits to `/api/alpha-login`, a real Vercel Node.js Function, rather than posting to a middleware-only URL that Safari could download as a file. Both `ALPHA_APP_PASSWORD` and `ALPHA_SESSION_SECRET` are still required. Redeploy after updating files or variables. Disable Vercel's separate Password Protection if you want only the Alpha Labs login. Test in Safari Private Browsing.
