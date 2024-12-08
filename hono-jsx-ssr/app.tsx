import {Hono} from "hono";
import {$Env} from "teenybase/worker";
import {jsxRenderer, useRequestContext} from "hono/jsx-renderer";
import {loginRoute, registerRoute} from "./lib/auth";
import {getLogin, logout} from "./auth";
import {BaseLayout} from "./lib/page";
import {createNoteRoute, editNoteRoute, ViewNoteCard, viewNoteRoute, zCreateNote} from "./lib/note";
import {NotesListSuspense} from "./lib/notes";
import {z} from "zod";
import {SearchForm} from "./lib/form";

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

const zPageQuery = z.object({
    q: z.string().optional().describe('Search query'),
    tag: z.string().optional().describe('Search by tag'),
    page: z.coerce.number().default(1).describe('Page number')
})

app.get('/', async (c) => {
    const user = c.get('$db').auth.uid
    const query = zPageQuery.safeParse(c.req.query())
    if(!query.success) {
        console.error(query.error)
        return c.redirect('/')
    }
    const {q: search, page, tag} = query.data
    return c.render(<>
        {!search && !tag && <>
            <h1>Home</h1>
            <p>Welcome to the notes app</p>
            <hr/>
            {user && <>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <div>
                        <h2>My Private notes</h2>
                        <small>Only you can see these notes</small>
                    </div>
                    <SearchForm path={"/notes"}/>
                </div>
                <hr/>
                {/* Standard list */}
                {/*<NotesList/>*/}
                {/* Streaming list with only private notes for logged-in user */}
                <NotesListSuspense where={`owner_id = "${user}" & is_public = false`} limit={10}/>
            </>}
        </>}
        <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>
            {!search ?
                <h2>All Public notes</h2> :
                <h1>Searching public notes</h1>
            }
            {tag && <p>Tag: {tag}</p>}
            </div>
            <SearchForm value={search} path={"/"}/>
        </div>
        <hr/>
        {/* Standard list */}
        {/*<NotesList/>*/}
        {/* Streaming list with only public notes except logged-in user's notes */}
        {/*<NotesListSuspense where={`is_public = true & ${user ? `owner_id != "${user}"` : 'true'}`}/>*/}
        {/* Streaming list with LIKE search */}
        {/*<NotesListSuspense where={`is_public = true ${search ? `& (title ~ "%${search}%" | content ~ "%${search}%")` : ''}`} page={page} pageLink={`/?q=${search || ''}&page=:page`}/>*/}
        {/* Streaming list with full text search */}
        <NotesListSuspense where={`is_public = true`}
                           search={search} tag={tag} page={page}
                           pageLink={`/?q=${search || ''}&page=:page&tag=${tag||''}`}/>
    </>)
})

app.on(['get', 'post'], '/login', loginRoute)

app.on(['get', 'post'], '/register', registerRoute)

app.on('get', '/logout', logout)

app.get('/notes', async (c) => {
    const user = c.get('$db').auth.uid
    if (!user) return c.redirect('/login')
    const query = zPageQuery.safeParse(c.req.query())
    if(!query.success) {
        console.error(query.error)
        return c.redirect('/notes')
    }
    const {q: search, page, tag} = query.data
    return c.render(<>
        <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>
                <h2>{!search ? 'Notes' : 'Search'}</h2>
                <p>{!search ? 'Notes in your account.' : `Search results in your account.`}</p>
                {tag && <p>Tag: {tag}</p>}
            </div>
            <SearchForm value={search} path={"/notes"}/>
        </div>
        <hr/>
        {/*<NotesList/>*/}
        <NotesListSuspense where={`owner_id = "${user}"`}
                           search={search} tag={tag} page={page}
                           pageLink={`/notes?q=${search||''}&page=:page&tag=${tag||''}`}/>
    </>)
})

app.on(['get', 'post'], '/notes/create', createNoteRoute)

app.on(['get'], '/notes/view/:slug', (c)=>viewNoteRoute(c, c.req.param('slug')))

app.on(['get', 'post'], '/notes/edit/:slug', (c)=>editNoteRoute(c, c.req.param('slug')))

export const honoJSXAppSSR = app