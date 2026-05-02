import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { ArrowLeft, Copy, Bot, Monitor, Globe, MapPin, Activity, Tag, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IssueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/errors/${id}`)
      .then(({ data }) => setError(data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!') }

  if (loading) return <Layout title="Issue Detail"><div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div></Layout>
  if (!error)  return (
    <Layout title="Issue Detail">
      <div className="empty-state" style={{ padding: 60, background: 'var(--bg-surface2)' }}>
        <div className="empty-state-icon">😕</div>
        <div className="empty-state-text">Issue not found</div>
        <div style={{ color: 'var(--tx-3)', marginTop: 8 }}>The error may have been deleted or the ID is incorrect.</div>
      </div>
    </Layout>
  )

  const severityColor = error.severity === 'critical' ? 'var(--red)' : error.severity === 'high' ? 'var(--orange)' : 'var(--brand)'

  return (
    <Layout title="Issue Detail">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            className="btn btn-ghost" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, background: 'var(--bg-surface2)', border: '1px solid var(--bd)' }} 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Back to Issues
          </button>
          
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--tx-3)', background: 'var(--bg-surface2)', padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px dashed var(--bd)' }}>
            ID: {error._id}
          </code>
        </div>

        {/* ── Header Card ── */}
        <div className="card" style={{ padding: 32, borderTop: `4px solid ${severityColor}`, background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <SeverityBadge severity={error.severity} />
                <StatusBadge status={error.status} />
                <span className="chip" style={{ background: 'var(--bg-main)' }}>{error.service}</span>
                {error.environment && <span className="chip" style={{ background: 'var(--bg-main)' }}>{error.environment}</span>}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)', marginBottom: 8, lineHeight: 1.3 }}>
                {error.message}
              </h1>
              {error.operation && (
                <div style={{ fontSize: 14, color: 'var(--tx-3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: 'var(--tx-2)', fontWeight: 600 }}>Location:</span> {error.operation}
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'right', background: 'var(--bg-surface2)', padding: '20px 32px', borderRadius: 'var(--radius)', border: '1px solid var(--bd-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', color: 'var(--tx-2)', marginBottom: 4 }}>
                <Activity size={16} color={severityColor} />
                <span style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Total Events</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--tx)', lineHeight: 1 }}>
                {error.count.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Dual Column Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          
          {/* LEFT COLUMN: Technical Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 2, minWidth: '60%' }}>
            
            {/* AI Suggestion (If exists) */}
            {error.aiSuggestion && (
              <div style={{ 
                background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0) 100%)', 
                border: '1px solid rgba(34, 197, 94, 0.3)', 
                borderRadius: 'var(--radius)', 
                padding: 24 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: 6, borderRadius: 8 }}>
                    <Bot size={20} color="var(--green)" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)', margin: 0 }}>Opus AI Analysis</h3>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--tx-2)' }}>
                  {error.aiSuggestion}
                </div>
              </div>
            )}

            {/* Stack Trace */}
            {error.stack ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '12px 20px', background: 'var(--bg-surface2)', borderBottom: '1px solid var(--bd)' 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stack Trace
                  </div>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '6px 12px', fontSize: 12, gap: 6, background: 'var(--bg-main)', border: '1px solid var(--bd)' }} 
                    onClick={() => copy(error.stack)}
                  >
                    <Copy size={14} /> Copy Trace
                  </button>
                </div>
                <div style={{ 
                  background: '#1a1625', 
                  padding: 20, 
                  overflowX: 'auto',
                  borderBottomLeftRadius: 'var(--radius)', 
                  borderBottomRightRadius: 'var(--radius)' 
                }}>
                  <pre style={{ 
                    margin: 0, 
                    fontFamily: "'JetBrains Mono', Consolas, monospace", 
                    fontSize: 13, 
                    lineHeight: 1.5, 
                    color: '#e2d5f8' 
                  }}>
                    {error.stack}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--tx-3)', background: 'var(--bg-surface2)', border: '1px dashed var(--bd)' }}>
                No stack trace provided for this error.
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Context & Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
            
            {/* Timeline */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--tx-3)" /> Activity Timeline
              </div>
              <div style={{ position: 'relative', paddingLeft: 16, borderLeft: '2px solid var(--bd)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', width: 10, height: 10, background: 'var(--brand)', borderRadius: '50%', left: -22, top: 4, border: '2px solid var(--bg-surface)' }} />
                  <div style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase' }}>Last Seen</div>
                  <div style={{ fontSize: 14, color: 'var(--tx)', marginTop: 2 }}>{new Date(error.lastSeen).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx-2)', marginTop: 2 }}>{timeAgo(error.lastSeen)}</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', width: 10, height: 10, background: 'var(--tx-3)', borderRadius: '50%', left: -22, top: 4, border: '2px solid var(--bg-surface)' }} />
                  <div style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase' }}>First Seen</div>
                  <div style={{ fontSize: 14, color: 'var(--tx)', marginTop: 2 }}>{new Date(error.firstSeen).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {error.tags && error.tags.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={16} color="var(--tx-3)" /> Tags
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {error.tags.map(t => (
                    <span key={t} style={{ background: 'var(--bg-main)', color: 'var(--tx-2)', padding: '4px 10px', borderRadius: 4, fontSize: 12, border: '1px solid var(--bd-light)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Context / Metadata */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Context Data
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <MetaRow icon={<Monitor size={14} />} label="User Agent" value={error.metadata?.userAgent || '—'} />
                <MetaRow icon={<Globe size={14} />}   label="IP Address" value={error.metadata?.ip || '—'} />
                <MetaRow icon={<MapPin size={14} />}  label="Request ID" value={error.metadata?.requestId || '—'} />
                <MetaRow icon={<Activity size={14} />} label="Fingerprint" value={error.fingerprint} isCode />
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  )
}

function MetaRow({ icon, label, value, isCode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-surface2)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--bd-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-3)' }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      </div>
      {isCode ? (
        <code style={{ fontSize: 12, color: 'var(--tx-2)', wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace" }}>{value}</code>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--tx)', wordBreak: 'break-all', lineHeight: 1.4 }}>{value}</div>
      )}
    </div>
  )
}
