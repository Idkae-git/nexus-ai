import type { ComponentType } from 'react'

export const WORLD_IDS = [
  'core',
  'arcade',
  'forest-cinema',
  'laboratory',
  'command-center',
  'circuit',
  'architect',
] as const

export type WorldId = typeof WORLD_IDS[number]
export type WorldPerformanceMode = 'high' | 'balanced' | 'low'
export type WorldTransitionPhase = 'idle' | 'leaving' | 'entering' | 'active'
export type WorldTransitionIntensity = 'none' | 'subtle' | 'full'

export interface WorldVariant {
  id: string
  label: string
}

export interface WorldMotionFrame {
  readonly [property: string]: number | string
}

export interface WorldMotionProfile {
  animate: WorldMotionFrame
  durationMs: number
  exit: WorldMotionFrame
  initial: WorldMotionFrame
}

export interface WorldPerformanceProfile {
  allowCanvas: boolean
  allowWebGL: boolean
  animationRate: number
  blurIntensity: number
  decorativeLayers: number
  glowIntensity: number
  mode: WorldPerformanceMode
  particleBudget: number
  shadowQuality: number
}

export interface WorldAccessibilityProfile {
  supportsBackgroundEffects: boolean
  supportsGlow: boolean
  supportsParallax: boolean
  supportsParticles: boolean
  supportsStaticMode: boolean
}

export interface WorldPreferences {
  animationsEnabled: boolean
  backgroundEffectsEnabled: boolean
  blurEnabled: boolean
  glowEnabled: boolean
  parallaxEnabled: boolean
  particlesEnabled: boolean
  performanceMode: WorldPerformanceMode
  respectReducedMotion: boolean
  staticMode: boolean
  transitionIntensity: WorldTransitionIntensity
  visualIntensity: number
}

export interface EffectiveWorldPreferences extends WorldPreferences {
  reducedMotionActive: boolean
}

export interface WorldEnvironmentProps {
  active: boolean
  performance: WorldPerformanceProfile
  preferences: EffectiveWorldPreferences
  variant: WorldVariant
}

export interface WorldEnvironmentDefinition {
  Component: ComponentType<WorldEnvironmentProps>
  cssClass: string
  loadPriority: 'immediate' | 'deferred'
}

export interface WorldTransitionDefinition {
  durationMs: number
  id: string
  intensity: WorldTransitionIntensity
  visual: string
}

export interface WorldDefinition {
  accessibility: WorldAccessibilityProfile
  cssAttributes: Readonly<Record<string, string>>
  defaultVariant: WorldVariant
  description: string
  environment: WorldEnvironmentDefinition
  id: WorldId
  internalName: string
  motion: WorldMotionProfile
  performance: WorldPerformanceMode
  publicName: string
  route: string
  transitionIn: string
  transitionOut: string
  variants: readonly WorldVariant[]
  visualIntensity: number
}

export interface WorldTransitionState {
  definition: WorldTransitionDefinition | null
  durationMs: number
  from: WorldId | null
  phase: WorldTransitionPhase
  startedAt: number | null
  to: WorldId
}

export interface WorldContextState {
  activeWorld: WorldDefinition
  performanceMode: WorldPerformanceMode
  preferences: EffectiveWorldPreferences
  previousWorld: WorldDefinition | null
  transitionState: WorldTransitionState
  variant: WorldVariant
}
