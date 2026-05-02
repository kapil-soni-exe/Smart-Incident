import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children, title }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'var(--bg-main)' }}>
        <div style={{
          width: 28, height: 28,
          border: '2px solid var(--bd)',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
          animation: 'spin .7s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  )
}
