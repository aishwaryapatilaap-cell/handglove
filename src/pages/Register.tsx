import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'patient' | 'therapist'>('patient')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(false)
  if (user) return <Navigate to="/app" replace />

  const longEnough = password.length >= 8
  const mixed = /[A-Za-z]/.test(password) && /\d/.test(password)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const r = await api<{ pending_approval: boolean }>('/auth/register', 'POST', { full_name: name, email: email.trim(), password, role, consent })
      if (r.pending_approval) setPending(true)
      else { await login(email.trim(), password); navigate('/app') }
    } catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  if (pending) return (
    <div className="auth-wrap"><div className="auth-card">
      <h1>Account created</h1>
      <div className="alert alert-info" style={{ marginTop: 16 }}>Therapist accounts are checked before they can sign in. You will be able to sign in once your account is approved.</div>
      <Link className="btn btn-secondary" to="/">Back to home</Link>
    </div></div>
  )

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted" style={{ marginTop: 0 }}>It takes a minute.</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="choice" role="radiogroup" aria-label="Account type">
          <label><input type="radio" name="role" checked={role === 'patient'} onChange={() => setRole('patient')} />Patient</label>
          <label><input type="radio" name="role" checked={role === 'therapist'} onChange={() => setRole('therapist')} />Therapist</label>
        </div>
        {role === 'therapist' && <div className="alert alert-info">Therapist accounts are reviewed before they can sign in.</div>}
        <div className="field"><label htmlFor="name">Full name</label>
          <input id="name" autoComplete="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className={'hint ' + (longEnough ? 'ok' : '')}>{longEnough ? '✓' : '•'} At least 8 characters</span>
          <span className={'hint ' + (mixed ? 'ok' : '')}>{mixed ? '✓' : '•'} A letter and a number</span></div>
        <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>I agree that NeuroKinetics stores my exercise and health information to track my recovery. I can export or delete it at any time from my profile.</span></label>
        <button className="btn" style={{ width: '100%' }} disabled={busy || !consent}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="small muted">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  )
}
