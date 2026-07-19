import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from 'electron'

import { SystemModule } from './modules/system/system-module.js'
import { ApplicationDetector } from './modules/applications/application-detector.js'
import { ApplicationHistoryStore } from './modules/applications/application-history.js'
import { ApplicationLauncher } from './modules/applications/application-launcher.js'
import { ApplicationManager } from './modules/applications/application-manager.js'
import { ApplicationsModule } from './modules/applications/application.module.js'
import { ApplicationProcessService } from './modules/applications/application-process.js'
import { ApplicationRegistry } from './modules/applications/application.registry.js'
import { WindowsRegistryReader } from './modules/applications/application-registry-reader.js'
import { GameHistoryStore } from './modules/gaming/games/game-history.js'
import { GameLauncher } from './modules/gaming/games/game-launcher.js'
import { GameLibrary } from './modules/gaming/games/game-library.js'
import { GameProcessService } from './modules/gaming/games/game-process.js'
import { GameSessionManager } from './modules/gaming/games/game-session-manager.js'
import { GamingManager } from './modules/gaming/gaming-manager.js'
import { GamingModule } from './modules/gaming/gaming.module.js'
import { LauncherDetector } from './modules/gaming/launchers/launcher-detector.js'
import { LauncherRegistry } from './modules/gaming/launchers/launcher.registry.js'
import { EpicProvider } from './modules/gaming/providers/epic/epic.provider.js'
import { LauncherOnlyProvider } from './modules/gaming/providers/launcher-only.provider.js'
import { NodeGamingFileSystem } from './modules/gaming/providers/node-file-system.js'
import { RiotProvider } from './modules/gaming/providers/riot/riot.provider.js'
import { SteamProvider } from './modules/gaming/providers/steam/steam.provider.js'
import { NodeMediaFileSystem } from './modules/media/media-file-system.js'
import { MediaFolderStore } from './modules/media/media-folder-store.js'
import { MediaHistoryStore } from './modules/media/media-history.js'
import { MediaLibrary } from './modules/media/media-library.js'
import { MediaManager } from './modules/media/media-manager.js'
import { MediaModule } from './modules/media/media.module.js'
import { MediaPlayer } from './modules/media/media-player.js'
import { LocalMediaProvider } from './modules/media/providers/local/local-media.provider.js'
import { JsonWatchHistoryRepository } from './modules/watch-tracking/watch-history.repository.js'
import { WatchImportFileStore } from './modules/watch-tracking/watch-import-file-store.js'
import { WatchTrackingManager } from './modules/watch-tracking/watch-tracking.manager.js'
import { WatchTrackingModule } from './modules/watch-tracking/watch-tracking.module.js'
import { SecureTokenStore } from './modules/watch-connectors/secure-token-store.js'
import { OAuthCallbackBroker, WatchAuthService } from './modules/watch-connectors/watch-auth.service.js'
import { WatchConnectorConfigurationService } from './modules/watch-connectors/watch-connector.config.js'
import { WatchConnectorManager } from './modules/watch-connectors/watch-connector.manager.js'
import { WatchConnectorRegistry } from './modules/watch-connectors/watch-connector.registry.js'
import { WatchConnectorsModule } from './modules/watch-connectors/watch-connectors.module.js'
import { JsonWatchSyncRepository } from './modules/watch-connectors/watch-sync.repository.js'
import { WindowsSystemBridge } from './platform/windows/windows-system-bridge.js'
import { CommandGateway } from './ipc/command-gateway.js'
import { WindowsSystemInfoService } from './services/windows-system-info-service.js'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)

if (!app.isPackaged) {
    for (const fileName of ['.env.local', '.env']) {
        try { process.loadEnvFile(path.join(process.cwd(), fileName)) } catch { /* Optional local OAuth configuration. */ }
    }
}

const oauthCallbackBroker = new OAuthCallbackBroker()
const ownsInstanceLock = app.requestSingleInstanceLock()

function handleOAuthArguments(argumentsList: readonly string[]) {
    const callback = argumentsList.find((argument) => argument.startsWith('nexus://oauth/'))
    return callback ? oauthCallbackBroker.handle(callback) : false
}

if (!ownsInstanceLock) {
    app.quit()
} else {
    if (process.defaultApp && process.argv[1]) app.setAsDefaultProtocolClient('nexus', process.execPath, [path.resolve(process.argv[1])])
    else app.setAsDefaultProtocolClient('nexus')
    app.on('second-instance', (_event, commandLine) => {
        handleOAuthArguments(commandLine)
        const window = BrowserWindow.getAllWindows()[0]
        if (window) { if (window.isMinimized()) window.restore(); window.focus() }
    })
    app.on('open-url', (event, url) => { event.preventDefault(); oauthCallbackBroker.handle(url) })
}

import { NexusCore } from '../src/core/nexus-core.js'

const core = new NexusCore()

const systemBridge =
    new WindowsSystemBridge()

const systemInfoService =
    new WindowsSystemInfoService()

const systemModule =
    new SystemModule(
        core.registry,
        systemBridge,
        systemInfoService,
    )

systemModule.register()

const applicationRegistry = new ApplicationRegistry()
const applicationProcessService = new ApplicationProcessService()
const applicationManager = new ApplicationManager({
    detector: new ApplicationDetector({
        applicationRegistry,
        processService: applicationProcessService,
        registryReader: new WindowsRegistryReader(),
    }),
    history: new ApplicationHistoryStore(path.join(app.getPath('userData'), 'application-history.json')),
    launcher: new ApplicationLauncher(),
    processService: applicationProcessService,
    registry: applicationRegistry,
})

new ApplicationsModule(core.registry, applicationManager).register()

const launcherRegistry = new LauncherRegistry()
const launcherDetector = new LauncherDetector(applicationManager, launcherRegistry)
const gamingFileSystem = new NodeGamingFileSystem()
const gameHistory = new GameHistoryStore(path.join(app.getPath('userData'), 'gaming-history.json'))
const gameProcessService = new GameProcessService()
const gameLibrary = new GameLibrary({
    fileSystem: gamingFileSystem,
    launcherDetector,
    providers: [
        new SteamProvider(),
        new EpicProvider(),
        new LauncherOnlyProvider('ubisoft', 'Ubisoft Connect'),
        new LauncherOnlyProvider('battlenet', 'Battle.net'),
        new RiotProvider(),
    ],
})
const gameSessionManager = new GameSessionManager({
    history: gameHistory,
    processService: gameProcessService,
})
const gamingManager = new GamingManager({
    applicationManager,
    gameLauncher: new GameLauncher((uri) => shell.openExternal(uri)),
    history: gameHistory,
    launcherDetector,
    launcherRegistry,
    library: gameLibrary,
    processService: gameProcessService,
    sessions: gameSessionManager,
})

new GamingModule(core.registry, gamingManager).register()

const mediaFolderStore = new MediaFolderStore(path.join(app.getPath('userData'), 'media-folders.json'))
const mediaHistory = new MediaHistoryStore(path.join(app.getPath('userData'), 'media-history.json'))
const mediaFileSystem = new NodeMediaFileSystem()
const watchFiles = new WatchImportFileStore()
const watchHistoryRepository = new JsonWatchHistoryRepository(path.join(app.getPath('userData'), 'watch-history.json'))
const watchTrackingManager = new WatchTrackingManager({
    chooseFile: async (provider) => {
        const filters = provider === 'netflix-import'
            ? [{ extensions: ['csv'], name: 'Netflix Viewing Activity' }]
            : [{ extensions: ['json', 'csv'], name: 'Watch history' }]
        const result = await dialog.showOpenDialog({ filters, properties: ['openFile'], title: provider === 'netflix-import' ? 'Importer l’activité Netflix' : 'Importer un historique de visionnage' })
        return result.canceled ? null : result.filePaths[0] ?? null
    },
    exportWriter: async (fileName, content) => {
        const result = await dialog.showSaveDialog({ defaultPath: fileName, filters: [{ extensions: ['json'], name: 'NEXUS Watch History' }], title: 'Exporter l’historique NEXUS' })
        if (result.canceled || !result.filePath) return { cancelled: true, fileName: null }
        await writeFile(result.filePath, content, 'utf8')
        return { cancelled: false, fileName: path.basename(result.filePath) }
    },
    files: watchFiles,
    repository: watchHistoryRepository,
})

new WatchTrackingModule(core.registry, watchTrackingManager).register()

const watchConnectorManager = new WatchConnectorManager({
    auth: new WatchAuthService({ broker: oauthCallbackBroker, openExternal: (url) => shell.openExternal(url) }),
    configuration: new WatchConnectorConfigurationService(),
    history: watchHistoryRepository,
    registry: new WatchConnectorRegistry(),
    repository: new JsonWatchSyncRepository(path.join(app.getPath('userData'), 'watch-sync.json')),
    tokens: new SecureTokenStore(path.join(app.getPath('userData'), 'watch-credentials.json'), {
        decrypt: (value) => safeStorage.decryptString(Buffer.from(value)),
        encrypt: (value) => safeStorage.encryptString(value),
        isAvailable: () => safeStorage.isEncryptionAvailable(),
    }),
})

new WatchConnectorsModule(core.registry, watchConnectorManager).register()

const mediaManager = new MediaManager({
    chooseFolders: async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'multiSelections'],
            title: 'Choisir les dossiers de The Forest Cinema',
        })
        return result.canceled ? [] : result.filePaths
    },
    folders: mediaFolderStore,
    history: mediaHistory,
    library: new MediaLibrary({
        fileSystem: mediaFileSystem,
        folders: mediaFolderStore,
        providers: [new LocalMediaProvider()],
    }),
    player: new MediaPlayer(applicationManager),
    watchTracker: watchTrackingManager,
})

new MediaModule(core.registry, mediaManager).register()

const gateway =
    new CommandGateway(
        core.executor,
        core.activity,
    )

gateway.register()

ipcMain.handle(
    'nexus:ping',
    async () => {
        return core.executor.execute({
            id: randomUUID(),
            command: 'system.ping',
            payload: undefined,
            source: 'ui',
            target: {
                type: 'local',
            },
            createdAt: Date.now(),
        })
    },
)

function createWindow(): void {
    const window = new BrowserWindow({
        width: 1440,
        height: 900,

        webPreferences: {
            preload: path.join(
                currentDirectory,
                'preload.cjs',
            ),

            contextIsolation: true,

            nodeIntegration: false,
        },
    })

    const devServer =
        process.env.VITE_DEV_SERVER_URL

    if (devServer) {
        void window.loadURL(devServer)
    } else {
        void window.loadFile(
            path.join(
                currentDirectory,
                '../dist/index.html',
            ),
        )
    }
}

void app.whenReady().then(() => {
    if (!ownsInstanceLock) return
    handleOAuthArguments(process.argv)
    createWindow()

    app.on('activate', () => {
        if (
            BrowserWindow.getAllWindows()
                .length === 0
        ) {
            createWindow()
        }
    })
})

app.on(
    'window-all-closed',
    () => {
        if (
            process.platform !== 'darwin'
        ) {
            app.quit()
        }
    },
)

app.on('before-quit', () => {
    gamingManager.dispose()
    watchConnectorManager.dispose()
})
