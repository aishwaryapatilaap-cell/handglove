import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">🧤</div>
          <span className="logo-text">NeuroKinetics</span>
        </Link>
        <ul className="navbar-links">
          <li><Link to="/features" className={`cursor-target ${location.pathname === '/features' ? 'active' : ''}`}>Features</Link></li>
          <li><Link to="/exercises" className={`cursor-target ${location.pathname === '/exercises' ? 'active' : ''}`}>Exercises</Link></li>
          <li><Link to="/how-it-works" className={`cursor-target ${location.pathname === '/how-it-works' ? 'active' : ''}`}>How It Works</Link></li>
          <li><Link to="/dashboard" className={`cursor-target ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link></li>
        </ul>
        <div className="navbar-cta">
          <button className="btn btn-secondary cursor-target">Log In</button>
          <button className="btn btn-primary cursor-target">Get Started</button>
          <button 
            className="theme-toggle cursor-target" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
        <button className="mobile-menu-btn">☰</button>
      </div>
    </nav>
  )
}
