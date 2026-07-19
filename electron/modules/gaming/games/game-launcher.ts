import { spawn } from 'node:child_process'

import type { DetectedGame, DetectedLauncher } from '../../../../src/features/gaming/gaming.types.js'

export type GameSpawn = (executablePath: string, args: readonly string[]) => Promise<void>
export type ExternalUriOpener = (uri: string) => Promise<void>

function spawnGame(executablePath: string, args: readonly string[]) {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(executablePath, [...args], { detached: true, shell: false, stdio: 'ignore', windowsHide: false })
        child.once('error', reject)
        child.once('spawn', () => { child.unref(); resolve() })
    })
}

function safeUri(game: DetectedGame, uri: string) {
    if (game.provider === 'steam') return /^steam:\/\/rungameid\/\d+$/.test(uri)
    if (game.provider === 'epic') return /^com\.epicgames\.launcher:\/\/apps\/[\w.%~-]+\?action=launch&silent=true$/.test(uri)
    return false
}

export class GameLauncher {
    readonly #openExternal: ExternalUriOpener
    readonly #spawn: GameSpawn

    constructor(openExternal: ExternalUriOpener, spawnProcess: GameSpawn = spawnGame) {
        this.#openExternal = openExternal
        this.#spawn = spawnProcess
    }

    async launch(game: DetectedGame, launchers: readonly DetectedLauncher[]) {
        if (game.installStatus !== 'installed' || !game.capabilities.launch) throw new Error(`${game.title} is not installed or cannot be launched.`)
        const strategy = game.launchStrategy
        if (strategy.type === 'uri') {
            if (!safeUri(game, strategy.uri)) throw new Error(`The launch URI for ${game.title} is not trusted.`)
            await this.#openExternal(strategy.uri)
            return strategy.type
        }
        if (strategy.type === 'launcher-arguments') {
            const launcher = launchers.find((entry) => entry.id === strategy.launcherId)
            if (!launcher?.executablePath || launcher.installStatus !== 'installed') throw new Error(`${launcher?.name ?? strategy.launcherId} is unavailable.`)
            await this.#spawn(launcher.executablePath, strategy.arguments)
            return strategy.type
        }
        if (!game.executablePath || game.executablePath !== strategy.executablePath) throw new Error('The detected game executable no longer matches its trusted strategy.')
        await this.#spawn(strategy.executablePath, strategy.arguments)
        return strategy.type
    }
}
