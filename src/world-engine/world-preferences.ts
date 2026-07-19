import type { EffectiveWorldPreferences, WorldPreferences } from './world.types.ts'

export const WORLD_PREFERENCES_STORAGE_KEY = 'nexus.world-preferences.v1'

export const defaultWorldPreferences: WorldPreferences = {
  animationsEnabled: true,
  backgroundEffectsEnabled: true,
  blurEnabled: true,
  glowEnabled: true,
  parallaxEnabled: true,
  particlesEnabled: true,
  performanceMode: 'balanced',
  respectReducedMotion: true,
  staticMode: false,
  transitionIntensity: 'subtle',
  visualIntensity: 0.72,
}

export function resolveWorldPreferences(
  preferences: WorldPreferences,
  systemReducedMotion: boolean,
): EffectiveWorldPreferences {
  const reducedMotionActive = preferences.respectReducedMotion && systemReducedMotion
  if (!reducedMotionActive) return { ...preferences, reducedMotionActive: false }

  return {
    ...preferences,
    animationsEnabled: false,
    blurEnabled: false,
    glowEnabled: false,
    parallaxEnabled: false,
    particlesEnabled: false,
    staticMode: true,
    transitionIntensity: 'none',
    reducedMotionActive: true,
  }
}

export function mergeWorldPreferences(value: unknown): WorldPreferences {
  if (!value || typeof value !== 'object') return defaultWorldPreferences
  const input = value as Partial<WorldPreferences>
  const performanceModes = ['high', 'balanced', 'low'] as const
  const transitionIntensities = ['none', 'subtle', 'full'] as const

  return {
    animationsEnabled: typeof input.animationsEnabled === 'boolean' ? input.animationsEnabled : defaultWorldPreferences.animationsEnabled,
    backgroundEffectsEnabled: typeof input.backgroundEffectsEnabled === 'boolean' ? input.backgroundEffectsEnabled : defaultWorldPreferences.backgroundEffectsEnabled,
    blurEnabled: typeof input.blurEnabled === 'boolean' ? input.blurEnabled : defaultWorldPreferences.blurEnabled,
    glowEnabled: typeof input.glowEnabled === 'boolean' ? input.glowEnabled : defaultWorldPreferences.glowEnabled,
    parallaxEnabled: typeof input.parallaxEnabled === 'boolean' ? input.parallaxEnabled : defaultWorldPreferences.parallaxEnabled,
    particlesEnabled: typeof input.particlesEnabled === 'boolean' ? input.particlesEnabled : defaultWorldPreferences.particlesEnabled,
    performanceMode: performanceModes.includes(input.performanceMode as typeof performanceModes[number]) ? input.performanceMode as WorldPreferences['performanceMode'] : defaultWorldPreferences.performanceMode,
    respectReducedMotion: typeof input.respectReducedMotion === 'boolean' ? input.respectReducedMotion : defaultWorldPreferences.respectReducedMotion,
    staticMode: typeof input.staticMode === 'boolean' ? input.staticMode : defaultWorldPreferences.staticMode,
    transitionIntensity: transitionIntensities.includes(input.transitionIntensity as typeof transitionIntensities[number]) ? input.transitionIntensity as WorldPreferences['transitionIntensity'] : defaultWorldPreferences.transitionIntensity,
    visualIntensity: typeof input.visualIntensity === 'number' ? Math.min(1, Math.max(0, input.visualIntensity)) : defaultWorldPreferences.visualIntensity,
  }
}
