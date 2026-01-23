import {Context} from "hono";
import {z, ZodError} from "zod";
import {FC} from "hono/jsx";
import {$Env} from "teenybase/worker";
import {parseRequestBody} from "teenybase/worker";

export type FormProps<T = Record<string, string|boolean|number|null|undefined|File>> = {
    data?: T,
    error?: string,
    errors?: Record<keyof T, string | string[] | undefined>
}

export async function formRoute<T>(c: Context<$Env>, zv: z.ZodType<T>, Component: FC<FormProps<T>>, route: (data: T) => Promise<Response>, requireLogin = false, requireLogout = false) {
    let error = c.req.query('error')
    let data: T | undefined = undefined
    let errors: FormProps<T>['errors'] | undefined = undefined
    if(requireLogin && !c.get('$db').auth.uid) return c.redirect('/login')
    if(requireLogout && !!c.get('$db').auth.uid) return c.redirect('/')
    if (c.req.method === 'POST') {
        data = (await c.get('$db').getRequestBody()) as T
        const parsed = zv.safeParse(data)
        if (parsed.error) {
            errors = parsed.error.formErrors.fieldErrors as any
            console.log(data)
            console.log(errors)
            error = 'Invalid form values'
        }
        if (parsed.data) {
            data = parsed.data
            const res = await route(parsed.data).catch((e) => {
                error = (e as any)?.message || 'Unknown error'
                if(e instanceof ZodError) {
                    errors = e.formErrors.fieldErrors as any
                    error = 'Invalid form values'
                }
                else if(e?.input)
                    errors = Object.fromEntries(Object.entries(e.input).map(([k, v]: [string, any]) => [k, v.message /*+ (v.code ? `(${v.code})` : '')*/])) as any
                // console.error(e)
                console.error({...e})
                return null
            })
            if(res) return res
        }
    }
    return c.render(<Component data={data} error={error} errors={errors}/>)
}
