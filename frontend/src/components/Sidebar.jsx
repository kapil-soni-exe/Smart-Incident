import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, AlertTriangle, Siren,
  Settings, Rocket, LogOut, ShieldCheck,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents',  icon: Siren },
  { to: '/issues',    label: 'Issues',     icon: AlertTriangle },
]

const bottomItems = [
  { to: '/onboarding', label: 'Onboarding', icon: Rocket },
  { to: '/settings',   label: 'Settings',   icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="sidebar-logo-text">OpusGuard</span>
      </div>

      {/* Main nav */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Monitoring</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ marginTop: 'auto' }}>
        <div className="sidebar-section" style={{ paddingBottom: 8 }}>
          <div className="sidebar-section-label">Settings</div>
          {bottomItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User row */}
        <div style={{
          borderTop: '1px solid var(--bd)',
          padding: '12px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>{user?.role || 'Member'}</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{ background: 'none', border: 'none', color: 'var(--tx-3)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
