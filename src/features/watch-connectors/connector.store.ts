import { create } from 'zustand'

import { connectorService, type WatchSyncExecutionResult } from './connector.service.js'
import type { WatchConnectorId, WatchConnectorView, WatchSyncConflict, WatchSyncConflictResolution, WatchSyncDirection, WatchSyncHistoryEntry, WatchSyncPlan, WatchSyncPreference, WatchSyncStatus } from './connector.types.js'

interface ConnectorStoreState {
  activeConnectorId: WatchConnectorId | null
  cancelSync: () => Promise<void>
  centerOpen: boolean
  clearError: () => void
  closeCenter: () => void
  conflicts: WatchSyncConflict[]
  connectConnector: (id: WatchConnectorId) => Promise<void>
  connecting: WatchConnectorId | null
  connectors: WatchConnectorView[]
  createSyncPlan: (id: WatchConnectorId, direction?: WatchSyncDirection) => Promise<void>
  disconnectConnector: (id: WatchConnectorId, deleteImportedData?: boolean) => Promise<void>
  error: string | null
  executeSyncPlan: () => Promise<void>
  load: () => Promise<void>
  loading: boolean
  openCenter: (id: WatchConnectorId) => void
  planning: boolean
  preferences: Partial<Record<WatchConnectorId, WatchSyncPreference>>
  resolveConflict: (id: string, resolution: WatchSyncConflictResolution) => Promise<void>
  syncHistory: WatchSyncHistoryEntry[]
  syncPlan: WatchSyncPlan | null
  syncResult: WatchSyncExecutionResult | null
  syncStatus: WatchSyncStatus | null
  syncing: boolean
  testConnector: (id: WatchConnectorId) => Promise<void>
  toggleSyncOperation: (id: string) => void
  updatePreferences: (id: WatchConnectorId, changes: Partial<Omit<WatchSyncPreference, 'connectorId'>>) => Promise<void>
}

function message(error: unknown) { return error instanceof Error ? error.message : 'Une erreur de synchronisation inattendue est survenue.' }

export const useConnectorStore = create<ConnectorStoreState>((set, get) => ({
  activeConnectorId: null, centerOpen: false, conflicts: [], connecting: null, connectors: [], error: null, loading: false, planning: false, preferences: {}, syncHistory: [], syncPlan: null, syncResult: null, syncStatus: null, syncing: false,
  cancelSync: async () => { const plan = get().syncPlan; if (plan) await connectorService.cancelSync(plan.id) },
  clearError: () => set({ error: null }), closeCenter: () => set({ centerOpen: false }), openCenter: (activeConnectorId) => set({ activeConnectorId, centerOpen: true, syncResult: null }),
  async load() { set({ loading: true }); try { const [connectors, syncHistory, conflicts] = await Promise.all([connectorService.connectors(), connectorService.history(), connectorService.conflicts()]); const preferences = { ...get().preferences }; await Promise.all(connectors.map(async (connector) => { preferences[connector.id] = await connectorService.preferences(connector.id) })); set({ conflicts, connectors, preferences, syncHistory }) } catch (error) { set({ error: message(error) }) } finally { set({ loading: false }) } },
  async connectConnector(id) { set({ connecting: id, error: null }); try { const connected = await connectorService.connect(id); set((state) => ({ connectors: state.connectors.map((item) => item.id === id ? connected : item) })) } catch (error) { set({ error: message(error) }); await get().load() } finally { set({ connecting: null }) } },
  async disconnectConnector(id, deleteImportedData = false) { try { const disconnected = await connectorService.disconnect(id, deleteImportedData); set((state) => ({ connectors: state.connectors.map((item) => item.id === id ? disconnected : item), syncPlan: state.activeConnectorId === id ? null : state.syncPlan })) } catch (error) { set({ error: message(error) }) } },
  async testConnector(id) { try { await connectorService.test(id) } catch (error) { set({ error: message(error) }) } },
  async createSyncPlan(id, direction = 'pull') { set({ activeConnectorId: id, centerOpen: true, error: null, planning: true, syncPlan: null, syncResult: null }); try { const plan = await connectorService.plan(id, direction, 'Default'); set({ syncPlan: plan }) } catch (error) { set({ error: message(error) }) } finally { set({ planning: false }) } },
  toggleSyncOperation(id) { set((state) => !state.syncPlan ? state : ({ syncPlan: { ...state.syncPlan, operations: state.syncPlan.operations.map((item) => item.id === id && !['conflict', 'unmatched'].includes(item.type) ? { ...item, included: !item.included } : item) } })) },
  async executeSyncPlan() { const plan = get().syncPlan; if (!plan) return; set({ error: null, syncing: true, syncResult: null }); const poll = window.setInterval(() => { void connectorService.status().then((syncStatus) => set({ syncStatus })).catch(() => undefined) }, 800); try { const confirmed = plan.operations.filter((item) => item.included).map((item) => item.id); const syncResult = await connectorService.executeSync(plan.id, confirmed); set({ syncResult, syncStatus: await connectorService.status() }); await get().load() } catch (error) { set({ error: message(error) }) } finally { window.clearInterval(poll); set({ syncing: false }) } },
  async resolveConflict(id, resolution) { try { await connectorService.resolveConflict(id, resolution); const currentPlan = get().syncPlan; const syncPlan = currentPlan ? await connectorService.preview(currentPlan.id) : null; set((state) => ({ conflicts: state.conflicts.filter((item) => item.id !== id), syncPlan })) } catch (error) { set({ error: message(error) }) } },
  async updatePreferences(id, changes) { try { const preference = await connectorService.updatePreferences(id, changes); set((state) => ({ preferences: { ...state.preferences, [id]: preference } })) } catch (error) { set({ error: message(error) }) } },
}))
