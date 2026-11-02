import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import HandSVG from '../components/HandSVG'

export default function ExerciseSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  
  // Simulate progress for the demo
  useEffect(() => {
    if (progress < 100) {
      const timer = setInterval(() => {
        setProgress(prev => Math.min(100, prev + Math.random() * 5))
      }, 500)
      return () => clearInterval(timer)
    } else {
      setIsComplete(true)
    }
  }, [progress])

  return (
    <div className="exercise-session" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="container">
        <div className="session-header">
          <Link to="/exercises" className="back-link cursor-target">← Back to Map</Link>
          <div className="session-title-group">
            <h1>Exercise: {id?.replace('-', ' ') || 'Finger Flexion'}</h1>
            <span className="badge">Level 1 • Fundamental</span>
          </div>
        </div>

        <div className="session-layout">
          <div className="session-visual card">
            <div className="live-badge">LIVE SENSOR DATA</div>
            <div className="session-hand-container">
              <HandSVG />
            </div>
            <div className="sensor-grid">
              <div className="sensor-val"><span>T</span> 65°</div>
              <div className="sensor-val active"><span>I</span> 82°</div>
              <div className="sensor-val"><span>M</span> 45°</div>
              <div className="sensor-val"><span>R</span> 30°</div>
              <div className="sensor-val"><span>P</span> 22°</div>
            </div>
          </div>

          <div className="session-controls card">
            <div className="instruction-box">
              <h3>Target: Hold 80° Flexion</h3>
              <p>Slowly curl your index finger until the indicator reaches the target zone. Hold for 3 seconds.</p>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>Session Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar-large">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="session-stats">
              <div className="s-stat">
                <div className="s-label">Time</div>
                <div className="s-value">02:45</div>
              </div>
              <div className="s-stat">
                <div className="s-label">Avg ROM</div>
                <div className="s-value">72°</div>
              </div>
              <div className="s-stat">
                <div className="s-label">Goal</div>
                <div className="s-value">80°</div>
              </div>
            </div>

            {isComplete ? (
              <div className="completion-card animate-float">
                <div className="check-icon">✓</div>
                <h3>Goal Reached!</h3>
                <p>+150 XP earned for this session.</p>
                <button className="btn btn-primary cursor-target" onClick={() => navigate('/exercises')}>
                  Finish & Save
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary cursor-target w-full" onClick={() => navigate('/exercises')}>
                Quit Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
