import type { NexusCommandRequest } from '../../core/commands/command.types.js'
import type { WatchConflict, WatchConflictResolution, WatchEntry, WatchEntryId, WatchEntryUpdate, WatchHistoryQuery, WatchImport, WatchImportPreview, WatchImportResult, WatchImportSelection, WatchProviderDefinition, WatchProviderId, WatchStats, WatchStatus } from './watch.types.ts'

function request<TPayload>(command: string, payload: TPayload): NexusCommandRequest<TPayload> { return { command, createdAt: Date.now(), id: crypto.randomUUID(), payload, source: 'ui', target: { type: 'local' } } }
async function execute<TPayload, TResult>(command: string, payload: TPayload) { if (!window.nexus) throw new Error('The NEXUS command gateway is unavailable.'); const result = await window.nexus.execute<TPayload, TResult>(request(command, payload)); if (result.status !== 'success' || result.data === undefined) throw new Error(result.error ?? `${command} failed.`); return result.data }
async function executeConfirmed<TPayload>(command: string, payload: TPayload) {
  if (!window.nexus) throw new Error('The NEXUS command gateway is unavailable.')
  const result = await window.nexus.execute(request(command, payload))
  if (result.status === 'confirmation_required' && result.requestId) {
    const confirmed = await window.nexus.confirm(result.requestId)
    if (confirmed.status !== 'success') throw new Error(confirmed.error ?? `${command} failed.`)
    return true
  }
  if (result.status !== 'success') throw new Error(result.error ?? `${command} failed.`)
  return true
}

export const watchService = {
  cancelImport: (importId: string) => execute<{ importId: string }, boolean>('watch.import.cancel', { importId }),
  commitImport: (importId: string) => execute<{ importId: string }, WatchImportResult>('watch.import.commit', { importId }),
  conflicts: () => execute<void, WatchConflict[]>('watch.conflicts.list', undefined),
  createManual: (title: string, profileName: string) => execute<{ profileName: string; title: string }, WatchEntry>('watch.history.create', { profileName, title }),
  deleteEntry: (watchEntryId: WatchEntryId) => execute<{ watchEntryId: WatchEntryId }, boolean>('watch.history.delete', { watchEntryId }),
  deleteProvider: (provider: WatchProviderId, profileName?: string) => executeConfirmed('watch.history.delete-provider', { profileName, provider }),
  exportHistory: (profileName: string) => execute<{ profileName: string }, { cancelled: boolean; fileName: string | null }>('watch.export.create', { profileName }),
  history: (query?: WatchHistoryQuery) => execute<WatchHistoryQuery | undefined, WatchEntry[]>('watch.history.list', query),
  imports: () => execute<void, WatchImport[]>('watch.import.list', undefined),
  mark: (watchEntryId: WatchEntryId, status: WatchStatus) => execute<{ status: WatchStatus; watchEntryId: WatchEntryId }, WatchEntry>('watch.history.mark', { status, watchEntryId }),
  previewImport: (provider: WatchImportSelection['provider'], fileToken: string, profileName: string) => execute<{ fileToken: string; profileName: string; provider: WatchImportSelection['provider'] }, WatchImportPreview>('watch.import.preview', { fileToken, profileName, provider }),
  providers: () => execute<void, WatchProviderDefinition[]>('watch.providers.list', undefined),
  resolveConflict: (conflictId: string, resolution: WatchConflictResolution) => execute<{ conflictId: string; resolution: WatchConflictResolution }, WatchConflict>('watch.conflicts.resolve', { conflictId, resolution }),
  selectImport: (provider: WatchImportSelection['provider']) => execute<{ provider: WatchImportSelection['provider'] }, WatchImportSelection | null>('watch.import.select', { provider }),
  stats: () => execute<void, WatchStats>('watch.stats.get', undefined),
  update: (watchEntryId: WatchEntryId, changes: WatchEntryUpdate) => execute<{ changes: WatchEntryUpdate; watchEntryId: WatchEntryId }, WatchEntry>('watch.history.update', { changes, watchEntryId }),
}

export type ImportableWatchProvider = Extract<WatchProviderId, 'netflix-import' | 'crunchyroll-import' | 'manual'>
