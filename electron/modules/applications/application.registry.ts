import type { ApplicationDefinition, ApplicationId, ApplicationSource } from '../../../src/features/applications/application.types.js'

export interface ApplicationPathCandidate {
    path: string
    source: Exclude<ApplicationSource, 'registry' | 'unknown'>
}

export interface ApplicationRegistryCandidate {
    appendExecutable?: string
    key: string
    valueName?: string
}

export interface RegisteredApplicationDefinition extends ApplicationDefinition {
    pathCandidates: readonly ApplicationPathCandidate[]
    registryCandidates: readonly ApplicationRegistryCandidate[]
}

const appPath = (executable: string): ApplicationRegistryCandidate[] => [
    { key: `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${executable}` },
    { key: `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${executable}` },
]

export const knownApplications = [
    {
        id: 'opera-gx', name: 'Opera GX', publisher: 'Opera Norway AS', category: 'browser', iconId: 'opera-gx',
        description: 'Gaming-focused browser with integrated workspace and media controls.',
        executableNames: ['launcher.exe', 'opera.exe'], processNames: ['opera.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [
            { key: 'HKCU\\Software\\Opera Software\\Opera GX Stable', valueName: 'Install Path', appendExecutable: 'launcher.exe' },
            { key: 'HKLM\\Software\\Opera Software\\Opera GX Stable', valueName: 'Install Path', appendExecutable: 'launcher.exe' },
        ],
        pathCandidates: [
            { path: '%LOCALAPPDATA%\\Programs\\Opera GX\\launcher.exe', source: 'known-path' },
            { path: '%PROGRAMFILES%\\Opera GX\\launcher.exe', source: 'known-path' },
            { path: '%PROGRAMFILES(X86)%\\Opera GX\\launcher.exe', source: 'known-path' },
        ],
    },
    {
        id: 'steam', name: 'Steam', publisher: 'Valve Corporation', category: 'games', iconId: 'steam',
        description: 'Game library, storefront and local session launcher.',
        executableNames: ['steam.exe'], processNames: ['steam.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [
            ...appPath('steam.exe'),
            { key: 'HKCU\\Software\\Valve\\Steam', valueName: 'SteamExe' },
            { key: 'HKCU\\Software\\Valve\\Steam', valueName: 'SteamPath', appendExecutable: 'steam.exe' },
            { key: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam', valueName: 'InstallLocation', appendExecutable: 'steam.exe' },
        ],
        pathCandidates: [
            { path: '%PROGRAMFILES(X86)%\\Steam\\steam.exe', source: 'known-path' },
            { path: '%PROGRAMFILES%\\Steam\\steam.exe', source: 'known-path' },
        ],
    },
    {
        id: 'discord', name: 'Discord', publisher: 'Discord Inc.', category: 'communication', iconId: 'discord',
        description: 'Community, messaging and voice communication client.',
        executableNames: ['Update.exe'], processNames: ['Discord.exe'], defaultArguments: ['--processStart', 'Discord.exe'],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [],
        pathCandidates: [{ path: '%LOCALAPPDATA%\\Discord\\Update.exe', source: 'known-path' }],
    },
    {
        id: 'spotify', name: 'Spotify', publisher: 'Spotify AB', category: 'music', iconId: 'spotify',
        description: 'Music and podcast playback for the local desktop.',
        executableNames: ['Spotify.exe'], processNames: ['Spotify.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [
            ...appPath('Spotify.exe'),
            { key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Spotify', valueName: 'InstallLocation', appendExecutable: 'Spotify.exe' },
        ],
        pathCandidates: [
            { path: '%APPDATA%\\Spotify\\Spotify.exe', source: 'known-path' },
            { path: '%LOCALAPPDATA%\\Microsoft\\WindowsApps\\Spotify.exe', source: 'known-path' },
        ],
    },
    {
        id: 'vscode', name: 'Visual Studio Code', publisher: 'Microsoft Corporation', category: 'development', iconId: 'vscode',
        description: 'Code editor, terminal and development workspace.',
        executableNames: ['Code.exe'], processNames: ['Code.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: appPath('Code.exe'),
        pathCandidates: [
            { path: '%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe', source: 'known-path' },
            { path: '%PROGRAMFILES%\\Microsoft VS Code\\Code.exe', source: 'known-path' },
            { path: '%PROGRAMFILES(X86)%\\Microsoft VS Code\\Code.exe', source: 'known-path' },
        ],
    },
    {
        id: 'vlc', name: 'VLC', publisher: 'VideoLAN', category: 'media', iconId: 'vlc',
        description: 'Local video, audio and streaming media player.',
        executableNames: ['vlc.exe'], processNames: ['vlc.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [
            ...appPath('vlc.exe'),
            { key: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VLC media player', valueName: 'InstallLocation', appendExecutable: 'vlc.exe' },
        ],
        pathCandidates: [
            { path: '%PROGRAMFILES%\\VideoLAN\\VLC\\vlc.exe', source: 'known-path' },
            { path: '%PROGRAMFILES(X86)%\\VideoLAN\\VLC\\vlc.exe', source: 'known-path' },
        ],
    },
    {
        id: 'epic-games', name: 'Epic Games Launcher', publisher: 'Epic Games, Inc.', category: 'games', iconId: 'epic-games',
        description: 'Epic storefront and installed game library.',
        executableNames: ['EpicGamesLauncher.exe'], processNames: ['EpicGamesLauncher.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: appPath('EpicGamesLauncher.exe'),
        pathCandidates: [
            { path: '%PROGRAMFILES(X86)%\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe', source: 'known-path' },
            { path: '%PROGRAMFILES%\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe', source: 'known-path' },
        ],
    },
    {
        id: 'ubisoft-connect', name: 'Ubisoft Connect', publisher: 'Ubisoft', category: 'games', iconId: 'ubisoft-connect',
        description: 'Ubisoft library, social layer and game launcher.',
        executableNames: ['UbisoftConnect.exe', 'upc.exe'], processNames: ['UbisoftConnect.exe', 'upc.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [
            ...appPath('UbisoftConnect.exe'),
            ...appPath('upc.exe'),
            { key: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Uplay', valueName: 'InstallLocation', appendExecutable: 'UbisoftConnect.exe' },
        ],
        pathCandidates: [
            { path: '%PROGRAMFILES(X86)%\\Ubisoft\\Ubisoft Game Launcher\\UbisoftConnect.exe', source: 'known-path' },
            { path: '%PROGRAMFILES%\\Ubisoft\\Ubisoft Game Launcher\\UbisoftConnect.exe', source: 'known-path' },
        ],
    },
    {
        id: 'battle-net', name: 'Battle.net', publisher: 'Blizzard Entertainment', category: 'games', iconId: 'battle-net',
        description: 'Blizzard game library and update launcher.',
        executableNames: ['Battle.net.exe'], processNames: ['Battle.net.exe'], defaultArguments: [],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: [
            ...appPath('Battle.net.exe'),
            { key: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Battle.net', valueName: 'InstallLocation', appendExecutable: 'Battle.net.exe' },
        ],
        pathCandidates: [
            { path: '%PROGRAMFILES(X86)%\\Battle.net\\Battle.net.exe', source: 'known-path' },
            { path: '%PROGRAMFILES%\\Battle.net\\Battle.net.exe', source: 'known-path' },
        ],
    },
    {
        id: 'riot-client', name: 'Riot Client', publisher: 'Riot Games', category: 'games', iconId: 'riot-client',
        description: 'Riot game launcher and patch management client.',
        executableNames: ['RiotClientServices.exe'], processNames: ['RiotClientServices.exe', 'RiotClientUx.exe'],
        defaultArguments: ['--launch-product=riot-client', '--launch-patchline=live'],
        capabilities: { launch: true, close: true, forceClose: false },
        registryCandidates: appPath('RiotClientServices.exe'),
        pathCandidates: [
            { path: '%PROGRAMFILES%\\Riot Games\\Riot Client\\RiotClientServices.exe', source: 'known-path' },
            { path: '%PROGRAMFILES(X86)%\\Riot Games\\Riot Client\\RiotClientServices.exe', source: 'known-path' },
        ],
    },
] as const satisfies readonly RegisteredApplicationDefinition[]

export class ApplicationRegistry {
    readonly #definitions = new Map<ApplicationId, RegisteredApplicationDefinition>()

    constructor(definitions: readonly RegisteredApplicationDefinition[] = knownApplications) {
        for (const definition of definitions) {
            if (this.#definitions.has(definition.id)) {
                throw new Error(`Application id "${definition.id}" is already registered.`)
            }
            this.#definitions.set(definition.id, definition)
        }
    }

    get(applicationId: ApplicationId) {
        const definition = this.#definitions.get(applicationId)
        if (!definition) throw new Error(`Unknown application "${applicationId}".`)
        return definition
    }

    has(applicationId: string): applicationId is ApplicationId {
        return this.#definitions.has(applicationId as ApplicationId)
    }

    list() {
        return Object.freeze([...this.#definitions.values()])
    }
}
