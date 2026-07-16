import { contextBridge, ipcRenderer } from 'electron'

import type {
    NexusCommandRequest,
    NexusCommandResult,
} from '../src/core/commands/command.types.js'
import type {
    ActivityFilter,
    NexusActivityEntry,
} from '../src/core/activity/activity.types.js'

export interface NexusRendererApi {
    ping(): Promise<NexusCommandResult<string>>

    execute<TPayload = unknown, TResult = unknown>(
        request: NexusCommandRequest<TPayload>,
    ): Promise<NexusCommandResult<TResult>>

    confirm(
        requestId: string,
    ): Promise<NexusCommandResult>

    cancel(
        requestId: string,
    ): Promise<boolean>

    listActivities(
        filter?: ActivityFilter,
    ): Promise<NexusActivityEntry[]>

    clearActivities(): Promise<void>
}

const nexusApi: NexusRendererApi = {
    ping() {
        return ipcRenderer.invoke(
            'nexus:ping',
        )
    },

    execute(request) {
        return ipcRenderer.invoke(
            'nexus:execute',
            request,
        )
    },

    confirm(requestId) {
        return ipcRenderer.invoke(
            'nexus:confirm',
            requestId,
        )
    },

    cancel(requestId) {
        return ipcRenderer.invoke(
            'nexus:cancel',
            requestId,
        )
    },

    listActivities(filter) {
        return ipcRenderer.invoke(
            'nexus:activities:list',
            filter,
        )
    },

    clearActivities() {
        return ipcRenderer.invoke(
            'nexus:activities:clear',
        )
    },
}

contextBridge.exposeInMainWorld(
    'nexus',
    nexusApi,
)
