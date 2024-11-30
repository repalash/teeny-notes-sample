import {Hono} from "hono";
import {$Env} from "teenybase/worker";
import {jsxRenderer, useRequestContext} from "hono/jsx-renderer";
import {loginRoute, registerRoute} from "./lib/auth";
import {getLogin, logout} from "./auth";
import {BaseLayout} from "./lib/page";
import {createNoteRoute, editNoteRoute, ViewNoteCard, viewNoteRoute, zCreateNote} from "./lib/note";
import {NotesListSuspense} from "./lib/notes";

const app = new Hono<$Env>()
app.use('*', async (c, next) => {
    const db = c.get('$db')
    await db.initAuth(await getLogin(c))
    return next()
})

app.use('*', jsxRenderer(
    ({children}) => <BaseLayout children={children}/>,
    {
        stream: true,
        // docType: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    }
))

app.get('/', async (c) => {
    const user = c.get('$db').auth.uid
    return c.render(<>
        <h1>Home</h1>
        <p>Welcome to the notes app</p>
        <hr/>
        {user && <>
            <h2>Private notes</h2>
            <small>Only you can see these notes</small>
            <hr/>
            {/*<NotesList/>*/}
            <NotesListSuspense where={`owner_id = "${user}" & is_public = false`}/>
        </>}
        <h2>Public notes</h2>
        {/*<NotesList/>*/}
        {/*<NotesListSuspense where={`is_public = true & ${user ? `owner_id != "${user}"` : 'true'}`}/>*/}
        <NotesListSuspense where={`is_public = true`}/>
    </>)
})

app.on(['get', 'post'], '/login', loginRoute)

app.on(['get', 'post'], '/register', registerRoute)

app.on('get', '/logout', logout)

app.get('/notes', async (c) => {
    const user = c.get('$db').auth.uid
    if(!user) return c.redirect('/login')
    return c.render(<>
        <h2>Notes</h2>
        <p>Notes in your account.</p>
        <hr/>
        {/*<NotesList/>*/}
        <NotesListSuspense where={`owner_id = "${user}"`}/>
    </>)
})

app.on(['get', 'post'], '/notes/create', createNoteRoute)

app.on(['get'], '/notes/view/:slug', (c)=>viewNoteRoute(c, c.req.param('slug')))

app.on(['get', 'post'], '/notes/edit/:slug', (c)=>editNoteRoute(c, c.req.param('slug')))

export const honoJSXAppSSR = app