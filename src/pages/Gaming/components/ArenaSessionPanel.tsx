import { useEffect, useState } from 'react'

import { Icon } from '../../../components/ui/Icon.tsx'
import type { DetectedGame, GameId, GameSession } from '../../../features/gaming/gaming.types.ts'

function duration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1_000))
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function ArenaSessionPanel({ game, onClose, onStop, session }: { game: DetectedGame | null; onClose: (gameId: GameId) => void; onStop: (sessionId: string) => void; session: GameSession | null }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!session) return
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [session])

  return (
    <section className={`arena-session-panel${session ? ' is-live' : ''}`}>
      <header><span><i />Live session</span><small>{session?.status ?? 'Standby'}</small></header>
      {session ? <>
        <div className="arena-session-identity"><Icon name="gaming" size={22} /><div><strong>{game?.title ?? session.gameId}</strong><span>{session.provider}</span></div></div>
        <time>{duration((session.endedAt ?? now) - session.startedAt)}</time>
        <div className="arena-session-actions">{game?.capabilities.close && <button onClick={() => onClose(game.id)} type="button">Close game</button>}<button onClick={() => onStop(session.id)} type="button">Stop tracking</button></div>
      </> : <div className="arena-session-empty"><strong>00:00:00</strong><p>Session tracking starts when a game is launched from The Arena.</p></div>}
    </section>
  )
}
