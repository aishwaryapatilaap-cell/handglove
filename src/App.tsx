import { Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Today from './pages/Today'
import Patients from './pages/Patients'
import Profile from './pages/Profile'
import Glove from './pages/Glove'
import Exercises from './pages/Exercises'
import Analysis from './pages/Analysis'
import PatientDetail from './pages/PatientDetail'

function Home() {
  const { user } = useAuth()
  return user?.role === 'therapist' ? <Patients /> : <Today />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="glove" element={<Glove />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
