import { ReactNode } from 'react'

export default function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      letterSpacing: 2,
      color: 'var(--brass-dark)',
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </div>
  )
}
