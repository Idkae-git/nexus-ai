import { execFile } from 'node:child_process'

import type { SystemBridge } from '../../../src/core/platform/system-bridge.js'

export class WindowsSystemBridge implements SystemBridge {
    async lock(): Promise<void> {
        await this.run('rundll32.exe', [
            'user32.dll,LockWorkStation',
        ])
    }

    async shutdown(): Promise<void> {
        await this.run('shutdown.exe', [
            '/s',
            '/t',
            '0',
        ])
    }

    async restart(): Promise<void> {
        await this.run('shutdown.exe', [
            '/r',
            '/t',
            '0',
        ])
    }

    async sleep(): Promise<void> {
        await this.run('rundll32.exe', [
            'powrprof.dll,SetSuspendState',
            '0,1,0',
        ])
    }

    private async run(
        executable: string,
        args: string[],
    ): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            execFile(
                executable,
                args,
                (error) => {
                    if (error) {
                        reject(error)
                        return
                    }

                    resolve()
                },
            )
        })
    }
}