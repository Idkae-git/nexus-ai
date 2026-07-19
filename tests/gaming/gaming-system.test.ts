import * as path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { GameHistoryStore, type GameHistory } from '../../electron/modules/gaming/games/game-history.js'
import { GameLauncher } from '../../electron/modules/gaming/games/game-launcher.js'
import { GameLibrary } from '../../electron/modules/gaming/games/game-library.js'
import { GameProcessService } from '../../electron/modules/gaming/games/game-process.js'
import { GameSessionManager } from '../../electron/modules/gaming/games/game-session-manager.js'
import type { LauncherDetector } from '../../electron/modules/gaming/launchers/launcher-detector.js'
import { LauncherRegistry, knownLaunchers } from '../../electron/modules/gaming/launchers/launcher.registry.js'
import { parseEpicManifest } from '../../electron/modules/gaming/providers/epic/epic-manifest-parser.js'
import { EpicProvider } from '../../electron/modules/gaming/providers/epic/epic.provider.js'
import { SteamProvider } from '../../electron/modules/gaming/providers/steam/steam.provider.js'
import { parseSteamAppManifest, parseSteamLibraryFolders } from '../../electron/modules/gaming/providers/steam/steam-manifest-parser.js'
import type { GameProvider, GamingFileSystem } from '../../electron/modules/gaming/providers/provider.types.js'
import { selectVisibleGames } from '../../src/features/gaming/gaming.selectors.js'
import type { DetectedGame, DetectedLauncher, GameFavorite, GameRecentEntry, GameSession } from '../../src/features/gaming/gaming.types.js'

const steamLauncher: DetectedLauncher = {
  ...knownLaunchers[0], error: null, executablePath: 'C:\\Steam\\steam.exe', gameCount: 0,
  installDirectory: 'C:\\Steam', installStatus: 'installed', runtimeStatus: 'stopped', source: 'test',
}

function game(overrides: Partial<DetectedGame> = {}): DetectedGame {
  return {
    artworkPath: null, capabilities: { close: false, launch: true, trackProcess: false }, executablePath: null,
    gameProcessNames: [], id: 'steam:730', installDirectory: 'C:\\Games\\CS2', installStatus: 'installed',
    lastLaunchedAt: null, lastUpdatedAt: null, launchCount: 0, launcherId: 'steam',
    launchStrategy: { type: 'uri', uri: 'steam://rungameid/730' }, metadata: {}, provider: 'steam',
    providerGameId: '730', remoteArtworkUrl: null, runtimeStatus: 'unknown', sizeOnDisk: null,
    source: 'test', tags: ['shooter'], title: 'Counter-Strike 2', ...overrides,
  }
}

class MemoryHistory implements GameHistory {
  favoriteEntries: GameFavorite[] = []
  recentEntries: GameRecentEntry[] = []
  sessionEntries: GameSession[] = []
  favorites = async () => this.favoriteEntries
  recent = async () => this.recentEntries
  sessions = async () => this.sessionEntries
  usage = async () => ({ lastLaunchedAt: null, launchCount: 0 })
  recordLaunch = async (entry: GameRecentEntry) => { this.recentEntries.unshift(entry) }
  saveSession = async (session: GameSession) => {
    const index = this.sessionEntries.findIndex((entry) => entry.id === session.id)
    if (index >= 0) this.sessionEntries[index] = session
    else this.sessionEntries.unshift(session)
  }
  setFavorite = async (gameId: DetectedGame['id'], favorite: boolean) => {
    this.favoriteEntries = favorite ? [{ createdAt: 1, gameId, order: 0 }] : []
    return this.favoriteEntries
  }
}

describe('gaming launcher and provider contracts', () => {
  it('registers every launcher id exactly once', () => {
    const registry = new LauncherRegistry()
    expect(new Set(registry.list().map((entry) => entry.id)).size).toBe(8)
    expect(() => new LauncherRegistry([knownLaunchers[0], knownLaunchers[0]])).toThrow(/already registered/)
  })

  it('parses modern and legacy Steam library folder formats', () => {
    const modern = '"libraryfolders" { "0" { "path" "C:\\\\Steam" } "1" { "path" "D:\\\\Games" } }'
    const legacy = '"LibraryFolders" { "1" "E:\\\\Library" }'
    expect(parseSteamLibraryFolders(modern)).toEqual(['C:\\Steam', 'D:\\Games'])
    expect(parseSteamLibraryFolders(legacy)).toEqual(['E:\\Library'])
  })

  it('parses a Steam app manifest and rejects incomplete data', () => {
    const parsed = parseSteamAppManifest('"AppState" { "appid" "730" "name" "Counter-Strike 2" "installdir" "Counter-Strike Global Offensive" "StateFlags" "4" "LastUpdated" "1700000000" "SizeOnDisk" "1000" }')
    expect(parsed).toMatchObject({ appId: '730', name: 'Counter-Strike 2', stateFlags: 4, sizeOnDisk: 1000 })
    expect(() => parseSteamAppManifest('"AppState" { "appid" "730" }')).toThrow(/missing/)
    expect(() => parseSteamAppManifest('not-vdf')).toThrow(/Invalid/)
  })

  it('scans several Steam libraries without duplicating games', async () => {
    const root = path.normalize('C:\\Steam')
    const second = path.normalize('D:\\Library')
    const libraryFile = path.join(root, 'steamapps', 'libraryfolders.vdf')
    const rootManifest = path.join(root, 'steamapps', 'appmanifest_730.acf')
    const duplicateManifest = path.join(second, 'steamapps', 'appmanifest_730.acf')
    const text = new Map([
      [libraryFile, `"libraryfolders" { "0" { "path" "${root.replace(/\\/g, '\\\\')}" } "1" { "path" "${second.replace(/\\/g, '\\\\')}" } }`],
      [rootManifest, '"AppState" { "appid" "730" "name" "CS2" "installdir" "CS2" "StateFlags" "4" }'],
      [duplicateManifest, '"AppState" { "appid" "730" "name" "CS2" "installdir" "CS2" "StateFlags" "4" }'],
    ])
    const directories = new Map([
      [path.join(root, 'steamapps'), ['appmanifest_730.acf', 'libraryfolders.vdf']],
      [path.join(second, 'steamapps'), ['appmanifest_730.acf']],
    ])
    const fileSystem: GamingFileSystem = {
      exists: async (entry) => text.has(entry) || directories.has(entry) || entry.endsWith(`${path.sep}CS2`),
      readDirectory: async (entry) => directories.get(entry) ?? [],
      readText: async (entry) => { const value = text.get(entry); if (!value) throw new Error('missing'); return value },
    }
    const result = await new SteamProvider().scan({ environment: {}, fileSystem, launcher: { ...steamLauncher, installDirectory: root } })
    expect(result.games).toHaveLength(1)
    expect(result.games[0]).toMatchObject({ id: 'steam:730', installStatus: 'installed' })
  })

  it('isolates malformed Steam manifests as warnings', async () => {
    const fileSystem: GamingFileSystem = {
      exists: async () => true,
      readDirectory: async () => ['appmanifest_7.acf'],
      readText: async (entry) => entry.endsWith('libraryfolders.vdf') ? '"libraryfolders" {}' : 'invalid',
    }
    const result = await new SteamProvider().scan({ environment: {}, fileSystem, launcher: steamLauncher })
    expect(result.games).toEqual([])
    expect(result.warnings[0]).toContain('appmanifest_7.acf')
  })

  it('validates Epic manifest identifiers', () => {
    expect(parseEpicManifest(JSON.stringify({ AppName: 'Fortnite', CatalogItemId: 'abc', DisplayName: 'Fortnite', InstallLocation: 'C:\\Fortnite' }))).toMatchObject({ appName: 'Fortnite', catalogItemId: 'abc' })
    expect(() => parseEpicManifest(JSON.stringify({ AppName: '../unsafe', DisplayName: 'Bad', InstallLocation: 'C:\\Bad' }))).toThrow(/valid/)
  })

  it('maps a known Epic bootstrap executable to the actual game process', async () => {
    const directory = path.join('C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
    const fileSystem: GamingFileSystem = {
      exists: async () => true,
      readDirectory: async () => ['rocket.item'],
      readText: async () => JSON.stringify({ AppName: 'Sugar', CatalogItemId: 'rocket', DisplayName: 'Rocket League', InstallLocation: 'C:\\RocketLeague', LaunchExecutable: 'Binaries/Win64/Launcher.exe' }),
    }
    const launcher = { ...steamLauncher, id: 'epic' as const, providerId: 'epic' as const }
    const result = await new EpicProvider().scan({ environment: { PROGRAMDATA: 'C:\\ProgramData' }, fileSystem, launcher })
    expect(directory).toContain('EpicGamesLauncher')
    expect(result.games[0]).toMatchObject({ capabilities: { close: true, trackProcess: true }, gameProcessNames: ['RocketLeague.exe'] })
  })
})

describe('unified library, launch and sessions', () => {
  it('keeps successful provider results when another provider fails', async () => {
    const success: GameProvider = { id: 'steam', scan: async () => ({ games: [game()], provider: 'steam', warnings: [] }) }
    const failed: GameProvider = { id: 'epic', scan: async () => { throw new Error('offline catalog') } }
    const launchers = [steamLauncher, { ...steamLauncher, id: 'epic' as const, providerId: 'epic' as const }]
    const detector = { scan: async () => launchers } as unknown as LauncherDetector
    const fileSystem: GamingFileSystem = { exists: async () => false, readDirectory: async () => [], readText: async () => '' }
    const result = await new GameLibrary({ fileSystem, launcherDetector: detector, providers: [success, failed] }).scan()
    expect(result.games.map((entry) => entry.id)).toEqual(['steam:730'])
    expect(result.summary.providerErrors).toEqual([{ message: 'offline catalog', provider: 'epic' }])
  })

  it('deduplicates games by stable provider id', async () => {
    const provider: GameProvider = { id: 'steam', scan: async () => ({ games: [game({ installStatus: 'partial' }), game()], provider: 'steam', warnings: [] }) }
    const detector = { scan: async () => [steamLauncher] } as unknown as LauncherDetector
    const fileSystem: GamingFileSystem = { exists: async () => false, readDirectory: async () => [], readText: async () => '' }
    expect((await new GameLibrary({ fileSystem, launcherDetector: detector, providers: [provider] }).scan()).games).toHaveLength(1)
  })

  it('launches Steam only through its provider URI', async () => {
    const open = vi.fn<(uri: string) => Promise<void>>().mockResolvedValue(undefined)
    const spawn = vi.fn<(executable: string, args: readonly string[]) => Promise<void>>().mockResolvedValue(undefined)
    const launcher = new GameLauncher(open, spawn)
    expect(await launcher.launch(game(), [steamLauncher])).toBe('uri')
    expect(open).toHaveBeenCalledWith('steam://rungameid/730')
    expect(spawn).not.toHaveBeenCalled()
    await expect(launcher.launch(game({ launchStrategy: { type: 'uri', uri: 'file:///unsafe.exe' } }), [steamLauncher])).rejects.toThrow(/not trusted/)
  })

  it('uses only detected launcher paths for argument strategies', async () => {
    const spawn = vi.fn<(executable: string, args: readonly string[]) => Promise<void>>().mockResolvedValue(undefined)
    const launcher = new GameLauncher(vi.fn(), spawn)
    const riotGame = game({ id: 'riot:valorant', launcherId: 'riot', provider: 'riot', launchStrategy: { arguments: ['--launch-product=valorant'], launcherId: 'riot', type: 'launcher-arguments' } })
    const riotLauncher = { ...steamLauncher, executablePath: 'C:\\Riot\\RiotClientServices.exe', id: 'riot' as const, installStatus: 'installed' as const }
    await launcher.launch(riotGame, [riotLauncher])
    expect(spawn).toHaveBeenCalledWith('C:\\Riot\\RiotClientServices.exe', ['--launch-product=valorant'])
  })

  it('does not report a successful soft close while the game process remains', async () => {
    const output = '"game.exe","100","Console","1","10 K"'
    const processes = new GameProcessService(async () => output, async () => undefined)
    const trackedGame = game({ capabilities: { close: true, launch: true, trackProcess: true }, gameProcessNames: ['game.exe'] })
    await expect(processes.close(trackedGame)).rejects.toThrow(/Force-close was not used/)
  })

  it('moves a tracked process session from launching to running and ended', async () => {
    let now = 1_000
    let processOutput = '"VALORANT.exe","100","Console","1","10 K"'
    const history = new MemoryHistory()
    const processes = new GameProcessService(async () => processOutput)
    const sessions = new GameSessionManager({ createId: () => 'session-1', history, now: () => now, pollIntervalMs: 1_000_000, processService: processes })
    const trackedGame = game({ capabilities: { close: true, launch: true, trackProcess: true }, gameProcessNames: ['VALORANT.exe'], id: 'riot:valorant', provider: 'riot' })
    await sessions.start(trackedGame)
    await sessions.refresh()
    expect(sessions.active()[0]?.status).toBe('running')
    now = 11_000
    processOutput = '"explorer.exe","101","Console","1","10 K"'
    await sessions.refresh()
    expect(sessions.active()).toEqual([])
    expect(history.sessionEntries[0]).toMatchObject({ durationMs: 10_000, endedAt: 11_000, status: 'ended' })
    sessions.dispose()
  })

  it('fails a session after a targeted launch detection timeout', async () => {
    let now = 0
    const history = new MemoryHistory()
    const sessions = new GameSessionManager({ createId: () => 'session-timeout', history, launchTimeoutMs: 50, now: () => now, pollIntervalMs: 1_000_000, processService: new GameProcessService(async () => '') })
    await sessions.start(game({ capabilities: { close: true, launch: true, trackProcess: true }, gameProcessNames: ['game.exe'] }))
    now = 51
    await sessions.refresh()
    expect(history.sessionEntries[0]).toMatchObject({ durationMs: 51, status: 'failed' })
    sessions.dispose()
  })

  it('recovers an unfinished persisted session after NEXUS restarts', async () => {
    const history = new MemoryHistory()
    history.sessionEntries.push({ detectedRunningAt: 10, durationMs: null, endedAt: null, gameId: 'steam:730', id: 'stale', processDetection: 'process-name', provider: 'steam', startedAt: 10, status: 'running' })
    const sessions = new GameSessionManager({ history, now: () => 110, processService: new GameProcessService(async () => '') })
    await sessions.restore([game({ capabilities: { close: true, launch: true, trackProcess: true }, gameProcessNames: ['game.exe'] })])
    expect(history.sessionEntries[0]).toMatchObject({ durationMs: 100, endedAt: 110, status: 'ended' })
    sessions.dispose()
  })
})

describe('favorites, history and renderer selection', () => {
  it('persists favorite order and recent duration in one snapshot', async () => {
    const temporaryFile = path.join(process.cwd(), `.gaming-test-${crypto.randomUUID()}.json`)
    const history = new GameHistoryStore(temporaryFile)
    await history.setFavorite('steam:730', true)
    await history.recordLaunch({ durationMs: null, gameId: 'steam:730', sessionId: 's1', success: true, timestamp: 10 })
    await history.saveSession({ detectedRunningAt: 11, durationMs: 90, endedAt: 100, gameId: 'steam:730', id: 's1', processDetection: 'process-name', provider: 'steam', startedAt: 10, status: 'ended' })
    expect(await history.favorites()).toEqual([{ createdAt: expect.any(Number), gameId: 'steam:730', order: 0 }])
    expect((await history.recent())[0]?.durationMs).toBe(90)
    await import('node:fs/promises').then((fs) => fs.rm(temporaryFile, { force: true }))
  })

  it('searches, filters and sorts without mutating the source library', () => {
    const source = [game({ id: 'steam:2', title: 'Zulu' }), game({ id: 'epic:1', provider: 'epic', launcherId: 'epic', title: 'Alpha' })]
    const favorites: GameFavorite[] = [{ createdAt: 1, gameId: 'steam:2', order: 0 }]
    expect(selectVisibleGames(source, favorites, 'epic', 'all', 'alphabetical').map((entry) => entry.id)).toEqual(['epic:1'])
    expect(selectVisibleGames(source, favorites, '', 'favorites', 'favorites').map((entry) => entry.id)).toEqual(['steam:2'])
    expect(source.map((entry) => entry.title)).toEqual(['Zulu', 'Alpha'])
  })
})
