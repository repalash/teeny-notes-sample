import {Context} from "hono";
import {z} from "zod";
import {FC} from "hono/jsx";

export type FormProps<T = Record<string, string|boolean|number|null|undefined|File>> = {
    data?: T,
    error?: string,
    errors?: Record<keyof T, string | string[] | undefined>
}

export async function formRoute<T>(c: Context, zv: z.ZodType<T>, Component: FC<FormProps<T>>, route: (data: T) => Promise<Response>) {
    let error = c.req.query('error')
    let data: T | undefined = undefined
    let errors: FormProps<T>['errors'] | undefined = undefined
    if (c.req.method === 'POST') {
        data = Object.fromEntries((await c.req.formData())?.entries()) as T
        const parsed = zv.safeParse(data)
        if (parsed.error) {
            errors = parsed.error.formErrors.fieldErrors as any
            // console.log(errors)
            error = 'Invalid form values'
        }
        if (parsed.data) {
            data = parsed.data
            const res = await route(parsed.data).catch((e) => {
                error = (e as any).message || 'Unknown error'
                console.error({...e})
                return null
            })
            if(res) return res
        }
    }
    return c.render(<Component data={data} error={error} errors={errors}/>)
}
