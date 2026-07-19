import { motion } from 'motion/react'

import { Icon } from '../../../components/ui/Icon.tsx'
import { PROVIDER_LABELS } from '../../../features/gaming/gaming.constants.ts'
import type { DetectedGame, GameId } from '../../../features/gaming/gaming.types.ts'
import { useWorld } from '../../../world-engine/world-hooks.ts'

interface ArenaGameCoverProps {
  favorite: boolean
  game: DetectedGame
  launching: boolean
  onFavorite: (gameId: GameId) => void
  onLaunch: (gameId: GameId) => void
  onSelect: (gameId: GameId) => void
  selected?: boolean
  variant?: 'cover' | 'favorite' | 'recent'
}

function initials(title: string) {
  return title.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase()
}

export function ArenaGameCover({ favorite, game, launching, onFavorite, onLaunch, onSelect, selected = false, variant = 'cover' }: ArenaGameCoverProps) {
  const { preferences } = useWorld()
  const motionEnabled = preferences.animationsEnabled && !preferences.reducedMotionActive && !preferences.staticMode
  return (
    <motion.article
      className={`arena-game-cover arena-game-cover-${variant}${selected ? ' is-selected' : ''}`}
      data-provider={game.provider}
      layout={motionEnabled ? 'position' : false}
      onClick={() => onSelect(game.id)}
      whileHover={motionEnabled ? { y: -6 } : undefined}
    >
      <div className="arena-cover-art">
        {game.artworkPath ? <img alt="" src={`file://${game.artworkPath}`} /> : <span>{initials(game.title)}</span>}
        <div className="arena-cover-gradient" />
        <small>{PROVIDER_LABELS[game.provider]}</small>
        <button aria-label={favorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`} aria-pressed={favorite} className={favorite ? 'is-favorite' : ''} onClick={(event) => { event.stopPropagation(); onFavorite(game.id) }} type="button"><Icon name="sparkles" size={14} /></button>
      </div>
      <div className="arena-cover-copy">
        <strong>{game.title}</strong>
        <span><i className={game.runtimeStatus === 'running' ? 'is-running' : ''} />{game.runtimeStatus === 'running' ? 'Running' : game.installStatus}</span>
        <button disabled={game.installStatus !== 'installed' || launching} onClick={(event) => { event.stopPropagation(); onLaunch(game.id) }} type="button"><Icon name={launching ? 'refresh' : 'play'} size={13} />{launching ? 'Launching' : 'Play'}</button>
      </div>
    </motion.article>
  )
}
