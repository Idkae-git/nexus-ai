import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { CircuitEnvironment } from './CircuitEnvironment.tsx'

export const circuitWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: true, supportsParallax: false, supportsParticles: true, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'pcb', density: 'technical' },
  defaultVariant: { id: 'idle', label: 'Idle' },
  description: 'An electronic circuit canvas for future local automations.',
  environment: { Component: CircuitEnvironment, cssClass: 'world-environment-circuit', loadPriority: 'immediate' },
  id: 'circuit',
  internalName: 'automation',
  motion: { animate: { opacity: 1, scale: 1, y: 0 }, durationMs: 300, exit: { opacity: 0, scale: 0.985, y: -10 }, initial: { opacity: 0, scale: 0.97, y: 20 } },
  performance: 'balanced',
  publicName: 'The Circuit',
  route: '/automation',
  transitionIn: 'circuit',
  transitionOut: 'energy',
  variants: [{ id: 'idle', label: 'Idle' }, { id: 'running', label: 'Running' }, { id: 'success', label: 'Success' }, { id: 'failure', label: 'Failure' }],
  visualIntensity: 0.7,
} satisfies WorldDefinition
