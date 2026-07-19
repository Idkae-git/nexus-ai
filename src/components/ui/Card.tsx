import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  as?: 'article' | 'div' | 'section'
}

export function Card({ as = 'div', children, className = '' }: CardProps) {
  const classes = `card${className ? ` ${className}` : ''}`

  if (as === 'article') return <article className={classes}>{children}</article>
  if (as === 'section') return <section className={classes}>{children}</section>
  return <div className={classes}>{children}</div>
}
