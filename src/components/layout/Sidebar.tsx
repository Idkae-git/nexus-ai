interface SidebarProps {
  coreStatus: 'connecting' | 'online' | 'offline'
}

const navItems = ['Overview', 'Activity', 'Automations', 'Settings']

export function Sidebar({ coreStatus }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">N</span>
        <div><strong>NEXUS</strong><span>CONTROL LAYER</span></div>
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <span className="nav-label">WORKSPACE</span>
        {navItems.map((item, index) => (
          <button className={index === 0 ? 'nav-item nav-item-active' : 'nav-item'} disabled={index !== 0} key={item}>
            <span className="nav-glyph" aria-hidden="true">{index === 0 ? '◫' : '·'}</span>{item}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className={`status-orb status-orb-${coreStatus}`} />
        <div><span>CORE STATUS</span><strong>{coreStatus.toUpperCase()}</strong></div>
      </div>
    </aside>
  )
}
