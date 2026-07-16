import { randomUUID } from 'node:crypto'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, ipcMain } from 'electron'

import { SystemModule } from './modules/system/system-module.js'
import { WindowsSystemBridge } from './platform/windows/windows-system-bridge.js'
import { CommandGateway } from './ipc/command-gateway.js'
import { WindowsSystemInfoService } from './services/windows-system-info-service.js'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)

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
