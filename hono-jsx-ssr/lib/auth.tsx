import {ErrorCard, FormInput} from "./form";
import {FormProps, formRoute} from "../forms";
import {z} from "zod";
import {login} from "../auth";
import {$Env} from "teenybase/worker";
import {Context} from "hono";

export function LoginCard(props: FormProps) {
    return <article style={{maxWidth: '700px', margin: '0 auto', padding: '2rem'}}>
        <h1>Login</h1>
        <form action="/login" method="post">
            {props.error && <ErrorCard error={props.error}/>}
            <FormInput name="email" placeholder="Email" required data={props.data} errors={props.errors}/>
            <FormInput name="password" type="password" placeholder="Password" required data={props.data}
                       errors={props.errors}/>
            <hr/>
            <button type="submit">Login</button>
            <div> or <a href="/register">Register</a></div>
        </form>
    </article>
}

export const zLogin = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const loginRoute = (c: Context<$Env>)=>formRoute(c, zLogin, LoginCard, async (data) => {
    const auth = c.get('$db').table('users').extension('auth')
    const res = await auth.loginWithPassword(data)
    return login(c, res.token)
})

export function RegisterCard(props: FormProps) {
    return <article style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <h1>Register</h1>
        <form action="/register" method="post">
            {props.error && <ErrorCard error={props.error}/>}
            <FormInput name="name" placeholder="Name" required data={props.data} errors={props.errors}/>
            <FormInput name="email" placeholder="Email" required data={props.data} errors={props.errors}/>
            <FormInput name="username" placeholder="Username" required data={props.data}
                       errors={props.errors}/>
            <FormInput name="password" type="password" placeholder="Password" required data={props.data}
                       errors={props.errors}/>
            <FormInput name="passwordConfirm" type="password" placeholder="Confirm Password" required data={props.data}
                       errors={props.errors}/>
            <input type="hidden" name="role" value="guest"/>
            <hr/>
            <button type="submit">Register</button>
            <div> or <a href="/login">Login</a></div>
        </form>
    </article>
}

export const zRegister = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    username: z.string().min(2),
    password: z.string().min(6),
    passwordConfirm: z.string().min(6),
    role: z.string(),
})


export const registerRoute = (c: Context<$Env>)=>formRoute(c, zRegister, RegisterCard, async (data) => {
    const auth = c.get('$db').table('users').extension('auth')
    const res = await auth.signUp(data)
    return login(c, res.token)
})
