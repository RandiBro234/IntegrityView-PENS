import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { ReportFilterProvider } from './data/ReportFilterContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ReportFilterProvider><App /></ReportFilterProvider>
    </AuthProvider>
  </StrictMode>,
)
