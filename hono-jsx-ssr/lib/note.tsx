import {FormProps, formRoute} from "../forms";
import {ErrorCard, FormFileInput, FormInput, FormTextArea} from "./form";
import {z} from "zod";
import {Context} from "hono";
import {$Database, $Env} from "teenybase/worker";
import {randomString, zJsonString} from "teenybase";
import {HTTPException} from "hono/http-exception";

export function ViewNoteCard(props: {data: any, showView?: boolean, showEdit?: boolean, small?: boolean}){
    return <article style={{maxWidth: props.small?'400px':'800px', flexBasis: '30%', flex: '1 1', minWidth: "300px", margin: !props.small?'0 auto':'', padding: '2rem'}}>
        <span style={{display: "flex", justifyContent: "space-between"}}>
        <h3>{props.data.title}</h3>
        <div style={{display: 'flex', gap: "0.5rem"}}>
        {props.showView && <a href={'/notes/view/' + props.data.slug}>View</a>}
        {props.showEdit && <a href={'/notes/edit/' + props.data.slug}>Edit</a>}
        </div>
        </span>
        {props.data.cover && <p><img src={props.data.cover} alt={props.data.title} style={{width: '100%', maxHeight: props.small?'100px':'200px', objectFit: 'cover'}}/></p>}
        <pre>{!props.small  ? props.data.content : props.data.content.substring(0, 100) + (props.data.content.length > 100 ? '...' : '')}</pre>
        {!props.small && <>
        <p>Tags: {props.data.tags?.split(',').map((t: string)=><span><a href={`${props.showEdit?'/notes':'/'}?tag=${t}`}>{t.trim()}</a> </span>)}</p>
        <p>Metadata: <pre>{props.data.meta}</pre></p>
        <p>Views: {props.data.views||0}, Visibility: {props.data.is_public ? 'Public' : 'Private'}</p>
        </>}
        {props.data.owner && <p>Owner: {props.data.owner.name}</p>}
    </article>
}

async function getNote(db: $Database, slug: string) {
    const note = await db.table('notes').select({
        select: 'id, title, content, tags, meta, cover, views, is_public, slug, users(name, id) as owner',
        where: `slug = "${slug}"`, limit: 1
    })
    // if(note[0]?.cover) note[0].cover = db.table('notes').getFile(note[0].cover, note[0].id)
    if(note[0]?.cover) note[0].cover = db.table('notes').fileRoute(note[0].cover, note[0].id)
    if(note[0]?.owner) note[0].owner = JSON.parse(note[0].owner) // todo this should not be required. fix in teenybase, see build/select.ts
    return note.length ? note[0] : null;
}

export async function getNotes(db: $Database, where: string, offset?: number, limit?: number) {
    const res = await db.table('notes').select({
        select: 'title, content, tags, meta, cover, is_public, slug, views, users(name, id) as owner',
        where: where,
        offset: offset || 0,
        limit: limit || 50,
        order: '-views'
    }, true).catch(e => {
        console.error(e)
        return {items: [], total: 0}
    })
    return {total: res.total, items: res.items.map((note: any) => {
        if(note.cover) note.cover = db.table('notes').fileRoute(note.cover, note.id)
        if(note.owner) note.owner = JSON.parse(note.owner) // todo this should not be required. fix in teenybase, see build
        return note
    })}
}

export const viewNoteRoute = async (c: Context<$Env>, slug: string)=>{
    const db = c.get('$db')
    const note = await getNote(db, slug);
    if(!note) return c.notFound()
    return c.render(<ViewNoteCard data={note} showView={false} showEdit={note.owner?.id === db.auth.uid}/>)
}

export function CreateNoteCard(props: FormProps){
    return <article style={{maxWidth: '800px', margin: '0 auto', padding: '2rem'}}>
        <span style={{display: "flex", justifyContent: "space-between"}}>
        <h1>{props.data?.slug ? 'Edit' : 'Create'} Note</h1>
            {props.data?.slug && <a href={'/notes/view/' + props.data.slug}>View</a>}
        </span>
        <form action={props.data?.slug ? `/notes/edit/${props.data?.slug}` : '/notes/create'} enctype="multipart/form-data" method="post">
            {props.error && <ErrorCard error={props.error}/>}
            <FormInput name="title" placeholder="Note title" label={"Title"} required data={props.data}
                       errors={props.errors}/>
            <FormTextArea name="content" placeholder="Content" label={"Content"} required data={props.data}
                          errors={props.errors}/>
            <FormInput name="tags" placeholder="comma, separated, tags" label={"Tags"} required data={props.data}
                       errors={props.errors}/>
            <FormTextArea name="meta" placeholder="{}" label={"Metadata"} required data={props.data} default={'{}'}
                          errors={props.errors}/>
            {props.data?.cover && <p><img src={String(props.data.cover)} alt={String(props.data.title)} style={{width: '100%', maxHeight: '200px', objectFit: 'cover'}}/></p>}
            <FormFileInput name={"cover"} label={(props.data?.cover ? "Change ":"") + "Cover Image"} data={props.data} errors={props.errors} accept={"image/*"}/>
            <FormInput name="is_public" type="checkbox" label={"Public"} data={props.data} errors={props.errors}/>
            <hr/>
            <button type="submit">{props.data?.slug ? 'Save' : 'Create'} Note</button>
        </form>
    </article>
}

export const zCreateNote = z.object({
    title: z.string().min(2),
    content: z.string().min(2),
    cover: z.instanceof(File).or(z.literal('')).optional(), // todo validate file type and size
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
        // adding commas to tags to make it easier to search, todo check this in table sql schema
        // this can also be done in a trigger instead of there
        tags: ',' + data.tags.split(',').map((t: string)=>t.trim()).filter(t=>t).join(',') + ',',
        // meta: JSON.stringify(JSON.parse(data.meta)),
    }
    const note = await db.table('notes').insert({values: dat, returning: 'slug' })
    if(!note?.length) throw new Error('Unable to create note, make sure you have the necessary permissions')
    return c.redirect('/notes/view/'+note[0].slug)
}, true)

export const EditNoteCard = async (c: Context<$Env>, slug: string) => {
    const db = c.get('$db')
    const note = await getNote(db, slug)
    if (note.owner?.id !== db.auth.uid) throw new HTTPException(401, {message: 'You do not have permission to edit this note'})
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
            const dat = {
                ...data,
                // adding commas to tags to make it easier to search, todo check this in table sql schema
                // this can also be done in a trigger instead of there
                tags: ',' + data.tags.split(',').map((t: string)=>t.trim()).filter(t=>t).join(',') + ',',
                // meta: JSON.stringify(JSON.parse(data.meta)),
            }
            const note = await db.table('notes').update({setValues: dat, returning: 'slug', where: `slug = "${slug}"`})
            if(!note?.length) throw new Error('Unable to update note, make sure you have the necessary permissions')
            return c.redirect('/notes/view/'+note[0].slug)
    }, true)
