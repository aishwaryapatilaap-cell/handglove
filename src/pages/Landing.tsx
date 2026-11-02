import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()
  return (
    <div>
      <header className="site-nav">
        <div className="brand">NeuroKinetics</div>
        <div className="links">
          {user ? <Link className="btn" to="/app">Open app</Link> : <><Link className="btn btn-secondary" to="/login">Sign in</Link><Link className="btn" to="/register">Create account</Link></>}
        </div>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">Hand rehabilitation at home</div>
          <h1>Guided hand exercises, with progress your therapist can see.</h1>
          <p>A sensor glove and web app for people recovering from stroke, arthritis or hand injury. Practise at home, track each session, and share results with your care team.</p>
          <Link className="btn" to="/register">Get started</Link>
        </div>
      </section>
      <section className="cols">
        <div><h3>Measure</h3><p>Five finger angles and wrist movement are recorded while you exercise.</p></div>
        <div><h3>Guide</h3><p>Each exercise shows a target range, counts repetitions and times each hold.</p></div>
        <div><h3>Review</h3><p>Therapists see trends, pain ratings and missed sessions, and adjust the plan.</p></div>
      </section>
      <footer className="footer">NeuroKinetics is a student research project. It does not replace advice from a qualified therapist or doctor.</footer>
    </div>
  )
}
