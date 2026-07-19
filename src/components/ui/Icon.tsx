import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'activity'
  | 'applications'
  | 'arrow-up-right'
  | 'automation'
  | 'check'
  | 'chevron-right'
  | 'clock'
  | 'close'
  | 'cpu'
  | 'discord'
  | 'drive'
  | 'film'
  | 'filter'
  | 'gaming'
  | 'grid'
  | 'lock'
  | 'media'
  | 'memory'
  | 'moon'
  | 'overview'
  | 'play'
  | 'plus'
  | 'power'
  | 'refresh'
  | 'restart'
  | 'search'
  | 'settings'
  | 'sparkles'
  | 'steam'
  | 'temperature'
  | 'terminal'
  | 'user'
  | 'vlc'
  | 'wave'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

const paths: Record<IconName, ReactNode> = {
  activity: <><path d="M4 12h3l2-6 4 12 2-6h5" /><path d="M4 4v16h16" /></>,
  applications: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
  automation: <><path d="M8 6h8" /><path d="M6 12h12" /><path d="M9 18h6" /><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="7" cy="18" r="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>,
  close: <><path d="m7 7 10 10" /><path d="M17 7 7 17" /></>,
  cpu: <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /><rect x="10" y="10" width="4" height="4" rx="1" /></>,
  discord: <><path d="M8 8a12 12 0 0 1 8 0l2 8a11 11 0 0 1-3 2l-1-2a8 8 0 0 1-4 0l-1 2a11 11 0 0 1-3-2Z" /><circle cx="9.5" cy="12.5" r=".8" fill="currentColor" stroke="none" /><circle cx="14.5" cy="12.5" r=".8" fill="currentColor" stroke="none" /></>,
  drive: <><path d="M5 6h14l2 10H3Z" /><path d="M6 16v2h12v-2" /><circle cx="17" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  film: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M16 5v14M4 10h4M16 10h4M4 14h4M16 14h4" /></>,
  filter: <path d="M4 6h16l-6 7v5l-4 2v-7Z" />,
  gaming: <><path d="M8 9h8a5 5 0 0 1 4.6 7l-.8 1.8a2 2 0 0 1-3.2.7L14 16h-4l-2.6 2.5a2 2 0 0 1-3.2-.7L3.4 16A5 5 0 0 1 8 9Z" /><path d="M8 12v4M6 14h4M16.5 13.5h.01M18 15h.01" /></>,
  grid: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  media: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3Z" /></>,
  memory: <><rect x="4" y="7" width="16" height="10" rx="2" /><path d="M7 10h2v4H7zM12 10h2v4h-2zM17 10v4M7 17v3M11 17v3M15 17v3M19 17v3" /></>,
  moon: <path d="M19 15a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z" />,
  overview: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
  play: <path d="m9 7 8 5-8 5Z" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  power: <><path d="M12 3v8" /><path d="M7 5.5a8 8 0 1 0 10 0" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.6-2L20 9M4 15l2.3 2a7 7 0 0 0 11.6-2" /></>,
  restart: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" /><path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7Z" /></>,
  steam: <><circle cx="9" cy="15" r="3" /><circle cx="17" cy="8" r="3" /><path d="m11.5 13.5 3-3M6.5 16.5 3 15" /></>,
  temperature: <><path d="M10 14.8V5a2 2 0 0 1 4 0v9.8a4 4 0 1 1-4 0Z" /><path d="M12 9v7" /></>,
  terminal: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  vlc: <><path d="m12 3 5 15H7Z" /><path d="M8.5 13h7M10 8h4M6 18h12v3H6z" /></>,
  wave: <path d="M3 12h3l2-6 4 12 3-10 2 4h4" />,
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        {paths[name]}
      </g>
    </svg>
  )
}
