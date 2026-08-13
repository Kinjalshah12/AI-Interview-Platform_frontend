import { ReactNode } from 'react'

export default function SectionLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      margin: '30px 0 14px',
      ...style,
    }}>
      {children}
    </div>
  )
}
