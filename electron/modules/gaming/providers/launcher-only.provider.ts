import type { GameProvider, GameProviderContext } from './provider.types.js'

export class LauncherOnlyProvider implements GameProvider {
    readonly id
    readonly #label: string

    constructor(id: 'ubisoft' | 'battlenet', label: string) {
        this.id = id
        this.#label = label
    }

    scan(context: GameProviderContext) {
        const warnings = context.launcher.installStatus === 'installed'
            ? [`${this.#label} game discovery is not enabled because no sufficiently reliable local catalog was found.`]
            : []
        return Promise.resolve({ games: [], provider: this.id, warnings })
    }
}
