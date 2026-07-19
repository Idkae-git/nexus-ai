import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { LaboratoryEnvironment } from './LaboratoryEnvironment.tsx'

export const laboratoryWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: false, supportsParallax: false, supportsParticles: false, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'workspace', density: 'editorial' },
  defaultVariant: { id: 'desk', label: 'Desk' },
  description: 'A calm digital workspace for focused application launching and organization.',
  environment: { Component: LaboratoryEnvironment, cssClass: 'world-environment-workspace', loadPriority: 'immediate' },
  id: 'laboratory',
  internalName: 'applications',
  motion: { animate: { opacity: 1, scale: 1, y: 0 }, durationMs: 260, exit: { opacity: 0, scale: 0.998, y: 8 }, initial: { opacity: 0, scale: 0.994, y: 12 } },
  performance: 'balanced',
  publicName: 'The Workspace',
  route: '/applications',
  transitionIn: 'workspace',
  transitionOut: 'information-flow',
  variants: [{ id: 'desk', label: 'Desk' }, { id: 'search', label: 'Search' }, { id: 'focus', label: 'Focus' }],
  visualIntensity: 0.38,
} satisfies WorldDefinition
