interface NexusRendererApi {
    ping(): Promise<unknown>
    lockSystem(): Promise<unknown>
    confirmCommand(requestId: string): Promise<unknown>
    cancelCommand(requestId: string): Promise<boolean>
}

interface Window {
    nexus: NexusRendererApi
}