import forestImage from '../../assets/media/cinematic-forest.png'

export function ForestAtmosphere() {
  return (
    <div aria-hidden="true" className="media-forest-atmosphere world-effect-layer">
      <img alt="" className="media-forest-image" src={forestImage} />
      <span className="media-forest-canopy" />
      <span className="media-forest-mist media-forest-mist-back" />
      <span className="media-forest-mist media-forest-mist-front ambient-secondary" />
      <span className="media-forest-light" />
      <span className="media-fireflies ambient-particles">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </span>
      <span className="media-leaves ambient-particles ambient-secondary">
        {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
      </span>
    </div>
  )
}
