import { Icon } from '../ui/Icon.tsx'
import type { IconName } from '../ui/Icon.tsx'

interface WorkflowNodeProps {
  className: string
  description: string
  icon: IconName
  label: string
  state: string
}

export function WorkflowNode({ className, description, icon, label, state }: WorkflowNodeProps) {
  return (
    <article className={`workflow-node ${className}`}>
      <header><span><Icon name={icon} size={17} /></span><small>{state}</small></header>
      <strong>{label}</strong>
      <p>{description}</p>
      <i className="workflow-port workflow-port-in" />
      <i className="workflow-port workflow-port-out" />
    </article>
  )
}
