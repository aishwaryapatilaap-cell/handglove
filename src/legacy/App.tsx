import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Noise from './components/Noise'
import TargetCursor from './components/TargetCursor'
import ProfileWidget from './components/ProfileWidget'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Pages
import Home from './pages/Home'
import Features from './pages/Features'
import Exercises from './pages/Exercises'
import ExerciseSession from './pages/ExerciseSession'
import NeuroFlap from './pages/NeuroFlap'
import HowItWorks from './pages/HowItWorks'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <div className="app">
        <TargetCursor 
          spinDuration={2}
          hideDefaultCursor={true}
          parallaxOn={true}
        />
        <ProfileWidget />
        <Noise 
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={15}
        />
        
        <Navbar />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/exercises/:id" element={<ExerciseSession />} />
            <Route path="/neuro-flap" element={<NeuroFlap />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  )
}

export default App
