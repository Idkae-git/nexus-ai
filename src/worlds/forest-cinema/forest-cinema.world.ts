import type { WorldDefinition } from '../../world-engine/world.types.ts'
import { ForestCinemaEnvironment } from './ForestCinemaEnvironment.tsx'

export const forestCinemaWorld = {
  accessibility: { supportsBackgroundEffects: true, supportsGlow: true, supportsParallax: true, supportsParticles: true, supportsStaticMode: true },
  cssAttributes: { atmosphere: 'forest', density: 'immersive' },
  defaultVariant: { id: 'mist', label: 'Mist' },
  description: 'An immersive forest clearing for films, series and personal media.',
  environment: { Component: ForestCinemaEnvironment, cssClass: 'world-environment-forest', loadPriority: 'deferred' },
  id: 'forest-cinema',
  internalName: 'media',
  motion: { animate: { filter: 'blur(0px)', opacity: 1, scale: 1, y: 0 }, durationMs: 480, exit: { filter: 'blur(5px)', opacity: 0, scale: 1.008, y: -8 }, initial: { filter: 'blur(10px)', opacity: 0, scale: 1.02, y: 18 } },
  performance: 'balanced',
  publicName: 'The Forest Cinema',
  route: '/media',
  transitionIn: 'forest',
  transitionOut: 'vegetation',
  variants: [{ id: 'mist', label: 'Mist' }, { id: 'dawn', label: 'Dawn' }, { id: 'daylight', label: 'Daylight' }, { id: 'sunset', label: 'Sunset' }, { id: 'night', label: 'Night' }],
  visualIntensity: 0.88,
} satisfies WorldDefinition
