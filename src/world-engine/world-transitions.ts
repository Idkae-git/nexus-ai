import type { WorldDefinition, WorldId, WorldPreferences, WorldTransitionDefinition } from './world.types.ts'

const genericTransition: WorldTransitionDefinition = {
  durationMs: 520,
  id: 'generic-world-fade',
  intensity: 'subtle',
  visual: 'generic',
}

const journeyTransitions: Readonly<Record<string, WorldTransitionDefinition>> = {
  'core:arcade': { durationMs: 760, id: 'core-to-arcade', intensity: 'full', visual: 'core-arena' },
  'arcade:forest-cinema': { durationMs: 1_050, id: 'arcade-to-forest', intensity: 'full', visual: 'arena-forest' },
  'forest-cinema:laboratory': { durationMs: 880, id: 'forest-to-laboratory', intensity: 'full', visual: 'forest-workspace' },
  'laboratory:command-center': { durationMs: 720, id: 'laboratory-to-command', intensity: 'full', visual: 'workspace-command' },
  'command-center:circuit': { durationMs: 760, id: 'command-to-circuit', intensity: 'full', visual: 'command-circuit' },
  'circuit:architect': { durationMs: 820, id: 'circuit-to-architect', intensity: 'full', visual: 'circuit-architect' },
}

export function resolveWorldTransition(
  from: WorldDefinition,
  to: WorldDefinition,
  preferences: WorldPreferences,
): WorldTransitionDefinition {
  if (!preferences.animationsEnabled || preferences.staticMode || preferences.transitionIntensity === 'none') {
    return { durationMs: 0, id: 'static-world-change', intensity: 'none', visual: 'static' }
  }

  const specific = journeyTransitions[`${from.id}:${to.id}`]
  const resolved = specific ?? {
    ...genericTransition,
    id: `${genericTransition.id}-${from.transitionOut}-${to.transitionIn}`,
    visual: `${from.transitionOut}-${to.transitionIn}`,
  }

  if (preferences.transitionIntensity === 'subtle') {
    return { ...resolved, durationMs: Math.round(resolved.durationMs * 0.72), intensity: 'subtle' }
  }

  return resolved
}

export function isJourneyTransition(from: WorldId, to: WorldId) {
  return `${from}:${to}` in journeyTransitions
}
