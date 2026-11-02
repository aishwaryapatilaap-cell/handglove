import { Link } from 'react-router-dom'

export default function Exercises() {
  return (
    <section className="levels" id="levels" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="levels-header">
          <p className="pixel-heading">🗺️ Exercise Map</p>
          <h2 className="section-title">Level Up Your <span className="glow-text">Recovery</span></h2>
          <p className="section-subtitle">Progress through 4 levels of rehabilitation exercises, unlocking new challenges as you improve.</p>
          <div style={{ marginTop: '24px' }}>
            <Link to="/neuro-flap" className="btn btn-primary cursor-target animate-pulse">
              🚀 Final Boss: Neuro-Flap Challenge
            </Link>
          </div>
        </div>
        <div className="level-track">
          {[
            { level: 1, title: 'Basic Extension', desc: 'Fundamental finger extension and flexion exercises. Build foundational range of motion.', color: 'level-1', exercises: ['Finger-Spread', 'Basic-Curl', 'Thumb-Touch', 'Open-Close', 'Hold-Release'] },
            { level: 2, title: 'Targeted Movement', desc: 'Individual finger control and precision movements. Develop fine motor skills.', color: 'level-2', exercises: ['Pinch-Grip', 'Finger-Walk', 'Key-Pinch', 'Tip-Press', 'Sequential-Tap'] },
            { level: 3, title: 'Strength Building', desc: 'Resistance exercises with servo-assisted training. Build grip strength and endurance.', color: 'level-3', exercises: ['Power-Grip', 'Wrist-Curl', 'Squeeze-Hold', 'Resistance-Flex', 'Sustained-Grip'] },
            { level: 4, title: 'Compound Movements', desc: 'Complex multi-finger coordination and real-world task simulation.', color: 'level-4', exercises: ['Object-Pickup', 'Writing-Sim', 'Button-Press', 'Twist-Turn', 'Full-Dexterity'] },
          ].map((l, i) => (
            <div className="level-node" key={i}>
              <div className={`level-dot ${l.color}`}>LV{l.level}</div>
              <div className="level-info">
                <h3>{l.title}</h3>
                <p>{l.desc}</p>
                <div className="level-exercises">
                  {l.exercises.map((e, j) => (
                    <Link 
                      key={j} 
                      to={`/exercises/${e.toLowerCase()}`} 
                      className="exercise-tag cursor-target"
                      style={{ textDecoration: 'none' }}
                    >
                      {e.replace('-', ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
