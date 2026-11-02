import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const first = user.role === 'therapist' ? 'Patients' : 'Today'
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">NeuroKinetics</div>
        <nav>
          <NavLink to="/app" end className="nav-link">{first}</NavLink>
          {user.role === 'patient' && <><NavLink to="/app/exercises" className="nav-link">Exercises</NavLink><NavLink to="/app/glove" className="nav-link">Glove</NavLink><NavLink to="/app/analysis" className="nav-link">Progress</NavLink></>}
          <NavLink to="/app/profile" className="nav-link">Profile</NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="who">{user.full_name}<span>{user.role === 'therapist' ? 'Therapist' : 'Patient'}</span></div>
          <button className="btn btn-secondary btn-sm" onClick={async () => { await logout(); navigate('/') }}>Sign out</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  )
}
