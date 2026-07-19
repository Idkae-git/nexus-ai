import { architectWorld } from '../worlds/architect/architect.world.ts'
import { arcadeWorld } from '../worlds/arcade/arcade.world.ts'
import { circuitWorld } from '../worlds/circuit/circuit.world.ts'
import { commandCenterWorld } from '../worlds/command-center/command-center.world.ts'
import { coreWorld } from '../worlds/core/core.world.ts'
import { forestCinemaWorld } from '../worlds/forest-cinema/forest-cinema.world.ts'
import { laboratoryWorld } from '../worlds/laboratory/laboratory.world.ts'
import type { WorldDefinition, WorldId } from './world.types.ts'

function normalizeRoute(route: string) {
  const cleanRoute = route.split(/[?#]/, 1)[0] || '/'
  return cleanRoute.length > 1 ? cleanRoute.replace(/\/$/, '') : cleanRoute
}

export class WorldRegistry {
  readonly #byId = new Map<WorldId, WorldDefinition>()
  readonly #byRoute = new Map<string, WorldDefinition>()

  constructor(definitions: readonly WorldDefinition[] = []) {
    for (const definition of definitions) this.register(definition)
  }

  register(definition: WorldDefinition) {
    const route = normalizeRoute(definition.route)
    if (this.#byId.has(definition.id)) throw new Error(`World id "${definition.id}" is already registered.`)
    if (this.#byRoute.has(route)) throw new Error(`World route "${route}" is already registered.`)
    this.#byId.set(definition.id, definition)
    this.#byRoute.set(route, definition)
    return this
  }

  getById(id: WorldId) {
    const definition = this.#byId.get(id)
    if (!definition) throw new Error(`Unknown World id "${id}".`)
    return definition
  }

  getByRoute(route: string) {
    return this.#byRoute.get(normalizeRoute(route))
  }

  has(id: WorldId) {
    return this.#byId.has(id)
  }

  list() {
    return Object.freeze([...this.#byId.values()])
  }
}

export const worldRegistry = new WorldRegistry([
  coreWorld,
  arcadeWorld,
  forestCinemaWorld,
  laboratoryWorld,
  commandCenterWorld,
  circuitWorld,
  architectWorld,
])
