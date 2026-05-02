import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { Search, ChevronLeft, ChevronRight, Activity, Filter, RefreshCw, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES   = ['', 'open', 'investigating', 'resolved', 'closed']
const SEVERITIES = ['', 'critical', 'high', 'medium', 'low']

export default function IncidentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [incidents, setIncidents] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  
  // Read initial filters from URL params
  const [filters,   setFilters]   = useState({ 
    status: searchParams.get('status') || '', 
    severity: searchParams.get('severity') || '' 
  })
  const [updating,  setUpdating]  = useState(null)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...filters }
      if (search) params.search = search
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const { data } = await api.get('/incidents', { params })
      setIncidents(data.data)
      setTotal(data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, filters, search])

  useEffect(() => {
    const t = setTimeout(fetchIncidents, 400)
    return () => clearTimeout(t)
  }, [fetchIncidents])

  const updateStatus = async (e, id, status) => {
    e.stopPropagation()
    setUpdating(id)
    try {
      await api.patch(`/incidents/${id}/status`, { status })
      toast.success(`Status → ${status}`)
      fetchIncidents()
    } catch { toast.error('Failed to update') }
    finally { setUpdating(null) }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <Layout title="Incidents">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Premium Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ flex: 1, maxWidth: 360, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--tx-3)', pointerEvents: 'none' }} />
              <input
                id="incident-search"
                className="form-input"
                style={{ paddingLeft: 36, background: 'var(--bg-surface2)', border: '1px solid var(--bd)' }}
                placeholder="Search incident titles…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-surface2)', padding: '4px', borderRadius: 'var(--radius)', border: '1px solid var(--bd)' }}>
              <Filter size={14} style={{ marginLeft: 8, color: 'var(--tx-3)' }} />
              {[['status', STATUSES], ['severity', SEVERITIES]].map(([key, opts]) => (
                <select
                  key={key}
                  className="form-select"
                  style={{ border: 'none', background: 'transparent', width: 140, paddingLeft: 8 }}
                  value={filters[key]}
                  onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1) }}
                >
                  <option value="">All {key.charAt(0).toUpperCase() + key.slice(1)}s</option>
                  {opts.filter(Boolean).map(o => (
                    <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--tx-2)', fontWeight: 500 }}>
              {total.toLocaleString()} incident{total !== 1 ? 's' : ''} found
            </div>
            <button className="btn btn-ghost" onClick={fetchIncidents} title="Refresh">
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Premium Card Stack View ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : incidents.length === 0 ? (
          <div className="empty-state" style={{ padding: 60, background: 'var(--bg-surface2)', border: '1px dashed var(--bd)' }}>
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text" style={{ fontSize: 16 }}>Zero Incidents!</div>
            <div style={{ fontSize: 13, color: 'var(--tx-3)', marginTop: 4 }}>
              Your systems are running smoothly.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {incidents.map((inc) => {
              const borderLeftColor = inc.severity === 'critical' ? 'var(--red)' : inc.severity === 'high' ? 'var(--orange)' : 'var(--brand)';
              return (
                <div 
                  key={inc._id}
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    borderLeft: `4px solid ${borderLeftColor}`,
                    background: 'var(--bg-surface)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.transform = 'translateY(-2px)'; 
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.transform = 'none'; 
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                         <span style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", background: 'var(--bg-main)', padding: '2px 6px', borderRadius: 4 }}>
                           INC-{inc._id.slice(-6).toUpperCase()}
                         </span>
                         <span style={{ color: 'var(--tx-3)', fontSize: 12 }}>•</span>
                         <span style={{ fontSize: 12, color: 'var(--tx-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                           <Clock size={12}/> {timeAgo(inc.createdAt)}
                         </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 17, color: 'var(--tx)', fontWeight: 600, lineHeight: 1.4 }}>
                        {inc.title}
                      </h3>
                    </div>

                    <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                      <select
                        className="form-select"
                        style={{ 
                          width: 140, padding: '8px 12px', fontSize: 13, 
                          background: 'var(--bg-main)', border: `1px solid ${inc.status === 'open' ? 'var(--yellow)' : 'var(--bd)'}`, 
                          fontWeight: 500, borderRadius: 'var(--radius)'
                        }}
                        value={inc.status}
                        disabled={updating === inc._id}
                        onChange={e => updateStatus(e, inc._id, e.target.value)}
                      >
                        {['open', 'investigating', 'resolved', 'closed'].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                    <span className="chip" style={{ background: 'var(--bg-main)', border: '1px solid var(--bd-light)' }}>
                      {inc.service || 'unknown'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-2)', fontWeight: 600, fontSize: 13, marginLeft: 'auto', background: 'var(--bg-surface2)', padding: '4px 10px', borderRadius: 12 }}>
                      <Activity size={14} color="var(--brand)" /> 
                      {inc.errorCount.toLocaleString()} Events
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
            <button className="btn btn-ghost" style={{ padding: '5px 10px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 500, padding: '0 4px' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-ghost" style={{ padding: '5px 10px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
