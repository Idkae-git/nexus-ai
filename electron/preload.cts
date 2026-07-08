import { contextBridge, ipcRenderer } from 'electron'

interface NexusRendererApi {
    ping(): Promise<unknown>
    lockSystem(): Promise<unknown>
}

const nexusApi: NexusRendererApi = {
    ping(): Promise<unknown> {
        return ipcRenderer.invoke('nexus:ping')
    },

    lockSystem(): Promise<unknown> {
        return ipcRenderer.invoke('nexus:system:lock')
    },
}

contextBridge.exposeInMainWorld('nexus', nexusApi)