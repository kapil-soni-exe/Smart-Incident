import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Copy, RefreshCw, Key, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [showKey,      setShowKey]      = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const copy = (text, label = 'Copied!') => { navigator.clipboard.writeText(text); toast.success(label) }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate API key? Your old key will stop working immediately.')) return
    setRegenerating(true)
    try {
      await api.post('/auth/regenerate-key')
      await refreshUser()
      toast.success('New API key generated!')
    } catch { toast.error('Failed to regenerate key') }
    finally { setRegenerating(false) }
  }

  const sdkSnippet = `// 1. Copy sdk/opus.js into your project

// 2. Initialise at app entry point
import Opus from './opus.js'

Opus.init({
  apiKey:   '${user?.apiKey || 'YOUR_API_KEY'}',
  endpoint: 'http://localhost:5000',
  service:  'my-service',
  env:      'prod',
})`

  return (
    <Layout title="Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

        {/* Account */}
        <div className="card">
          <div className="section-title">Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Row label="Name"  value={user?.name} />
            <Row label="Email" value={user?.email} />
            <Row label="Role"  value={user?.role} last />
          </div>
        </div>

        {/* API Key */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>API Key</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', gap: 5 }} onClick={() => setShowKey(s => !s)}>
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />} {showKey ? 'Hide' : 'Reveal'}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', gap: 5 }} onClick={() => copy(user?.apiKey, 'API key copied!')}>
                <Copy size={12} /> Copy
              </button>
              <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px', gap: 5 }} disabled={regenerating} onClick={handleRegenerate}>
                <RefreshCw size={12} /> Regenerate
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface2)', border: '1px solid var(--bd)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Key size={13} style={{ color: 'var(--brand-light)', flexShrink: 0 }} />
            <code style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              color: showKey ? 'var(--tx)' : 'var(--tx-3)',
              letterSpacing: showKey ? 0 : 4, flex: 1, wordBreak: 'break-all',
            }}>
              {showKey ? user?.apiKey : '•'.repeat(44)}
            </code>
          </div>
          <p style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 8 }}>
            Keep this secret. Use it in the Opus SDK to send errors from your application.
          </p>
        </div>

        {/* SDK Snippet */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>SDK Integration</div>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', gap: 5 }} onClick={() => copy(sdkSnippet, 'Snippet copied!')}>
              <Copy size={12} /> Copy snippet
            </button>
          </div>
          <pre className="stack-trace" style={{ fontSize: 12 }}>{sdkSnippet}</pre>
        </div>

      </div>
    </Layout>
  )
}

function Row({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--bd-light)',
    }}>
      <span style={{ width: 90, fontSize: 12, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--tx)' }}>{value}</span>
    </div>
  )
}
