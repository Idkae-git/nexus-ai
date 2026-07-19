import { motion } from 'motion/react'

import { Icon } from '../../../components/ui/Icon.tsx'
import { PROVIDER_LABELS } from '../../../features/gaming/gaming.constants.ts'
import type { DetectedGame, GameId, GameSession } from '../../../features/gaming/gaming.types.ts'
import { useWorld } from '../../../world-engine/world-hooks.ts'

interface ArenaHeroProps {
  favorite: boolean
  game: DetectedGame | null
  launching: boolean
  onFavorite: (gameId: GameId) => void
  onLaunch: (gameId: GameId) => void
  session: GameSession | null
}

function initials(title: string) {
  return title.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase()
}

export function ArenaHero({ favorite, game, launching, onFavorite, onLaunch, session }: ArenaHeroProps) {
  const { preferences } = useWorld()
  const motionEnabled = preferences.animationsEnabled && !preferences.reducedMotionActive && !preferences.staticMode

  return (
    <motion.section className="arena-hero" layout={motionEnabled ? 'position' : false}>
      <div className="arena-hero-art" data-provider={game?.provider ?? 'none'}>
        {game?.artworkPath ? <img alt="" src={`file://${game.artworkPath}`} /> : <span>{game ? initials(game.title) : 'NX'}</span>}
        <div className="arena-hero-shade" />
      </div>
      <div className="arena-hero-copy">
        <div className="arena-eyebrow">
          <span><i className={session ? 'is-live' : ''} />{session ? 'Session in progress' : 'Ready room'}</span>
          <span>{game ? PROVIDER_LABELS[game.provider] : 'Local library'}</span>
        </div>
        <div>
          <p className="arena-hero-kicker">Selected game</p>
          <h2>{game?.title ?? 'Your next session starts here.'}</h2>
          <p className="arena-hero-description">
            {game ? `${game.source} · ${game.installStatus === 'installed' ? 'Installed and ready to launch' : 'Installation is incomplete'}` : 'Scan supported launchers to build a unified local library without an internet account.'}
          </p>
        </div>
        <div className="arena-hero-actions">
          <button className="arena-primary-action" disabled={!game || game.installStatus !== 'installed' || launching} onClick={() => game && onLaunch(game.id)} type="button">
            <Icon name={launching ? 'refresh' : 'play'} size={17} />{launching ? 'Launching' : 'Play now'}
          </button>
          {game && <button aria-pressed={favorite} className="arena-icon-action" onClick={() => onFavorite(game.id)} type="button"><Icon name="sparkles" size={16} />{favorite ? 'Saved' : 'Favorite'}</button>}
        </div>
      </div>
      <div className="arena-hero-meta">
        <span><b>{game?.runtimeStatus ?? 'unknown'}</b>Runtime</span>
        <span><b>{game?.launchCount ?? 0}</b>NEXUS launches</span>
        <span><b>{game?.installStatus ?? 'unknown'}</b>Install</span>
      </div>
    </motion.section>
  )
}
