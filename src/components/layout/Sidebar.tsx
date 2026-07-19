import { NavLink } from 'react-router-dom'

import type { NavigationItem } from '../../types/navigation.js'
import { SidebarItem } from './SidebarItem.tsx'

interface SidebarProps {
  coreStatus: 'connecting' | 'online' | 'offline'
}

const navItems: NavigationItem[] = [
  { id: 'overview', label: 'Overview', path: '/', icon: 'overview' },
  { id: 'gaming', label: 'Gaming', path: '/gaming', icon: 'gaming' },
  { id: 'media', label: 'Media', path: '/media', icon: 'media' },
  { id: 'applications', label: 'Applications', path: '/applications', icon: 'applications' },
  { id: 'activity', label: 'Activity', path: '/activity', icon: 'activity' },
  { id: 'automation', label: 'Automation', path: '/automation', icon: 'automation' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'settings' },
]

export function Sidebar({ coreStatus }: SidebarProps) {
  return (
    <aside className="sidebar">
      <NavLink aria-label="NEXUS Overview" className="brand" to="/">
        <span className="brand-mark">N</span>
        <span className="brand-copy"><strong>NEXUS</strong><span>CONTROL LAYER</span></span>
      </NavLink>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <span className="nav-label">WORKSPACE</span>
        {navItems.map((item) => <SidebarItem item={item} key={item.id} />)}
      </nav>
      <div className="sidebar-footer">
        <div className={`status-orb status-orb-${coreStatus}`} />
        <div className="sidebar-status-copy"><span>CORE STATUS</span><strong>{coreStatus.toUpperCase()}</strong></div>
      </div>
    </aside>
  )
}
