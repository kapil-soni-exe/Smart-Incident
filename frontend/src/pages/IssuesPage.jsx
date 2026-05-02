import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const SERVICES   = ['', 'payments', 'auth', 'api', 'frontend', 'backend']
const SEVERITIES = ['', 'critical', 'high', 'medium', 'low']
const STATUSES   = ['', 'active', 'resolved', 'ignored']

export default function IssuesPage() {
  const navigate  = useNavigate()
  const [errors,  setErrors]  = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [filters, setFilters] = useState({ service: '', severity: '', status: '' })

  const fetchErrors = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...filters }
      if (search) params.search = search
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const { data } = await api.get('/errors', { params })
      setErrors(data.data)
      setTotal(data.total)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, filters, search])

  useEffect(() => {
    const t = setTimeout(fetchErrors, 400)
    return () => clearTimeout(t)
  }, [fetchErrors])

  const handleFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }
  const totalPages = Math.ceil(total / 20)

  return (
    <Layout title="Issues">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--tx-3)', pointerEvents: 'none' }} />
            <input
              id="issues-search"
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search errors…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {[['service', SERVICES], ['severity', SEVERITIES], ['status', STATUSES]].map(([key, opts]) => (
            <select
              key={key}
              id={`filter-${key}`}
              className="form-select"
              style={{ width: 138 }}
              value={filters[key]}
              onChange={e => handleFilter(key, e.target.value)}
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
          {total} issue{total !== 1 ? 's' : ''} found
        </div>

        {/* ── Table ── */}
        {loading ? <Spinner /> : errors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">No issues match your filters</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 4 }}>Try adjusting your search or filters</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Service</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Events</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {errors.map(err => (
                  <tr key={err._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/issues/${err._id}`)}>
                    <td style={{ maxWidth: 380 }}>
                      <div style={{
                        fontWeight: 500, color: 'var(--tx)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360,
                      }}>
                        {err.message}
                      </div>
                      {err.operation && (
                        <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                          {err.operation}
                        </div>
                      )}
                    </td>
                    <td><span className="chip">{err.service}</span></td>
                    <td><SeverityBadge severity={err.severity} /></td>
                    <td><StatusBadge status={err.status} /></td>
                    <td style={{ fontWeight: 600, color: 'var(--tx)' }}>{err.count.toLocaleString()}</td>
                    <td style={{ color: 'var(--tx-2)' }}>{timeAgo(err.lastSeen)}</td>
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
