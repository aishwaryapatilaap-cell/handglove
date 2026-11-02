export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="how-header">
          <p className="pixel-heading">⚙️ How It Works</p>
          <h2 className="section-title">From Glove to <span className="glow-text">Recovery</span></h2>
          <p className="section-subtitle">A seamless pipeline from physical sensors to actionable rehabilitation insights.</p>
        </div>
        <div className="how-steps">
          {[
            { num: '01', icon: '🧤', title: 'Wear the Glove', desc: 'Put on the sensor-equipped glove with 5 flex sensors and an IMU.' },
            { num: '02', icon: '📡', title: 'Calibrate', desc: 'Quick 4-second calibration — fully open, then fist — customized to your hand.' },
            { num: '03', icon: '🎮', title: 'Do Exercises', desc: 'Follow guided exercises with real-time visual feedback on your dashboard.' },
            { num: '04', icon: '📈', title: 'Track Progress', desc: 'Review analytics, earn XP, and share results with your therapist remotely.' },
          ].map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
