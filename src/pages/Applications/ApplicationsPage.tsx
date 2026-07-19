import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'

import { Icon } from '../../components/ui/Icon.tsx'
import { APPLICATION_RUNTIME_REFRESH_MS } from '../../features/applications/application.constants.ts'
import { isFavorite, selectApplications, selectFavoriteApplications, selectRunningApplications } from '../../features/applications/application.selectors.ts'
import { useApplicationStore } from '../../features/applications/application.store.ts'
import { useWorld } from '../../world-engine/world-hooks.ts'
import { WorkspaceAppRow } from './components/WorkspaceAppRow.tsx'
import { WorkspaceCommandBar } from './components/WorkspaceCommandBar.tsx'
import { WorkspaceInspector } from './components/WorkspaceInspector.tsx'
import { WorkspacePinnedApp } from './components/WorkspacePinnedApp.tsx'
import { WorkspaceRecentItem } from './components/WorkspaceRecentItem.tsx'
import { WorkspaceRunningApp } from './components/WorkspaceRunningApp.tsx'

import './Applications.css'

export function ApplicationsPage() {
  const store = useApplicationStore()
  const { preferences } = useWorld()
  const scanApplications = store.scanApplications
  const visibleApplications = useMemo(() => selectApplications(store.applications, { favorites: store.favorites, filter: store.filter, query: store.searchQuery, sortMode: store.sortMode }), [store.applications, store.favorites, store.filter, store.searchQuery, store.sortMode])
  const favoriteApplications = useMemo(() => selectFavoriteApplications(store.applications, store.favorites), [store.applications, store.favorites])
  const runningApplications = useMemo(() => selectRunningApplications(store.applications), [store.applications])
  const selectedApplication = store.applications.find((application) => application.id === store.selectedApplicationId) ?? visibleApplications[0] ?? null
  const installedCount = store.applications.filter((application) => application.installStatus === 'installed').length
  const motionEnabled = preferences.animationsEnabled && !preferences.staticMode && !preferences.reducedMotionActive

  useEffect(() => {
    void scanApplications()
    const interval = window.setInterval(() => void useApplicationStore.getState().refreshRuntimeStatus(), APPLICATION_RUNTIME_REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [scanApplications])

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="page page-applications workspace-page" initial={motionEnabled ? { opacity: 0, y: 10 } : false} transition={{ duration: 0.26 }}>
      <header className="workspace-page-header">
        <div><span>WORLD 04 / DIGITAL WORKSPACE</span><h1>The Workspace</h1><p>A calm, organized place to open what matters and return to your work.</p></div>
        <div><span><i className={runningApplications.length > 0 ? 'is-active' : ''} />{runningApplications.length > 0 ? `${runningApplications.length} applications running` : 'Workspace ready'}</span></div>
      </header>

      <WorkspaceCommandBar filter={store.filter} installedCount={installedCount} isScanning={store.isScanning} onFilter={store.setFilter} onQuery={store.setSearchQuery} onScan={() => void store.scanApplications()} onSort={store.setSortMode} query={store.searchQuery} runningCount={runningApplications.length} sort={store.sortMode} />

      {store.error && <div className="workspace-error" role="alert"><Icon name="activity" size={16} /><span><strong>Application Registry unavailable</strong>{store.error}</span><button onClick={() => void store.scanApplications()} type="button">Retry</button></div>}

      <div className="workspace-layout">
        <main className="workspace-content">
          <section className="workspace-pinned">
            <header><div><span>Personal desk</span><h2>Pinned workspace</h2></div><small>{favoriteApplications.length} pinned</small></header>
            {favoriteApplications.length > 0 ? <div>{favoriteApplications.slice(0, 4).map((application) => <WorkspacePinnedApp actionState={store.actionById[application.id]} application={application} key={application.id} onClose={() => void store.closeApplication(application.id)} onLaunch={() => void store.launchApplication(application.id)} onSelect={() => store.setSelectedApplication(application.id)} onToggleFavorite={() => store.toggleFavorite(application.id)} selected={selectedApplication?.id === application.id} />)}</div> : <div className="workspace-pinned-empty"><Icon name="sparkles" size={21} /><span><strong>Build your workspace</strong><small>Pin frequently used applications from the library below.</small></span></div>}
          </section>

          <section className="workspace-running">
            <header><div><span>Current desktop</span><h2>Running now</h2></div><small>{runningApplications.length} open</small></header>
            {runningApplications.length > 0 ? <div>{runningApplications.map((application) => <WorkspaceRunningApp actionState={store.actionById[application.id]} application={application} key={application.id} onClose={() => void store.closeApplication(application.id)} onSelect={() => store.setSelectedApplication(application.id)} />)}</div> : <p>No detected application is currently open.</p>}
          </section>

          <section className="workspace-library">
            <header><div><span>Application collection</span><h2>{store.searchQuery ? 'Search results' : `${store.filter.replace('-', ' ')} applications`}</h2></div><small>{visibleApplications.length} shown</small></header>
            {visibleApplications.length > 0 ? <div className="workspace-app-shelf">{visibleApplications.map((application, index) => <WorkspaceAppRow actionState={store.actionById[application.id]} application={application} favorite={isFavorite(store.favorites, application.id)} featured={index === 0 && !store.searchQuery} key={application.id} onClose={() => void store.closeApplication(application.id)} onLaunch={() => void store.launchApplication(application.id)} onSelect={() => store.setSelectedApplication(application.id)} onToggleFavorite={() => store.toggleFavorite(application.id)} selected={selectedApplication?.id === application.id} />)}</div> : <div className="workspace-library-empty"><Icon name={store.isScanning ? 'refresh' : 'search'} size={25} /><strong>{store.isScanning ? 'Refreshing your workspace' : 'Nothing matches this view'}</strong><p>{store.isScanning ? 'Known Windows locations and live processes are being checked.' : 'Try another query or filter.'}</p></div>}
          </section>

          <section className="workspace-recent">
            <header><div><span>NEXUS activity</span><h2>Recently used</h2></div><small>{store.recent.length} events</small></header>
            {store.recent.length > 0 ? <ol>{store.recent.slice(0, 6).map((entry) => <WorkspaceRecentItem application={store.applications.find((item) => item.id === entry.applicationId)} entry={entry} key={`${entry.applicationId}-${entry.timestamp}`} />)}</ol> : <p>No application has been opened through NEXUS yet.</p>}
          </section>
        </main>

        <WorkspaceInspector actionState={selectedApplication ? store.actionById[selectedApplication.id] : undefined} application={selectedApplication} favorite={selectedApplication ? isFavorite(store.favorites, selectedApplication.id) : false} onClose={() => { if (selectedApplication) void store.closeApplication(selectedApplication.id) }} onLaunch={() => { if (selectedApplication) void store.launchApplication(selectedApplication.id) }} onToggleFavorite={() => { if (selectedApplication) store.toggleFavorite(selectedApplication.id) }} />
      </div>
    </motion.div>
  )
}
