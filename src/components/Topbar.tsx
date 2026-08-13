import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { label: 'Dashboard',      path: '/' },
  { label: 'Create Session', path: '/create' },
  { label: 'Interview',      path: '/interview' },
  { label: 'Results',        path: '/results' },
]

export default function Topbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Initials from user's name
  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 40px',
      borderBottom: '1px solid var(--line)',
      background: 'rgba(242,244,239,0.85)',
      backdropFilter: 'blur(6px)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>

      {/* Brand */}
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16,
          transform: 'rotate(-4deg)',
        }}>P</div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, letterSpacing: '0.2px' }}>
            Prepared
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: -2 }}>
            Assessment Studio
          </div>
        </div>
      </div>

      {/* Nav tabs — only shown when logged in */}
      {user && (
        <nav style={{
          display: 'flex', gap: 6,
          background: 'var(--paper-alt)',
          padding: 4, borderRadius: 999,
          border: '1px solid var(--line)',
        }}>
          {TABS.map(tab => {
            const active = pathname === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  padding: '9px 18px', borderRadius: 999,
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.1px',
                  border: 'none', cursor: 'pointer',
                  transition: 'all .15s ease',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--paper)' : 'var(--ink-soft)',
                  boxShadow: active ? '0 2px 6px rgba(29,43,57,0.25)' : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      )}

      {/* Right side — avatar dropdown or auth links */}
      {user ? (
        <div ref={menuRef} style={{ position: 'relative' }}>
          {/* Avatar button */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--brass-tint)',
              border: '1px solid var(--brass)',
              color: 'var(--brass-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
            }}
            title={user.full_name || user.email}
          >
            {initials}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 12, boxShadow: '0 8px 24px rgba(29,43,57,0.12)',
              minWidth: 200, overflow: 'hidden', zIndex: 99,
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {user.full_name || user.email}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                  {user.email}
                </div>
              </div>

              {/* Menu items */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--rust)',
                  fontFamily: "'Inter', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--rust-tint)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 15 }}>↩</span> Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--line)', background: 'transparent',
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              fontSize: 13, cursor: 'pointer', color: 'var(--ink)',
            }}
          >Sign in</button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: 'none', background: 'var(--ink)',
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              fontSize: 13, cursor: 'pointer', color: 'var(--paper)',
            }}
          >Get started</button>
        </div>
      )}
    </header>
  )
}
