import { z } from 'zod'

export const diskInfoSchema = z.object({
    name: z.string().min(1),
    totalBytes: z.number().nonnegative(),
    freeBytes: z.number().nonnegative(),
    usedBytes: z.number().nonnegative(),
    usedPercent: z.number().min(0).max(100),
})

export const systemInfoSchema = z.object({
    hostname: z.string().min(1),
    platform: z.string().min(1),
    windowsVersion: z.string().min(1),
    architecture: z.string().min(1),
    uptimeSeconds: z.number().nonnegative(),
    cpu: z.object({
        model: z.string().min(1),
        logicalProcessors: z.number().int().positive(),
        loadPercent: z.number().min(0).max(100),
    }),
    memory: z.object({
        totalBytes: z.number().positive(),
        usedBytes: z.number().nonnegative(),
        availableBytes: z.number().nonnegative(),
        usedPercent: z.number().min(0).max(100),
    }),
    disks: z.array(diskInfoSchema),
})

export type DiskInfo = z.infer<typeof diskInfoSchema>
export type SystemInfo = z.infer<typeof systemInfoSchema>

export interface SystemInfoService {
    getInfo(): Promise<SystemInfo>
}
