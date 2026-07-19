import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { arcadeWorld } from '../../src/worlds/arcade/arcade.world.ts'
import { coreWorld } from '../../src/worlds/core/core.world.ts'
import { forestCinemaWorld } from '../../src/worlds/forest-cinema/forest-cinema.world.ts'
import { laboratoryWorld } from '../../src/worlds/laboratory/laboratory.world.ts'
import {
  beginWorldTransition,
  completeWorldTransition,
  createIdleTransitionState,
  setWorldTransitionPhase,
} from '../../src/world-engine/world-engine.ts'
import { selectWorldPerformanceMode } from '../../src/world-engine/world-performance.ts'
import { defaultWorldPreferences, mergeWorldPreferences, resolveWorldPreferences } from '../../src/world-engine/world-preferences.ts'
import { WorldRegistry, worldRegistry } from '../../src/world-engine/world.registry.ts'
import { useWorld } from '../../src/world-engine/world-hooks.ts'
import { isJourneyTransition, resolveWorldTransition } from '../../src/world-engine/world-transitions.ts'

function WorldConsumerOutsideProvider() {
  useWorld()
  return null
}

describe('WorldRegistry', () => {
  it('registers all Worlds and resolves routes consistently', () => {
    expect(worldRegistry.list()).toHaveLength(7)
    expect(worldRegistry.getByRoute('/gaming')?.id).toBe('arcade')
    expect(worldRegistry.getByRoute('/gaming')?.publicName).toBe('The Arena')
    expect(worldRegistry.getByRoute('/applications')?.id).toBe('laboratory')
    expect(worldRegistry.getByRoute('/applications')?.publicName).toBe('The Workspace')
    expect(worldRegistry.getByRoute('/media?source=sidebar')?.id).toBe('forest-cinema')
    expect(worldRegistry.getByRoute('/settings/')?.id).toBe('architect')
    expect(worldRegistry.has('command-center')).toBe(true)
  })

  it('keeps stable routes while exposing the redesigned World identities', () => {
    expect(arcadeWorld).toMatchObject({ environment: { cssClass: 'world-environment-arena' }, publicName: 'The Arena', route: '/gaming' })
    expect(laboratoryWorld).toMatchObject({ environment: { cssClass: 'world-environment-workspace' }, publicName: 'The Workspace', route: '/applications' })
  })

  it('rejects duplicate identifiers', () => {
    expect(() => new WorldRegistry([coreWorld, coreWorld])).toThrow(/already registered/)
  })

  it('rejects duplicate normalized routes', () => {
    expect(() => new WorldRegistry([
      coreWorld,
      { ...arcadeWorld, route: '/' },
    ])).toThrow(/route.*already registered/i)
  })
})

describe('World hooks', () => {
  it('fails explicitly outside WorldProvider', () => {
    expect(() => renderToString(createElement(WorldConsumerOutsideProvider))).toThrow(/inside WorldProvider/)
  })
})

describe('World preferences and performance', () => {
  it('uses balanced and accessible defaults', () => {
    expect(defaultWorldPreferences.performanceMode).toBe('balanced')
    expect(defaultWorldPreferences.respectReducedMotion).toBe(true)
    expect(defaultWorldPreferences.transitionIntensity).toBe('subtle')
  })

  it('sanitizes persisted preference values', () => {
    const preferences = mergeWorldPreferences({ performanceMode: 'ultra', visualIntensity: 4 })
    expect(preferences.performanceMode).toBe('balanced')
    expect(preferences.visualIntensity).toBe(1)
  })

  it('converts the engine to static mode for reduced motion', () => {
    const preferences = resolveWorldPreferences(defaultWorldPreferences, true)
    expect(preferences).toMatchObject({
      animationsEnabled: false,
      blurEnabled: false,
      glowEnabled: false,
      particlesEnabled: false,
      reducedMotionActive: true,
      staticMode: true,
      transitionIntensity: 'none',
    })
  })

  it('selects low mode when rendering is constrained', () => {
    expect(selectWorldPerformanceMode('high', 42, false)).toBe('low')
    expect(selectWorldPerformanceMode('high', 60, true)).toBe('low')
    expect(selectWorldPerformanceMode('high', 60, false)).toBe('high')
  })
})

describe('World transitions', () => {
  it('selects a journey transition and a generic fallback', () => {
    const fullPreferences = { ...defaultWorldPreferences, transitionIntensity: 'full' as const }
    expect(isJourneyTransition('core', 'arcade')).toBe(true)
    expect(resolveWorldTransition(coreWorld, arcadeWorld, fullPreferences).id).toBe('core-to-arcade')
    expect(resolveWorldTransition(coreWorld, forestCinemaWorld, fullPreferences).id).toContain('generic-world-fade')
  })

  it('changes World through explicit phases and cleans completed state', () => {
    const definition = resolveWorldTransition(
      coreWorld,
      arcadeWorld,
      { ...defaultWorldPreferences, transitionIntensity: 'full' },
    )
    const leaving = beginWorldTransition('core', 'arcade', definition, 1_234)
    const entering = setWorldTransitionPhase(leaving, 'entering')
    const active = setWorldTransitionPhase(entering, 'active')
    const completed = completeWorldTransition(active)

    expect(leaving).toMatchObject({ from: 'core', phase: 'leaving', to: 'arcade' })
    expect(entering.phase).toBe('entering')
    expect(active.phase).toBe('active')
    expect(completed).toEqual(createIdleTransitionState('arcade'))
  })

  it('skips animated phases when animations are disabled', () => {
    const staticDefinition = resolveWorldTransition(
      coreWorld,
      arcadeWorld,
      { ...defaultWorldPreferences, animationsEnabled: false },
    )
    expect(beginWorldTransition('core', 'arcade', staticDefinition, 1)).toMatchObject({
      durationMs: 0,
      phase: 'active',
    })
  })
})
