import { createContext } from 'react'

import type {
  WorldContextState,
  WorldId,
  WorldPerformanceProfile,
  WorldPreferences,
  WorldVariant,
} from './world.types.ts'

export interface WorldContextValue extends WorldContextState {
  completeTransition: () => void
  isDocumentVisible: boolean
  performanceProfile: WorldPerformanceProfile
  setActiveWorld: (world: WorldId) => void
  setPreference: <Key extends keyof WorldPreferences>(key: Key, value: WorldPreferences[Key]) => void
  setVariant: (variant: WorldVariant) => void
  startTransition: (world: WorldId) => void
}

export const WorldContext = createContext<WorldContextValue | null>(null)
