import { Icon } from '../../../components/ui/Icon.tsx'
import { applicationFilters, applicationSortModes } from '../../../features/applications/application.constants.ts'
import type { ApplicationSearchFilter, ApplicationSortMode } from '../../../features/applications/application.types.ts'

interface WorkspaceCommandBarProps {
  filter: ApplicationSearchFilter
  installedCount: number
  isScanning: boolean
  onFilter: (filter: ApplicationSearchFilter) => void
  onQuery: (query: string) => void
  onScan: () => void
  onSort: (sort: ApplicationSortMode) => void
  query: string
  runningCount: number
  sort: ApplicationSortMode
}

export function WorkspaceCommandBar(props: WorkspaceCommandBarProps) {
  return (
    <section className="workspace-command-bar">
      <div className="workspace-command-input">
        <Icon name="search" size={21} />
        <input aria-label="Search applications" autoComplete="off" onChange={(event) => props.onQuery(event.target.value)} placeholder="Search applications, publishers or categories…" value={props.query} />
        <kbd>Ctrl K</kbd>
      </div>
      <div className="workspace-command-options">
        <div className="workspace-filter-pills">{applicationFilters.map((filter) => <button aria-pressed={props.filter === filter} className={props.filter === filter ? 'is-active' : ''} key={filter} onClick={() => props.onFilter(filter)} type="button">{filter.replace('-', ' ')}</button>)}</div>
        <div className="workspace-command-meta"><span>{props.installedCount} installed</span><span>{props.runningCount} running</span><select aria-label="Sort applications" onChange={(event) => props.onSort(event.target.value as ApplicationSortMode)} value={props.sort}>{applicationSortModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select><button disabled={props.isScanning} onClick={props.onScan} type="button"><Icon name="refresh" size={14} />{props.isScanning ? 'Scanning' : 'Refresh'}</button></div>
      </div>
      {props.query && <div className="workspace-command-suggestion"><Icon name="arrow-up-right" size={14} /><span>Showing results for <strong>{props.query}</strong></span><small>Quick launch keyboard navigation is prepared for a future release.</small></div>}
    </section>
  )
}
