import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Btn from '../components/Btn'

export default function Register() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register({
        email,
        first_name: firstName,
        last_name:  lastName,
        password,
        password_confirm: passwordConfirm,
      })
      login(res.user, res.tokens.access, res.tokens.refresh)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid var(--line)', borderRadius: 9,
    padding: '12px 14px', fontFamily: "'Inter', sans-serif",
    fontSize: 14, background: 'var(--paper)', color: 'var(--ink)', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5,
    letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)',
    display: 'block', marginBottom: 8,
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--ink)', color: 'var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18,
            transform: 'rotate(-4deg)',
          }}>P</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22 }}>Prepared</div>
        </div>

        {/* Card */}
        <div className="ticket" style={{ padding: '36px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: 2, color: 'var(--brass-dark)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>Get started</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600 }}>
              Create your account
            </h1>
          </div>

          {error && (
            <div style={{
              background: 'var(--rust-tint)', border: '1px solid var(--rust)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: 'var(--rust)', marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>First name</label>
                <input
                  type="text" required
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Alice"
                  style={inputStyle}
                  onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
                  onBlur={e => e.target.style.outline = 'none'}
                />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input
                  type="text"
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Smith"
                  style={inputStyle}
                  onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
                  onBlur={e => e.target.style.outline = 'none'}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
                onBlur={e => e.target.style.outline = 'none'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password" required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={inputStyle}
                onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
                onBlur={e => e.target.style.outline = 'none'}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password" required
                value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  borderColor: passwordConfirm && password !== passwordConfirm
                    ? 'var(--rust)' : 'var(--line)',
                }}
                onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
                onBlur={e => e.target.style.outline = 'none'}
              />
              {passwordConfirm && password !== passwordConfirm && (
                <p style={{ fontSize: 12, color: 'var(--rust)', marginTop: 6 }}>Passwords don't match</p>
              )}
            </div>

            <Btn
              type="submit"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </Btn>
          </form>

          <div className="ticket-perf" style={{ marginTop: 28 }} />

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brass-dark)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
