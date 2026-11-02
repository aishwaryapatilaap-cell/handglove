import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { GloveProvider } from './context/GloveContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GloveProvider><App /></GloveProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
