export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

export interface User {
  id: number; email: string; full_name: string; role: 'patient' | 'therapist'; is_approved: boolean
  condition: string | null; affected_hand: string | null; link_code: string | null
  therapist_id: number | null; therapist_name: string | null; streak_days: number; created_at: string
  age?: number | null; gender?: string | null; medical_history?: string | null; medications?: string | null; allergies?: string | null; emergency_contact?: string | null; clinical_notes?: string | null; prescribed_exercises?: ExercisePlanItem[] | null
}
export interface PatientRow {
  id: number; full_name: string; condition: string | null; affected_hand: string | null
  last_session_at: string | null; sessions_7d: number; streak_days: number; flags: string[]
}
export interface ExercisePlanItem { name: string; finger?: string; sets?: number; reps?: number; frequency?: string; instructions?: string }
export interface SessionRow {
  id: number; level: number; exercise_name: string; duration_secs: number; score_pct: number
  reps_completed: number | null; reps_target: number | null; pain_before: number | null
  pain_after: number | null; therapist_note: string | null; created_at: string
}

function messageFrom(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => String(d.msg ?? '').replace(/^Value error, /, '')).filter(Boolean).join('. ')
  return 'Something went wrong. Please try again.'
}

export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail: unknown
    try { detail = (await res.json()).detail } catch { /* not JSON */ }
    throw new ApiError(messageFrom(detail), res.status)
  }
  return res.json() as Promise<T>
}
