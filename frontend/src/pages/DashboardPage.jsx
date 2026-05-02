import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Spinner } from '../components/ui'
import api from '../lib/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, Siren, Flame, Activity } from 'lucide-react'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-surface2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ color: 'var(--tx-3)', marginBottom: 3, fontSize: 11 }}>{label}</div>
      <div style={{ color: 'var(--tx)', fontWeight: 600, fontSize: 14 }}>{payload[0].value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [errorStats,    setErrorStats]    = useState(null)
  const [incidentStats, setIncidentStats] = useState(null)
  const [loadingE, setLoadingE] = useState(true)
  const [loadingI, setLoadingI] = useState(true)

  useEffect(() => {
    api.get('/errors/stats')
      .then(({ data }) => setErrorStats(data.data))
      .catch(console.error)
      .finally(() => setLoadingE(false))

    api.get('/incidents/stats')
      .then(({ data }) => setIncidentStats(data.data))
      .catch(console.error)
      .finally(() => setLoadingI(false))
  }, [])

  const totalErrors    = errorStats?.total ?? 0
  const criticalCount  = errorStats?.bySeverity?.find(s => s._id === 'critical')?.count ?? 0
  const openIncidents  = incidentStats?.statusCounts?.find(s => s._id === 'open')?.count ?? 0
  const totalIncidents = incidentStats?.statusCounts?.reduce((a, b) => a + b.count, 0) ?? 0

  const errorTrend    = (errorStats?.last7Days    || []).map(d => ({ date: d._id, count: d.count }))
  const incidentTrend = (incidentStats?.recentTrend || []).map(d => ({ date: d._id, count: d.count }))

  const loading = loadingE || loadingI

  return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Stat cards ── */}
        <div className="grid-4">
          <StatCard
            icon={<AlertTriangle size={16} />}
            iconColor="var(--yellow)" iconBg="var(--yellow-bg)"
            value={loading ? '—' : totalErrors}
            label="Total Errors"
            delta="+12% vs last week"
          />
          <StatCard
            icon={<Siren size={16} />}
            iconColor="var(--blue)" iconBg="var(--blue-bg)"
            value={loading ? '—' : totalIncidents}
            label="Total Incidents"
          />
          <StatCard
            icon={<Flame size={16} />}
            iconColor="var(--red)" iconBg="var(--red-bg)"
            value={loading ? '—' : criticalCount}
            label="Critical Issues"
          />
          <StatCard
            icon={<Activity size={16} />}
            iconColor="var(--brand-light)" iconBg="var(--brand-dim)"
            value={loading ? '—' : openIncidents}
            label="Open Incidents"
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid-2">
          <div className="card">
            <div className="section-title">Errors — Last 7 Days</div>
            {loadingE ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={errorTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6c5fc7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c5fc7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--bd-light)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--tx-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--tx-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#6c5fc7" strokeWidth={2} fill="url(#errGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="section-title">Incident Frequency — Last 7 Days</div>
            {loadingI ? <Spinner /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={incidentTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="var(--bd-light)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--tx-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--tx-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#6c5fc7" radius={[3, 3, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Severity breakdown ── */}
        {!loadingE && errorStats?.bySeverity?.length > 0 && (
          <div className="card">
            <div className="section-title">Errors by Severity</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {errorStats.bySeverity.map(({ _id: sev, count }) => (
                <div key={sev} style={{
                  background: 'var(--bg-surface2)',
                  border: '1px solid var(--bd)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 20px',
                  minWidth: 110,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--tx)', lineHeight: 1 }}>{count}</div>
                  <span className={`badge badge-${sev}`}>{sev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

function StatCard({ icon, iconColor, iconBg, value, label, delta }) {
  return (
    <div className="stat-card">
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {delta && <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 2 }}>{delta}</div>}
    </div>
  )
}
