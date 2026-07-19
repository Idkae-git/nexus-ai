import type { ReactNode } from 'react'

interface MediaShelfProps {
  children: ReactNode
  count: string
  eyebrow: string
  title: string
}

export function MediaShelf({ children, count, eyebrow, title }: MediaShelfProps) {
  return (
    <section className="media-shelf">
      <header className="media-shelf-header">
        <div><span>{eyebrow}</span><h2>{title}</h2></div>
        <small>{count}</small>
      </header>
      <div className="media-shelf-track">{children}</div>
    </section>
  )
}
