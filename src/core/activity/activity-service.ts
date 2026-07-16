import { ActivityStore } from './activity-store.js'

import type {
    ActivityFilter,
    NexusActivityEntry,
    NexusActivityStatus,
} from './activity.types.js'

export class ActivityService {
    private readonly store: ActivityStore

    constructor(store: ActivityStore) {
        this.store = store
    }

    record(
        activity: NexusActivityEntry,
    ): void {
        this.store.add(activity)
    }

    request(
        activity: Omit<NexusActivityEntry, 'status'>,
    ): void {
        this.store.add({
            ...activity,
            status: 'requested',
        })
    }

    complete(
        id: string,
        status: Exclude<
            NexusActivityStatus,
            'requested'
        >,
        options?: {
            result?: unknown
            error?: string
        },
    ): NexusActivityEntry | undefined {
        return this.store.update(
            id,
            status,
            options,
        )
    }

    get(
        id: string,
    ): NexusActivityEntry | undefined {
        return this.store.get(id)
    }

    list(filter?: ActivityFilter): NexusActivityEntry[] {
        return this.store.list(filter)
    }

    clear(): void {
        this.store.clear()
    }

    count(): number {
        return this.store.count()
    }
}
