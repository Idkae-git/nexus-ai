import { useContext, useLayoutEffect } from 'react'

import { WorldContext } from './world-context.ts'
import { worldRegistry } from './world.registry.ts'

export function useWorld() {
  const context = useContext(WorldContext)
  if (!context) throw new Error('World hooks must be used inside WorldProvider.')
  return context
}

export function useActiveWorld() {
  return useWorld().activeWorld
}

export function useWorldPreferences() {
  const { preferences, setPreference } = useWorld()
  return { preferences, setPreference }
}

export function useWorldTransition() {
  const { completeTransition, previousWorld, startTransition, transitionState } = useWorld()
  return { completeTransition, previousWorld, startTransition, transitionState }
}

export function useWorldPerformance() {
  const { performanceMode, performanceProfile } = useWorld()
  return { performanceMode, performanceProfile }
}

export function useWorldRoute(pathname: string) {
  const { startTransition } = useWorld()

  useLayoutEffect(() => {
    const world = worldRegistry.getByRoute(pathname) ?? worldRegistry.getById('core')
    startTransition(world.id)
  }, [pathname, startTransition])
}
