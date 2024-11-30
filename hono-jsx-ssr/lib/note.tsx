import {FormProps, formRoute} from "../forms";
import {ErrorCard, FormInput, FormTextArea} from "./form";
import {z} from "zod";
import {Context} from "hono";
import {$Database, $Env} from "teenybase/worker";
import {randomString, zJsonString} from "teenybase";
import {useRequestContext} from "hono/jsx-renderer";
import {HTTPException} from "hono/http-exception";

export function ViewNoteCard(props: {data: any, showView?: boolean, showEdit?: boolean}){
    return <article style={{maxWidth: '800px', flexBasis: '30%', flex: '1 1', minWidth: "300px", margin: '0 auto', padding: '2rem'}}>
        <span style={{display: "flex", justifyContent: "space-between"}}>
        <h3>{props.data.title}</h3>
        <div style={{display: 'flex', gap: "0.5rem"}}>
        {props.showView && <a href={'/notes/view/' + props.data.slug}>View</a>}
        {props.showEdit && <a href={'/notes/edit/' + props.data.slug}>Edit</a>}
        </div>
        </span>
        <pre>{props.data.content}</pre>
        <p>Tags: {props.data.tags?.split(',').map((t: string)=><code>{t.trim()}</code>)}</p>
        <p>Metadata: <pre>{props.data.meta}</pre></p>
        <p>Views: {props.data.views||0}, Visibility: {props.data.is_public ? 'Public' : 'Private'}</p>
    </article>
}

async function getNote(db: $Database, slug: string) {
    const note = await db.table('notes').select({
        select: 'title, content, tags, meta, views, is_public, slug, owner_id',
        where: `slug = "${slug}"`, limit: 1
    })
    return note.length ? note[0] : null;
}

export const viewNoteRoute = async (c: Context<$Env>, slug: string)=>{
    const db = c.get('$db')
    const note = await getNote(db, slug);
    if(!note) return c.notFound()
    return c.render(<ViewNoteCard data={note} showView={false} showEdit={note.owner_id === db.auth.uid}/>)
}

export function CreateNoteCard(props: FormProps){
    return <article style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <span style={{display: "flex", justifyContent: "space-between"}}>
        <h1>{props.data?.slug ? 'Edit' : 'Create'} Note</h1>
            {props.data?.slug && <a href={'/notes/view/' + props.data.slug}>View</a>}
        </span>
        <form action={props.data?.slug ? `/notes/edit/${props.data?.slug}` : '/notes/create'} method="post">
            {props.error && <ErrorCard error={props.error}/>}
            <FormInput name="title" placeholder="Note title" label={"Title"} required data={props.data}
                       errors={props.errors}/>
            <FormTextArea name="content" placeholder="Content" label={"Content"} required data={props.data}
                          errors={props.errors}/>
            <FormInput name="tags" placeholder="comma, separated, tags" label={"Tags"} required data={props.data}
                       errors={props.errors}/>
            <FormTextArea name="meta" placeholder="{}" label={"Metadata"} required data={props.data}
                          errors={props.errors}/>
            <FormInput name="is_public" type="checkbox" label={"Public"} data={props.data} errors={props.errors}/>
            <hr/>
            <button type="submit">{props.data?.slug ? 'Save' : 'Create'} Note</button>
        </form>
    </article>
}

export const zCreateNote = z.object({
    title: z.string().min(2),
    content: z.string().min(2),
    tags: z.string(),
    meta: zJsonString,
    is_public: z.coerce.boolean(),
})

export const createNoteRoute = (c: Context<$Env>)=>formRoute(c, zCreateNote, CreateNoteCard, async (data) => {
    const db = c.get('$db')
    if(!db.auth.uid) return c.redirect('/login')
    const dat = {
        ...data,
        slug: randomString(8),
        owner_id: db.auth.uid,
        // meta: JSON.stringify(JSON.parse(data.meta)),
    }
    const note = await db.table('notes').insert({values: dat, returning: 'slug' })
    if(!note.length) throw new Error('Unable to create note, make sure you have the necessary permissions')
    return c.redirect('/notes/view/'+note[0].slug)
}, true)

export const EditNoteCard = async (c: Context<$Env>, slug: string) => {
    const db = c.get('$db')
    const note = await getNote(db, slug)
    if (note.owner_id !== db.auth.uid) throw new HTTPException(401, {message: 'You do not have permission to edit this note'})
    return async (props: FormProps) => {
        props.data = {...note, ...props.data}
        return <CreateNoteCard {...props}/>
    };
}

const zEditNote = zCreateNote

export const editNoteRoute = async (c: Context<$Env>, slug: string)=>
    formRoute(c, zEditNote, await EditNoteCard(c, slug),
        async (data) => {
            const db = c.get('$db')
            const note = await db.table('notes').update({setValues: data, returning: 'slug', where: `slug = "${slug}"`})
            if(!note.length) throw new Error('Unable to update note, make sure you have the necessary permissions')
            return c.redirect('/notes/view/'+note[0].slug)
    }, true)