import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { ArchitectEnvironment } from './ArchitectEnvironment.tsx'

export const architectWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: false, supportsParallax: false, supportsParticles: false, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'architectural', density: 'quiet' },
  defaultVariant: { id: 'calm', label: 'Calm' },
  description: 'A calm architectural plane for local preferences.',
  environment: { Component: ArchitectEnvironment, cssClass: 'world-environment-architect', loadPriority: 'immediate' },
  id: 'architect',
  internalName: 'settings',
  motion: { animate: { opacity: 1 }, durationMs: 100, exit: { opacity: 0 }, initial: { opacity: 0 } },
  performance: 'low',
  publicName: 'The Architect',
  route: '/settings',
  transitionIn: 'architect',
  transitionOut: 'blueprint',
  variants: [{ id: 'calm', label: 'Calm' }],
  visualIntensity: 0.28,
} satisfies WorldDefinition
