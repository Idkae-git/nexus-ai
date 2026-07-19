import type { NexusCommandRequest, NexusCommandResult } from '../../core/commands/command.types.js'
import type { WatchConnectorId, WatchConnectorView, WatchSyncConflict, WatchSyncConflictResolution, WatchSyncDirection, WatchSyncHistoryEntry, WatchSyncPlan, WatchSyncPreference, WatchSyncResult, WatchSyncStatus } from './connector.types.js'

function request<TPayload>(command: string, payload: TPayload): NexusCommandRequest<TPayload> { return { command, createdAt: Date.now(), id: crypto.randomUUID(), payload, source: 'ui', target: { type: 'local' } } }
async function execute<TPayload, TResult>(command: string, payload: TPayload) { if (!window.nexus) throw new Error('The NEXUS command gateway is unavailable.'); const result = await window.nexus.execute<TPayload, TResult>(request(command, payload)); if (result.status !== 'success' || result.data === undefined) throw new Error(result.error ?? `${command} failed.`); return result.data }
async function executeConfirmed<TPayload, TResult>(command: string, payload: TPayload) {
  if (!window.nexus) throw new Error('The NEXUS command gateway is unavailable.')
  const result = await window.nexus.execute<TPayload, TResult>(request(command, payload))
  if (result.status === 'confirmation_required' && result.requestId) {
    const confirmed = await window.nexus.confirm(result.requestId) as NexusCommandResult<TResult>
    if (confirmed.status !== 'success' || confirmed.data === undefined) throw new Error(confirmed.error ?? `${command} failed.`)
    return confirmed.data
  }
  if (result.status !== 'success' || result.data === undefined) throw new Error(result.error ?? `${command} failed.`)
  return result.data
}

export interface WatchSyncExecutionResult extends WatchSyncResult { operations: WatchSyncPlan['operations'] }

export const connectorService = {
  cancelSync: (syncPlanId: string) => execute<{ syncPlanId: string }, boolean>('watch.sync.cancel', { syncPlanId }),
  connect: (connectorId: WatchConnectorId) => execute<{ connectorId: WatchConnectorId }, WatchConnectorView>('watch.connectors.connect', { connectorId }),
  connectors: () => execute<void, WatchConnectorView[]>('watch.connectors.list', undefined),
  disconnect: (connectorId: WatchConnectorId, deleteImportedData = false) => executeConfirmed<{ connectorId: WatchConnectorId; deleteImportedData: boolean }, WatchConnectorView>('watch.connectors.disconnect', { connectorId, deleteImportedData }),
  executeSync: (syncPlanId: string, confirmedOperationIds: string[]) => executeConfirmed<{ confirmedOperationIds: string[]; syncPlanId: string }, WatchSyncExecutionResult>('watch.sync.execute', { confirmedOperationIds, syncPlanId }),
  history: () => execute<void, WatchSyncHistoryEntry[]>('watch.sync.history', undefined),
  conflicts: () => execute<void, WatchSyncConflict[]>('watch.sync.conflicts', undefined),
  plan: (connectorId: WatchConnectorId, direction: WatchSyncDirection, profileName: string) => execute<{ connectorId: WatchConnectorId; direction: WatchSyncDirection; profileName: string }, WatchSyncPlan>('watch.sync.plan', { connectorId, direction, profileName }),
  preview: (syncPlanId: string) => execute<{ syncPlanId: string }, WatchSyncPlan>('watch.sync.preview', { syncPlanId }),
  preferences: (connectorId: WatchConnectorId) => execute<{ connectorId: WatchConnectorId }, WatchSyncPreference>('watch.sync.preferences.get', { connectorId }),
  resolveConflict: (conflictId: string, resolution: WatchSyncConflictResolution) => execute<{ conflictId: string; resolution: WatchSyncConflictResolution }, WatchSyncConflict>('watch.sync.resolve', { conflictId, resolution }),
  status: () => execute<void, WatchSyncStatus>('watch.sync.status', undefined),
  test: (connectorId: WatchConnectorId) => execute<{ connectorId: WatchConnectorId }, boolean>('watch.connectors.test', { connectorId }),
  updatePreferences: (connectorId: WatchConnectorId, changes: Partial<Omit<WatchSyncPreference, 'connectorId'>>) => execute<{ changes: Partial<Omit<WatchSyncPreference, 'connectorId'>>; connectorId: WatchConnectorId }, WatchSyncPreference>('watch.sync.preferences.update', { changes, connectorId }),
}
