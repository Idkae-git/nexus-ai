import { Icon } from '../../../components/ui/Icon.tsx'
import type { WatchEntry } from '../../../features/watch-tracking/watch.types.ts'
import { WatchSourceBadge } from './WatchSourceBadge.tsx'

export function ContinueWatching({ entries, onSelect }: { entries: readonly WatchEntry[]; onSelect: (id: string) => void }) {
  if (entries.length === 0) return null
  return <section className="watch-continue"><header><div><span>TRUSTED PROGRESS</span><h2>Continuer le voyage</h2></div><small>Progression locale exacte uniquement</small></header><div>{entries.slice(0, 6).map((entry) => <button key={entry.id} onClick={() => onSelect(entry.id)} type="button"><div className="watch-continue-art"><span>{entry.title.slice(0, 2).toLocaleUpperCase()}</span><Icon name="play" size={20} /></div><div className="watch-continue-copy"><WatchSourceBadge precision={entry.progress.precision} provider={entry.primaryProvider} /><strong>{entry.title}</strong><span>{Math.round(entry.progress.percent ?? 0)} % · {entry.status}</span><i><b style={{ width: `${entry.progress.percent ?? 0}%` }} /></i></div></button>)}</div></section>
}
