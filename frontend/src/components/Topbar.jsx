import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ title }) {
  const { user } = useAuth()

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Bell */}
        <button style={{
          background: 'transparent',
          border: '1px solid var(--bd)',
          borderRadius: 'var(--radius-sm)',
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--tx-2)', cursor: 'pointer',
          position: 'relative',
          transition: 'var(--tr)',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--tx-3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}
        >
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--red)',
            border: '1.5px solid var(--bg-surface)',
          }} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
