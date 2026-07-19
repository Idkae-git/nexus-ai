import { spawn } from 'node:child_process'

import type { ApplicationLaunchResult, DetectedApplication } from '../../../src/features/applications/application.types.js'

export type ApplicationSpawn = (executablePath: string, args: readonly string[]) => Promise<void>

function spawnApplication(executablePath: string, args: readonly string[]) {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(executablePath, [...args], {
            detached: true,
            shell: false,
            stdio: 'ignore',
            windowsHide: false,
        })
        child.once('error', reject)
        child.once('spawn', () => {
            child.unref()
            resolve()
        })
    })
}
export class ApplicationLauncher {
    readonly #spawn: ApplicationSpawn

    constructor(spawnProcess: ApplicationSpawn = spawnApplication) {
        this.#spawn = spawnProcess
    }

    async launch(application: DetectedApplication): Promise<ApplicationLaunchResult> {
        if (application.installStatus !== 'installed' || !application.executablePath) {
            throw new Error(`${application.name} is not installed or its executable is missing.`)
        }
        if (!application.capabilities.launch) throw new Error(`Launching ${application.name} is not supported.`)
        await this.#spawn(application.executablePath, application.defaultArguments)
        return {
            applicationId: application.id,
            executablePath: application.executablePath,
            launchedAt: Date.now(),
            success: true,
        }
    }
}
