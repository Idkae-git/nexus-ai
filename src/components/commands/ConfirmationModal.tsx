import { motion } from 'motion/react'

import type { PendingConfirmation } from '../../NexusApp.tsx'
import { Icon } from '../ui/Icon.tsx'

interface ConfirmationModalProps {
  pending: PendingConfirmation
  isResolving: boolean
  onConfirm: () => Promise<void>
  onCancel: () => Promise<void>
}

const commandCopy: Record<string, { title: string; description: string; icon: 'lock' | 'moon' | 'restart' | 'power' }> = {
  'system.lock': {
    title: 'Lock this session?',
    description: 'Windows will return to the sign-in screen. Running applications will remain open.',
    icon: 'lock',
  },
  'system.sleep': {
    title: 'Put this system to sleep?',
    description: 'The device will suspend and network activity may be interrupted.',
    icon: 'moon',
  },
  'system.restart': {
    title: 'Restart this system?',
    description: 'Windows will restart immediately. Save any open work before continuing.',
    icon: 'restart',
  },
  'system.shutdown': {
    title: 'Shut down this system?',
    description: 'The computer will power off immediately. Unsaved work may be lost.',
    icon: 'power',
  },
}

export function ConfirmationModal({ pending, isResolving, onConfirm, onCancel }: ConfirmationModalProps) {
  const copy = commandCopy[pending.command] ?? {
    title: 'Execute this command?',
    description: 'This operation requires explicit confirmation.',
    icon: 'activity' as const,
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="confirmation-backdrop"
      initial={{ opacity: 0 }}
      role="presentation"
    >
      <motion.section
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby="confirmation-title"
        aria-modal="true"
        className="confirmation-modal"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        role="dialog"
        transition={{ duration: 0.2 }}
      >
        <span className="modal-icon"><Icon name={copy.icon} size={20} /></span>
        <span className="eyebrow">EXPLICIT CONFIRMATION</span>
        <h2 id="confirmation-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <dl className="confirmation-details">
          <div><dt>COMMAND</dt><dd>{pending.command}</dd></div>
          <div><dt>TARGET</dt><dd>{pending.target.type}</dd></div>
          <div><dt>SOURCE</dt><dd>{pending.source}</dd></div>
        </dl>
        <div className="confirmation-actions">
          <button className="secondary-soft-button" disabled={isResolving} onClick={() => void onCancel()}>Cancel</button>
          <button className="primary-confirm-button" disabled={isResolving} onClick={() => void onConfirm()}>
            {isResolving ? 'Executing…' : 'Confirm action'}
          </button>
        </div>
      </motion.section>
    </motion.div>
  )
}
