export function ArenaBackground() {
  return (
    <div aria-hidden="true" className="arena-background world-effect-layer">
      <span className="arena-background-halo" />
      <span className="arena-background-panel arena-background-panel-left ambient-secondary" />
      <span className="arena-background-panel arena-background-panel-right ambient-secondary" />
      <span className="arena-background-depth" />
      <span className="arena-background-energy ambient-secondary" />
    </div>
  )
}
