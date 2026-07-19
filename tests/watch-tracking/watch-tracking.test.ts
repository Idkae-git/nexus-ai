import { rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { mergeWatchEntries, matchWatchEntry, progressConflict } from '../../electron/modules/watch-tracking/watch-deduplication.service.js'
import { createWatchEntry, extractWatchIdentity, normalizeWatchTitle } from '../../electron/modules/watch-tracking/watch-history-normalizer.js'
import type { WatchHistoryRepository, WatchHistorySnapshot } from '../../electron/modules/watch-tracking/watch-history.repository.js'
import { WatchImportFileStore } from '../../electron/modules/watch-tracking/watch-import-file-store.js'
import { completionStatus } from '../../electron/modules/watch-tracking/watch-progress.service.js'
import { calculateWatchStats } from '../../electron/modules/watch-tracking/watch-stats.service.js'
import { WatchTrackingManager } from '../../electron/modules/watch-tracking/watch-tracking.manager.js'
import { WatchTrackingModule } from '../../electron/modules/watch-tracking/watch-tracking.module.js'
import { parseCrunchyrollJson } from '../../electron/modules/watch-tracking/providers/crunchyroll/crunchyroll-history.parser.js'
import { nexusWatchHistorySchema, parseNexusWatchHistory } from '../../electron/modules/watch-tracking/providers/manual/nexus-watch.parser.js'
import { parseNetflixCsv } from '../../electron/modules/watch-tracking/providers/netflix/netflix-csv.parser.js'
import { NexusCore } from '../../src/core/nexus-core.js'
import { selectContinueWatching, selectWatchHistory } from '../../src/features/watch-tracking/watch.selectors.js'
import type { WatchEntry } from '../../src/features/watch-tracking/watch.types.js'

class MemoryRepository implements WatchHistoryRepository {
  snapshot: WatchHistorySnapshot = { conflicts: [], entries: [], identities: [], imports: [], preferences: [], version: 1 }
  async read() { return structuredClone(this.snapshot) }
  async update(mutator: (snapshot: WatchHistorySnapshot) => void) { mutator(this.snapshot); return structuredClone(this.snapshot) }
}

function entry(overrides: Partial<WatchEntry> = {}) {
  return { ...createWatchEntry({ automatic: false, precision: 'watched-only', profileName: 'Mathys', provider: 'netflix-import', sourceFileName: 'netflix.csv', status: 'unknown', title: 'Arcane', watchedAt: Date.UTC(2026, 0, 2) }), ...overrides }
}

const temporaryFiles: string[] = []
afterEach(async () => { vi.useRealTimers(); await Promise.all(temporaryFiles.splice(0).map((file) => rm(file, { force: true }))) })

describe('Netflix import', () => {
  it('parses official CSV, BOM and localized columns', () => { const result = parseNetflixCsv('\uFEFFTitre,Date de visionnage\nArcane,02/01/2026', 'Mathys'); expect(result.entries).toHaveLength(1); expect(result.entries[0]).toMatchObject({ primaryProvider: 'netflix-import', progress: { percent: null, precision: 'watched-only' }, status: 'unknown' }) })
  it('supports quoted titles containing commas', () => { expect(parseNetflixCsv('Title,Date\n"Arcane, Season 2",1/2/26', 'Mathys').entries[0]?.title).toBe('Arcane, Season 2') })
  it('reports invalid dates and incomplete rows without crashing', () => { const result = parseNetflixCsv('Title,Date\nArcane,not-a-date\n,1/2/26', 'Mathys'); expect(result.entries).toEqual([]); expect(result.errors).toHaveLength(2) })
  it('rejects incompatible files', () => { expect(() => parseNetflixCsv('Name,When\nArcane,Today', 'Mathys')).toThrow(/incompatible/) })
})

describe('Crunchyroll and NEXUS formats', () => {
  it('parses explicit Crunchyroll JSON without inventing progress', () => { const result = parseCrunchyrollJson(JSON.stringify({ provider: 'crunchyroll', profile: 'Mathys', entries: [{ seriesTitle: 'Frieren', seasonNumber: 1, episodeNumber: 12 }] }), 'Fallback'); expect(result.entries[0]).toMatchObject({ episodeNumber: 12, mediaType: 'anime', profileName: 'Mathys', progress: { percent: null, precision: 'watched-only' } }) })
  it('rejects an undocumented Crunchyroll shape', () => { expect(() => parseCrunchyrollJson('{"password":"secret"}', 'Mathys')).toThrow(/incompatible/) })
  it('validates schemaVersion 1 exports strictly', () => { const exported = { entries: [entry()], exportedAt: 1, metadata: {}, profile: 'Mathys', provider: 'nexus', schemaVersion: 1 }; expect(nexusWatchHistorySchema.safeParse(exported).success).toBe(true); expect(nexusWatchHistorySchema.safeParse({ ...exported, schemaVersion: 2 }).success).toBe(false) })
  it('exports can be parsed back without losing exact progress', () => { const exact = entry({ primaryProvider: 'nexus-local', progress: { durationSeconds: 100, percent: 42, positionSeconds: 42, precision: 'exact', updatedAt: 1 }, sources: [{ automatic: true, importedAt: 1, precision: 'exact', provider: 'nexus-local', sourceFileName: null, syncedAt: 1 }] }); const parsed = parseNexusWatchHistory(JSON.stringify({ entries: [exact], exportedAt: 2, metadata: {}, profile: 'Mathys', provider: 'nexus', schemaVersion: 1 })); expect(parsed.entries[0]?.progress).toMatchObject({ percent: 42, precision: 'exact' }) })
})

describe('identity, deduplication and progress truth', () => {
  it('normalizes accents, quality suffixes, file extensions and punctuation', () => { expect(normalizeWatchTitle('Été.S02E03.1080p.WEB-DL.mkv')).toBe('ete s02e03') })
  it('detects conservative season and episode signals', () => { expect(extractWatchIdentity('Arcane.S02E03.1080p.mkv')).toMatchObject({ episodeNumber: 3, normalizedTitle: 'arcane', seasonNumber: 2 }) })
  it('deduplicates exact provider entries only inside a profile', () => { const source = entry({ providerEntryId: 'abc' }); expect(matchWatchEntry(entry({ providerEntryId: 'abc' }), [source]).confidence).toBe('exact'); expect(matchWatchEntry(entry({ profileName: 'Guest', providerEntryId: 'abc' }), [source]).entryId).toBeNull() })
  it('never replaces exact progress with watched-only data', () => { const exact = entry({ progress: { durationSeconds: 100, percent: 50, positionSeconds: 50, precision: 'exact', updatedAt: 1 } }); expect(mergeWatchEntries(exact, entry()).progress.precision).toBe('exact') })
  it('protects manual edits with a conflict', () => { expect(progressConflict(entry({ manuallyEdited: true }), entry(), 'import-id')?.kind).toBe('manual-protection') })
  it('uses the centralized completion threshold', () => { expect(completionStatus(900, 1_000)).toBe('completed'); expect(completionStatus(650, 1_000)).toBe('in-progress'); expect(completionStatus(0, null)).toBe('unknown') })
})

describe('idempotency, statistics and selectors', () => {
  it('updates precise local progress without creating duplicate entries', async () => {
    const repository = new MemoryRepository()
    const manager = new WatchTrackingManager({ chooseFile: async () => null, exportWriter: async () => ({ cancelled: false, fileName: null }), files: new WatchImportFileStore(), repository })
    const media = { dateAdded: 1, durationMs: 100_000, extension: '.mkv', filePath: 'C:\\Media\\Arcane.mkv', folderId: 'folder', id: 'media:arcane', metadata: {}, provider: 'local' as const, size: 1, source: 'configured-folder', thumbnailPath: null, title: 'Arcane', type: 'series' as const }
    await manager.recordLocalProgress(media, 10, 100, 'Mathys')
    await manager.recordLocalProgress(media, 40, 100, 'Mathys')
    expect(repository.snapshot.entries).toHaveLength(1)
    expect(repository.snapshot.entries[0]?.progress).toMatchObject({ percent: 40, positionSeconds: 40, precision: 'exact' })
  })
  it('does not overwrite a manual correction with later automatic progress', async () => {
    const repository = new MemoryRepository()
    const manager = new WatchTrackingManager({ chooseFile: async () => null, exportWriter: async () => ({ cancelled: false, fileName: null }), files: new WatchImportFileStore(), repository })
    const media = { dateAdded: 1, durationMs: 100_000, extension: '.mkv', filePath: 'C:\\Media\\Arcane.mkv', folderId: 'folder', id: 'media:manual-protection', metadata: {}, provider: 'local' as const, size: 1, source: 'configured-folder', thumbnailPath: null, title: 'Arcane', type: 'series' as const }
    const tracked = await manager.recordLocalProgress(media, 30, 100, 'Mathys')
    await manager.update(tracked.id, { durationSeconds: 100, positionSeconds: 70, status: 'completed' })
    await manager.recordLocalProgress(media, 40, 100, 'Mathys')
    expect(repository.snapshot.entries[0]).toMatchObject({ manuallyEdited: true, progress: { percent: 70, positionSeconds: 70 }, status: 'completed' })
  })
  it('keeps progress update fields nested in the progress object', async () => {
    const repository = new MemoryRepository(); repository.snapshot.entries = [entry()]
    const manager = new WatchTrackingManager({ chooseFile: async () => null, exportWriter: async () => ({ cancelled: false, fileName: null }), files: new WatchImportFileStore(), repository })
    const updated = await manager.update(repository.snapshot.entries[0]!.id, { durationSeconds: 100, positionSeconds: 25 })
    expect(updated).not.toHaveProperty('durationSeconds')
    expect(updated).not.toHaveProperty('positionSeconds')
    expect(updated.progress).toMatchObject({ durationSeconds: 100, percent: 25, positionSeconds: 25, precision: 'exact' })
  })
  it('reimporting the same file is idempotent and preserves profiles', async () => {
    const file = path.join(process.cwd(), `.watch-import-${crypto.randomUUID()}.csv`); temporaryFiles.push(file); await writeFile(file, 'Title,Date\nArcane,1/2/26', 'utf8')
    const files = new WatchImportFileStore(); const repository = new MemoryRepository(); const manager = new WatchTrackingManager({ chooseFile: async () => file, exportWriter: async () => ({ cancelled: false, fileName: 'export.json' }), files, repository })
    const firstToken = files.create(file, 'netflix-import'); const first = await manager.previewImport('netflix-import', firstToken.fileToken, 'Mathys'); expect((await manager.commitImport(first.importId)).importedCount).toBe(1)
    const secondToken = files.create(file, 'netflix-import'); const second = await manager.previewImport('netflix-import', secondToken.fileToken, 'Mathys'); const result = await manager.commitImport(second.importId); expect(result.importedCount).toBe(0); expect(result.ignoredDuplicates).toBe(1); expect(repository.snapshot.entries).toHaveLength(1)
  })
  it('does not fabricate hours from watched-only entries', () => { const stats = calculateWatchStats([entry()]); expect(stats.exactDurationSeconds).toBe(0); expect(stats.estimatedDurationSeconds).toBe(0); expect(stats.activityWithoutDuration).toBe(1) })
  it('filters search, sources and profiles independently', () => { const entries = [entry(), entry({ id: 'manual:2', primaryProvider: 'manual', profileName: 'Guest', title: 'Dune', normalizedTitle: 'dune' })]; expect(selectWatchHistory(entries, [], 'arc', 'all', 'title', 'Mathys')).toHaveLength(1); expect(selectWatchHistory(entries, [], '', 'manual', 'title', 'all')[0]?.title).toBe('Dune') })
  it('continues only exact, incomplete progress', () => { const exact = entry({ progress: { durationSeconds: 100, percent: 40, positionSeconds: 40, precision: 'exact', updatedAt: 1 }, status: 'in-progress' }); expect(selectContinueWatching([exact, entry({ status: 'in-progress' })])).toEqual([exact]) })
  it('rejects unknown IDs at the command boundary', async () => { const core = new NexusCore(); const manager = { get: vi.fn().mockRejectedValue(new Error('unknown')) } as unknown as WatchTrackingManager; new WatchTrackingModule(core.registry, manager).register(); const result = await core.executor.execute({ command: 'watch.history.get', createdAt: 1, id: 'watch-test', payload: { watchEntryId: 'unknown-entry' }, source: 'ui', target: { type: 'local' } }); expect(result.status).toBe('failed') })
  it('requires Gateway confirmation before deleting a provider history', async () => { const core = new NexusCore(); const manager = { deleteProvider: vi.fn() } as unknown as WatchTrackingManager; new WatchTrackingModule(core.registry, manager).register(); const result = await core.executor.execute({ command: 'watch.history.delete-provider', createdAt: 1, id: 'watch-delete-provider', payload: { provider: 'netflix-import' }, source: 'ui', target: { type: 'local' } }); expect(result.status).toBe('confirmation_required'); expect(manager.deleteProvider).not.toHaveBeenCalled() })
})
