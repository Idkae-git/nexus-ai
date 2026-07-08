interface NexusRendererApi {
    ping(): Promise<unknown>
    lockSystem(): Promise<unknown>
}

interface Window {
    nexus: NexusRendererApi
}