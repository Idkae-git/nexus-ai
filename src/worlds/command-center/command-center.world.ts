import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { CommandCenterEnvironment } from './CommandCenterEnvironment.tsx'

export const commandCenterWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: true, supportsParallax: false, supportsParticles: false, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'terminal', density: 'operational' },
  defaultVariant: { id: 'monitoring', label: 'Monitoring' },
  description: 'A live supervision center for local audit and command history.',
  environment: { Component: CommandCenterEnvironment, cssClass: 'world-environment-command', loadPriority: 'immediate' },
  id: 'command-center',
  internalName: 'activity',
  motion: { animate: { opacity: 1, y: 0 }, durationMs: 180, exit: { opacity: 0, y: -12 }, initial: { opacity: 0, y: 14 } },
  performance: 'balanced',
  publicName: 'Command Center',
  route: '/activity',
  transitionIn: 'command',
  transitionOut: 'stream',
  variants: [{ id: 'monitoring', label: 'Monitoring' }],
  visualIntensity: 0.66,
} satisfies WorldDefinition
