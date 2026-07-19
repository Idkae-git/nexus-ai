export function CircuitAtmosphere() {
  return (
    <svg aria-hidden="true" className="circuit-atmosphere world-effect-layer" preserveAspectRatio="none" viewBox="0 0 1200 800">
      <path d="M0 180 H220 V90 H470 V250 H710" />
      <path d="M1200 150 H930 V330 H760 V520 H490" />
      <path d="M0 640 H180 V510 H360 V700 H650 V610 H880" />
      <g className="ambient-particles">
        <circle cx="220" cy="180" r="4" /><circle cx="470" cy="90" r="4" />
        <circle cx="930" cy="150" r="4" /><circle cx="760" cy="330" r="4" />
        <circle cx="180" cy="640" r="4" /><circle cx="650" cy="700" r="4" />
      </g>
    </svg>
  )
}
