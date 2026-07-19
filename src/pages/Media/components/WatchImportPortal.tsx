import { useState } from 'react'

import { Icon } from '../../../components/ui/Icon.tsx'
import type { ImportableWatchProvider } from '../../../features/watch-tracking/watch.service.ts'
import type { WatchImport } from '../../../features/watch-tracking/watch.types.ts'

const imports: readonly { description: string; icon: 'media' | 'play' | 'refresh'; label: string; provider: ImportableWatchProvider }[] = [
  { description: 'CSV officiel d’activité de visionnage', icon: 'media', label: 'Netflix', provider: 'netflix-import' },
  { description: 'JSON ou CSV explicitement fourni', icon: 'play', label: 'Crunchyroll', provider: 'crunchyroll-import' },
  { description: 'Sauvegarde NexusWatchHistoryExport', icon: 'refresh', label: 'Historique NEXUS', provider: 'manual' },
]

export function WatchImportPortal({ busy, history, onCreateManual, onExport, onImport }: { busy: boolean; history: readonly WatchImport[]; onCreateManual: (title: string) => Promise<void>; onExport: () => void; onImport: (provider: ImportableWatchProvider) => void }) {
  const [manualTitle, setManualTitle] = useState('')
  const submitManual = async () => {
    const title = manualTitle.trim()
    if (!title) return
    await onCreateManual(title)
    setManualTitle('')
  }

  return <section className="watch-import-portal"><header><div><span>IMPORT PORTAL</span><h2>Relier les sentiers</h2></div><button disabled={busy} onClick={onExport} type="button"><Icon name="arrow-up-right" size={14} />Exporter NEXUS</button></header><div>{imports.map((entry) => <button disabled={busy} key={entry.provider} onClick={() => onImport(entry.provider)} type="button"><span><Icon name={entry.icon} size={21} /></span><p><strong>Importer {entry.label}</strong><small>{entry.description}</small></p><Icon name="chevron-right" size={15} /></button>)}</div><form className="watch-manual-entry" onSubmit={(event) => { event.preventDefault(); void submitManual() }}><label htmlFor="watch-manual-title"><span>AJOUT MANUEL</span><strong>Planter un nouveau repère</strong></label><input disabled={busy} id="watch-manual-title" maxLength={500} onChange={(event) => setManualTitle(event.target.value)} placeholder="Titre du film, de la série ou de l’animé" value={manualTitle} /><button disabled={busy || !manualTitle.trim()} type="submit"><Icon name="plus" size={14} />Ajouter</button></form><footer><Icon name="lock" size={13} /><span>Aucun mot de passe, cookie ou donnée n’est transmis. Les fichiers restent locaux.</span><small>{history.filter((entry) => entry.status === 'committed').length} imports validés</small></footer></section>
}
