import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { interviewApi } from '../lib/api'
import type { InterviewResults } from '../lib/api'
import Eyebrow from '../components/Eyebrow'
import Stamp from '../components/Stamp'
import Btn from '../components/Btn'
import SectionLabel from '../components/SectionLabel'

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return '—'
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function scoreColor(pct: number) {
  if (pct >= 80) return 'var(--sage)'
  if (pct >= 60) return 'var(--brass)'
  return 'var(--rust)'
}

export default function Results() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const sessionId  = (location.state as { sessionId?: number })?.sessionId

  const [results,  setResults]  = useState<InterviewResults | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('No session selected.')
      setLoading(false)
      return
    }
    interviewApi.results(sessionId)
      .then(setResults)
      .catch(() => setError('Could not load results.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--ink-faint)' }}>
      Loading results…
    </div>
  )

  if (error || !results) return (
    <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--rust-tint)', border: '1px solid var(--rust)', borderRadius: 12, padding: '24px 28px', color: 'var(--rust)', fontSize: 14 }}>
        {error || 'No results found.'}
      </div>
      <Btn variant="ghost" style={{ marginTop: 20 }} onClick={() => navigate('/')}>← Dashboard</Btn>
    </div>
  )

  const answeredPct = results.total_questions > 0
    ? Math.round((results.answered_count / results.total_questions) * 100)
    : 0
  const avgScore  = results.average_score !== null ? Math.round(results.average_score * 10) : null
  const hasPending = results.pending_evaluations > 0

  return (
    <div className="screen-enter" style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 40px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <Eyebrow>Session complete</Eyebrow>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, letterSpacing: '-0.3px' }}>Results</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }}>
            {results.role} · Finished in {duration(results.started_at, results.ended_at)}
          </p>
        </div>
        <Btn variant="ghost" onClick={() => navigate('/create')}>Retake Session</Btn>
      </div>

      {/* Pending notice */}
      {hasPending && (
        <div style={{ background: 'var(--brass-tint)', border: '1px solid var(--brass)', borderRadius: 10, padding: '12px 18px', marginBottom: 24, fontSize: 13, color: 'var(--brass-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⏳ {results.pending_evaluations} answer{results.pending_evaluations > 1 ? 's are' : ' is'} pending AI evaluation. Scores will appear shortly.
        </div>
      )}

      {/* Boarding pass */}
      <div style={{ marginBottom: 34 }}>
        <div className="ticket" style={{ display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '28px 30px' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>{results.role}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3, textTransform: 'capitalize' }}>
              {results.experience_level} · {results.difficulty} · {results.total_questions} Questions
            </div>
            <div style={{ display: 'flex', gap: 30, marginTop: 20 }}>
              {[
                { value: `${results.answered_count}/${results.total_questions}`, label: 'Answered' },
                { value: duration(results.started_at, results.ended_at),         label: 'Duration' },
                { value: results.skills.slice(0, 2).join(', ') || '—',           label: 'Skills' },
              ].map(stat => (
                <div key={stat.label}>
                  <b style={{ fontFamily: "'Fraunces', serif", fontSize: 22, display: 'block' }}>{stat.value}</b>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-faint)', fontFamily: "'IBM Plex Mono', monospace" }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: 170, background: 'var(--paper-alt)', borderLeft: '1.5px dashed var(--line)', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {avgScore !== null ? (
              <>
                <Stamp value={avgScore} good={avgScore >= 70} size={64} />
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.5 }}>
                  Average score
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 600, color: 'var(--ink-faint)' }}>—</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center' }}>Pending evaluation</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown by topic (answered count per question type) */}
      {results.questions.length > 0 && (() => {
        const byType: Record<string, { total: number; answered: number }> = {}
        results.questions.forEach(q => {
          if (!byType[q.question_type]) byType[q.question_type] = { total: 0, answered: 0 }
          byType[q.question_type].total++
          if (q.answer_text) byType[q.question_type].answered++
        })
        return (
          <div className="ticket" style={{ padding: '26px 30px', marginBottom: 26 }}>
            <SectionLabel style={{ marginTop: 0 }}>Breakdown by type</SectionLabel>
            {Object.entries(byType).map(([type, { total, answered }]) => {
              const pct = Math.round((answered / total) * 100)
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 150, fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{type.replace('_', ' ')}</div>
                  <div style={{ flex: 1, height: 9, background: 'var(--paper-alt)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: scoreColor(pct), borderRadius: 99, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ width: 40, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: 'var(--ink-soft)' }}>{answered}/{total}</div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Question review */}
      <SectionLabel>Question review</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
        {results.questions.map((q, i) => {
          const answered = !!q.answer_text
          const score    = q.score !== null ? Math.round(q.score * 10) : null
          const correct  = score !== null ? score >= 60 : answered

          return (
            <div key={q.id} className="ticket" style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2,
                background: !answered ? 'var(--paper-alt)' : correct ? 'var(--sage-tint)' : 'var(--rust-tint)',
                color:      !answered ? 'var(--ink-faint)' : correct ? 'var(--sage)' : 'var(--rust)',
              }}>
                {!answered ? '—' : correct ? '✓' : '✕'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Q{q.order || i + 1} — {q.text.length > 100 ? q.text.slice(0, 100) + '…' : q.text}
                </div>
                {q.answer_text && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: q.feedback ? 8 : 0 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Your answer: </span>
                    {q.answer_text.length > 200 ? q.answer_text.slice(0, 200) + '…' : q.answer_text}
                  </div>
                )}
                {q.feedback && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, padding: '8px 12px', background: 'var(--paper-alt)', borderRadius: 8, marginTop: 8 }}>
                    {q.feedback}
                  </div>
                )}
                {q.eval_status === 'pending' && q.answer_text && (
                  <div style={{ fontSize: 12, color: 'var(--brass-dark)', marginTop: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                    ⏳ Evaluation pending…
                  </div>
                )}
                {!q.answer_text && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontStyle: 'italic' }}>Not answered</div>
                )}
              </div>
              {score !== null && (
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: scoreColor(score), flexShrink: 0 }}>
                  {score}%
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
