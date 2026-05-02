import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES   = ['', 'open', 'investigating', 'resolved', 'closed']
const SEVERITIES = ['', 'critical', 'high', 'medium', 'low']

export default function IncidentsPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [filters,   setFilters]   = useState({ status: '', severity: '' })
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 220, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--tx-3)', pointerEvents: 'none' }} />
            <input
              id="incident-search"
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search incidents…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Filters */}
          {[['status', STATUSES], ['severity', SEVERITIES]].map(([key, opts]) => (
            <select
              key={key}
              id={`inc-filter-${key}`}
              className="form-select"
              style={{ width: 148 }}
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

        {/* ── Count ── */}
        <div style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 500 }}>
          {total} incident{total !== 1 ? 's' : ''} found
        </div>

        {/* ── Table ── */}
        {loading ? <Spinner /> : incidents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text">No incidents found</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 4 }}>
              Your systems are running clean
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Errors</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr
                    key={inc._id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/incidents/${inc._id}`)}
                  >
                    <td style={{ maxWidth: 300 }}>
                      <div style={{
                        fontWeight: 500,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 280, color: 'var(--tx)',
                      }}>
                        {inc.title}
                      </div>
                    </td>
                    <td><span className="chip">{inc.service}</span></td>
                    <td><SeverityBadge severity={inc.severity} /></td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td style={{ fontWeight: 600, color: 'var(--tx)' }}>{inc.errorCount.toLocaleString()}</td>
                    <td style={{ color: 'var(--tx-2)' }}>{timeAgo(inc.createdAt)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className="form-select"
                        style={{ width: 138, padding: '4px 8px', fontSize: 12 }}
                        value={inc.status}
                        disabled={updating === inc._id}
                        onChange={e => updateStatus(e, inc._id, e.target.value)}
                      >
                        {['open', 'investigating', 'resolved', 'closed'].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
