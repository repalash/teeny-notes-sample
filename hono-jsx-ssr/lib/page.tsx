import type {PropsWithChildren} from "hono/jsx";
import {useRequestContext} from "hono/jsx-renderer";
import {$Env} from "teenybase/worker";

export function Navbar(props: {user?: string}) {
    return <nav>
        <ul>
            <li><a href="/"><strong>Notes App</strong></a></li>
        </ul>
        {props.user && <ul>
            <li><a href="/notes">Dashboard</a></li>
            <li><a href="/notes/create">Create</a></li>
        </ul>}
        <ul>
            {props.user && <li>{props.user}</li>}
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
    </head>
    <body>
    <header className="container">
        <Nav/>
    </header>
    <main className="container">
        {children}
    </main>
    </body>
    </html>
}
