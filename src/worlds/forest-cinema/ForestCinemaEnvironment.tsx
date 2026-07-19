import type { WorldEnvironmentProps } from '../../world-engine/world.types.ts'

export function ForestCinemaEnvironment({ performance }: WorldEnvironmentProps) {
  const fireflyCount = Math.min(10, performance.particleBudget)

  return (
    <div aria-hidden="true" className="forest-world-environment world-effect-layer">
      <span className="forest-world-fog" />
      <span className="forest-world-light" />
      <span className="forest-world-particles ambient-particles">
        {Array.from({ length: fireflyCount }, (_, index) => <i key={index} />)}
      </span>
    </div>
  )
}
