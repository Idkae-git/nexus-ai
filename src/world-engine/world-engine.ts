import type { WorldId, WorldTransitionDefinition, WorldTransitionPhase, WorldTransitionState } from './world.types.ts'

export function createIdleTransitionState(world: WorldId): WorldTransitionState {
  return { definition: null, durationMs: 0, from: null, phase: 'idle', startedAt: null, to: world }
}

export function beginWorldTransition(
  from: WorldId,
  to: WorldId,
  definition: WorldTransitionDefinition,
  startedAt: number,
): WorldTransitionState {
  return {
    definition,
    durationMs: definition.durationMs,
    from,
    phase: definition.durationMs === 0 ? 'active' : 'leaving',
    startedAt,
    to,
  }
}

export function setWorldTransitionPhase(
  transition: WorldTransitionState,
  phase: WorldTransitionPhase,
): WorldTransitionState {
  return { ...transition, phase }
}

export function completeWorldTransition(transition: WorldTransitionState): WorldTransitionState {
  return { ...transition, definition: null, durationMs: 0, from: null, phase: 'idle', startedAt: null }
}
