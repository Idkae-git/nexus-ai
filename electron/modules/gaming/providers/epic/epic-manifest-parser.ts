export interface EpicGameManifest {
    appName: string
    catalogItemId: string
    displayName: string
    installLocation: string
    launchExecutable: string | null
}

function property(value: Record<string, unknown>, name: string) {
    const entry = value[name]
    return typeof entry === 'string' && entry.trim() ? entry.trim() : null
}

export function parseEpicManifest(input: string): EpicGameManifest {
    const parsed: unknown = JSON.parse(input)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Epic manifest must be an object.')
    const value = parsed as Record<string, unknown>
    const appName = property(value, 'AppName')
    const catalogItemId = property(value, 'CatalogItemId') ?? appName
    const displayName = property(value, 'DisplayName')
    const installLocation = property(value, 'InstallLocation')
    if (!appName || !catalogItemId || !displayName || !installLocation || !/^[\w.-]+$/.test(appName)) {
        throw new Error('Epic manifest is missing a valid AppName, DisplayName, CatalogItemId, or InstallLocation.')
    }
    return {
        appName,
        catalogItemId,
        displayName,
        installLocation,
        launchExecutable: property(value, 'LaunchExecutable'),
    }
}
