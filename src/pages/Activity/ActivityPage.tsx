import { useMemo, useState } from 'react'

import type { NexusActivityEntry, NexusActivityStatus } from '../../core/activity/activity.types.js'
import { TimelineEntry } from '../../components/activity/TimelineEntry.tsx'
import { ActionButton } from '../../components/ui/ActionButton.tsx'
import { Icon } from '../../components/ui/Icon.tsx'
import { SearchBar } from '../../components/ui/SearchBar.tsx'

interface ActivityPageProps {
  activities: NexusActivityEntry[]
  error: string | null
  onClear: () => Promise<void>
  onRefresh: () => Promise<void>
}

type StatusFilter = 'all' | NexusActivityStatus

const statusFilters: StatusFilter[] = ['all', 'success', 'failed', 'confirmation_required', 'cancelled', 'denied']

export function ActivityPage({ activities, error, onClear, onRefresh }: ActivityPageProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [source, setSource] = useState<'all' | NexusActivityEntry['source']>('all')

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return activities.filter((activity) => {
      const matchesQuery = !normalizedQuery
        || activity.command.toLowerCase().includes(normalizedQuery)
        || activity.source.toLowerCase().includes(normalizedQuery)
      return matchesQuery && (status === 'all' || activity.status === status) && (source === 'all' || activity.source === source)
    })
  }, [activities, query, source, status])

  const successCount = activities.filter((item) => item.status === 'success').length
  const attentionCount = activities.filter((item) => item.status === 'failed' || item.status === 'denied').length

  return (
    <div className="page page-activity">
      <header className="activity-terminal-header">
        <div className="terminal-window-controls" aria-hidden="true"><i /><i /><i /></div>
        <div className="activity-terminal-title">
          <span>nexus@command:~$</span>
          <h1>command-center --follow</h1>
          <i className="terminal-cursor" />
        </div>
        <ActionButton onClick={() => void onRefresh()} variant="secondary"><Icon name="refresh" size={14} /> Sync stream</ActionButton>
      </header>

      <div className="activity-terminal-layout">
        <aside className="activity-inspector">
          <header><span>STREAM INSPECTOR</span><small>LOCAL AUDIT</small></header>
          <dl className="activity-counter-stack">
            <div><dt>EVENTS</dt><dd>{activities.length.toString().padStart(2, '0')}</dd></div>
            <div><dt>SUCCESS</dt><dd>{successCount.toString().padStart(2, '0')}</dd></div>
            <div><dt>ATTENTION</dt><dd>{attentionCount.toString().padStart(2, '0')}</dd></div>
          </dl>
          <div className="activity-inspector-section">
            <span>STATUS FILTER</span>
            {statusFilters.map((filter) => (
              <button className={status === filter ? 'terminal-filter terminal-filter-active' : 'terminal-filter'} key={filter} onClick={() => setStatus(filter)}>
                <i /> {filter.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
          <div className="activity-inspector-section">
            <label htmlFor="activity-source">SOURCE</label>
            <select id="activity-source" onChange={(event) => setSource(event.target.value as typeof source)} value={source}>
              <option value="all">all sources</option>
              <option value="ui">ui</option>
              <option value="ai">ai</option>
              <option value="automation">automation</option>
              <option value="remote">remote</option>
            </select>
          </div>
          {activities.length > 0 && <ActionButton onClick={() => void onClear()} variant="text">clear --history</ActionButton>}
        </aside>

        <main className="activity-terminal-main">
          <div className="activity-command-bar">
            <SearchBar ariaLabel="Search activity" onChange={setQuery} placeholder="grep commands, modules or sources..." value={query} />
            <span><i /> LIVE TAIL</span>
          </div>
          <div className="activity-terminal-ruler"><span>LINE</span><span>EXECUTION LOG</span><span>STATUS / TIME</span></div>

          {error ? (
            <div className="terminal-error-state">
              <span className="terminal-error-code">ERR_CORE_STREAM</span>
              <strong>$ activity stream unavailable</strong>
              <p>{error}</p>
              <small>retry with: activity --refresh</small>
            </div>
          ) : filteredActivities.length > 0 ? (
            <ol className="activity-terminal-list">
              {filteredActivities.map((activity, index) => <TimelineEntry activity={activity} index={index} key={activity.id} />)}
            </ol>
          ) : (
            <div className="terminal-idle-state">
              <pre>{`┌─ NEXUS ACTIVITY STREAM\n├─ source: local/core\n├─ status: listening\n└─ events: 0`}</pre>
              <strong>Waiting for the next command.</strong>
              <p>Execution events will be appended to this timeline in real time.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
