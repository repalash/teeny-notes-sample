import type {PropsWithChildren} from "hono/jsx";
import {useRequestContext} from "hono/jsx-renderer";
import {$Env} from "teenybase/worker";

export function Navbar(props: {user?: string}) {
    return <nav>
        <ul>
            <li><a href="/"><strong>Notes App</strong></a></li>
        </ul>
        {props.user && <ul>
            <li><a href="/notes">My Notes</a></li>
            <li><a href="/notes/create">Create</a></li>
        </ul>}
        <ul>
            {props.user && <li>{props.user}</li>}
            {!props.user && <li>
                <a href="/register">Register</a>
            </li>}
            <li>
                {props.user ? <a href="/logout">Logout</a> : <a href="/login">Login</a>}
            </li>
        </ul>
    </nav>
}

const Nav = async () => {
    const c = useRequestContext<$Env>()
    const db = c.get('$db')
    const loggedIn = db.auth.uid
    return <Navbar user={loggedIn ? db.auth.jwt.user : ''}/>
}

export function BaseLayout({children}: PropsWithChildren) {
    return <html>
    <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="color-scheme" content="light dark"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.colors.min.css"/>
        <title>Notes App</title>
        <meta name="description" content="A simple notes app."/>
        <style>{`
        :root{
            --pico-form-element-spacing-horizontal: calc(1rem * 0.5);
            --pico-form-element-spacing-vertical: calc(0.75rem * 0.5);
            --pico-spacing: calc(1rem * 0.5);
            --pico-typography-spacing-vertical: calc(1rem * 1);
            --pico-line-height: 1.5;
            --pico-font-weight: 400;
            --pico-font-size: 110%;
        }
        
        `}
        </style>
    </head>
    <body>
    <header className="container">
        <Nav/>
    </header>
    <main className="container">
        {children}
    </main>
    <footer className="container" style={{marginBottom: "1rem"}}>
        Powered by <a href="https://teenybase.org">Teenybase</a>
    </footer>
    </body>
    </html>
}
