import type { WorldPerformanceMode, WorldPerformanceProfile } from './world.types.ts'

export const worldPerformanceProfiles: Readonly<Record<WorldPerformanceMode, WorldPerformanceProfile>> = {
  high: {
    allowCanvas: true,
    allowWebGL: true,
    animationRate: 1,
    blurIntensity: 1,
    decorativeLayers: 4,
    glowIntensity: 1,
    mode: 'high',
    particleBudget: 24,
    shadowQuality: 1,
  },
  balanced: {
    allowCanvas: false,
    allowWebGL: false,
    animationRate: 0.72,
    blurIntensity: 0.7,
    decorativeLayers: 3,
    glowIntensity: 0.72,
    mode: 'balanced',
    particleBudget: 12,
    shadowQuality: 0.68,
  },
  low: {
    allowCanvas: false,
    allowWebGL: false,
    animationRate: 0.35,
    blurIntensity: 0,
    decorativeLayers: 1,
    glowIntensity: 0.28,
    mode: 'low',
    particleBudget: 0,
    shadowQuality: 0.22,
  },
}

export function selectWorldPerformanceMode(
  requested: WorldPerformanceMode,
  framesPerSecond: number | null,
  reducedMotion: boolean,
): WorldPerformanceMode {
  if (reducedMotion || (framesPerSecond !== null && framesPerSecond < 48)) return 'low'
  return requested
}
