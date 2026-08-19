/**
 * Centralised API client.
 *
 * Every request that needs auth gets an `Authorization: Bearer <token>`
 * header injected automatically.
 *
 * Token storage:
 *   - access  token → localStorage (short-lived, 60 min)
 *   - refresh token → localStorage (7 days)
 *
 * If an access token is expired the client transparently calls
 * /api/auth/refresh/ with the refresh token, updates storage, and
 * retries the original request once.
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// ── Standard API envelope ────────────────────────────────────────────────────
export type ApiEnvelope<T = unknown> = {
  success: boolean
  status: number
  message: string
  data: T
}

/** Extract an array from envelope data (plain array or paginated/named wrapper). */
function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of ['results', 'sessions', 'interviews', 'questions', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
  }
  return []
}

/** Extract a single object from envelope data (direct or nested under a key). */
function asObject<T>(data: unknown, keys: string[] = []): T {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of keys) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        return obj[key] as T
      }
    }
  }
  return data as T
}

function normalizeAuthResponse(data: unknown): AuthResponse {
  const d = (data ?? {}) as Record<string, unknown>
  const user = (d.user ?? d) as User
  const tokensObj = (d.tokens ?? d) as Record<string, unknown>
  const access  = (tokensObj.access  ?? d.access)  as string | undefined
  const refresh = (tokensObj.refresh ?? d.refresh) as string | undefined
  if (!user?.email || !access || !refresh) {
    throw new ApiError(500, 'Invalid authentication response from server.')
  }
  return { user, tokens: { access, refresh } }
}

function normalizeUser(data: unknown): User {
  return asObject<User>(data, ['user'])
}

// ── Demo credentials bypass ──────────────────────────────────────────────────
// Temporary: allows login without a running backend.
// Remove once the real DB is set up.
const DEMO_EMAIL    = 'kinjal@yopmail.com'
const DEMO_PASSWORD = '12345678'
const DEMO_TOKEN    = 'demo-access-token-kinjal'
const DEMO_REFRESH  = 'demo-refresh-token-kinjal'

// ── Token helpers ────────────────────────────────────────────────────────────
export const tokens = {
  getAccess:      ()    => localStorage.getItem('access_token'),
  getRefresh:     ()    => localStorage.getItem('refresh_token'),
  setAccess:      (t: string) => localStorage.setItem('access_token', t),
  setRefresh:     (t: string) => localStorage.setItem('refresh_token', t),
  setTokens:      (a: string, r: string) => { tokens.setAccess(a); tokens.setRefresh(r) },
  clearTokens:    ()    => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token') },
  setUser:        (u: object) => localStorage.setItem('user', JSON.stringify(u)),
  getUser:        ()    => { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null },
  clearUser:      ()    => localStorage.removeItem('user'),
  clearAll:       ()    => { tokens.clearTokens(); tokens.clearUser() },
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const access = tokens.getAccess()
  if (access) headers['Authorization'] = `Bearer ${access}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // ── Transparent token refresh ────────────────────────────────────────────
  if (res.status === 401 && retry) {
    const refresh = tokens.getRefresh()
    if (!refresh) throw new ApiError(401, 'Session expired. Please log in again.')

    // Demo session — don't try to refresh against the real API
    if (refresh === DEMO_REFRESH) {
      tokens.clearAll()
      throw new ApiError(401, 'Demo session expired. Please log in again.')
    }

    const refreshRes = await fetch(`${BASE}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!refreshRes.ok) {
      tokens.clearAll()
      throw new ApiError(401, 'Session expired. Please log in again.')
    }

    const refreshJson = await refreshRes.json()
    const refreshData = (refreshJson?.data ?? refreshJson) as Record<string, unknown>
    const tokensObj   = (refreshData.tokens ?? refreshData) as Record<string, unknown>
    const newAccess: string  = (tokensObj.access  ?? refreshData.access)  as string
    const newRefresh: string = (tokensObj.refresh ?? refreshData.refresh) as string
    tokens.setAccess(newAccess)
    if (newRefresh) tokens.setRefresh(newRefresh)

    // Retry original request once with new access token
    return request<T>(method, path, body, false)
  }

  // ── Parse response ───────────────────────────────────────────────────────
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      // Support both envelope format { message } and legacy field formats
      detail = json?.message
        ?? json?.detail
        ?? json?.non_field_errors?.[0]
        ?? Object.values(json)?.[0]
        ?? detail
      if (Array.isArray(detail)) detail = detail[0]
    } catch { /* ignore */ }
    throw new ApiError(res.status, String(detail))
  }

  if (res.status === 204) return undefined as T

  // Unwrap the standard API envelope: { success, status, message, data }
  const envelope = await res.json()
  if (envelope?.success === false) {
    throw new ApiError(envelope.status ?? res.status, envelope.message ?? 'Request failed')
  }
  return (envelope?.data !== undefined ? envelope.data : envelope) as T
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Typed API methods ────────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string)                      => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown)      => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown)      => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body?: unknown)      => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                      => request<T>('DELETE', path),
}

// ── Auth API calls ───────────────────────────────────────────────────────────
export type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  created_at: string
}

export type AuthResponse = {
  user: User
  tokens: { access: string; refresh: string }
}

const DEMO_USER: User = {
  id:         1,
  email:      DEMO_EMAIL,
  first_name: 'Kinjal',
  last_name:  'J',
  full_name:  'Kinjal J',
  created_at: new Date().toISOString(),
}

function isDemoToken(t: string | null) {
  return t === DEMO_TOKEN
}

export const authApi = {
  register: async (data: { email: string; first_name: string; last_name: string; password: string; password_confirm: string }) => {
    const res = await api.post<unknown>('/api/auth/register/', data)
    return normalizeAuthResponse(res)
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    // Demo bypass — no backend needed
    if (data.email === DEMO_EMAIL && data.password === DEMO_PASSWORD) {
      return {
        user:   DEMO_USER,
        tokens: { access: DEMO_TOKEN, refresh: DEMO_REFRESH },
      }
    }
    const res = await api.post<unknown>('/api/auth/login/', data)
    return normalizeAuthResponse(res)
  },

  me: async (): Promise<User> => {
    // If the stored token is the demo token, return demo user without hitting the API
    if (isDemoToken(tokens.getAccess())) return DEMO_USER
    const res = await api.get<unknown>('/api/auth/me/')
    return normalizeUser(res)
  },
}

// ── Interview API calls ──────────────────────────────────────────────────────
export type InterviewSession = {
  id: number
  role: string
  experience_level: string
  difficulty: string
  skills: string[]
  status: string
  question_count: number
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export type InterviewSessionDetail = InterviewSession & {
  questions: Question[]
  updated_at: string
}

export type Question = {
  id: number
  text: string
  question_type: string
  expected_answer: string
  order: number
  user_answer: UserAnswer | null
  created_at: string
}

export type UserAnswer = {
  id: number
  answer_text: string
  time_taken_seconds: number | null
  submitted_at: string
  evaluation: Evaluation | null
}

export type Evaluation = {
  id: number
  status: string
  score: number | null
  feedback: string
  strengths: string[]
  improvements: string[]
  ai_model_used: string
  evaluated_at: string | null
  created_at: string
}

export type InterviewResults = {
  id: number
  role: string
  experience_level: string
  difficulty: string
  skills: string[]
  status: string
  started_at: string | null
  ended_at: string | null
  total_questions: number
  answered_count: number
  average_score: number | null
  pending_evaluations: number
  questions: QuestionResult[]
}

export type QuestionResult = {
  id: number
  order: number
  text: string
  question_type: string
  expected_answer: string
  answer_text: string | null
  score: number | null
  feedback: string | null
  strengths: string[]
  improvements: string[]
  eval_status: string
}

export const interviewApi = {
  list: async () => {
    const data = await api.get<unknown>('/api/interviews/')
    return asList<InterviewSession>(data)
  },

  create: async (data: {
    role: string
    experience_level: string
    difficulty: string
    skills: string[]
    notes?: string
  }) => {
    const res = await api.post<unknown>('/api/interviews/', data)
    return asObject<InterviewSession>(res, ['session', 'interview'])
  },

  generateQuestions: async (sessionId: number, questionCount?: number) => {
    const body = questionCount !== undefined ? { question_count: questionCount } : undefined
    const data = await api.post<unknown>(`/api/interviews/${sessionId}/questions/generate/`, body)
    return asList<Question>(data)
  },

  detail: async (id: number) => {
    const res = await api.get<unknown>(`/api/interviews/${id}/`)
    return asObject<InterviewSessionDetail>(res, ['session', 'interview'])
  },

  results: async (id: number) => {
    const res = await api.get<unknown>(`/api/interviews/${id}/results/`)
    return asObject<InterviewResults>(res, ['results', 'session'])
  },

  listQuestions: async (id: number) => {
    const data = await api.get<unknown>(`/api/interviews/${id}/questions/`)
    return asList<Question>(data)
  },

  addQuestion: async (id: number, data: { text: string; question_type: string; expected_answer?: string; order?: number }) => {
    const res = await api.post<unknown>(`/api/interviews/${id}/questions/`, data)
    return asObject<Question>(res, ['question'])
  },

  submitAnswer: async (questionId: number, data: { answer_text: string; time_taken_seconds?: number }) => {
    const res = await api.post<unknown>(`/api/interviews/questions/${questionId}/answer/`, data)
    return asObject<UserAnswer>(res, ['answer', 'user_answer'])
  },
}
