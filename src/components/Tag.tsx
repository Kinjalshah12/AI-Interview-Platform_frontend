import { ReactNode } from 'react'

interface TagProps {
  children: ReactNode
  variant?: 'sage' | 'brass' | 'rust' | 'default'
  style?: React.CSSProperties
}

const variants = {
  sage:    { background: 'var(--sage-tint)',  color: 'var(--sage)' },
  brass:   { background: 'var(--brass-tint)', color: 'var(--brass-dark)' },
  rust:    { background: 'var(--rust-tint)',  color: 'var(--rust)' },
  default: { background: 'var(--paper-alt)',  color: 'var(--ink-soft)' },
}

export default function Tag({ children, variant = 'sage', style }: TagProps) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10.5,
      letterSpacing: 1,
      textTransform: 'uppercase',
      padding: '4px 9px',
      borderRadius: 5,
      fontWeight: 600,
      ...variants[variant],
      ...style,
    }}>
      {children}
    </span>
  )
}
