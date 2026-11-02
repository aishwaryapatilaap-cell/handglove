import { useEffect, useMemo, useState } from 'react'
import { api, PatientRow } from '../api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const LABEL: Record<string, string> = { missed_sessions: 'Missed sessions', pain_rising: 'Pain rising' }
function ago(iso: string | null) {
  if (!iso) return 'No sessions yet'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`
}
export default function Patients() {
  const { user } = useAuth()
  const [rows, setRows] = useState<PatientRow[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api<PatientRow[]>('/users/patients/summary').then(setRows).catch(e => { setError((e as Error).message); setRows([]) }) }, [])
  const filtered = useMemo(() => (rows ?? []).filter(p => `${p.full_name} ${p.condition ?? ''}`.toLowerCase().includes(query.toLowerCase())), [rows, query])
  if (!user) return null
  const attention = (rows ?? []).filter(r => r.flags.length).length
  const weekly = (rows ?? []).reduce((n, r) => n + r.sessions_7d, 0)
  return <>
    <div className="page-head"><div><span className="eyebrow">THERAPIST WORKSPACE</span><h1>Patient care dashboard</h1></div><span className="muted small">{rows?.length ?? '…'} linked patients</span></div>
    <div className="therapist-stats">
      <div className="card"><span className="muted small">Linked patients</span><strong>{rows?.length ?? '—'}</strong><span className="small muted">Under your care</span></div>
      <div className="card"><span className="muted small">Sessions this week</span><strong>{weekly}</strong><span className="small muted">Across all patients</span></div>
      <div className="card"><span className="muted small">Need attention</span><strong className={attention ? 'warn' : 'ok'}>{rows ? attention : '—'}</strong><span className="small muted">Missed sessions or rising pain</span></div>
    </div>
    <div className="card therapist-link-card"><div><span className="eyebrow">PATIENT INVITATION</span><h2>Your patient-link code</h2><p className="muted small">Share this code with a patient. After linking, you can access their records, prescribe exercises and monitor progress.</p></div><div className="row-actions"><span className="code">{user.link_code || 'Not available'}</span><button className="btn btn-secondary btn-sm" onClick={() => { void navigator.clipboard?.writeText(user.link_code ?? ''); setCopied(true) }}>{copied ? 'Copied' : 'Copy code'}</button></div></div>
    <div className="card"><div className="patient-list-head"><div><h2>Patients under your care</h2><p className="muted small">Select Open patient record to view their medical history, daily exercise plan, live readings and session history.</p></div><input className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search patients…" aria-label="Search patients" /></div>
      {error && <div className="alert alert-error">{error}</div>}
      {rows === null ? <p className="muted">Loading patients…</p> : filtered.length === 0 ? <div className="empty-state"><strong>{rows.length ? 'No matching patients' : 'No patients linked yet'}</strong><p className="muted">{rows.length ? 'Try another search.' : 'Share your link code to connect a patient account.'}</p></div> :
      <div className="patient-cards">{filtered.map(p => <article className="patient-row-card" key={p.id}><div className="patient-avatar">{p.full_name.split(/\s+/).map(x => x[0]).slice(0,2).join('').toUpperCase()}</div><div className="patient-row-main"><div className="patient-name-line"><strong>{p.full_name}</strong>{p.flags.length ? <span className="status-pill status-warn">{p.flags.map(f => LABEL[f] ?? f).join(' · ')}</span> : <span className="status-pill status-ok">On track</span>}</div><span className="muted small">{p.condition || 'Condition not specified'}{p.affected_hand ? ` · ${p.affected_hand} hand` : ''}</span><div className="patient-meta"><span>Last session: <b>{ago(p.last_session_at)}</b></span><span>This week: <b>{p.sessions_7d} sessions</b></span><span>Streak: <b>{p.streak_days} days</b></span></div></div><Link className="btn" to={`/app/patients/${p.id}`}>Open patient record</Link></article>)}</div>}
    </div>
  </>
}
