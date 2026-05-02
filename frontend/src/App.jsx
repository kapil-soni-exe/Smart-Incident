// App.jsx — root router, wraps all routes with AuthProvider + Toaster
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

// Auth pages (public)
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// App pages (authenticated — Layout handles the guard)
import DashboardPage      from './pages/DashboardPage'
import IssuesPage         from './pages/IssuesPage'
import IssueDetailPage    from './pages/IssueDetailPage'
import IncidentsPage      from './pages/IncidentsPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import SettingsPage       from './pages/SettingsPage'
import OnboardingPage     from './pages/OnboardingPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — Layout component enforces auth */}
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/issues"            element={<IssuesPage />} />
          <Route path="/issues/:id"        element={<IssueDetailPage />} />
          <Route path="/incidents"         element={<IncidentsPage />} />
          <Route path="/incidents/:id"     element={<IncidentDetailPage />} />
          <Route path="/settings"          element={<SettingsPage />} />
          <Route path="/onboarding"        element={<OnboardingPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#241f35',
            color: '#ebe6f0',
            border: '1px solid #3e3659',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            borderRadius: '6px',
          },
          success: { iconTheme: { primary: '#4dc771', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f55459', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  )
}
