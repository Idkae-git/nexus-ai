import { AnimatePresence, motion } from 'motion/react'

import { useWorld } from './world-hooks.ts'

export function WorldEnvironmentHost() {
  const { activeWorld, isDocumentVisible, performanceProfile, preferences, variant } = useWorld()
  const Environment = activeWorld.environment.Component
  const animationsEnabled = preferences.animationsEnabled && isDocumentVisible
  const duration = animationsEnabled ? 0.42 : 0
  const delay = activeWorld.environment.loadPriority === 'deferred' && animationsEnabled ? 0.08 : 0

  return (
    <div
      aria-hidden="true"
      className={`world-environment-host ${activeWorld.environment.cssClass}`}
      data-atmosphere={activeWorld.cssAttributes.atmosphere}
      data-variant={variant.id}
      data-world-id={activeWorld.id}
    >
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: preferences.backgroundEffectsEnabled ? 1 : 0 }}
          className="world-environment-layer"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={activeWorld.id}
          transition={{ delay, duration, ease: [0.22, 1, 0.36, 1] }}
        >
          <Environment active performance={performanceProfile} preferences={preferences} variant={variant} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
