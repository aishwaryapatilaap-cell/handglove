import { FormEvent, useEffect, useState } from 'react'
import { api, SessionRow, User } from '../api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import Messages from '../components/Messages'

const WEEKLY_GOAL = 5

export default function Today() {
  const { user, setUser } = useAuth()
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [code, setCode] = useState('')
  const [linkError, setLinkError] = useState('')
  const [assignedExercises, setAssignedExercises] = useState<User['prescribed_exercises']>([])

  useEffect(() => { if (user?.role === 'patient') api<{exercises: NonNullable<User['prescribed_exercises']> }>(`/users/patients/${user.id}/plan`).then(r => setAssignedExercises(r.exercises)).catch(() => setAssignedExercises(user.prescribed_exercises ?? [])) }, [user?.id, user?.role])

  useEffect(() => { api<SessionRow[]>('/sessions/my?limit=100').then(setSessions).catch(() => setSessions([])) }, [])
  if (!user) return null

  const weekAgo = Date.now() - 7 * 864e5
  const thisWeek = (sessions ?? []).filter((s) => new Date(s.created_at).getTime() > weekAgo).length
  const last = sessions?.[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  async function link(e: FormEvent) {
    e.preventDefault(); setLinkError('')
    try { setUser(await api<User>('/users/me/link-therapist', 'POST', { code })); setCode('') }
    catch (err) { setLinkError((err as Error).message) }
  }
  async function unlink() { setUser(await api<User>('/users/me/therapist', 'DELETE')) }

  return (
    <>
      <div className="page-head"><h1>Today</h1><span className="muted small">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <div className="card">
        <h2>{greeting}, {user.full_name.split(' ')[0]}</h2>
        <div className="muted">Sessions this week: {thisWeek} of {WEEKLY_GOAL}</div>
        <div className="bar"><div style={{ width: Math.min(100, (thisWeek / WEEKLY_GOAL) * 100) + '%' }} /></div>
        <div className="muted small">Current streak: {user.streak_days} day{user.streak_days === 1 ? '' : 's'}</div>
      </div>
      <div className="row-actions dashboard-actions"><Link className="btn" to="/app/exercises">Start exercises</Link><Link className="btn btn-secondary" to="/app/analysis">View progress</Link></div>
      {assignedExercises && assignedExercises.length > 0 && <div className="card"><h2>Your therapist's daily exercise plan</h2>{assignedExercises.map((x,i)=><div className="kv" key={i}><span><b>{x.name}</b><small className="muted" style={{display:'block'}}>{x.instructions}</small></span><b>{x.sets??'–'} × {x.reps??'–'}</b></div>)}</div>}
      <div className="grid2">
        <div className="card">
          <h2>Last session</h2>
          {sessions === null ? <p className="muted">Loading…</p> : !last ? <p className="muted">No sessions yet.</p> : <>
            <div className="kv"><span>Exercise</span><span>{last.exercise_name}</span></div>
            <div className="kv"><span>Date</span><span>{new Date(last.created_at).toLocaleDateString()}</span></div>
            <div className="kv"><span>Score</span><span>{Math.round(last.score_pct)}%</span></div>
            <div className="kv"><span>Pain before / after</span><span>{last.pain_before ?? '–'} / {last.pain_after ?? '–'}</span></div>
            {last.therapist_note && <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>Therapist note: {last.therapist_note}</div>}
          </>}
        </div>
        <div className="card">
          <h2>Your therapist</h2>
          {user.therapist_name ? <>
            <p style={{ marginTop: 0 }}>{user.therapist_name}</p>
            <button className="btn btn-secondary btn-sm" onClick={unlink}>Unlink</button>
          </> : <form onSubmit={link}>
            <p className="muted small" style={{ marginTop: 0 }}>Enter the 6-character code your therapist gave you.</p>
            {linkError && <div className="alert alert-error">{linkError}</div>}
            <div className="field"><label htmlFor="code">Therapist code</label>
              <input id="code" value={code} maxLength={8} onChange={(e) => setCode(e.target.value.toUpperCase())} required /></div>
            <button className="btn btn-sm">Link</button>
          </form>}
        </div>
      </div>
      {user.therapist_id && <Messages peerId={user.therapist_id} currentUserId={user.id}/>}
    </>
  )
}
