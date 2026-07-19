import { Card } from '../ui/Card.tsx'
import { Icon } from '../ui/Icon.tsx'
import type { IconName } from '../ui/Icon.tsx'

interface WorkflowCardProps {
  description: string
  icon: IconName
  index: number
  title: string
}

export function WorkflowCard({ description, icon, index, title }: WorkflowCardProps) {
  return (
    <Card as="article" className="routine-card">
      <span className="routine-index">{String(index).padStart(2, '0')}</span>
      <span className="routine-icon"><Icon name={icon} size={19} /></span>
      <small>ROUTINE TEMPLATE</small>
      <strong>{title}</strong>
      <p>{description}</p>
      <button aria-label={`Open ${title} routine`} disabled><Icon name="chevron-right" size={14} /></button>
    </Card>
  )
}
