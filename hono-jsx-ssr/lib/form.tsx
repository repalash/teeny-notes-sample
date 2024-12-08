import {FormProps} from "../forms";

export function FormInput(props: {
    name: string, type?: string, placeholder?: string, required?: boolean, label?: string,
    data?: FormProps['data'], errors?: Record<string, string | string[] | undefined>,
}) {
    const val = props.data?.[props.name]
    return <label>
        {props.label ? <>{props.label}&nbsp;&nbsp;</> : ''}
        <input type={props.type||'text'} name={props.name} placeholder={props.placeholder} required={props.required}
               value={(val ?? undefined) !== undefined ? String(val) : undefined}
               checked={props.type === 'checkbox' ? !!val : undefined}
               aria-invalid={!!props.errors?.[props.name] || undefined}
               aria-describedby={`${props.name}-invalid-helper`}/>
        {props.errors?.[props.name] &&
            <small id={`${props.name}-invalid-helper`}>{props.errors[props.name]}</small>}
    </label>
}

export function FormTextArea(props: {
    name: string, placeholder?: string, required?: boolean, label?: string, default?: string,
    data?: FormProps['data'], errors?: Record<string, string | string[] | undefined>,
}) {
    const val = props.data?.[props.name] || props.default || ''
    return <label>
        {props.label ? <>{props.label}&nbsp;&nbsp;</> : ''}
        <textarea name={props.name} placeholder={props.placeholder} required={props.required}
                  aria-invalid={!!props.errors?.[props.name] || undefined}
                  aria-describedby={`${props.name}-invalid-helper`}>{val}</textarea>
        {props.errors?.[props.name] &&
            <small id={`${props.name}-invalid-helper`}>{props.errors[props.name]}</small>}
    </label>
}

export function FormFileInput(props: {
    name: string, required?: boolean, label?: string, multiple?: boolean, accept?: string,
    data?: FormProps['data'], errors?: Record<string, string | string[] | undefined>,
}) {
    return <label>
        {props.label ? <>{props.label}&nbsp;&nbsp;</> : ''}
        <input type="file" name={props.name} required={props.required}
               multiple={props.multiple} accept={props.accept}
               aria-invalid={!!props.errors?.[props.name] || undefined}
               aria-describedby={`${props.name}-invalid-helper`}/>
        {props.errors?.[props.name] &&
            <small id={`${props.name}-invalid-helper`}>{props.errors[props.name]}</small>}
    </label>
}

export function ErrorCard(props: { error?: string }) {
    return <article className="" style={{
        backgroundImage: "var(--pico-icon-invalid)",
        backgroundPosition: 'center left .75rem',
        backgroundSize: '1rem auto',
        backgroundRepeat: 'no-repeat',
        paddingLeft: '2.5rem',
        '--pico-border-color': 'var(--pico-form-element-invalid-border-color)',
        border: 'var(--pico-border-width) solid var(--pico-border-color)',
        borderRadius: 'var(--pico-border-radius)',
        color: 'var(--pico-text-color)',
    }}>{props.error}</article>
}

export function SearchForm(props: { value?: string, path: string }) {
    return <form method="get" action={props.path}>
        <input type="search" name="q" placeholder="Search" aria-label="Search" value={props.value} style={{margin: 0}}/>
    </form>;
}
