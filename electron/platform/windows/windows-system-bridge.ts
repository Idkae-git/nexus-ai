import { execFile } from 'node:child_process'

import type { SystemBridge } from '../../../src/core/platform/system-bridge.js'

export class WindowsSystemBridge implements SystemBridge {
    async lock(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            execFile(
                'rundll32.exe',
                ['user32.dll,LockWorkStation'],
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