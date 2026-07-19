import { Icon } from '../../../components/ui/Icon.tsx'
import type { MediaFolder } from '../../../features/media/media.types.ts'

export function MediaFolderPanel({ folders, onAdd, onRemove, scanning }: { folders: readonly MediaFolder[]; onAdd: () => void; onRemove: (id: string) => void; scanning: boolean }) {
  return <section className="forest-folder-panel">
    <header><div><span>INDEX ROOTS</span><h2>Dossiers surveillés</h2></div><button disabled={scanning} onClick={onAdd} type="button">+ AJOUTER UN DOSSIER</button></header>
    {folders.length > 0 ? <div>{folders.map((folder) => <article key={folder.id}><span><Icon name="drive" size={18} /></span><p><strong>{folder.label}</strong><small>{folder.displayPath}</small></p><button aria-label={`Retirer ${folder.label}`} onClick={() => onRemove(folder.id)} type="button"><Icon name="close" size={13} /></button></article>)}</div> : <div className="forest-folder-empty"><strong>Aucune clairière indexée</strong><p>Ajoutez un dossier avec le sélecteur natif. Seuls ces emplacements seront parcourus.</p></div>}
  </section>
}
