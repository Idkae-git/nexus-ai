import type { LauncherDefinition, LauncherId } from '../../../../src/features/gaming/gaming.types.js'

export const knownLaunchers = [
    { id: 'steam', applicationId: 'steam', name: 'Steam', providerId: 'steam', processNames: ['steam.exe'], manifestLocations: ['steamapps\\libraryfolders.vdf'], capabilities: { launch: true, close: true, libraryScan: true, directGameLaunch: true } },
    { id: 'epic', applicationId: 'epic-games', name: 'Epic Games', providerId: 'epic', processNames: ['EpicGamesLauncher.exe'], manifestLocations: ['%PROGRAMDATA%\\Epic\\EpicGamesLauncher\\Data\\Manifests'], capabilities: { launch: true, close: true, libraryScan: true, directGameLaunch: true } },
    { id: 'ubisoft', applicationId: 'ubisoft-connect', name: 'Ubisoft Connect', providerId: 'ubisoft', processNames: ['UbisoftConnect.exe', 'upc.exe'], manifestLocations: [], capabilities: { launch: true, close: true, libraryScan: false, directGameLaunch: false } },
    { id: 'battlenet', applicationId: 'battle-net', name: 'Battle.net', providerId: 'battlenet', processNames: ['Battle.net.exe'], manifestLocations: ['%PROGRAMDATA%\\Battle.net'], capabilities: { launch: true, close: true, libraryScan: false, directGameLaunch: false } },
    { id: 'riot', applicationId: 'riot-client', name: 'Riot Client', providerId: 'riot', processNames: ['RiotClientServices.exe', 'RiotClientUx.exe'], manifestLocations: ['%SYSTEMDRIVE%\\Riot Games'], capabilities: { launch: true, close: true, libraryScan: true, directGameLaunch: true } },
    { id: 'ea', applicationId: null, name: 'EA App', providerId: null, processNames: ['EADesktop.exe'], manifestLocations: [], capabilities: { launch: false, close: false, libraryScan: false, directGameLaunch: false } },
    { id: 'gog', applicationId: null, name: 'GOG Galaxy', providerId: null, processNames: ['GalaxyClient.exe'], manifestLocations: [], capabilities: { launch: false, close: false, libraryScan: false, directGameLaunch: false } },
    { id: 'xbox', applicationId: null, name: 'Xbox', providerId: null, processNames: ['XboxPcApp.exe'], manifestLocations: [], capabilities: { launch: false, close: false, libraryScan: false, directGameLaunch: false } },
] as const satisfies readonly LauncherDefinition[]

export class LauncherRegistry {
    readonly #definitions = new Map<LauncherId, LauncherDefinition>()

    constructor(definitions: readonly LauncherDefinition[] = knownLaunchers) {
        for (const definition of definitions) {
            if (this.#definitions.has(definition.id)) throw new Error(`Launcher id "${definition.id}" is already registered.`)
            this.#definitions.set(definition.id, definition)
        }
    }

    get(id: LauncherId) {
        const definition = this.#definitions.get(id)
        if (!definition) throw new Error(`Unknown launcher "${id}".`)
        return definition
    }

    list() { return Object.freeze([...this.#definitions.values()]) }
}
