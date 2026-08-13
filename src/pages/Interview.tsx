import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { interviewApi, ApiError } from '../lib/api'
import type { Question } from '../lib/api'
import Pill from '../components/Pill'
import Btn from '../components/Btn'

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function Interview() {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionId = (location.state as { sessionId?: number })?.sessionId

  const [questions,   setQuestions]   = useState<Question[]>([])
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [answer,      setAnswer]      = useState('')
  const [elapsed,     setElapsed]     = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [pageError,   setPageError]   = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const questionStartRef = useRef(Date.now())

  // Load questions
  useEffect(() => {
    if (!sessionId) {
      setPageError('No session selected. Please create a new session.')
      setLoading(false)
      return
    }
    interviewApi.listQuestions(sessionId)
      .then(qs => {
        if (qs.length === 0) {
          setPageError('This session has no questions yet. Add questions first.')
        }
        setQuestions(qs)
      })
      .catch(() => setPageError('Could not load questions.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  // Global elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Reset per-question timer when question changes
  useEffect(() => { questionStartRef.current = Date.now() }, [currentIdx])

  const current = questions[currentIdx]
  const total   = questions.length

  async function submitAnswer(skip = false) {
    if (!current) return
    if (!skip && !answer.trim()) { setError('Please write an answer before submitting.'); return }
    setError('')
    setSubmitting(true)
    try {
      if (!skip && answer.trim()) {
        const timeTaken = Math.round((Date.now() - questionStartRef.current) / 1000)
        await interviewApi.submitAnswer(current.id, {
          answer_text: answer.trim(),
          time_taken_seconds: timeTaken,
        })
      }

      if (currentIdx < total - 1) {
        setCurrentIdx(i => i + 1)
        setAnswer('')
      } else {
        // All done → go to results
        navigate('/results', { state: { sessionId } })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--ink-faint)' }}>
      Loading questions…
    </div>
  )

  if (pageError) return (
    <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--rust-tint)', border: '1px solid var(--rust)', borderRadius: 12, padding: '24px 28px', color: 'var(--rust)', fontSize: 14 }}>
        {pageError}
      </div>
      <Btn variant="ghost" style={{ marginTop: 20 }} onClick={() => navigate('/create')}>← Create a session</Btn>
    </div>
  )

  if (!current) return null

  const qType = current.question_type.replace('_', ' ')

  return (
    <div className="screen-enter" style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 40px 0' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Progress dots + timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((_, i) => {
              const done    = i < currentIdx
              const current = i === currentIdx
              return (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: done ? 'var(--sage)' : current ? 'var(--brass)' : 'var(--line)',
                  transform: current ? 'scale(1.4)' : 'scale(1)',
                  transition: 'all .2s ease',
                }} />
              )
            })}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, background: 'var(--paper-alt)', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⏱ {formatTime(elapsed)}
          </div>
        </div>

        {/* Question ticket */}
        <div className="ticket" style={{ padding: '38px 40px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 52, fontWeight: 600, color: 'var(--paper-alt)', lineHeight: 1, WebkitTextStroke: '1.5px var(--line)' }}>
              {String(currentIdx + 1).padStart(2, '0')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Pill style={{ textTransform: 'capitalize' }}>{qType}</Pill>
            </div>
          </div>

          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: 500, lineHeight: 1.4, marginBottom: 28 }}>
            {current.text}
          </div>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            style={{ width: '100%', minHeight: 150, border: `1px solid ${error ? 'var(--rust)' : 'var(--line)'}`, borderRadius: 11, padding: 16, fontFamily: "'Inter', sans-serif", fontSize: 14.5, background: 'var(--paper)', resize: 'vertical', outline: 'none', color: 'var(--ink)' }}
            onFocus={e => { e.target.style.outline = '2px solid var(--brass)'; e.target.style.outlineOffset = '1px'; e.target.style.borderColor = 'transparent' }}
            onBlur={e => { e.target.style.outline = 'none'; e.target.style.borderColor = error ? 'var(--rust)' : 'var(--line)' }}
          />

          {error && <p style={{ fontSize: 12.5, color: 'var(--rust)', marginTop: 8 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
              Answers are evaluated on reasoning, not just keywords.
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" onClick={() => submitAnswer(true)} disabled={submitting}>Skip</Btn>
              <Btn onClick={() => submitAnswer(false)} disabled={submitting}>
                {submitting ? 'Submitting…' : currentIdx < total - 1 ? 'Submit Answer →' : 'Finish Interview →'}
              </Btn>
            </div>
          </div>

        </div>

        {/* Progress label */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: "'IBM Plex Mono', monospace" }}>
          Question {currentIdx + 1} of {total}
        </p>
      </div>
    </div>
  )
}
