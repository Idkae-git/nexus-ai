export interface SystemBridge {
    lock(): Promise<void>
    shutdown(): Promise<void>
    restart(): Promise<void>
    sleep(): Promise<void>
}