import {useRequestContext} from "hono/jsx-renderer";
import {$Env} from "teenybase/worker";
import {getNotes, ViewNoteCard} from "./note";
import {Suspense} from "hono/jsx";

const pageSize = 10
export type NotesListProps = {
    where: string,
    page?: number,
    limit?: number,
    pageLink?: string,
    tag?: string
    search?: string
}
export const NotesList = async (p: NotesListProps) => {
    const c = useRequestContext<$Env>()
    const db = c.get('$db')
    let where = `(${p.where})`
    if(p.tag)
        // note - this works since we are adding , to the beg and end of the tags during insert and update
        where += ` & tags ~ '%,'||${JSON.stringify(p.tag.replace(/ /g,''))}||',%'`
    if(p.search)
        where += ` & notes @@ ${JSON.stringify(p.search)}`
    const notes = await getNotes(db, where, p.page ? (p.page - 1) * (p.limit||pageSize) : 0, (p.limit||pageSize))
    const totalPages = Math.ceil(notes.total / (p.limit || pageSize))
    return <>
        <div style={{display: "flex", flexWrap: "wrap", gap: "2rem"}}>
            {!notes.items.length && <p>No notes found</p>}
            {notes.items.map(note => (
                <ViewNoteCard data={note} showView={true} showEdit={note.owner_id === db.auth.uid} small={true}/>
            ))}
        </div>
        <hr/>
        {notes.total > 0 && p.page && p.pageLink && (<div style={{display: "flex", marginTop: "1rem", gap: "2rem", justifyContent: "center"}}>
            <a href={p.pageLink.replace(':page', p.page-1+'')} disabled={p.page === 1}>Previous</a>
            <span>Page {p.page}/{totalPages} ({notes.total} notes)</span>
            <a href={p.pageLink.replace(':page', p.page+1+'')} disabled={p.page === totalPages}>Next</a>
        </div>)}
    </>
}

export const NotesListSuspense = (p: NotesListProps) => {
    return <Suspense fallback={<span aria-busy="true">Loading Notes...</span>}>
        <NotesList {...p}/>
    </Suspense>
}
