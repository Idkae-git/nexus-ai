import { LogRain } from '../../components/activity/LogRain.tsx'
import { NetworkPulseField } from '../../components/activity/NetworkPulseField.tsx'

export function CommandCenterEnvironment() {
  return (
    <div aria-hidden="true" className="command-world-environment world-effect-layer">
      <LogRain />
      <NetworkPulseField />
    </div>
  )
}
