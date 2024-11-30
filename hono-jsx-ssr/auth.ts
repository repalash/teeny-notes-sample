import {Context} from "hono";
import {$Env} from "teenybase/worker";
import {getSignedCookie, setSignedCookie} from "hono/cookie";

const AUTH_COOKIE = 'TEENY_AUTH'
const AUTH_COOKIE_SECRET = 'TEENY_AUTH_217369dqhakdw12redq'

export async function login(c: Context<$Env>, token: string) {
    await setSignedCookie(c, AUTH_COOKIE, token, AUTH_COOKIE_SECRET, {httpOnly: true})
    return c.redirect('/')
}

export async function logout(c: Context<$Env>) {
    await setSignedCookie(c, AUTH_COOKIE, '', AUTH_COOKIE_SECRET, {httpOnly: true, maxAge: 0})
    return c.redirect('/')
}

export async function getLogin(c: Context<$Env>){
    return await getSignedCookie(c, AUTH_COOKIE_SECRET, AUTH_COOKIE)
}
