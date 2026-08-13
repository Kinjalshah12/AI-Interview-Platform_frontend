import { ReactNode, ButtonHTMLAttributes } from 'react'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  children: ReactNode
}

export default function Btn({ variant = 'primary', children, style, ...rest }: BtnProps) {
  const base: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: 13.5,
    padding: '12px 22px',
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background .15s ease',
  }

  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--ink)', color: 'var(--paper)' },
    ghost:   { background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)' },
  }

  return (
    <button style={{ ...base, ...styles[variant], ...style }} {...rest}>
      {children}
    </button>
  )
}
