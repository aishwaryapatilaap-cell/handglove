import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="logo-text" style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.2rem', marginBottom: '1rem', display: 'block' }}>⚡ NeuroKinetics</span>
            <p>IoT-enabled smart hand rehabilitation glove with real-time kinematic analysis for effective hand motor recovery.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/exercises">Exercises</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Research Papers</a></li>
              <li><a href="#">Hardware Guide</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="#">GitHub</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Support</a></li>
              <li><a href="#">About</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 NeuroKinetics. Built with ❤️ for rehabilitation.</p>
          <div className="footer-socials">
            <a href="#" title="GitHub">GH</a>
            <a href="#" title="Twitter">𝕏</a>
            <a href="#" title="LinkedIn">in</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
