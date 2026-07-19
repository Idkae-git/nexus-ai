import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { DetectedGame, GameCloseResult, GameRuntimeStatus } from '../../../../src/features/gaming/gaming.types.js'
import { parseTasklist } from '../../applications/application-process.js'

const executeFile = promisify(execFile)
export type GamingProcessRunner = (executable: string, args: readonly string[]) => Promise<string>
export type GamingProcessDelay = (durationMs: number) => Promise<void>

async function runProcess(executable: string, args: readonly string[]) {
    const result = await executeFile(executable, [...args], { encoding: 'utf8', windowsHide: true })
    return result.stdout
}

function delay(durationMs: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, durationMs))
}

export class GameProcessService {
    readonly #run: GamingProcessRunner
    readonly #delay: GamingProcessDelay

    constructor(run: GamingProcessRunner = runProcess, wait: GamingProcessDelay = delay) {
        this.#run = run
        this.#delay = wait
    }

    async listProcesses() {
        try { return parseTasklist(await this.#run('tasklist.exe', ['/FO', 'CSV', '/NH'])) }
        catch { return null }
    }

    status(game: DetectedGame, processes: ReadonlySet<string> | null): GameRuntimeStatus {
        if (!game.capabilities.trackProcess || game.gameProcessNames.length === 0) return 'unknown'
        if (!processes) return 'unknown'
        return game.gameProcessNames.some((name) => processes.has(name.toLocaleLowerCase())) ? 'running' : 'stopped'
    }

    async close(game: DetectedGame): Promise<GameCloseResult> {
        if (!game.capabilities.close || game.gameProcessNames.length === 0) throw new Error(`Closing ${game.title} is not supported reliably.`)
        const processes = await this.listProcesses()
        if (!processes) throw new Error('Game runtime status could not be determined.')
        const targets = game.gameProcessNames.filter((name) => processes.has(name.toLocaleLowerCase()))
        if (targets.length === 0) throw new Error(`${game.title} is not running.`)
        const closedProcesses: string[] = []
        for (const processName of targets) {
            await this.#run('taskkill.exe', ['/IM', processName])
            closedProcesses.push(processName)
        }
        await this.#delay(2_000)
        const remaining = await this.listProcesses()
        if (!remaining) throw new Error(`Could not verify that ${game.title} exited after the soft-close request.`)
        const stillRunning = targets.filter((name) => remaining.has(name.toLocaleLowerCase()))
        if (stillRunning.length > 0) {
            throw new Error(`${game.title} did not exit after a soft-close request. Force-close was not used.`)
        }
        return { closedProcesses, gameId: game.id, success: true }
    }
}
