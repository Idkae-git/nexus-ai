import type { DetectedGame, GameSession } from '../../../features/gaming/gaming.types.ts'

function bytes(value: number | null) { return value === null ? '—' : `${(value / 1_073_741_824).toFixed(1)} GB` }

export function ArenaInspector({ game, sessions }: { game: DetectedGame | null; sessions: readonly GameSession[] }) {
  const gameSessions = game ? sessions.filter((session) => session.gameId === game.id) : []
  return (
    <aside className="arena-inspector">
      <header><span>Game details</span><strong>{game?.provider ?? 'No selection'}</strong></header>
      <h3>{game?.title ?? 'Select a game'}</h3>
      <dl>
        <div><dt>Installation</dt><dd>{game?.installStatus ?? '—'}</dd></div>
        <div><dt>Runtime</dt><dd>{game?.runtimeStatus ?? '—'}</dd></div>
        <div><dt>Storage</dt><dd>{bytes(game?.sizeOnDisk ?? null)}</dd></div>
        <div><dt>NEXUS launches</dt><dd>{game?.launchCount ?? 0}</dd></div>
        <div><dt>Tracked sessions</dt><dd>{gameSessions.length}</dd></div>
        <div><dt>Close support</dt><dd>{game?.capabilities.close ? 'Available' : 'Unavailable'}</dd></div>
      </dl>
    </aside>
  )
}
