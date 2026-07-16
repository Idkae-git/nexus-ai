import { ipcMain } from 'electron'

import type { CommandExecutor } from '../../src/core/commands/command-executor.js'
import type { ActivityService } from '../../src/core/activity/activity-service.js'
import type { ActivityFilter } from '../../src/core/activity/activity.types.js'
import type {
    NexusCommandRequest,
} from '../../src/core/commands/command.types.js'

export class CommandGateway {
    private readonly executor: CommandExecutor

    private readonly activityService: ActivityService

    constructor(
        executor: CommandExecutor,
        activityService: ActivityService,
    ) {
        this.executor = executor
        this.activityService = activityService
    }

    register(): void {
        ipcMain.handle(
            'nexus:execute',
            async (_event, request: NexusCommandRequest) => {
                return this.executor.execute(request)
            },
        )

        ipcMain.handle(
            'nexus:confirm',
            async (_event, requestId: string) => {
                return this.executor.confirm(requestId)
            },
        )

        ipcMain.handle(
            'nexus:cancel',
            (_event, requestId: string) => {
                return this.executor.cancel(requestId)
            },
        )

        ipcMain.handle(
            'nexus:activities:list',
            (_event, filter?: ActivityFilter) => {
                return this.activityService.list(filter)
            },
        )

        ipcMain.handle(
            'nexus:activities:clear',
            () => {
                this.activityService.clear()
            },
        )
    }
}
