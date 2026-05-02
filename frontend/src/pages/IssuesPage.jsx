import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { SeverityBadge, StatusBadge, Spinner, timeAgo } from '../components/ui'
import api from '../lib/api'
import { Search, ChevronLeft, ChevronRight, Activity, Filter, RefreshCw } from 'lucide-react'

const SERVICES   = ['', 'payments', 'auth', 'api', 'frontend', 'backend']
const SEVERITIES = ['', 'critical', 'high', 'medium', 'low']
const STATUSES   = ['', 'active', 'resolved', 'ignored']

export default function IssuesPage() {
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [errors,  setErrors]  = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  
  // Read initial filters from URL params
  const [filters, setFilters] = useState({ 
    service: searchParams.get('service') || '', 
    severity: searchParams.get('severity') || '', 
    status: searchParams.get('status') || '' 
  })

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Premium Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ flex: 1, maxWidth: 360, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--tx-3)', pointerEvents: 'none' }} />
              <input
                id="issues-search"
                className="form-input"
                style={{ paddingLeft: 36, background: 'var(--bg-surface2)', border: '1px solid var(--bd)' }}
                placeholder="Search error messages or hashes…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-surface2)', padding: '4px', borderRadius: 'var(--radius)', border: '1px solid var(--bd)' }}>
              <Filter size={14} style={{ marginLeft: 8, color: 'var(--tx-3)' }} />
              {[['service', SERVICES], ['severity', SEVERITIES], ['status', STATUSES]].map(([key, opts]) => (
                <select
                  key={key}
                  className="form-select"
                  style={{ border: 'none', background: 'transparent', width: 130, paddingLeft: 8 }}
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
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--tx-2)', fontWeight: 500 }}>
              {total.toLocaleString()} issue{total !== 1 ? 's' : ''} found
            </div>
            <button className="btn btn-ghost" onClick={fetchErrors} title="Refresh">
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Premium List View ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : errors.length === 0 ? (
          <div className="empty-state" style={{ padding: 60, background: 'var(--bg-surface2)', border: '1px dashed var(--bd)' }}>
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text" style={{ fontSize: 16 }}>Inbox Zero! No issues found.</div>
            <div style={{ fontSize: 13, color: 'var(--tx-3)', marginTop: 4 }}>You have resolved all errors matching these filters.</div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bd)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            
            {/* List Header */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1fr 1fr', gap: 16, 
              padding: '12px 20px', borderBottom: '1px solid var(--bd)', 
              background: 'var(--bg-surface2)', fontSize: 11, textTransform: 'uppercase', 
              color: 'var(--tx-3)', fontWeight: 600, letterSpacing: '0.5px'
            }}>
              <div>Error Event</div>
              <div>Service</div>
              <div>Status</div>
              <div>Volume</div>
              <div style={{ textAlign: 'right' }}>Last Seen</div>
            </div>
            
            {/* List Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {errors.map((err, i) => (
                <div 
                  key={err._id}
                  onClick={() => navigate(`/issues/${err._id}`)}
                  style={{ 
                    display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1fr 1fr', gap: 16, alignItems: 'center',
                    padding: '16px 20px', borderBottom: i === errors.length - 1 ? 'none' : '1px solid var(--bd-light)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Title & Metadata */}
                  <div style={{ minWidth: 0, paddingRight: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <SeverityBadge severity={err.severity} />
                      <div style={{ fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 14 }}>
                        {err.message}
                      </div>
                    </div>
                    {err.operation && (
                      <div style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: 'var(--tx-2)', fontWeight: 500 }}>{err.operation.split(' ')[0]}</span> {err.operation.split(' ').slice(1).join(' ')}
                      </div>
                    )}
                  </div>

                  {/* Service */}
                  <div><span className="chip" style={{ background: 'var(--bg-main)' }}>{err.service || 'unknown'}</span></div>
                  
                  {/* Status */}
                  <div><StatusBadge status={err.status} /></div>

                  {/* Events Count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-2)', fontWeight: 600, fontSize: 13 }}>
                    <Activity size={14} color="var(--brand)" /> 
                    {err.count.toLocaleString()}
                  </div>

                  {/* Last Seen */}
                  <div style={{ textAlign: 'right', color: 'var(--tx-3)', fontSize: 12, fontWeight: 500 }}>
                    {timeAgo(err.lastSeen)}
                  </div>
                </div>
              ))}
            </div>
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
