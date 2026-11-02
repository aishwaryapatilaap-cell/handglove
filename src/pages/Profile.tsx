import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, User } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.full_name ?? '')
  const [condition, setCondition] = useState(user?.condition ?? '')
  const [hand, setHand] = useState(user?.affected_hand ?? '')
  const [age,setAge]=useState(user?.age?.toString()??'')
  const [gender,setGender]=useState(user?.gender??'')
  const [history,setHistory]=useState(user?.medical_history??'')
  const [medications,setMedications]=useState(user?.medications??'')
  const [allergies,setAllergies]=useState(user?.allergies??'')
  const [emergency,setEmergency]=useState(user?.emergency_contact??'')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [delPw, setDelPw] = useState('')
  const [delErr, setDelErr] = useState('')
  if (!user) return null

  async function save(e: FormEvent) {
    e.preventDefault()
    try {
      const body: Record<string, unknown> = { full_name: name }
      if (user!.role === 'patient') { body.condition=condition||null; body.affected_hand=hand||null; body.age=age?Number(age):null; body.gender=gender||null; body.medical_history=history; body.medications=medications; body.allergies=allergies; body.emergency_contact=emergency }
      setUser(await api<User>('/users/me', 'PATCH', body)); setMsg({ ok: true, text: 'Saved.' })
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }) }
  }
  async function changePw(e: FormEvent) {
    e.preventDefault()
    try { await api('/users/me/password', 'POST', { current_password: pw.current, new_password: pw.next }); setPw({ current: '', next: '' }); setPwMsg({ ok: true, text: 'Password changed.' }) }
    catch (err) { setPwMsg({ ok: false, text: (err as Error).message }) }
  }
  async function exportData() {
    const data = await api('/users/me/export')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = 'neurokinetics-my-data.json'; a.click(); URL.revokeObjectURL(a.href)
  }
  async function deleteAccount(e: FormEvent) {
    e.preventDefault()
    if (!window.confirm('Delete your account and all your data? This cannot be undone.')) return
    try { await api('/users/me', 'DELETE', { password: delPw }); await logout(); navigate('/') }
    catch (err) { setDelErr((err as Error).message) }
  }

  return (
    <>
      <div className="page-head"><h1>Profile</h1><span className="muted small">{user.email}</span></div>
      <form className="card" onSubmit={save}>
        <h2>Your details</h2>
        {msg && <div className={'alert ' + (msg.ok ? 'alert-ok' : 'alert-error')}>{msg.text}</div>}
        <div className="field"><label htmlFor="n">Full name</label><input id="n" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
        {user.role === 'patient' && <>
          <div className="field"><label htmlFor="c">Condition</label>
            <select id="c" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Not set</option><option value="stroke">Stroke</option><option value="arthritis">Arthritis</option><option value="injury">Hand or wrist injury</option><option value="other">Other</option></select></div>
          <div className="field"><label htmlFor="age">Age</label><input id="age" type="number" min="1" max="120" value={age} onChange={e=>setAge(e.target.value)} /></div>
          <div className="field"><label htmlFor="gender">Gender (optional)</label><input id="gender" value={gender} onChange={e=>setGender(e.target.value)} placeholder="Your preference" /></div>
          <div className="field"><label htmlFor="history">Medical history / diagnosis details</label><textarea id="history" rows={3} value={history} onChange={e=>setHistory(e.target.value)} /></div>
          <div className="field"><label htmlFor="meds">Current medications</label><textarea id="meds" rows={2} value={medications} onChange={e=>setMedications(e.target.value)} /></div>
          <div className="field"><label htmlFor="allergies">Allergies</label><textarea id="allergies" rows={2} value={allergies} onChange={e=>setAllergies(e.target.value)} /></div>
          <div className="field"><label htmlFor="emergency">Emergency contact</label><input id="emergency" value={emergency} onChange={e=>setEmergency(e.target.value)} /></div>
          <div className="field"><label htmlFor="h">Affected hand</label>
            <select id="h" value={hand} onChange={(e) => setHand(e.target.value)}>
              <option value="">Not set</option><option value="left">Left</option><option value="right">Right</option><option value="both">Both</option></select></div>
        </>}
        <button className="btn">Save changes</button>
      </form>
      <form className="card" onSubmit={changePw}>
        <h2>Change password</h2>
        {pwMsg && <div className={'alert ' + (pwMsg.ok ? 'alert-ok' : 'alert-error')}>{pwMsg.text}</div>}
        <div className="field"><label htmlFor="cp">Current password</label><input id="cp" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
        <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          <span className="hint">At least 8 characters, with a letter and a number.</span></div>
        <button className="btn">Change password</button>
      </form>
      <div className="card">
        <h2>Your data</h2>
        <p className="muted small" style={{ marginTop: 0 }}>Download everything stored about you, or delete your account and all sessions.</p>
        <button className="btn btn-secondary" onClick={exportData}>Download my data</button>
        <form onSubmit={deleteAccount} style={{ marginTop: 20 }}>
          {delErr && <div className="alert alert-error">{delErr}</div>}
          <div className="field"><label htmlFor="dp">Password to confirm deletion</label><input id="dp" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} required /></div>
          <button className="btn btn-danger">Delete my account</button>
        </form>
      </div>
    </>
  )
}
