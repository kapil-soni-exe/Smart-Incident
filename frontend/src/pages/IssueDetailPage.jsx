import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { ArrowLeft, Copy, Bot, Monitor, Globe, MapPin } from 'lucide-react'
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

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  if (loading) return <Layout title="Issue Detail"><Spinner /></Layout>
  if (!error)  return (
    <Layout title="Issue Detail">
      <div className="empty-state"><div className="empty-state-icon">😕</div><div className="empty-state-text">Issue not found</div></div>
    </Layout>
  )

  return (
    <Layout title="Issue Detail">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

        {/* Back */}
        <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', gap: 6 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back to Issues
        </button>

        {/* Header */}
        <div className="card" style={{ borderLeft: '3px solid var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tx)', marginBottom: 12, lineHeight: 1.4 }}>
                {error.message}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <SeverityBadge severity={error.severity} />
                <StatusBadge status={error.status} />
                <span className="chip">{error.service}</span>
                {error.environment && <span className="chip">{error.environment}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--tx)', lineHeight: 1 }}>{error.count.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>occurrences</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="section-title">Timeline</div>
          <div className="timeline" style={{ marginTop: 8 }}>
            <div className="timeline-item">
              <div className="timeline-time">First Seen</div>
              <div className="timeline-label">{new Date(error.firstSeen).toLocaleString()}</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-time">Last Seen</div>
              <div className="timeline-label">{new Date(error.lastSeen).toLocaleString()} · {timeAgo(error.lastSeen)}</div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="card">
          <div className="section-title">Metadata</div>
          <div className="grid-3" style={{ gap: 12 }}>
            <MetaItem icon={<Monitor size={14} />} label="User Agent" value={error.metadata?.userAgent || '—'} />
            <MetaItem icon={<Globe size={14} />}   label="IP Address" value={error.metadata?.ip || '—'} />
            <MetaItem icon={<MapPin size={14} />}  label="Request ID" value={error.metadata?.requestId || '—'} />
          </div>
          {error.tags?.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {error.tags.map(t => <span key={t} className="chip">{t}</span>)}
            </div>
          )}
        </div>

        {/* Stack Trace */}
        {error.stack && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Stack Trace</div>
              <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, gap: 5 }} onClick={() => copy(error.stack)}>
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre className="stack-trace">{error.stack}</pre>
          </div>
        )}

        {/* AI Suggestion */}
        {error.aiSuggestion && (
          <div className="ai-box">
            <div className="ai-box-header">
              <Bot size={15} style={{ color: 'var(--yellow)' }} />
              <div className="ai-box-title">AI Suggestion</div>
            </div>
            <div className="ai-box-body">{error.aiSuggestion}</div>
          </div>
        )}

        {/* Fingerprint */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ fontSize: 11, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Fingerprint</span>
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--tx-2)', background: 'var(--bg-surface2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
            {error.fingerprint}
          </code>
        </div>

      </div>
    </Layout>
  )
}

function MetaItem({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--bg-surface2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius)', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-3)', marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--tx)', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}
