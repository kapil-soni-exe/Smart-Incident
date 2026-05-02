import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Spinner } from '../components/ui'
import api from '../lib/api'
import { useTelemetry } from '../context/TelemetryContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { AlertCircle, CheckCircle2, XCircle, Activity, BrainCircuit } from 'lucide-react'



const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-surface2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px',
      fontSize: 12,
      boxShadow: 'var(--shadow)',
      minWidth: '150px'
    }}>
      <div style={{ color: 'var(--tx-2)', marginBottom: 8, fontSize: 11, fontWeight: 600 }}>{label}</div>
      {payload.map((entry, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: 'var(--tx-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
             {entry.name}
          </span>
          <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || payload.count === 0) return null; // Don't render dot if count is 0
  
  let fill = 'var(--green)';
  let r = 3;
  
  if (payload.count > 10) {
    fill = 'var(--red)';
    r = 6;
  } else if (payload.count > 5) {
    fill = 'var(--yellow)';
    r = 5;
  }

  return (
    <circle cx={cx} cy={cy} r={r} fill={fill} stroke="var(--bg-surface)" strokeWidth={1.5} />
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [errorStats, setErrorStats] = useState(null)
  const [incidentStats, setIncidentStats] = useState(null)
  const [recentIncidents, setRecentIncidents] = useState([])
  const [recentErrors, setRecentErrors] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Live graph data comes from global context (survives navigation) ────────
  const { liveData } = useTelemetry()

  useEffect(() => {
    // Fetch dashboard KPI data (no trend fetch here — TelemetryContext handles it)
    Promise.all([
      api.get('/errors/stats'),
      api.get('/incidents/stats'),
      api.get('/incidents?limit=5'),
      api.get('/errors?limit=5'),
    ])
      .then(([errStats, incStats, incList, errList]) => {
        setErrorStats(errStats.data.data)
        setIncidentStats(incStats.data.data)
        setRecentIncidents(incList.data.data.incidents || incList.data.data || [])
        setRecentErrors(errList.data.data.errors || errList.data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalErrors = errorStats?.total ?? 0
  const criticalCount = errorStats?.bySeverity?.find(s => s._id === 'critical')?.count ?? 0
  const openIncidents = incidentStats?.statusCounts?.find(s => s._id === 'open')?.count ?? 0

  // Determine System Status
  let systemStatus = 'Healthy'
  let systemColor = 'var(--green)'
  let SystemIcon = CheckCircle2
  
  if (criticalCount > 0 || openIncidents > 2) {
    systemStatus = 'Critical'
    systemColor = 'var(--red)'
    SystemIcon = XCircle
  } else if (openIncidents > 0 || totalErrors > 100) {
    systemStatus = 'Degraded'
    systemColor = 'var(--yellow)'
    SystemIcon = AlertCircle
  }

  return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* 1. Top Summary Cards (KPI Section) */}
        <div className="grid-4">
          <StatCard
            title="Total Errors"
            value={loading ? '—' : totalErrors}
            indicatorColor="var(--tx-2)"
            onClick={() => navigate('/issues')}
          />
          <StatCard
            title="Active Incidents"
            value={loading ? '—' : openIncidents}
            indicatorColor={openIncidents > 0 ? 'var(--yellow)' : 'var(--tx-2)'}
            onClick={() => navigate('/incidents?status=open')}
          />
          <StatCard
            title="Critical Issues"
            value={loading ? '—' : criticalCount}
            indicatorColor={criticalCount > 0 ? 'var(--red)' : 'var(--tx-2)'}
            onClick={() => navigate('/issues?severity=critical')}
          />
          <div className="stat-card">
            <div className="stat-card-label">System Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <div style={{ color: systemColor, display: 'flex', alignItems: 'center' }}>
                <SystemIcon size={32} />
              </div>
              <div className="stat-card-value" style={{ color: systemColor }}>{systemStatus}</div>
            </div>
          </div>
        </div>

        {/* 2. Real-Time Error Trend Graph */}
        <div className="card">
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} /> Live Telemetry (Last 60 Mins)
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }}/> Total Errors</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }}/> Critical</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={liveData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--bd-light)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--tx-3)' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--tx-3)' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              
              {/* Critical Errors Area */}
              <Area 
                type="monotone" 
                dataKey="critical" 
                name="Critical Severity"
                stroke="var(--red)" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorCrit)" 
                dot={{ r: 2, fill: 'var(--red)' }}
              />
              
              {/* Total Errors Area with custom colored spike dots */}
              <Area 
                type="monotone" 
                dataKey="count" 
                name="Total Vol"
                stroke="var(--brand)" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                dot={<CustomDot />} 
                activeDot={{ r: 6, fill: '#fff', stroke: 'var(--brand)', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Incident Table */}
        <div className="card">
          <div className="section-title">Recent Incidents</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}><Spinner /></td></tr>
                ) : recentIncidents.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--tx-3)' }}>No recent incidents</td></tr>
                ) : (
                  recentIncidents.map(inc => (
                    <tr key={inc._id}>
                      <td style={{ fontWeight: 500 }}>{inc.title}</td>
                      <td>{inc.service || 'frontend'}</td>
                      <td>
                        <span className={`badge badge-${inc.severity}`}>{inc.severity}</span>
                      </td>
                      <td>
                        <span style={{ color: inc.status === 'open' ? 'var(--yellow)' : 'var(--green)', fontWeight: 500 }}>
                          {inc.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--tx-2)' }}>{new Date(inc.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4 & 5. Top Errors & AI Insights */}
        <div className="grid-2-1">
          {/* Top Errors Section */}
          <div className="card">
            <div className="section-title">Top Errors</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? <Spinner /> : recentErrors.length === 0 ? (
                <div style={{ color: 'var(--tx-3)', padding: 10 }}>No errors detected</div>
              ) : (
                recentErrors.slice(0, 5).map((err, i) => (
                  <div key={i} className="error-list-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{err.message}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--tx-2)' }}>
                        <span>Service: {err.service || 'backend'}</span>
                        <span>Env: {err.environment || 'production'}</span>
                      </div>
                    </div>
                    <span className={`badge badge-${err.severity}`}>{err.severity}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Insight Panel */}
          <div className="card" style={{ background: 'var(--bg-surface2)', border: '1px solid var(--brand)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--brand)' }} />
            <div className="section-title" style={{ color: 'var(--brand)' }}>
              <BrainCircuit size={18} /> AI Insight Panel
            </div>
            {recentIncidents.length > 0 || recentErrors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--tx-2)', textTransform: 'uppercase', marginBottom: 4 }}>Detected Anomaly</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    High error rate detected in <span style={{ color: 'var(--tx)', fontWeight: 600 }}>backend service</span> related to database connection timeouts.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--tx-2)', textTransform: 'uppercase', marginBottom: 4 }}>Root Cause Analysis</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--orange)' }}>
                    Possible DB connection pool exhaustion. Connections are not being released properly after long-running queries.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--tx-2)', textTransform: 'uppercase', marginBottom: 4 }}>Suggested Fix</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--green)' }}>
                    1. Increase Mongo connection pool size in production.<br/>
                    2. Implement strict timeout limits on heavy aggregation queries.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--tx-3)', fontSize: 13 }}>
                System is stable. No active insights to report.
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  )
}

function StatCard({ title, value, indicatorColor, onClick }) {
  return (
    <div 
      className="stat-card" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-label">{title}</div>
      <div className="stat-card-value">{value}</div>
      <div style={{ width: '100%', height: 2, background: 'var(--bd)', borderRadius: 2, marginTop: 'auto' }}>
        <div style={{ width: '30%', height: '100%', background: indicatorColor, borderRadius: 2 }} />
      </div>
    </div>
  )
}
