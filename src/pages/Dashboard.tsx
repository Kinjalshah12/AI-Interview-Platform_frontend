import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewApi } from '../lib/api'
import type { InterviewSession } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Eyebrow from '../components/Eyebrow'
import Stamp from '../components/Stamp'
import Tag from '../components/Tag'
import Pill from '../components/Pill'
import Btn from '../components/Btn'
import SectionLabel from '../components/SectionLabel'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0)  return `${mins}m ago`
  return 'just now'
}

function difficultyColor(d: string) {
  if (d === 'hard')   return { bg: 'var(--rust-tint)',  text: 'var(--rust)' }
  if (d === 'easy')   return { bg: 'var(--sage-tint)',  text: 'var(--sage)' }
  return                     { bg: 'var(--brass-tint)', text: 'var(--brass-dark)' }
}

function greet(name: string): string {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name}.`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sessions, setSessions]   = useState<InterviewSession[]>([])
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState('')

  useEffect(() => {
    interviewApi.list()
      .then(setSessions)
      .catch(() => setError('Could not load sessions.'))
      .finally(() => setLoading(false))
  }, [])

  // In-progress session (most recent one with status in_progress)
  const inProgress = sessions.find(s => s.status === 'in_progress')

  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="screen-enter" style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 40px 0' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <Eyebrow>Welcome back</Eyebrow>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, letterSpacing: '-0.3px' }}>
            {greet(firstName)}
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6, maxWidth: 480 }}>
            {sessions.length > 0
              ? `You have ${sessions.length} session${sessions.length > 1 ? 's' : ''} total.${inProgress ? ' One is still in progress.' : ''}`
              : 'Start your first interview session below.'}
          </p>
        </div>
        <Btn onClick={() => navigate('/create')}>＋ New Session</Btn>
      </div>

      {/* In-progress card */}
      {inProgress && (
        <div className="ticket" style={{
          padding: '26px 30px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 34, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: -6, top: 14,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 70, fontWeight: 600,
            color: 'var(--paper-alt)', zIndex: 0, letterSpacing: 2,
            userSelect: 'none', pointerEvents: 'none',
          }}>CONTINUE</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Tag variant="sage">In progress</Tag>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 600, marginBottom: 4, marginTop: 10 }}>
              {inProgress.role}
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
              {inProgress.question_count} question{inProgress.question_count !== 1 ? 's' : ''} · {inProgress.difficulty} difficulty
            </p>
            <div className="progress-track" style={{ width: 220, marginTop: 12 }}>
              <div className="progress-fill" style={{ width: '60%' }} />
            </div>
          </div>

          <Btn variant="ghost" style={{ position: 'relative', zIndex: 1 }}
            onClick={() => navigate('/interview', { state: { sessionId: inProgress.id } })}>
            Resume →
          </Btn>
        </div>
      )}

      {/* Loading / error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-faint)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
          Loading sessions…
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--rust-tint)', border: '1px solid var(--rust)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: 'var(--rust)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Sessions grid */}
      {!loading && (
        <>
          <SectionLabel>
            {sessions.length > 0 ? 'Recent sessions' : 'No sessions yet'}
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>

            {sessions.slice(0, 9).map(s => {
              const { bg, text } = difficultyColor(s.difficulty)
              return (
                <div
                  key={s.id}
                  className="ticket"
                  onClick={() => navigate('/results', { state: { sessionId: s.id } })}
                  style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 24px rgba(29,43,57,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 2px rgba(29,43,57,0.04)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16.5, maxWidth: 160 }}>{s.role}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, textTransform: 'capitalize' }}>
                        {s.experience_level} · {s.difficulty}
                      </div>
                    </div>
                    {s.status === 'completed' ? (
                      <Stamp value="✓" good size={46} />
                    ) : s.status === 'in_progress' ? (
                      <Tag variant="sage">Active</Tag>
                    ) : (
                      <Pill style={{ background: bg, color: text }}>{s.difficulty}</Pill>
                    )}
                  </div>
                  <div className="ticket-perf" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-faint)' }}>
                    <Pill>{s.question_count} q</Pill>
                    <span>{timeAgo(s.created_at)}</span>
                  </div>
                </div>
              )
            })}

            {/* New session card */}
            <div
              onClick={() => navigate('/create')}
              style={{
                border: '1.5px dashed var(--line)', borderRadius: 'var(--radius)',
                padding: 20, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                color: 'var(--ink-faint)', cursor: 'pointer', minHeight: 150,
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brass)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--brass-dark)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--ink-faint)' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Start a new session</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
