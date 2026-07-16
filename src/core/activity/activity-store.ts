import type {
    ActivityFilter,
    NexusActivityEntry,
    NexusActivityStatus,
} from './activity.types.js'

export class ActivityStore {
    private readonly activities: NexusActivityEntry[] = []

    private readonly maxEntries: number

    constructor(maxEntries = 1000) {
        this.maxEntries = maxEntries
    }

    add<TResult = unknown>(
        activity: NexusActivityEntry<TResult>,
    ): void {
        const existingIndex = this.activities.findIndex(
            (entry) => entry.id === activity.id,
        )

        if (existingIndex >= 0) {
            this.activities.splice(existingIndex, 1)
        }

        this.activities.unshift(activity)

        if (this.activities.length > this.maxEntries) {
            this.activities.length = this.maxEntries
        }
    }

    update(
        id: string,
        status: NexusActivityStatus,
        options?: {
            result?: unknown
            error?: string
        },
    ): NexusActivityEntry | undefined {
        const activity = this.activities.find(
            (entry) => entry.id === id,
        )

        if (!activity) {
            return undefined
        }

        activity.status = status
        activity.completedAt = Date.now()
        activity.durationMs =
            activity.completedAt - activity.createdAt

        if (options?.result !== undefined) {
            activity.result = options.result
        }

        if (options?.error) {
            activity.error = options.error
        }

        return activity
    }

    get(
        id: string,
    ): NexusActivityEntry | undefined {
        return this.activities.find(
            (entry) => entry.id === id,
        )
    }

    list(
        filter?: ActivityFilter,
    ): NexusActivityEntry[] {
        let entries = [...this.activities]

        if (filter?.command) {
            entries = entries.filter(
                (entry) => entry.command === filter.command,
            )
        }

        if (filter?.status) {
            entries = entries.filter(
                (entry) => entry.status === filter.status,
            )
        }

        if (filter?.source) {
            entries = entries.filter(
                (entry) => entry.source === filter.source,
            )
        }

        if (filter?.limit !== undefined) {
            entries = entries.slice(
                0,
                Math.max(0, filter.limit),
            )
        }

        return entries
    }

    clear(): void {
        this.activities.length = 0
    }

    count(): number {
        return this.activities.length
    }
}
