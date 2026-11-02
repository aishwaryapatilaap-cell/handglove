import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useGlove } from '../context/GloveContext'

const fingers = ['Thumb', 'Index', 'Middle', 'Ring', 'Little']
const emptyAngles: (number | null)[] = [null, null, null, null, null]

export default function Exercises() {
  const g = useGlove()
  const [reps, setReps] = useState(0)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(0)
  const [pain, setPain] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [telemetryError, setTelemetryError] = useState('')
  const previous = useRef<number | null>(null)
  const repArmed = useRef(false)
  const repsRef = useRef(0)
  const [now, setNow] = useState(Date.now())
  const [indexHistory, setIndexHistory] = useState<number[]>([])
  const angles = g.reading?.angles ?? emptyAngles
  const idx = angles[1] ?? null
  const telemetry = useRef({ angles: emptyAngles, reps: 0, motor: 'idle', calibrated: false })
  telemetry.current = { angles, reps, motor: g.reading?.motor ?? 'idle', calibrated: !!g.reading?.calibrated }

  // The therapist dashboard reads this patient's most recent live status.
  // Publish immediately when a new reading arrives and keep a heartbeat while connected.
  useEffect(() => {
    if (g.mode === 'none') return
    let active = true
    const publish = async () => {
      try {
        await api('/sessions/live', 'POST', telemetry.current)
        if (active) setTelemetryError('')
      } catch (e) {
        if (active) setTelemetryError((e as Error).message || 'Could not send live readings to the therapist dashboard.')
      }
    }
    void publish()
    const id = window.setInterval(() => { void publish() }, 1000)
    return () => { active = false; window.clearInterval(id) }
  }, [g.mode])

  // Count one complete extension-to-flexion cycle. The finger must first
  // reach <=25 degrees, then cross >=45 degrees. This prevents a false rep
  // when a session starts with the finger already bent.
  useEffect(() => {
    if (!running || idx === null) return
    if (idx <= 25) {
      repArmed.current = true
    } else if (idx >= 45 && repArmed.current) {
      repsRef.current += 1
      setReps(repsRef.current)
      repArmed.current = false
    }
    previous.current = idx
    setIndexHistory(a => [...a.slice(-1199), idx])
  }, [idx, running])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [running])

  const elapsedSeconds = started ? Math.floor((now - started) / 1000) : 0
  const elapsedLabel = elapsedSeconds < 60
    ? `${elapsedSeconds} sec`
    : `${Math.floor(elapsedSeconds / 60)} min ${elapsedSeconds % 60} sec`

  async function finish() {
    g.send('STOP')
    setNow(Date.now())
    setRunning(false)
    const duration = Math.max(1, Math.floor((Date.now() - started) / 1000))
    const finalReps = repsRef.current
    try {
      await api('/sessions/', 'POST', {
        level: 1, exercise_name: 'Finger flexion practice', duration_secs: duration,
        score_pct: Math.min(100, Math.round(finalReps / 10 * 100)), reps_completed: finalReps,
        reps_target: 10, pain_before: pain === '' ? null : Number(pain),
        pain_after: pain === '' ? null : Number(pain), finger_angles: { index: indexHistory },
      })
      setSaved(true)
    } catch (e) { setError((e as Error).message) }
  }

  return <>
    <div className="page-head"><h1>Exercise session</h1><span className="muted small">Live finger tracking</span></div>
    <div className="alert alert-info">Use only the movement range approved by your therapist. Stop immediately if you feel pain, numbness or unusual resistance. Motor-assisted movement must be supervised.</div>
    <div className="card"><h2>Glove connection</h2><div className="row-actions">
      {g.mode === 'none' ? <><button className="btn" onClick={g.connectUsb} disabled={g.connecting}>Connect USB glove</button><button className="btn btn-secondary" onClick={g.connectDemo}>Demo mode</button></> : <><span className="ok">{g.mode === 'usb' ? 'USB connected' : 'Demo connected'}</span><button className="btn btn-secondary" onClick={g.disconnect}>Disconnect</button></>}
    </div>{g.error && <p className="bad">{g.error}</p>}{telemetryError && <p className="bad">Dashboard sync: {telemetryError}</p>}</div>
    <div className="finger-grid">{fingers.map((finger, i) => {
      const value = angles[i] ?? null
      return <div className="card finger-card" key={finger}>
        <div className="muted small">{finger} finger</div>
        <strong>{value === null ? 'Waiting for sensor' : `${Math.round(value)}°`}</strong>
        <div className="bar"><div style={{ width: `${value === null ? 0 : Math.max(0, Math.min(100, value / 90 * 100))}%` }} /></div>
        <small>{value === null ? 'No reading received' : 'Live potentiometer reading'}</small>
      </div>
    })}</div>
    <div className="grid2"><div className="card"><h2>Session activity</h2><div className="metric-large">{reps}<span> / 10 reps</span></div>
      <div className="kv"><span>Session time</span><b>{running ? elapsedLabel : (started ? elapsedLabel : 'Not started')}</b></div>
      <div className="kv"><span>Motor</span><b>{g.reading?.motor ?? '–'}</b></div>
      <div className="kv"><span>Index raw sensor</span><b>{g.reading?.raw ?? '–'}</b></div>
      <div className="kv"><span>Calibration</span><b>{g.reading?.calibrated ? 'Ready' : 'Required'}</b></div>
      <div className="field"><label>Pain level (0–10)</label><input type="number" min="0" max="10" value={pain} onChange={e => setPain(e.target.value)} placeholder="Optional" /></div>
      <div className="row-actions">{!running ? <button className="btn" disabled={!g.reading?.calibrated} onClick={() => { repsRef.current = 0; setReps(0); setIndexHistory([]); previous.current = idx; repArmed.current = idx !== null && idx <= 25; setStarted(Date.now()); setNow(Date.now()); setSaved(false); setError(''); setRunning(true) }}>Start session</button> : <button className="btn btn-danger" onClick={finish}>Finish &amp; save</button>}</div>
      {saved && <p className="ok">Session saved to your progress.</p>}{error && <p className="bad">{error}</p>}
    </div><div className="card"><h2>How reps are counted</h2><p className="muted">To count one repetition, first straighten the index finger to 25° or less, then bend it to 45° or more. Each complete cycle counts once. If the session starts with the finger already bent, straighten it first.</p><p className="muted small">All five finger angles are sent to the therapist dashboard whenever readings are received.</p></div></div>
  </>
}
