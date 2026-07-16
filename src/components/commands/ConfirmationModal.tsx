import type { PendingConfirmation } from '../../NexusApp.tsx'

interface ConfirmationModalProps {
  pending: PendingConfirmation
  isResolving: boolean
  onConfirm: () => Promise<void>
  onCancel: () => Promise<void>
}

const commandCopy: Record<string, { title: string; description: string }> = {
  'system.lock': { title: 'Lock this session?', description: 'Windows will return to the sign-in screen. Running applications will remain open.' },
  'system.sleep': { title: 'Put this system to sleep?', description: 'The device will suspend and network activity may be interrupted.' },
  'system.restart': { title: 'Restart this system?', description: 'Windows will restart immediately. Save any open work before continuing.' },
  'system.shutdown': { title: 'Shut down this system?', description: 'The computer will power off immediately. Unsaved work may be lost.' },
}

export function ConfirmationModal({ pending, isResolving, onConfirm, onCancel }: ConfirmationModalProps) {
  const copy = commandCopy[pending.command] ?? { title: 'Execute this command?', description: 'This operation requires explicit confirmation.' }

  return (
    <div className="confirmation-backdrop" role="presentation">
      <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
        <span className="modal-icon" aria-hidden="true">!</span>
        <span className="eyebrow">CRITICAL CONFIRMATION</span>
        <h2 id="confirmation-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <dl className="confirmation-details">
          <div><dt>COMMAND</dt><dd>{pending.command}</dd></div>
          <div><dt>TARGET</dt><dd>{pending.target.type}</dd></div>
          <div><dt>SOURCE</dt><dd>{pending.source}</dd></div>
        </dl>
        <div className="confirmation-actions">
          <button className="secondary-button" disabled={isResolving} onClick={() => void onCancel()}>Cancel</button>
          <button className="primary-button" disabled={isResolving} onClick={() => void onConfirm()}>{isResolving ? 'Executing…' : 'Confirm action'}</button>
        </div>
      </section>
    </div>
  )
}
