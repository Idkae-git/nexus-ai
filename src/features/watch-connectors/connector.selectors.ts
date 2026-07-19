import type { WatchConnectorView, WatchSyncOperation, WatchSyncPlan } from './connector.types.js'

export function connectedWatchConnectors(connectors: readonly WatchConnectorView[]) { return connectors.filter((item) => item.connection.status === 'connected') }
export function includedSyncOperations(plan: WatchSyncPlan | null): WatchSyncOperation[] { return plan?.operations.filter((item) => item.included) ?? [] }
export function groupedSyncOperations(plan: WatchSyncPlan | null) {
  return (plan?.operations ?? []).reduce<Partial<Record<WatchSyncOperation['type'], WatchSyncOperation[]>>>((groups, item) => {
    (groups[item.type] ??= []).push(item)
    return groups
  }, {})
}
