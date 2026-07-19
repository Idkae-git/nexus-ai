export function NetworkPulseField() {
  return (
    <div aria-hidden="true" className="activity-network-field world-effect-layer">
      {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
    </div>
  )
}
