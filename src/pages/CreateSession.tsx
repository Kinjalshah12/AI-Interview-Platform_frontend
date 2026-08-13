import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewApi, ApiError } from '../lib/api'
import Eyebrow from '../components/Eyebrow'
import Btn from '../components/Btn'

const MODES = [
  { num: '01', title: 'Practice Interview',   desc: 'Role, skills & experience level' },
  { num: '02', title: 'Knowledge Assessment', desc: 'Topic-based MCQ or written' },
  { num: '03', title: 'Custom Topic',         desc: 'Describe anything, in your words' },
]

const DIFFICULTIES: { label: string; value: string }[] = [
  { label: 'Easy',   value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard',   value: 'hard' },
]

const EXPERIENCE_LEVELS: { label: string; value: string }[] = [
  { label: 'Junior (0-1 yrs)', value: 'junior' },
  { label: 'Mid (1-3 yrs)',    value: 'mid' },
  { label: 'Senior (3-6 yrs)', value: 'senior' },
  { label: 'Lead (6+ yrs)',    value: 'lead' },
]

export default function CreateSession() {
  const navigate = useNavigate()

  const [activeMode,     setActiveMode]     = useState(0)
  const [role,           setRole]           = useState('Python Backend Developer')
  const [skills,         setSkills]         = useState(['Python', 'Django', 'PostgreSQL'])
  const [newSkill,       setNewSkill]       = useState('')
  const [addingSkill,    setAddingSkill]    = useState(false)
  const [difficulty,     setDifficulty]     = useState('medium')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [questionCount,  setQuestionCount]  = useState(10)
  const [notes,          setNotes]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))
  const addSkill = () => {
    const t = newSkill.trim()
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t])
    setNewSkill(''); setAddingSkill(false)
  }

  async function handleGenerate() {
    if (!role.trim()) { setError('Please enter a role.'); return }
    if (skills.length === 0) { setError('Add at least one skill.'); return }
    setError('')
    setLoading(true)
    try {
      const session = await interviewApi.create({
        role: role.trim(),
        experience_level: experienceLevel,
        difficulty,
        skills,
      })
      navigate('/interview', { state: { sessionId: session.id } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create session.')
    } finally {
      setLoading(false)
    }
  }

  const FieldLabel = ({ children }: { children: string }) => (
    <label style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5,
      letterSpacing: 1, textTransform: 'uppercase' as const,
      color: 'var(--ink-faint)', display: 'block', marginBottom: 8,
    }}>{children}</label>
  )

  const difficultyLabel = DIFFICULTIES.find(d => d.value === difficulty)?.label ?? difficulty
  const expLabel        = EXPERIENCE_LEVELS.find(e => e.value === experienceLevel)?.label ?? experienceLevel

  return (
    <div className="screen-enter" style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 40px 0' }}>

      <div style={{ marginBottom: 28 }}>
        <Eyebrow>Step 1 of 1</Eyebrow>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, letterSpacing: '-0.3px' }}>
          Create a session
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6, maxWidth: 480 }}>
          Choose how you'd like to be tested. The AI adapts to your choice.
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {MODES.map((m, i) => {
          const active = activeMode === i
          return (
            <div key={m.num} onClick={() => setActiveMode(i)} style={{
              flex: 1, padding: '16px 18px', borderRadius: 12,
              border: `1.5px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
              background: active ? 'var(--ink)' : 'var(--card)',
              cursor: 'pointer', transition: 'all .15s ease',
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: active ? 'var(--brass)' : 'var(--brass-dark)', marginBottom: 6 }}>{m.num}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, marginBottom: 3, color: active ? 'var(--paper)' : 'var(--ink)' }}>{m.title}</div>
              <div style={{ fontSize: 12, color: active ? 'rgba(242,244,239,0.7)' : 'var(--ink-soft)' }}>{m.desc}</div>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{ background: 'var(--rust-tint)', border: '1px solid var(--rust)', borderRadius: 9, padding: '10px 14px', marginBottom: 20, color: 'var(--rust)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 26, alignItems: 'start' }}>

        {/* Form */}
        <div className="ticket" style={{ padding: 30 }}>

          {/* Role */}
          <div style={{ marginBottom: 22 }}>
            <FieldLabel>Role</FieldLabel>
            <input type="text" value={role} onChange={e => setRole(e.target.value)}
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 9, padding: '12px 14px', fontFamily: "'Inter', sans-serif", fontSize: 14, background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
              onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
              onBlur={e => e.target.style.outline = 'none'}
            />
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 22 }}>
            <FieldLabel>Skills / Topics</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map(s => (
                <div key={s} style={{ padding: '7px 13px', borderRadius: 99, background: 'var(--paper-alt)', border: '1px solid var(--line)', fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s}
                  <span onClick={() => removeSkill(s)} style={{ cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1 }}>✕</span>
                </div>
              ))}
              {addingSkill ? (
                <input autoFocus value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSkill(); if (e.key === 'Escape') setAddingSkill(false) }}
                  onBlur={addSkill}
                  style={{ padding: '7px 13px', borderRadius: 99, border: '1px dashed var(--brass)', fontSize: 12.5, background: 'var(--paper)', outline: 'none', width: 120 }}
                  placeholder="Skill name"
                />
              ) : (
                <div onClick={() => setAddingSkill(true)} style={{ padding: '7px 13px', borderRadius: 99, border: '1px dashed var(--line)', fontSize: 12.5, color: 'var(--ink-faint)', cursor: 'pointer' }}>
                  + Add skill
                </div>
              )}
            </div>
          </div>

          {/* Experience level */}
          <div style={{ marginBottom: 22 }}>
            <FieldLabel>Experience level</FieldLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXPERIENCE_LEVELS.map(e => (
                <button key={e.value}
                  onClick={() => setExperienceLevel(e.value)}
                  className={`punch${experienceLevel === e.value ? ' sel' : ''}`}
                  style={{ flex: 'none', padding: '8px 14px' }}
                >{e.label}</button>
              ))}
            </div>
          </div>

          {/* Difficulty + Question count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Difficulty</FieldLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {DIFFICULTIES.map(d => (
                  <button key={d.value} onClick={() => setDifficulty(d.value)} className={`punch${difficulty === d.value ? ' sel' : ''}`}>{d.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Question count</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--line)', borderRadius: 9, padding: '8px 14px', width: 'fit-content' }}>
                <button onClick={() => setQuestionCount(c => Math.max(1, c - 1))} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'var(--paper-alt)', fontSize: 15, cursor: 'pointer' }}>−</button>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{questionCount}</div>
                <button onClick={() => setQuestionCount(c => Math.min(20, c + 1))} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'var(--paper-alt)', fontSize: 15, cursor: 'pointer' }}>+</button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <FieldLabel>Notes for the interviewer (optional)</FieldLabel>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 9, padding: '12px 14px', fontFamily: "'Fraunces', serif", fontSize: 15, background: 'var(--paper)', color: 'var(--ink)', resize: 'vertical', minHeight: 74, outline: 'none' }}
              onFocus={e => e.target.style.outline = '2px solid var(--brass)'}
              onBlur={e => e.target.style.outline = 'none'}
              placeholder="e.g. Focus more on async views and query optimization than syntax basics."
            />
          </div>
        </div>

        {/* Preview ticket */}
        <div className="ticket" style={{ position: 'sticky', top: 100 }}>
          <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '18px 22px', borderRadius: '14px 14px 0 0' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 2, color: 'var(--brass)', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600 }}>Session Ticket</div>
          </div>
          <div style={{ padding: 22 }}>
            {[
              { label: 'Mode',       value: MODES[activeMode].title },
              { label: 'Role',       value: role || '—' },
              { label: 'Skills',     value: skills.join(', ') || '—' },
              { label: 'Level',      value: expLabel },
              { label: 'Difficulty', value: difficultyLabel },
              { label: 'Questions',  value: String(questionCount) },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--paper-alt)', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-faint)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{row.label}</span>
                <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
            <div className="ticket-perf" style={{ marginBottom: 22 }} />
            <Btn style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerate} disabled={loading}>
              {loading ? 'Creating…' : 'Generate Interview →'}
            </Btn>
          </div>
        </div>

      </div>
    </div>
  )
}
