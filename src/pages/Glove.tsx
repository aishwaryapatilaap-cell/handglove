import { useState } from 'react'
import HandDiagram from '../components/HandDiagram'
import { useGlove } from '../context/GloveContext'

const MEANING: Record<string, string> = {
  READY: 'Glove started.',
  REACHED: 'Reached the target angle and stopped.',
  JOG_DONE: 'Ran for 2 seconds and stopped.',
  STOPPED: 'Stopped.',
  LIMIT: 'Stopped at the end of the range.',
  TIMEOUT: 'Stopped: it took too long. Check the line is not slack or jammed.',
  DIRECTION: 'Stopped: the finger moved the wrong way. The motor wires or the sensor direction need swapping.',
  NOT_CALIBRATED: 'Set the open and closed positions first.',
  CAL_OPEN_SET: 'Open position saved.',
  CAL_CLOSED_SET: 'Closed position saved.',
  CAL_SPAN_TOO_SMALL: 'Open and closed are too close together. Move the finger through its full range and set both again.',
  PONG: 'Glove replied.',
}

export default function Glove() {
  const g = useGlove()
  const [target, setTarget] = useState(45)
  const live = g.mode !== 'none'
  const idx = g.reading?.angles[1] ?? null

  return (
    <>
      <div className="page-head"><h1>Glove</h1><span className="muted small">Connection and test</span></div>
      <div className="alert alert-info">Test the motor with the glove <b>off your hand</b> first. Move the finger yourself to calibrate, and keep your hand clear while the motor runs.</div>

      <div className="card">
        <h2>Connection</h2>
        {g.error && <div className="alert alert-error" role="alert">{g.error}</div>}
        <div className="row-actions">
          {!live && <>
            <button className="btn" onClick={g.connectUsb} disabled={g.connecting}>{g.connecting ? 'Connecting…' : 'Connect glove (USB)'}</button>
            <button className="btn btn-secondary" onClick={g.connectDemo}>Use demo glove</button>
          </>}
          {live && <>
            <span className="ok"><span className="dot" />{g.mode === 'demo' ? 'Demo glove running' : 'Glove connected'}</span>
            <button className="btn btn-secondary btn-sm" onClick={g.disconnect}>Disconnect</button>
          </>}
        </div>
        {!live && <p className="muted small" style={{ marginBottom: 0 }}>USB needs Chrome or Edge on a laptop. Plug the glove in, close the Arduino Serial Monitor, then choose the port.</p>}
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Live reading</h2>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <HandDiagram angles={g.reading?.angles ?? [null, null, null, null, null]} size={220} />
            <div style={{ flex: 1 }}>
              <div className="muted small">Index finger</div>
              <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.1 }}>{idx === null ? '–' : Math.round(idx) + '°'}</div>
              <div className="kv"><span>Sensor reading</span><span>{g.reading?.raw ?? '–'}</span></div>
              <div className="kv"><span>Motor</span><span>{g.reading?.motor ?? '–'}</span></div>
              <div className="kv"><span>Calibrated</span><span>{!g.reading ? '–' : g.reading.calibrated ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        </div>
        <div className="card">
          <h2>Sensor calibration</h2>
          <p className="muted small" style={{ marginTop: 0 }}>This firmware uses the demo calibration range for each potentiometer: ADC 500 = 0° and ADC 3500 = 90°. Adjust the ADC_MIN and ADC_MAX values in the firmware to match each finger's actual open and closed readings before patient use.</p>
          <div className="kv"><span>Configured ADC range</span><b>500–3500</b></div>
          <div className="kv"><span>Angle range</span><b>0°–90°</b></div>
        </div>
      </div>

      <div className="card">
        <h2>Motor control</h2>
        <div className="row-actions">
          <button className="btn btn-secondary" disabled={!live} onClick={() => g.send('OPEN')}>Open</button>
          <button className="btn btn-secondary" disabled={!live} onClick={() => g.send('CLOSE')}>Close</button>
          <button className="btn btn-danger" disabled={!live} onClick={() => g.send('STOP')}>Stop</button>
        </div>
        <div className="field" style={{ marginTop: 18, maxWidth: 420 }}>
          <label htmlFor="t">Go to angle: {target}°</label>
          <input id="t" type="range" min={5} max={90} value={target} onChange={(e) => setTarget(+e.target.value)} />
        </div>
        <button className="btn" disabled={!live || !g.reading?.calibrated} onClick={() => g.send('GOTO:' + target)}>Go to {target}°</button>
        {live && g.reading && !g.reading.calibrated && <span className="muted small" style={{ marginLeft: 12 }}>Calibrate first.</span>}
      </div>

      <div className="card">
        <h2>Recent activity</h2>
        {g.events.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nothing yet.</p> :
          g.events.map((e, i) => (
            <div key={i} className="kv"><span>{MEANING[e.event] ?? e.event}</span><span>{e.angle !== undefined ? e.angle + '°' : e.raw !== undefined ? 'reading ' + e.raw : ''}</span></div>
          ))}
      </div>
    </>
  )
}
