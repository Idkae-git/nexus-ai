import { execFile } from 'node:child_process'
import * as os from 'node:os'
import { promisify } from 'node:util'

import { z } from 'zod'

import {
    systemInfoSchema,
} from '../../src/core/platform/system-info.js'
import type {
    DiskInfo,
    SystemInfo,
    SystemInfoService,
} from '../../src/core/platform/system-info.js'

const execFileAsync = promisify(execFile)

const rawDiskSchema = z.object({
    DeviceID: z.string().min(1),
    Size: z.union([z.string(), z.number()]),
    FreeSpace: z.union([z.string(), z.number()]),
})

const diskOutputSchema = z.union([
    rawDiskSchema,
    z.array(rawDiskSchema),
])

interface CpuSnapshot {
    idle: number
    total: number
}

const diskScript = [
    'Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"',
    '| Select-Object DeviceID,Size,FreeSpace',
    '| ConvertTo-Json -Compress',
].join(' ')

export class WindowsSystemInfoService implements SystemInfoService {
    private previousCpuSnapshot: CpuSnapshot | undefined

    async getInfo(): Promise<SystemInfo> {
        const cpus = os.cpus()
        const totalMemory = os.totalmem()
        const availableMemory = os.freemem()
        const usedMemory = totalMemory - availableMemory
        const currentCpuSnapshot = this.captureCpuSnapshot(cpus)
        const loadPercent = this.calculateCpuLoad(currentCpuSnapshot)

        this.previousCpuSnapshot = currentCpuSnapshot

        const info: SystemInfo = {
            hostname: os.hostname(),
            platform: os.platform(),
            windowsVersion: os.version() || os.release(),
            architecture: os.arch(),
            uptimeSeconds: Math.floor(os.uptime()),
            cpu: {
                model: cpus[0]?.model.trim() || 'Unknown CPU',
                logicalProcessors: Math.max(cpus.length, 1),
                loadPercent,
            },
            memory: {
                totalBytes: totalMemory,
                usedBytes: usedMemory,
                availableBytes: availableMemory,
                usedPercent: this.percentage(usedMemory, totalMemory),
            },
            disks: await this.readLocalDisks(),
        }

        return systemInfoSchema.parse(info)
    }

    private captureCpuSnapshot(cpus: os.CpuInfo[]): CpuSnapshot {
        return cpus.reduce<CpuSnapshot>(
            (snapshot, cpu) => {
                const total = Object.values(cpu.times)
                    .reduce((sum, time) => sum + time, 0)

                return {
                    idle: snapshot.idle + cpu.times.idle,
                    total: snapshot.total + total,
                }
            },
            { idle: 0, total: 0 },
        )
    }

    private calculateCpuLoad(current: CpuSnapshot): number {
        const previous = this.previousCpuSnapshot

        if (!previous) {
            return this.percentage(
                current.total - current.idle,
                current.total,
            )
        }

        const totalDelta = current.total - previous.total
        const idleDelta = current.idle - previous.idle

        return this.percentage(totalDelta - idleDelta, totalDelta)
    }

    private async readLocalDisks(): Promise<DiskInfo[]> {
        try {
            const { stdout } = await execFileAsync(
                'powershell.exe',
                [
                    '-NoLogo',
                    '-NoProfile',
                    '-NonInteractive',
                    '-Command',
                    diskScript,
                ],
                {
                    encoding: 'utf8',
                    windowsHide: true,
                },
            )

            if (!stdout.trim()) {
                return []
            }

            const parsed: unknown = JSON.parse(stdout)
            const output = diskOutputSchema.parse(parsed)
            const disks = Array.isArray(output) ? output : [output]

            return disks.map((disk) => {
                const totalBytes = Number(disk.Size)
                const freeBytes = Number(disk.FreeSpace)
                const usedBytes = Math.max(0, totalBytes - freeBytes)

                return {
                    name: disk.DeviceID,
                    totalBytes,
                    freeBytes,
                    usedBytes,
                    usedPercent: this.percentage(usedBytes, totalBytes),
                }
            })
        } catch (error) {
            console.warn(
                'NEXUS could not read local disk metrics:',
                error instanceof Error ? error.message : error,
            )

            return []
        }
    }

    private percentage(value: number, total: number): number {
        if (total <= 0) {
            return 0
        }

        return Math.min(
            100,
            Math.max(0, Math.round((value / total) * 1000) / 10),
        )
    }
}
