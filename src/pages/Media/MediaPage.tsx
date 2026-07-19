import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'

import { MediaCard } from '../../components/media/MediaCard.tsx'
import { MediaHero } from '../../components/media/MediaHero.tsx'
import { MediaShelf } from '../../components/media/MediaShelf.tsx'
import { Icon } from '../../components/ui/Icon.tsx'
import { selectMedia, selectRecommendations } from '../../features/media/media.selectors.ts'
import { useMediaStore } from '../../features/media/media.store.ts'
import { useConnectorStore } from '../../features/watch-connectors/connector.store.ts'
import { selectContinueWatching, selectWatchHistory, selectWatchProfiles } from '../../features/watch-tracking/watch.selectors.ts'
import { useWatchStore } from '../../features/watch-tracking/watch.store.ts'
import { useWorld } from '../../world-engine/world-hooks.ts'
import { ContinueWatching } from './components/ContinueWatching.tsx'
import { ConnectedServices } from './components/ConnectedServices.tsx'
import { MediaFolderPanel } from './components/MediaFolderPanel.tsx'
import { MediaToolbar } from './components/MediaToolbar.tsx'
import { TrackingSettings } from './components/TrackingSettings.tsx'
import { SyncCenter } from './components/SyncCenter.tsx'
import { UnifiedWatchHistory } from './components/UnifiedWatchHistory.tsx'
import { WatchConflictClearing } from './components/WatchConflictClearing.tsx'
import { WatchDetailsPanel } from './components/WatchDetailsPanel.tsx'
import { WatchImportDialog } from './components/WatchImportDialog.tsx'
import { WatchImportPortal } from './components/WatchImportPortal.tsx'
import { WatchStatsPanel } from './components/WatchStatsPanel.tsx'

import './MediaTracking.css'

export function MediaPage() {
  const media = useMediaStore()
  const watch = useWatchStore()
  const connectors = useConnectorStore()
  const { preferences } = useWorld()
  const loadMedia = media.load
  const loadWatch = watch.load
  const loadConnectors = connectors.load
  useEffect(() => { void loadMedia() }, [loadMedia])
  useEffect(() => { void loadWatch() }, [loadWatch])
  useEffect(() => { void loadConnectors() }, [loadConnectors])

  const visible = useMemo(() => selectMedia(media.items, media.favorites, media.recent, media.searchQuery, media.filter, media.sortMode), [media.items, media.favorites, media.recent, media.searchQuery, media.filter, media.sortMode])
  const recommendations = useMemo(() => selectRecommendations(media.items, media.favorites, media.recent), [media.items, media.favorites, media.recent])
  const selected = media.items.find((item) => item.id === media.selectedMediaId) ?? visible[0] ?? null
  const favoriteIds = new Set(media.favorites.map((entry) => entry.mediaId))
  const progressById = new Map(media.progress.map((entry) => [entry.mediaId, entry]))
  const continueItems = media.progress.filter((entry) => entry.positionMs > 0 && !entry.completed).map((entry) => media.items.find((item) => item.id === entry.mediaId)).filter((item) => item !== undefined)
  const recentItems = media.recent.filter((entry) => entry.success).map((entry) => media.items.find((item) => item.id === entry.mediaId)).filter((item) => item !== undefined)
  const motionEnabled = preferences.animationsEnabled && !preferences.reducedMotionActive && !preferences.staticMode
  const visibleWatchEntries = useMemo(() => selectWatchHistory(watch.history, watch.conflicts, watch.searchQuery, watch.filter, watch.sortMode, watch.selectedProfile), [watch.history, watch.conflicts, watch.searchQuery, watch.filter, watch.sortMode, watch.selectedProfile])
  const trackedContinueWatching = useMemo(() => selectContinueWatching(watch.history), [watch.history])
  const watchProfiles = useMemo(() => selectWatchProfiles(watch.history), [watch.history])
  const selectedWatchEntry = watch.history.find((entry) => entry.id === watch.selectedEntryId) ?? visibleWatchEntries[0] ?? null
  const card = (item: typeof media.items[number], variant: 'landscape' | 'portrait' = 'portrait') => <MediaCard favorite={favoriteIds.has(item.id)} item={item} key={item.id} onFavorite={media.toggleFavorite} onPlay={media.playMedia} onSelect={media.selectMedia} playing={media.playingMediaId === item.id} progress={progressById.get(item.id)} selected={media.selectedMediaId === item.id} variant={variant} />

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="page page-media forest-media-center" initial={motionEnabled ? { opacity: 0, y: 12 } : false} transition={{ duration: 0.5 }}>
      <header className="media-topbar">
        <div><Icon name="film" size={17} /><span>THE FOREST CINEMA</span></div>
        <nav aria-label="Media sections"><button className="media-nav-active">Home</button><button onClick={() => document.querySelector('.unified-watch-history')?.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' })}>Historique</button><button onClick={() => document.querySelector('.forest-library')?.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' })}>Bibliothèque</button><button onClick={() => document.querySelector('.media-player-dock')?.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' })}>Lecteurs</button></nav>
        <span className="media-index-state"><i /> {media.scanning ? 'INDEXATION…' : `${media.items.length} MÉDIAS`}</span>
      </header>

      {media.error && <div className="forest-media-error" role="alert"><span>FOREST SIGNAL</span><p>{media.error}</p><button onClick={media.clearError} type="button"><Icon name="close" size={13} /></button></div>}
      {watch.error && <div className="forest-media-error" role="alert"><span>WATCH SIGNAL</span><p>{watch.error}</p><button onClick={watch.clearError} type="button"><Icon name="close" size={13} /></button></div>}

      <MediaHero favorite={selected ? favoriteIds.has(selected.id) : false} item={selected} onFavorite={media.toggleFavorite} onPlay={media.playMedia} playerStatus={media.playerStatus} />
      <MediaFolderPanel folders={media.folders} onAdd={media.addFolders} onRemove={media.removeFolder} scanning={media.scanning} />
      <ContinueWatching entries={trackedContinueWatching} onSelect={watch.selectEntry} />

      <section className="watch-source-groves"><header><div><span>SOURCE GROVES</span><h2>Les clairières connectées</h2></div><label>Profil<select onChange={(event) => watch.setSelectedProfile(event.target.value)} value={watch.selectedProfile}>{watchProfiles.map((profile) => <option key={profile} value={profile}>{profile === 'all' ? 'Tous les profils' : profile}</option>)}</select></label></header><div><article><span>LOCAL</span><strong>{watch.stats?.sourceCounts['nexus-local'] ?? 0}</strong><small>Progression exacte</small></article><article><span>NETFLIX</span><strong>{watch.stats?.sourceCounts['netflix-import'] ?? 0}</strong><small>Activité importée</small></article><article><span>CRUNCHYROLL</span><strong>{watch.stats?.sourceCounts['crunchyroll-import'] ?? 0}</strong><small>Historique importé</small></article><article><span>VLC</span><strong>{watch.stats?.sourceCounts.vlc ?? 0}</strong><small>Lancements enregistrés</small></article><article><span>MANUEL</span><strong>{watch.stats?.sourceCounts.manual ?? 0}</strong><small>Corrections utilisateur</small></article></div></section>

      <div className="watch-tracker-layout"><UnifiedWatchHistory entries={visibleWatchEntries} filter={watch.filter} onFilter={watch.setFilter} onQuery={watch.setSearchQuery} onSelect={watch.selectEntry} onSort={watch.setSortMode} query={watch.searchQuery} selectedId={watch.selectedEntryId} sort={watch.sortMode} /><WatchDetailsPanel entry={selectedWatchEntry} onDelete={(id) => { if (window.confirm('Supprimer définitivement cette entrée de suivi ?')) void watch.deleteEntry(id) }} onMark={watch.markEntry} onUpdate={watch.updateEntry} /></div>

      <WatchStatsPanel stats={watch.stats} />
      <ConnectedServices connecting={connectors.connecting} connectors={connectors.connectors} onConnect={(id) => void connectors.connectConnector(id)} onOpen={connectors.openCenter} onSync={(id) => void connectors.createSyncPlan(id, 'pull')} />
      <WatchConflictClearing conflicts={watch.conflicts} onResolve={watch.resolveConflict} />
      <WatchImportPortal busy={watch.importing || watch.exporting} history={watch.imports} onCreateManual={watch.createManual} onExport={() => void watch.exportHistory()} onImport={(provider) => void watch.previewImport(provider)} />
      <TrackingSettings onDeleteProvider={(provider) => { const scope = watch.selectedProfile === 'all' ? 'tous les profils' : `le profil ${watch.selectedProfile}`; if (window.confirm(`Effacer toutes les traces ${provider} pour ${scope} ? Cette action est définitive.`)) void watch.deleteProvider(provider) }} profileName={watch.selectedProfile} providers={watch.providers} stats={watch.stats} />

      {continueItems.length > 0 && <MediaShelf count={`${continueItems.length} À REPRENDRE`} eyebrow="CONTINUER" title="Reprendre la lecture locale">{continueItems.map((item) => card(item, 'landscape'))}</MediaShelf>}
      {recentItems.length > 0 && <MediaShelf count={`${recentItems.length} RÉCENTS`} eyebrow="DERNIÈRES TRACES" title="Récemment ouverts">{recentItems.slice(0, 8).map((item) => card(item, 'landscape'))}</MediaShelf>}
      {recommendations.length > 0 && <MediaShelf count={`${recommendations.length} SUGGESTIONS`} eyebrow="SÉLECTION LOCALE" title="Au détour du sentier">{recommendations.map((item) => card(item))}</MediaShelf>}

      <section className="forest-library"><header><div><span>LOCAL ARCHIVE</span><h2>Bibliothèque</h2></div><button disabled={media.scanning} onClick={media.scan} type="button"><Icon name="refresh" size={14} /> {media.scanning ? 'INDEXATION' : 'RÉINDEXER'}</button></header><MediaToolbar filter={media.filter} onFilter={media.setFilter} onQuery={media.setSearchQuery} onSort={media.setSortMode} query={media.searchQuery} sortMode={media.sortMode} />{visible.length > 0 ? <div className="forest-library-grid">{visible.map((item) => card(item))}</div> : <div className="forest-library-empty"><Icon name="film" size={28} /><strong>La forêt est silencieuse.</strong><p>{media.folders.length === 0 ? 'Ajoutez un dossier local pour commencer l’indexation.' : 'Aucun média ne correspond à cette recherche.'}</p></div>}</section>

      <section className="media-player-dock"><header><span>CONNECTED ECOSYSTEM</span><h2>Lecteurs & services</h2></header><div><article><span><Icon name="vlc" size={22} /></span><p><strong>VLC</strong><small>Lancement enregistré, progression inconnue</small></p><b>{media.playerStatus?.vlcAvailable ? 'PRÊT' : 'ABSENT'}</b></article><article><span className="media-player-letter">N</span><p><strong>Lecteur NEXUS</strong><small>Progression exacte préparée</small></p><b>À VENIR</b></article><article><span className="media-player-letter">P</span><p><strong>Plex</strong><small>Provider futur</small></p><b>PRÉPARÉ</b></article><article><span className="media-player-letter">J</span><p><strong>Jellyfin</strong><small>Provider futur</small></p><b>PRÉPARÉ</b></article><article><span className="media-player-letter">E</span><p><strong>Emby</strong><small>Provider futur</small></p><b>PRÉPARÉ</b></article></div><footer><Icon name="lock" size={14} /><span>Tout l’historique reste local. Aucun compte ou cookie n’est demandé.</span></footer></section>

      <footer className="forest-scan-summary"><span>{media.scanSummary ? `${media.scanSummary.itemsDetected} MÉDIAS · ${media.scanSummary.foldersScanned} DOSSIERS · ${media.scanSummary.durationMs} MS` : 'INDEX LOCAL UNIQUEMENT'}</span><span>AUCUN SCAN HORS DOSSIERS CONFIGURÉS</span></footer>
      {watch.importPreview && <WatchImportDialog busy={watch.importing} onCancel={() => void watch.cancelImport()} onCommit={() => void watch.commitImport()} preview={watch.importPreview} />}
      <SyncCenter />
    </motion.div>
  )
}
