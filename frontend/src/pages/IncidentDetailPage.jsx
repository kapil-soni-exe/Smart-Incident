import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { ArrowLeft, Bot, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incident, setIncident] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    api.get(`/incidents/${id}`)
      .then(({ data }) => setIncident(data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (status) => {
    setSaving(true)
    try {
      const { data } = await api.patch(`/incidents/${id}/status`, { status })
      setIncident(data.data)
      toast.success(`Status → ${status}`)
    } catch { toast.error('Failed to update status') }
    finally { setSaving(false) }
  }

  if (loading) return <Layout title="Incident"><Spinner /></Layout>
  if (!incident) return (
    <Layout title="Incident">
      <div className="empty-state"><div className="empty-state-icon">😕</div><div className="empty-state-text">Incident not found</div></div>
    </Layout>
  )

  return (
    <Layout title="Incident Detail">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

        {/* Back */}
        <button
          className="btn btn-ghost"
          style={{ alignSelf: 'flex-start', gap: 6 }}
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft size={14} /> Back to Incidents
        </button>

        {/* Header card */}
        <div className="card" style={{ borderLeft: '3px solid var(--brand)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, lineHeight: 1.4, color: 'var(--tx)' }}>
                {incident.title}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
                <span className="chip">{incident.service}</span>
              </div>
            </div>
            {/* Status actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              {['open', 'investigating', 'resolved', 'closed']
                .filter(s => s !== incident.status)
                .map(s => (
                  <button
                    key={s}
                    className={`btn ${s === 'resolved' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    disabled={saving}
                    onClick={() => updateStatus(s)}
                  >
                    {s === 'resolved' && <CheckCircle size={12} />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))
              }
            </div>
          </div>
        </div>

        {/* Description */}
        {incident.description && (
          <div className="card">
            <div className="section-title">Description</div>
            <p style={{ fontSize: 14, color: 'var(--tx)', lineHeight: 1.7 }}>{incident.description}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid-3">
          <InfoBox label="Error Count"     value={incident.errorCount.toLocaleString()} />
          <InfoBox label="Assigned To"     value={incident.assignedTo || 'Unassigned'} />
          <InfoBox label="Last Occurrence" value={timeAgo(incident.lastOccurrence)} />
        </div>

        {/* AI Suggestion */}
        {incident.aiSuggestion ? (
          <div className="ai-box">
            <div className="ai-box-header">
              <Bot size={15} style={{ color: 'var(--yellow)' }} />
              <div className="ai-box-title">AI Root Cause & Fix</div>
            </div>
            <div className="ai-box-body">{incident.aiSuggestion}</div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bot size={16} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--tx-3)' }}>
              AI analysis will appear once this incident is processed by the queue.
            </span>
          </div>
        )}

        {/* Timeline */}
        <div className="card">
          <div className="section-title">Timeline</div>
          <div className="timeline" style={{ marginTop: 8 }}>
            <div className="timeline-item">
              <div className="timeline-time">Created</div>
              <div className="timeline-label">{new Date(incident.createdAt).toLocaleString()}</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-time">Last Occurrence</div>
              <div className="timeline-label">{new Date(incident.lastOccurrence).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {incident.tags?.length > 0 && (
          <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '14px 20px' }}>
            <span style={{ fontSize: 11, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Tags</span>
            {incident.tags.map(t => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        )}

        {/* Fingerprint */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <span style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Fingerprint</span>
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--tx-2)', background: 'var(--bg-surface2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
            {incident.fingerprint}
          </code>
        </div>

      </div>
    </Layout>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx)' }}>{value}</div>
    </div>
  )
}
