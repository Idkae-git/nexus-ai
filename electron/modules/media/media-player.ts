import { spawn } from 'node:child_process'

import type { ApplicationManager } from '../applications/application-manager.js'
import type { DetectedMedia, MediaPlayResult, MediaPlayerStatus } from '../../../src/features/media/media.types.js'

export type MediaSpawn = (executablePath: string, args: readonly string[]) => Promise<void>

function spawnPlayer(executablePath: string, args: readonly string[]) {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(executablePath, [...args], { detached: true, shell: false, stdio: 'ignore', windowsHide: false })
        child.once('error', reject)
        child.once('spawn', () => { child.unref(); resolve() })
    })
}

export class MediaPlayer {
    readonly #applications: ApplicationManager
    readonly #spawn: MediaSpawn

    constructor(applications: ApplicationManager, spawnProcess: MediaSpawn = spawnPlayer) {
        this.#applications = applications
        this.#spawn = spawnProcess
    }

    async status(): Promise<MediaPlayerStatus> {
        await this.#applications.refreshRuntimeStatus()
        try {
            const vlc = await this.#applications.get('vlc')
            return { internalAvailable: false, vlcAvailable: vlc.installStatus === 'installed' && Boolean(vlc.executablePath), vlcRunning: vlc.runtimeStatus === 'running' }
        } catch { return { internalAvailable: false, vlcAvailable: false, vlcRunning: false } }
    }

    async play(item: DetectedMedia): Promise<MediaPlayResult> {
        let vlc
        try { vlc = await this.#applications.get('vlc') }
        catch { return { error: 'VLC est indisponible. Le lecteur interne est prévu pour une version future.', mediaId: item.id, player: 'internal', success: false } }
        if (vlc.installStatus !== 'installed' || !vlc.executablePath) return { error: 'VLC est indisponible. Le lecteur interne est prévu pour une version future.', mediaId: item.id, player: 'internal', success: false }
        await this.#spawn(vlc.executablePath, [item.filePath])
        return { launchedAt: Date.now(), mediaId: item.id, player: 'vlc', success: true }
    }
}
