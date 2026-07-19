export function CoreAtmosphere() {
  return (
    <div aria-hidden="true" className="core-atmosphere world-effect-layer">
      <span className="core-horizon" />
      <span className="core-scan-line core-scan-line-one" />
      <span className="core-scan-line core-scan-line-two ambient-secondary" />
      <div className="core-particle-field ambient-particles">
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </div>
    </div>
  )
}
