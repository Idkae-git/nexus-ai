import { randomUUID } from 'node:crypto'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, ipcMain } from 'electron'

import { CommandExecutor } from '../src/core/commands/command-executor.js'
import { CommandRegistry } from '../src/core/commands/command-registry.js'
import type { NexusCommand } from '../src/core/commands/command.types.js'
import { PermissionManager } from '../src/core/permissions/permission-manager.js'
import { WindowsSystemBridge } from './platform/windows/windows-system-bridge.js'
import { PendingCommandStore } from '../src/core/commands/pending-command-store.js'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)

const registry = new CommandRegistry()
const permissionManager = new PermissionManager()

const pendingCommandStore = new PendingCommandStore()

const executor = new CommandExecutor(
    registry,
    permissionManager,
    pendingCommandStore,
)

const systemBridge = new WindowsSystemBridge()

const pingCommand: NexusCommand<void, string> = {
    id: 'system.ping',
    module: 'system',
    description: 'Check NEXUS Core availability',
    permission: 'system.read',
    confirmation: 'none',
    platforms: ['windows'],

    async execute() {
        return 'NEXUS CORE ONLINE'
    },
}

const lockCommand: NexusCommand<void, void> = {
    id: 'system.lock',
    module: 'system',
    description: 'Lock the local Windows session',
    permission: 'system.power',
    confirmation: 'critical',
    platforms: ['windows'],

    async execute() {
        await systemBridge.lock()
    },
}

registry.register(pingCommand)
registry.register(lockCommand)

ipcMain.handle('nexus:ping', async () => {
    return executor.execute({
        id: randomUUID(),
        command: 'system.ping',
        target: {
            type: 'local',
        },
        payload: undefined,
        source: 'ui',
        createdAt: Date.now(),
    })
})

ipcMain.handle('nexus:system:lock', async () => {
    return executor.execute({
        id: randomUUID(),
        command: 'system.lock',
        target: {
            type: 'local',
        },
        payload: undefined,
        source: 'ui',
        createdAt: Date.now(),
    })
})

ipcMain.handle(
    'nexus:command:confirm',
    async (_event, requestId: unknown) => {
        if (typeof requestId !== 'string') {
            return {
                status: 'failed',
                error: 'Invalid request ID',
            }
        }

        return executor.confirm(requestId)
    },
)

ipcMain.handle(
    'nexus:command:cancel',
    (_event, requestId: unknown) => {
        if (typeof requestId !== 'string') {
            return false
        }

        return executor.cancel(requestId)
    },
)

function createWindow(): void {
    const window = new BrowserWindow({
        width: 1440,
        height: 900,
        webPreferences: {
            preload: path.join(currentDirectory, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    const devServerUrl = process.env.VITE_DEV_SERVER_URL

    if (devServerUrl) {
        void window.loadURL(devServerUrl)
        return
    }

    void window.loadFile(
        path.join(currentDirectory, '../dist/index.html'),
    )
}

void app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})