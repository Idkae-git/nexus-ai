import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { worldRegistry } from './world.registry.ts'
import { WorldContext } from './world-context.ts'
import {
  beginWorldTransition,
  completeWorldTransition as createCompletedTransition,
  createIdleTransitionState,
  setWorldTransitionPhase,
} from './world-engine.ts'
import { selectWorldPerformanceMode, worldPerformanceProfiles } from './world-performance.ts'
import {
  defaultWorldPreferences,
  mergeWorldPreferences,
  resolveWorldPreferences,
  WORLD_PREFERENCES_STORAGE_KEY,
} from './world-preferences.ts'
import { resolveWorldTransition } from './world-transitions.ts'
import type { WorldId, WorldPreferences, WorldVariant } from './world.types.ts'

function loadPreferences() {
  try {
    const stored = window.localStorage.getItem(WORLD_PREFERENCES_STORAGE_KEY)
    return stored ? mergeWorldPreferences(JSON.parse(stored)) : defaultWorldPreferences
  } catch {
    return defaultWorldPreferences
  }
}

export function WorldProvider({ children }: PropsWithChildren) {
  const [activeWorldId, setActiveWorldId] = useState<WorldId>('core')
  const [previousWorldId, setPreviousWorldId] = useState<WorldId | null>(null)
  const [preferences, setPreferences] = useState<WorldPreferences>(loadPreferences)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)
  const [measuredFramesPerSecond, setMeasuredFramesPerSecond] = useState<number | null>(null)
  const [isDocumentVisible, setIsDocumentVisible] = useState(document.visibilityState === 'visible')
  const [variant, setVariant] = useState<WorldVariant>(worldRegistry.getById('core').defaultVariant)
  const [transitionState, setTransitionState] = useState(() => createIdleTransitionState('core'))
  const activeWorldIdRef = useRef(activeWorldId)
  const transitionTimers = useRef<number[]>([])

  const activeWorld = worldRegistry.getById(activeWorldId)
  const previousWorld = previousWorldId ? worldRegistry.getById(previousWorldId) : null
  const effectivePreferences = useMemo(
    () => resolveWorldPreferences(preferences, systemReducedMotion),
    [preferences, systemReducedMotion],
  )
  const activePreferences = useMemo(() => ({
    ...effectivePreferences,
    backgroundEffectsEnabled: effectivePreferences.backgroundEffectsEnabled && activeWorld.accessibility.supportsBackgroundEffects,
    glowEnabled: effectivePreferences.glowEnabled && activeWorld.accessibility.supportsGlow,
    parallaxEnabled: effectivePreferences.parallaxEnabled && activeWorld.accessibility.supportsParallax,
    particlesEnabled: effectivePreferences.particlesEnabled && activeWorld.accessibility.supportsParticles,
  }), [activeWorld.accessibility, effectivePreferences])
  const performanceMode = selectWorldPerformanceMode(
    preferences.performanceMode,
    measuredFramesPerSecond,
    effectivePreferences.reducedMotionActive,
  )
  const performanceProfile = worldPerformanceProfiles[performanceMode]

  const cancelTransitionTimers = useCallback(() => {
    for (const timer of transitionTimers.current) window.clearTimeout(timer)
    transitionTimers.current = []
  }, [])

  const completeTransition = useCallback(() => {
    cancelTransitionTimers()
    setTransitionState((current) => createCompletedTransition(current))
  }, [cancelTransitionTimers])

  const setActiveWorld = useCallback((world: WorldId) => {
    const current = activeWorldIdRef.current
    const target = worldRegistry.getById(world)
    cancelTransitionTimers()
    if (current !== world) setPreviousWorldId(current)
    activeWorldIdRef.current = world
    setActiveWorldId(world)
    setVariant(target.defaultVariant)
    setTransitionState(createIdleTransitionState(world))
  }, [cancelTransitionTimers])

  const startTransition = useCallback((world: WorldId) => {
    const current = activeWorldIdRef.current
    if (current === world) return

    const from = worldRegistry.getById(current)
    const to = worldRegistry.getById(world)
    const definition = resolveWorldTransition(from, to, effectivePreferences)
    cancelTransitionTimers()
    setPreviousWorldId(current)
    activeWorldIdRef.current = world
    setActiveWorldId(world)
    setVariant(to.defaultVariant)
    setTransitionState(beginWorldTransition(current, world, definition, Date.now()))

    if (definition.durationMs === 0) {
      setTransitionState(createIdleTransitionState(world))
      return
    }

    transitionTimers.current = [
      window.setTimeout(() => setTransitionState((state) => setWorldTransitionPhase(state, 'entering')), definition.durationMs * 0.28),
      window.setTimeout(() => setTransitionState((state) => setWorldTransitionPhase(state, 'active')), definition.durationMs * 0.78),
      window.setTimeout(() => setTransitionState((state) => createCompletedTransition(state)), definition.durationMs),
    ]
  }, [cancelTransitionTimers, effectivePreferences])

  const setPreference = useCallback(<Key extends keyof WorldPreferences>(key: Key, value: WorldPreferences[Key]) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const synchronize = () => setSystemReducedMotion(mediaQuery.matches)
    synchronize()
    mediaQuery.addEventListener('change', synchronize)
    return () => mediaQuery.removeEventListener('change', synchronize)
  }, [])

  useEffect(() => {
    const synchronize = () => setIsDocumentVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', synchronize)
    return () => document.removeEventListener('visibilitychange', synchronize)
  }, [])

  useEffect(() => {
    if (!activePreferences.animationsEnabled || !isDocumentVisible) return
    let animationFrame = 0
    let frames = 0
    let startTime = 0

    const sampleFrameRate = (timestamp: number) => {
      if (startTime === 0) startTime = timestamp
      frames += 1
      const elapsed = timestamp - startTime
      if (elapsed < 2_400) {
        animationFrame = window.requestAnimationFrame(sampleFrameRate)
        return
      }
      setMeasuredFramesPerSecond(frames / (elapsed / 1_000))
    }

    animationFrame = window.requestAnimationFrame(sampleFrameRate)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [activePreferences.animationsEnabled, activeWorldId, isDocumentVisible])

  useEffect(() => {
    try {
      window.localStorage.setItem(WORLD_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Preferences remain available for the current session when storage is unavailable.
    }
  }, [preferences])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.activeWorld = activeWorld.id
    root.dataset.effectsAnimations = activePreferences.animationsEnabled && isDocumentVisible ? 'on' : 'off'
    root.dataset.effectsBackgrounds = activePreferences.backgroundEffectsEnabled ? 'on' : 'off'
    root.dataset.effectsParallax = activePreferences.parallaxEnabled ? 'on' : 'off'
    root.dataset.effectsParticles = activePreferences.particlesEnabled ? 'on' : 'off'
    root.dataset.effectsQuality = performanceMode === 'low' ? 'reduced' : 'full'
    root.dataset.worldBlur = activePreferences.blurEnabled ? 'on' : 'off'
    root.dataset.worldGlow = activePreferences.glowEnabled ? 'on' : 'off'
    root.dataset.worldPaused = isDocumentVisible ? 'false' : 'true'
    root.dataset.worldPerformance = performanceMode
    root.dataset.worldTransition = transitionState.phase
    root.style.setProperty('--world-visual-intensity', String(activePreferences.visualIntensity * activeWorld.visualIntensity))
    root.style.setProperty('--world-animation-rate', String(performanceProfile.animationRate))
    root.style.setProperty('--world-glow-intensity', String(performanceProfile.glowIntensity))
    root.style.setProperty('--world-blur-intensity', String(performanceProfile.blurIntensity))
  }, [activePreferences, activeWorld, isDocumentVisible, performanceMode, performanceProfile, transitionState.phase])

  useEffect(() => () => cancelTransitionTimers(), [cancelTransitionTimers])

  const value = useMemo(() => ({
    activeWorld,
    completeTransition,
    isDocumentVisible,
    performanceMode,
    performanceProfile,
    preferences: activePreferences,
    previousWorld,
    setActiveWorld,
    setPreference,
    setVariant,
    startTransition,
    transitionState,
    variant,
  }), [activePreferences, activeWorld, completeTransition, isDocumentVisible, performanceMode, performanceProfile, previousWorld, setActiveWorld, setPreference, startTransition, transitionState, variant])

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
}
