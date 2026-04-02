import {Context} from "hono";
import {$Env} from "teenybase/worker";
import {deleteCookie, setCookie} from "hono/cookie";

// Cookie auth for SSR pages. Teenybase's authCookie config handles cookie reading
// in initAuth() and cookie deletion on logout. But for JSON endpoints like
// login-password and sign-up, teenybase returns the token in JSON — it does NOT
// set a cookie (by design: avoids CORS, CDN caching, and mobile client issues).
// SSR apps must set the cookie themselves after calling the auth API.
// See: wiki/FRONTEND_GUIDE.md and wiki/CONFIG_REFERENCE.md for details.

const AUTH_COOKIE = 'teeny_auth' // must match authCookie.name in teenybase.ts

export async function login(c: Context<$Env>, token: string) {
    // Set the auth cookie manually — teenybase only sets it on OAuth redirect flows,
    // not on JSON responses (loginWithPassword, signUp). This is the standard pattern
    // for SSR apps: extract the token from the API response and set the cookie server-side.
    setCookie(c, AUTH_COOKIE, token, {
        httpOnly: true,
        secure: false, // set to true in production (requires HTTPS)
        sameSite: 'Lax',
        path: '/',
    })
    return c.redirect('/')
}

export async function logout(c: Context<$Env>) {
    deleteCookie(c, AUTH_COOKIE, {path: '/'})
    return c.redirect('/')
}
