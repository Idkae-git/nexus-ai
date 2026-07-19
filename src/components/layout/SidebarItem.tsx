import { NavLink } from 'react-router-dom'

import type { NavigationItem } from '../../types/navigation.js'
import { Icon } from '../ui/Icon.tsx'

interface SidebarItemProps {
  item: NavigationItem
}

export function SidebarItem({ item }: SidebarItemProps) {
  return (
    <NavLink
      className={({ isActive }) => isActive ? 'nav-item nav-item-active' : 'nav-item'}
      end={item.path === '/'}
      title={item.label}
      to={item.path}
    >
      <span className="nav-glyph"><Icon name={item.icon} size={18} /></span>
      <span className="nav-item-label">{item.label}</span>
    </NavLink>
  )
}
