import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { ArcadeEnvironment } from './ArcadeEnvironment.tsx'

export const arcadeWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: true, supportsParallax: true, supportsParticles: false, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'arena', density: 'cinematic' },
  defaultVariant: { id: 'command', label: 'Command' },
  description: 'A modern gaming command center for libraries, launchers and live sessions.',
  environment: { Component: ArcadeEnvironment, cssClass: 'world-environment-arena', loadPriority: 'immediate' },
  id: 'arcade',
  internalName: 'gaming',
  motion: { animate: { filter: 'brightness(1)', opacity: 1, scale: 1, y: 0 }, durationMs: 360, exit: { filter: 'brightness(.82)', opacity: 0, scale: 1.008, y: -10 }, initial: { filter: 'brightness(.72)', opacity: 0, scale: 0.985, y: 18 } },
  performance: 'balanced',
  publicName: 'The Arena',
  route: '/gaming',
  transitionIn: 'arena',
  transitionOut: 'technical-dim',
  variants: [{ id: 'command', label: 'Command' }, { id: 'active-session', label: 'Active session' }, { id: 'focus', label: 'Focus' }],
  visualIntensity: 0.68,
} satisfies WorldDefinition
