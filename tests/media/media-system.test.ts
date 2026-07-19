import * as path from 'node:path'
import { rm } from 'node:fs/promises'

import { describe, expect, it, vi } from 'vitest'

import type { ApplicationManager } from '../../electron/modules/applications/application-manager.js'
import { MediaFolderStore } from '../../electron/modules/media/media-folder-store.js'
import { MediaHistoryStore, type MediaHistory } from '../../electron/modules/media/media-history.js'
import { MediaLibrary } from '../../electron/modules/media/media-library.js'
import { MediaManager } from '../../electron/modules/media/media-manager.js'
import { MediaModule } from '../../electron/modules/media/media.module.js'
import { MediaPlayer } from '../../electron/modules/media/media-player.js'
import type { MediaFileSystem } from '../../electron/modules/media/media-file-system.js'
import type { MediaProvider } from '../../electron/modules/media/providers/media-provider.types.js'
import { classifyMedia, LocalMediaScanner, mediaTitle } from '../../electron/modules/media/providers/local/local-media-scanner.js'
import { selectMedia, selectRecommendations } from '../../src/features/media/media.selectors.js'
import type { DetectedMedia, MediaFavorite, MediaFolder, MediaProgressEntry, MediaRecentEntry } from '../../src/features/media/media.types.js'
import { NexusCore } from '../../src/core/nexus-core.js'

const folder: MediaFolder = { addedAt: 1, displayPath: 'C:\\Media', id: '0123456789abcdef0123', label: 'Media', path: 'C:\\Media' }

function item(overrides: Partial<DetectedMedia> = {}): DetectedMedia {
  return {
    dateAdded: 100, durationMs: null, extension: 'mkv', filePath: 'C:\\Media\\Movies\\Arrival.2016.mkv',
    folderId: folder.id, id: 'local:abc', metadata: {}, provider: 'local', size: 1_000, source: 'test',
    thumbnailPath: null, title: 'Arrival', type: 'film', ...overrides,
  }
}

class MemoryHistory implements MediaHistory {
  favoriteEntries: MediaFavorite[] = []
  progressEntries: MediaProgressEntry[] = []
  recentEntries: MediaRecentEntry[] = []
  favorites = async () => this.favoriteEntries
  progress = async () => this.progressEntries
  recent = async () => this.recentEntries
  recordRecent = async (entry: MediaRecentEntry) => { this.recentEntries.unshift(entry) }
  setFavorite = async (mediaId: DetectedMedia['id'], favorite: boolean) => { this.favoriteEntries = favorite ? [{ createdAt: 1, mediaId, order: 0 }] : []; return this.favoriteEntries }
  setProgress = async (entry: MediaProgressEntry) => { this.progressEntries = [entry]; return this.progressEntries }
}

describe('local media detection', () => {
  it('supports exactly the configured video and audio extensions', () => {
    expect(classifyMedia('C:\\Media\\clip.mp4')).toBe('video')
    expect(classifyMedia('C:\\Media\\clip.MKV')).toBe('video')
    expect(classifyMedia('C:\\Media\\song.flac')).toBe('music')
    expect(classifyMedia('C:\\Media\\document.pdf')).toBeNull()
  })

  it('classifies series and films from conservative local naming signals', () => {
    expect(classifyMedia('C:\\Media\\Show.S02E04.mkv')).toBe('series')
    expect(classifyMedia('C:\\Media\\Show.2x04.mkv')).toBe('series')
    expect(classifyMedia('C:\\Media\\Movies\\Arrival.2016.mkv')).toBe('film')
  })

  it('normalizes a readable title without inventing metadata', () => {
    expect(mediaTitle('C:\\Media\\Arrival.2016.mkv')).toBe('Arrival')
    expect(mediaTitle('C:\\Media\\My_Home_Video.webm')).toBe('My Home Video')
  })

  it('scans only configured roots, descends directories and skips symbolic links', async () => {
    const entries = new Map([
      ['C:\\Media', [{ isDirectory: true, isSymbolicLink: false, name: 'Movies' }, { isDirectory: false, isSymbolicLink: true, name: 'linked.mp4' }]],
      ['C:\\Media\\Movies', [{ isDirectory: false, isSymbolicLink: false, name: 'Arrival.2016.mkv' }, { isDirectory: false, isSymbolicLink: false, name: 'notes.txt' }]],
    ])
    const fileSystem: MediaFileSystem = {
      exists: async (target) => target === 'C:\\Media',
      readDirectory: async (target) => entries.get(target) ?? [],
      stat: async () => ({ birthtimeMs: 50, mtimeMs: 60, size: 1_024 }),
    }
    const result = await new LocalMediaScanner(fileSystem).scan([folder])
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ extension: 'mkv', title: 'Arrival', type: 'film' })
    expect(result.skippedFiles).toBe(2)
  })

  it('isolates inaccessible folders as warnings', async () => {
    const fileSystem: MediaFileSystem = { exists: async () => false, readDirectory: async () => [], stat: async () => ({ birthtimeMs: 0, mtimeMs: 0, size: 0 }) }
    const result = await new LocalMediaScanner(fileSystem).scan([folder])
    expect(result.items).toEqual([])
    expect(result.warnings[0]).toContain('indisponible')
  })
})

describe('media library and secure playback', () => {
  it('rejects renderer file paths and extra payload fields at the command boundary', async () => {
    const manager = { play: vi.fn() } as unknown as MediaManager
    const core = new NexusCore()
    new MediaModule(core.registry, manager).register()
    const result = await core.executor.execute({ command: 'media.item.play', createdAt: 1, id: 'media-request', payload: { filePath: 'C:\\unsafe.mp4', mediaId: 'local:abc12345' }, source: 'ui', target: { type: 'local' } })
    expect(result.status).toBe('failed')
    expect(manager.play).not.toHaveBeenCalled()
  })

  it('keeps successful provider results when another provider fails', async () => {
    const success: MediaProvider = { id: 'local', scan: async () => ({ items: [item()], provider: 'local', skippedFiles: 0, warnings: [] }) }
    const failed: MediaProvider = { id: 'plex', scan: async () => { throw new Error('server offline') } }
    const folders = { add: async () => [folder], list: async () => [folder], remove: async () => [] }
    const fileSystem: MediaFileSystem = { exists: async () => true, readDirectory: async () => [], stat: async () => ({ birthtimeMs: 0, mtimeMs: 0, size: 0 }) }
    const result = await new MediaLibrary({ fileSystem, folders, providers: [success, failed] }).scan()
    expect(result.items).toHaveLength(1)
    expect(result.summary.providerErrors).toEqual([{ message: 'server offline', provider: 'plex' }])
  })

  it('deduplicates normalized media ids', async () => {
    const provider: MediaProvider = { id: 'local', scan: async () => ({ items: [item(), item({ title: 'Duplicate' })], provider: 'local', skippedFiles: 0, warnings: [] }) }
    const folders = { add: async () => [folder], list: async () => [folder], remove: async () => [] }
    const fileSystem: MediaFileSystem = { exists: async () => true, readDirectory: async () => [], stat: async () => ({ birthtimeMs: 0, mtimeMs: 0, size: 0 }) }
    expect((await new MediaLibrary({ fileSystem, folders, providers: [provider] }).scan()).items).toHaveLength(1)
  })

  it('launches VLC with the cached media path and never a renderer path', async () => {
    const spawn = vi.fn<(executable: string, args: readonly string[]) => Promise<void>>().mockResolvedValue(undefined)
    const applications = {
      get: async () => ({ executablePath: 'C:\\VLC\\vlc.exe', installStatus: 'installed', runtimeStatus: 'stopped' }),
      refreshRuntimeStatus: async () => [],
    } as unknown as ApplicationManager
    const result = await new MediaPlayer(applications, spawn).play(item())
    expect(result.success).toBe(true)
    expect(spawn).toHaveBeenCalledWith('C:\\VLC\\vlc.exe', ['C:\\Media\\Movies\\Arrival.2016.mkv'])
  })

  it('returns the prepared internal-player state when VLC is absent', async () => {
    const applications = { get: async () => { throw new Error('absent') }, refreshRuntimeStatus: async () => [] } as unknown as ApplicationManager
    expect(await new MediaPlayer(applications, vi.fn()).play(item())).toMatchObject({ player: 'internal', success: false })
  })

  it('refuses an unknown media id before invoking the player', async () => {
    const provider: MediaProvider = { id: 'local', scan: async () => ({ items: [item()], provider: 'local', skippedFiles: 0, warnings: [] }) }
    const folders = { add: async () => [folder], list: async () => [folder], remove: async () => [] }
    const fileSystem: MediaFileSystem = { exists: async () => true, readDirectory: async () => [], stat: async () => ({ birthtimeMs: 0, mtimeMs: 0, size: 0 }) }
    const player = { play: vi.fn(), status: vi.fn() } as unknown as MediaPlayer
    const manager = new MediaManager({ chooseFolders: async () => [], folders, history: new MemoryHistory(), library: new MediaLibrary({ fileSystem, folders, providers: [provider] }), player })
    await expect(manager.play('local:unknown')).rejects.toThrow(/inconnu/)
    expect(player.play).not.toHaveBeenCalled()
  })
})

describe('folders, history and selectors', () => {
  it('persists unique configured folders and removes them by opaque id', async () => {
    const filePath = path.join(process.cwd(), `.media-folders-test-${crypto.randomUUID()}.json`)
    const store = new MediaFolderStore(filePath)
    await store.add('C:\\Media')
    await store.add('C:\\Media')
    expect(await store.list()).toHaveLength(1)
    const configured = (await store.list())[0]
    expect(configured?.id).toMatch(/^[a-f0-9]{20}$/)
    await store.remove(configured?.id ?? '')
    expect(await store.list()).toEqual([])
    await rm(filePath, { force: true })
  })

  it('persists favorites, recent playback and prepared progress', async () => {
    const filePath = path.join(process.cwd(), `.media-history-test-${crypto.randomUUID()}.json`)
    const history = new MediaHistoryStore(filePath)
    await history.setFavorite('local:abc', true)
    await history.recordRecent({ mediaId: 'local:abc', player: 'vlc', success: true, timestamp: 10 })
    await history.setProgress({ completed: false, durationMs: 100, mediaId: 'local:abc', positionMs: 40, updatedAt: 11 })
    expect(await history.favorites()).toHaveLength(1)
    expect(await history.recent()).toHaveLength(1)
    expect(await history.progress()).toEqual([{ completed: false, durationMs: 100, mediaId: 'local:abc', positionMs: 40, updatedAt: 11 }])
    await rm(filePath, { force: true })
  })

  it('searches, filters and sorts without mutating the source library', () => {
    const source = [item({ id: 'local:z', title: 'Zulu' }), item({ id: 'local:a', title: 'Alpha', type: 'music' })]
    const favorites: MediaFavorite[] = [{ createdAt: 1, mediaId: 'local:z', order: 0 }]
    expect(selectMedia(source, favorites, [], 'alpha', 'all', 'title').map((entry) => entry.id)).toEqual(['local:a'])
    expect(selectMedia(source, favorites, [], '', 'favorites', 'title').map((entry) => entry.id)).toEqual(['local:z'])
    expect(source.map((entry) => entry.title)).toEqual(['Zulu', 'Alpha'])
  })

  it('builds deterministic local recommendations from favorites and history', () => {
    const items = [item({ id: 'local:a', title: 'A' }), item({ id: 'local:b', title: 'B', dateAdded: 200 })]
    const favorites: MediaFavorite[] = [{ createdAt: 1, mediaId: 'local:a', order: 0 }]
    const recent: MediaRecentEntry[] = [{ mediaId: 'local:b', player: 'vlc', success: true, timestamp: 10 }]
    expect(selectRecommendations(items, favorites, recent)[0]?.id).toBe('local:a')
  })
})
