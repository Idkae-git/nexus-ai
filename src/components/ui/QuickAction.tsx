import { Icon } from './Icon.tsx'
import type { IconName } from './Icon.tsx'

interface QuickActionProps {
  command: string
  description: string
  disabled: boolean
  icon: IconName
  label: string
  onExecute: (command: string) => Promise<void>
  critical?: boolean
}

export function QuickAction({
  command,
  description,
  disabled,
  icon,
  label,
  onExecute,
  critical,
}: QuickActionProps) {
  return (
    <button
      className={`quick-action-card${critical ? ' quick-action-card-critical' : ''}`}
      disabled={disabled}
      onClick={() => void onExecute(command)}
    >
      <span className="quick-action-icon"><Icon name={icon} size={19} /></span>
      <span className="quick-action-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <Icon className="quick-action-arrow" name="arrow-up-right" size={15} />
    </button>
  )
}
