import { ReactNode } from 'react'

export default function Pill({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      padding: '3px 9px',
      borderRadius: 99,
      background: 'var(--paper-alt)',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--ink-soft)',
      ...style,
    }}>
      {children}
    </span>
  )
}
