import { create } from 'zustand'

import { watchService, type ImportableWatchProvider } from './watch.service.ts'
import type { WatchConflict, WatchConflictResolution, WatchEntry, WatchEntryId, WatchEntryUpdate, WatchHistoryFilter, WatchHistorySortMode, WatchImport, WatchImportPreview, WatchProviderDefinition, WatchProviderId, WatchStats, WatchStatus } from './watch.types.ts'

interface WatchStoreState {
  cancelImport: () => Promise<void>
  clearError: () => void
  commitImport: () => Promise<void>
  conflicts: WatchConflict[]
  createManual: (title: string) => Promise<void>
  deleteEntry: (id: WatchEntryId) => Promise<void>
  deleteProvider: (provider: WatchProviderId) => Promise<void>
  error: string | null
  exportHistory: () => Promise<void>
  exporting: boolean
  filter: WatchHistoryFilter
  history: WatchEntry[]
  importing: boolean
  imports: WatchImport[]
  importPreview: WatchImportPreview | null
  load: () => Promise<void>
  loading: boolean
  previewImport: (provider: ImportableWatchProvider) => Promise<void>
  providers: WatchProviderDefinition[]
  resolveConflict: (id: string, resolution: WatchConflictResolution) => Promise<void>
  searchQuery: string
  selectedEntryId: WatchEntryId | null
  selectedProfile: string
  selectEntry: (id: WatchEntryId | null) => void
  setFilter: (filter: WatchHistoryFilter) => void
  setSearchQuery: (query: string) => void
  setSelectedProfile: (profile: string) => void
  setSortMode: (sort: WatchHistorySortMode) => void
  sortMode: WatchHistorySortMode
  stats: WatchStats | null
  updateEntry: (id: WatchEntryId, changes: WatchEntryUpdate) => Promise<void>
  markEntry: (id: WatchEntryId, status: WatchStatus) => Promise<void>
}

function message(error: unknown) { return error instanceof Error ? error.message : 'Une erreur Watch Tracker inattendue est survenue.' }

export const useWatchStore = create<WatchStoreState>((set, get) => ({
  cancelImport: async () => { const preview = get().importPreview; if (preview) await watchService.cancelImport(preview.importId); set({ importPreview: null }) },
  clearError: () => set({ error: null }), conflicts: [], error: null, exporting: false, filter: 'all', history: [], importing: false, imports: [], importPreview: null, loading: false, providers: [], searchQuery: '', selectedEntryId: null, selectedProfile: 'all', sortMode: 'recently-watched', stats: null,
  async load() { set({ loading: true }); try { const [history, imports, conflicts, providers, stats] = await Promise.all([watchService.history(), watchService.imports(), watchService.conflicts(), watchService.providers(), watchService.stats()]); set((state) => ({ conflicts, history, imports, providers, selectedEntryId: state.selectedEntryId ?? history[0]?.id ?? null, stats })) } catch (error) { set({ error: message(error) }) } finally { set({ loading: false }) } },
  async previewImport(provider) { set({ error: null, importing: true }); try { const selection = await watchService.selectImport(provider); if (!selection) return; set({ importPreview: await watchService.previewImport(provider, selection.fileToken, get().selectedProfile === 'all' ? 'Default' : get().selectedProfile) }) } catch (error) { set({ error: message(error) }) } finally { set({ importing: false }) } },
  async commitImport() { const preview = get().importPreview; if (!preview) return; set({ importing: true }); try { await watchService.commitImport(preview.importId); set({ importPreview: null }); await get().load() } catch (error) { set({ error: message(error) }) } finally { set({ importing: false }) } },
  async updateEntry(id, changes) { try { const updated = await watchService.update(id, changes); set((state) => ({ history: state.history.map((entry) => entry.id === id ? updated : entry) })) } catch (error) { set({ error: message(error) }) } },
  async markEntry(id, status) { try { const updated = await watchService.mark(id, status); set((state) => ({ history: state.history.map((entry) => entry.id === id ? updated : entry) })) } catch (error) { set({ error: message(error) }) } },
  async deleteEntry(id) { try { await watchService.deleteEntry(id); set((state) => ({ history: state.history.filter((entry) => entry.id !== id), selectedEntryId: null })) } catch (error) { set({ error: message(error) }) } },
  async deleteProvider(provider) { try { const profile = get().selectedProfile; await watchService.deleteProvider(provider, profile === 'all' ? undefined : profile); await get().load() } catch (error) { set({ error: message(error) }) } },
  async resolveConflict(id, resolution) { try { await watchService.resolveConflict(id, resolution); await get().load() } catch (error) { set({ error: message(error) }) } },
  async exportHistory() { set({ exporting: true }); try { await watchService.exportHistory(get().selectedProfile === 'all' ? 'Default' : get().selectedProfile) } catch (error) { set({ error: message(error) }) } finally { set({ exporting: false }) } },
  async createManual(title) { try { const entry = await watchService.createManual(title, get().selectedProfile === 'all' ? 'Default' : get().selectedProfile); set((state) => ({ history: [entry, ...state.history], selectedEntryId: entry.id })) } catch (error) { set({ error: message(error) }) } },
  selectEntry: (selectedEntryId) => set({ selectedEntryId }), setFilter: (filter) => set({ filter }), setSearchQuery: (searchQuery) => set({ searchQuery }), setSelectedProfile: (selectedProfile) => set({ selectedProfile }), setSortMode: (sortMode) => set({ sortMode }),
}))
