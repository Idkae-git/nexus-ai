import { contextBridge, ipcRenderer } from 'electron'

interface NexusRendererApi {
    ping(): Promise<unknown>
    lockSystem(): Promise<unknown>
    confirmCommand(requestId: string): Promise<unknown>
    cancelCommand(requestId: string): Promise<boolean>
}

const nexusApi: NexusRendererApi = {
    ping(): Promise<unknown> {
        return ipcRenderer.invoke('nexus:ping')
    },

    lockSystem(): Promise<unknown> {
        return ipcRenderer.invoke('nexus:system:lock')
    },

    confirmCommand(requestId: string): Promise<unknown> {
        return ipcRenderer.invoke(
            'nexus:command:confirm',
            requestId,
        )
    },

    cancelCommand(requestId: string): Promise<boolean> {
        return ipcRenderer.invoke(
            'nexus:command:cancel',
            requestId,
        )
    },
}

contextBridge.exposeInMainWorld('nexus', nexusApi)