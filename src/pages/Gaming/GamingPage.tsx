import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'

import type { SystemInfo } from '../../core/platform/system-info.js'
import { Icon } from '../../components/ui/Icon.tsx'
import { selectVisibleGames } from '../../features/gaming/gaming.selectors.ts'
import { useGamingStore } from '../../features/gaming/gaming.store.ts'
import { useWorld } from '../../world-engine/world-hooks.ts'
import { ArenaGameCover } from './components/ArenaGameCover.tsx'
import { ArenaGameLibrary } from './components/ArenaGameLibrary.tsx'
import { ArenaHero } from './components/ArenaHero.tsx'
import { ArenaInspector } from './components/ArenaInspector.tsx'
import { ArenaLauncherStrip } from './components/ArenaLauncherStrip.tsx'
import { ArenaPerformancePanel } from './components/ArenaPerformancePanel.tsx'
import { ArenaSessionPanel } from './components/ArenaSessionPanel.tsx'

import './Gaming.css'

export function GamingPage({ systemInfo }: { systemInfo: SystemInfo | null }) {
  const gaming = useGamingStore()
  const { preferences } = useWorld()
  const activeSessionId = gaming.activeSession?.id
  const load = gaming.load
  const refreshStatuses = gaming.refreshStatuses

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!activeSessionId) return
    const timer = window.setInterval(() => { void refreshStatuses() }, 8_000)
    return () => window.clearInterval(timer)
  }, [activeSessionId, refreshStatuses])

  const visibleGames = useMemo(() => selectVisibleGames(gaming.games, gaming.favorites, gaming.searchQuery, gaming.filter, gaming.sortMode), [gaming.games, gaming.favorites, gaming.searchQuery, gaming.filter, gaming.sortMode])
  const selectedGame = gaming.games.find((game) => game.id === gaming.selectedGameId) ?? visibleGames[0] ?? null
  const favoriteIds = new Set(gaming.favorites.map((favorite) => favorite.gameId))
  const favoriteGames = gaming.favorites.map((favorite) => gaming.games.find((game) => game.id === favorite.gameId)).filter((game) => game !== undefined).slice(0, 5)
  const recentGames = gaming.recentGames.map((entry) => gaming.games.find((game) => game.id === entry.gameId)).filter((game) => game !== undefined).slice(0, 6)
  const activeGame = gaming.activeSession ? gaming.games.find((game) => game.id === gaming.activeSession?.gameId) ?? null : null
  const motionEnabled = preferences.animationsEnabled && !preferences.staticMode && !preferences.reducedMotionActive

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="page page-gaming arena-page" initial={motionEnabled ? { opacity: 0, y: 16 } : false} transition={{ duration: 0.34 }}>
      <header className="arena-page-header">
        <div><span>WORLD 02 / GAMING COMMAND</span><h1>The Arena</h1><p>One command center for your games, launchers and live sessions.</p></div>
        <div className="arena-header-actions">
          <span><i className={gaming.scanning ? 'is-scanning' : ''} />{gaming.scanning ? 'Scanning providers' : `${gaming.games.length} games ready`}</span>
          <button disabled={gaming.scanning} onClick={() => gaming.scanLibrary()} type="button"><Icon name="refresh" size={15} />{gaming.scanning ? 'Scanning' : 'Scan library'}</button>
        </div>
      </header>

      {gaming.error && <div className="arena-error" role="alert"><Icon name="activity" size={16} /><span><strong>Gaming service unavailable</strong>{gaming.error}</span><button aria-label="Dismiss error" onClick={gaming.clearError} type="button"><Icon name="close" size={14} /></button></div>}

      <div className="arena-command-grid">
        <ArenaHero favorite={selectedGame ? favoriteIds.has(selectedGame.id) : false} game={selectedGame} launching={gaming.launchingGameId === selectedGame?.id} onFavorite={gaming.toggleFavorite} onLaunch={gaming.launchGame} session={gaming.activeSession} />
        <div className="arena-command-side">
          <ArenaPerformancePanel systemInfo={systemInfo} />
          <ArenaSessionPanel game={activeGame} onClose={gaming.closeGame} onStop={gaming.stopTracking} session={gaming.activeSession} />
        </div>
      </div>

      <ArenaLauncherStrip launchers={gaming.launchers} onOpen={gaming.openLauncher} onScan={gaming.scanLibrary} scanning={gaming.scanning} />

      {favoriteGames.length > 0 && <section className="arena-favorites">
        <header><div><span>Priority lineup</span><h2>Favorites</h2></div><small>Always within reach</small></header>
        <div>{favoriteGames.map((game, index) => <ArenaGameCover favorite game={game} key={game.id} launching={gaming.launchingGameId === game.id} onFavorite={gaming.toggleFavorite} onLaunch={gaming.launchGame} onSelect={gaming.selectGame} selected={gaming.selectedGameId === game.id} variant={index === 0 ? 'favorite' : 'recent'} />)}</div>
      </section>}

      <div className="arena-library-layout">
        <ArenaGameLibrary favorites={gaming.favorites} filter={gaming.filter} games={visibleGames} launchingGameId={gaming.launchingGameId} onFavorite={gaming.toggleFavorite} onFilter={gaming.setFilter} onLaunch={gaming.launchGame} onSearch={gaming.setSearchQuery} onSelect={gaming.selectGame} onSort={gaming.setSortMode} query={gaming.searchQuery} selectedGameId={gaming.selectedGameId} sort={gaming.sortMode} />
        <ArenaInspector game={selectedGame} sessions={gaming.sessions} />
      </div>

      <section className="arena-recent-sessions">
        <header><div><span>NEXUS history</span><h2>Recent sessions</h2></div><small>{gaming.sessions.length} tracked</small></header>
        {recentGames.length > 0 ? <div>{recentGames.map((game) => <ArenaGameCover favorite={favoriteIds.has(game.id)} game={game} key={game.id} launching={gaming.launchingGameId === game.id} onFavorite={gaming.toggleFavorite} onLaunch={gaming.launchGame} onSelect={gaming.selectGame} variant="recent" />)}</div> : <p>No game has been launched through NEXUS yet.</p>}
      </section>

      <footer className="arena-scan-summary">
        <span>{gaming.scanSummary ? `${gaming.scanSummary.providersSucceeded.length}/${gaming.scanSummary.providersInspected.length} providers · ${gaming.scanSummary.durationMs} ms` : 'Local catalog · offline ready'}</span>
        <span>{gaming.providerErrors.length > 0 ? `${gaming.providerErrors.length} provider error${gaming.providerErrors.length > 1 ? 's' : ''}` : 'All available providers responding'}</span>
      </footer>
    </motion.div>
  )
}
