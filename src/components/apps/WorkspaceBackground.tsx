export function WorkspaceBackground() {
  return (
    <div aria-hidden="true" className="workspace-background world-effect-layer">
      <span className="workspace-background-light" />
      <span className="workspace-window workspace-window-primary ambient-secondary" />
      <span className="workspace-window workspace-window-secondary ambient-secondary" />
      <span className="workspace-window workspace-window-tertiary ambient-secondary" />
      <span className="workspace-background-grain" />
    </div>
  )
}
