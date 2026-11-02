export default function Features() {
  return (
    <section className="features" id="features" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="features-header">
          <p className="pixel-heading">✦ Core Features</p>
          <h2 className="section-title">Everything You Need for <span className="glow-text">Smart Rehab</span></h2>
          <p className="section-subtitle">From real-time sensor tracking to gamified exercises, NeuroKinetics delivers a complete rehabilitation platform.</p>
        </div>
        <div className="features-grid">
          {[
            { icon: '📡', color: 'cyan', title: 'Real-Time Monitoring', desc: 'Track finger bending, wrist rotation, and grip strength at 20Hz with sub-degree accuracy.' },
            { icon: '🎮', color: 'purple', title: 'Gamified Exercises', desc: '4 progressive levels with 20 exercises. Earn XP, unlock new challenges, and track your streaks.' },
            { icon: '📊', color: 'green', title: 'Progress Analytics', desc: 'Per-finger ROM charts, session history, peak angle tracking, and weekly trend analysis.' },
            { icon: '🩺', color: 'pink', title: 'Tele-Rehabilitation', desc: 'Physiotherapists can monitor patients remotely, adjust targets, and add clinical notes.' },
            { icon: '❤️', color: 'red', title: 'Vital Monitoring', desc: 'Integrated heart rate and SpO₂ tracking with automatic alerts for abnormal readings.' },
            { icon: '📱', color: 'amber', title: 'IoT Connected', desc: 'ESP32 + BLE 5.0 for seamless wireless data transmission from glove to dashboard.' },
          ].map((f, i) => (
            <div className="card feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
