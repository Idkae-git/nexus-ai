import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { CoreEnvironment } from './CoreEnvironment.tsx'

export const coreWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: true, supportsParallax: true, supportsParticles: true, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'holographic', density: 'analytical' },
  defaultVariant: { id: 'nominal', label: 'Nominal' },
  description: 'Analytical mission control for the local NEXUS Core.',
  environment: { Component: CoreEnvironment, cssClass: 'world-environment-core', loadPriority: 'immediate' },
  id: 'core',
  internalName: 'overview',
  motion: { animate: { opacity: 1, y: 0 }, durationMs: 160, exit: { opacity: 0, y: 3 }, initial: { opacity: 0, y: 6 } },
  performance: 'balanced',
  publicName: 'The Core',
  route: '/',
  transitionIn: 'core',
  transitionOut: 'hologram',
  variants: [{ id: 'nominal', label: 'Nominal' }, { id: 'warning', label: 'Warning' }, { id: 'critical', label: 'Critical' }, { id: 'focus', label: 'Focus' }],
  visualIntensity: 0.58,
} satisfies WorldDefinition
