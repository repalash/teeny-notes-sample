import {useRequestContext} from "hono/jsx-renderer";
import {$Env} from "teenybase/worker";
import {ViewNoteCard} from "./note";
import {Suspense} from "hono/jsx";

export type NotesListProps = {where: string, offset?: number}
export const NotesList = async (p: NotesListProps) => {
    const c = useRequestContext<$Env>()
    const db = c.get('$db')
    const notes = await db.table('notes').select({
        select: 'title, content, tags, meta, views, is_public, slug, views, owner_id',
        where: p.where,
        offset: p.offset || 0,
        limit: 10,
        order: '-views'
    }, true).catch(e => {
        console.error(e)
        return {items: [], total: 0}
    })
    return <>
        <div style={{display: "flex", flexWrap: "wrap", gap: "2rem"}}>
            {!notes.items.length && <p>No notes found</p>}
            {notes.items.map(note => (
                <ViewNoteCard data={note} showView={true} showEdit={note.owner_id === db.auth.uid}/>
            ))}
        </div>
        <hr/>
        {notes.total > 0 ? `Total notes: ${notes.total}` : ''}
    </>
}

export const NotesListSuspense = (p: NotesListProps) => {
    return <Suspense fallback={<span aria-busy="true">Loading Notes...</span>}>
        <NotesList {...p}/>
    </Suspense>
}
