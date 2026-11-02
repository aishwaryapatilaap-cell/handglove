export default function Dashboard() {
  return (
    <section className="dashboard-preview" id="dashboard" style={{ paddingTop: '120px', minHeight: '100vh' }}>
      <div className="container">
        <div className="dashboard-header">
          <p className="pixel-heading">🖥️ Live Dashboard</p>
          <h2 className="section-title">Your Rehab <span className="glow-text">Command Center</span></h2>
          <p className="section-subtitle">Real-time visualization of every sensor reading, exercise score, and recovery milestone.</p>
        </div>
        <div className="dashboard-mockup">
          <div className="mockup-topbar">
            <div className="mockup-user">
              <div className="mockup-avatar">👤</div>
              <div>
                <div className="mockup-name">Patient #2847</div>
                <div className="mockup-role">Level 2 • Session #14</div>
              </div>
            </div>
            <div className="mockup-stats-row">
              <span className="mockup-stat-chip xp">⚡ 2,450 XP</span>
              <span className="mockup-stat-chip streak">🔥 7-day streak</span>
              <span className="mockup-stat-chip level">🎮 Level 2</span>
            </div>
          </div>
          <div className="mockup-grid">
            {/* Finger Angles Panel */}
            <div className="mockup-panel">
              <div className="mockup-panel-title">Live Finger Angles</div>
              <div className="mini-hand-grid">
                {[
                  { name: 'Thumb', angle: 68, status: 'green' },
                  { name: 'Index', angle: 72, status: 'green' },
                  { name: 'Middle', angle: 45, status: 'amber' },
                  { name: 'Ring', angle: 58, status: 'green' },
                  { name: 'Pinky', angle: 32, status: 'red' },
                ].map((f, i) => (
                  <div className={`finger-bar ${f.status}`} key={i}>
                    <div className="finger-name">{f.name}</div>
                    {f.angle}°
                  </div>
                ))}
              </div>
            </div>

            {/* Vitals Panel */}
            <div className="mockup-panel">
              <div className="mockup-panel-title">Vital Signs</div>
              <div className="vitals-row">
                <div className="vital-item">
                  <div className="vital-icon">❤️</div>
                  <div className="vital-val" style={{ color: 'var(--accent-green)' }}>78</div>
                  <div className="vital-label">BPM</div>
                </div>
                <div className="vital-item">
                  <div className="vital-icon">🫁</div>
                  <div className="vital-val" style={{ color: 'var(--accent-cyan)' }}>98%</div>
                  <div className="vital-label">SpO₂</div>
                </div>
                <div className="vital-item">
                  <div className="vital-icon">🌡️</div>
                  <div className="vital-val" style={{ color: 'var(--accent-amber)' }}>36.5°</div>
                  <div className="vital-label">Temp</div>
                </div>
              </div>
            </div>

            {/* Session History Chart */}
            <div className="mockup-panel">
              <div className="mockup-panel-title">Weekly ROM Progress</div>
              <div className="chart-bars">
                {[40, 55, 52, 65, 70, 68, 78].map((h, i) => (
                  <div
                    key={i}
                    className="chart-bar"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgba(0,240,255,0.3), rgba(0,212,170,${0.4 + h / 200}))`,
                      border: '1px solid rgba(0,240,255,0.2)',
                      borderBottom: 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Score Panel */}
            <div className="mockup-panel">
              <div className="mockup-panel-title">Session Score</div>
              <div className="score-display">
                <div className="score-circle">
                  <div className="score-value">82%</div>
                  <div className="score-label">Score</div>
                </div>
                <div className="score-message">🎉 Great session! Full XP earned.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
