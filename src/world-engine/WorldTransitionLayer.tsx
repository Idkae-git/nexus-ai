import { AnimatePresence, motion } from 'motion/react'

import { useWorld } from './world-hooks.ts'

export function WorldTransitionLayer() {
  const { activeWorld, preferences, previousWorld, transitionState } = useWorld()
  const definition = transitionState.definition
  const visible = definition && transitionState.phase !== 'idle' && definition.durationMs > 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          animate={{ opacity: 0 }}
          aria-hidden="true"
          className={`world-portal world-portal-${activeWorld.transitionIn} world-transition-${definition.visual} world-effect-layer`}
          initial={{ opacity: preferences.transitionIntensity === 'full' ? 1 : 0.72 }}
          key={`${definition.id}-${transitionState.startedAt ?? 0}`}
          transition={{ duration: definition.durationMs / 1_000, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="world-portal-field">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
          <span className="world-portal-route">{previousWorld?.publicName ?? 'NEXUS'}<b>→</b>{activeWorld.publicName}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
