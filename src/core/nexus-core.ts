import { CommandExecutor } from './commands/command-executor.js'
import { CommandRegistry } from './commands/command-registry.js'
import { PendingCommandStore } from './commands/pending-command-store.js'

import { PermissionManager } from './permissions/permission-manager.js'

import { ActivityService } from './activity/activity-service.js'
import { ActivityStore } from './activity/activity-store.js'

export class NexusCore {
    readonly registry: CommandRegistry

    readonly permissions: PermissionManager

    readonly pending: PendingCommandStore

    readonly activityStore: ActivityStore

    readonly activity: ActivityService

    readonly executor: CommandExecutor

    constructor() {
        this.registry = new CommandRegistry()

        this.permissions = new PermissionManager()

        this.pending = new PendingCommandStore()

        this.activityStore = new ActivityStore()

        this.activity = new ActivityService(
            this.activityStore,
        )

        this.executor =
            new CommandExecutor(
                this.registry,
                this.permissions,
                this.pending,
                this.activity,
            )
    }
}
