import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ConnectivityProvider } from './context/ConnectivityContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

import ErrorBoundary from './components/common/ErrorBoundary'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ConnectivityProvider>
              <NotificationProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </NotificationProvider>
            </ConnectivityProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
