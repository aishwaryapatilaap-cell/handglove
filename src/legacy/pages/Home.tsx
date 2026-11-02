import { useState } from 'react'
import { Link } from 'react-router-dom'
import HandSVG from '../components/HandSVG'

export default function Home() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge">⚡ IoT-Powered Rehabilitation</span>
          </div>
          <h1>
            Smart Hand Rehab,{' '}
            <span className="glow-text">Gamified</span>
          </h1>
          <p className="hero-description">
            Real-time kinematic analysis meets RPG-style progression. Monitor finger movements,
            track recovery, and level up your rehabilitation journey — all from a sensor-equipped glove.
          </p>
          <div className="hero-buttons">
            <Link to="/exercises" className="btn btn-primary cursor-target">
              Start Your Journey →
            </Link>
            <button 
              className="btn btn-secondary cursor-target"
              onClick={() => setShowDemo(true)}
            >
              Watch Demo ▶
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">20Hz</div>
              <div className="hero-stat-label">Sensor Refresh</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">5</div>
              <div className="hero-stat-label">Flex Sensors</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">0-90°</div>
              <div className="hero-stat-label">ROM Tracking</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hand-container">
            <div className="hand-glow"></div>
            <HandSVG />
            <div className="floating-data fd-1">
              <div className="data-label">Index Finger</div>
              <div className="data-value green">72° ✓</div>
            </div>
            <div className="floating-data fd-2">
              <div className="data-label">Heart Rate</div>
              <div className="data-value cyan">78 BPM</div>
            </div>
            <div className="floating-data fd-3">
              <div className="data-label">SpO₂</div>
              <div className="data-value green">98%</div>
            </div>
            <div className="floating-data fd-4">
              <div className="data-label">Wrist Angle</div>
              <div className="data-value purple">15° flex</div>
            </div>
          </div>
        </div>
      </div>
      {/* ── VIDEO MODAL ── */}
      {showDemo && (
        <div className="demo-modal-overlay" onClick={() => setShowDemo(false)}>
          <div className="demo-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close cursor-target" onClick={() => setShowDemo(false)}>×</button>
            <div className="video-container">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="NeuroKinetics Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="modal-footer">
              <h3>NeuroKinetics Hardware Demo</h3>
              <p>See how the smart glove captures kinematic data in real-time.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
