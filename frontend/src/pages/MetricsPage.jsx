import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Spinner } from '../components/ui'
import api from '../lib/api'
import { Activity, Server, Clock, Database, Layers } from 'lucide-react'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/system/health')
      setMetrics(res.data.data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Failed to load system metrics.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    // Auto refresh metrics every 15 seconds
    const interval = setInterval(fetchMetrics, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <Layout title="System Metrics">
        <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="System Metrics">
        <div style={{ color: 'var(--red)', padding: 20 }}>{error}</div>
      </Layout>
    )
  }

  // Parse HTTP Latency (from Prometheus Histogram)
  // Usually metrics.httpLatency is an array of objects: { labels: { route, method }, value }
  const httpLatency = metrics?.httpLatency || []
  // Filter for "_sum" or average out if needed. For now just raw dump or formatting.
  const latencies = httpLatency.filter(h => !h.metricName?.includes('bucket')).slice(0, 10)

  // Parse Queue Health
  const queueHealth = metrics?.queueHealth || []
  const waitingJobs = queueHealth.find(q => q.name === "opusguard_queue_jobs_waiting")?.values || []
  const completedJobs = queueHealth.find(q => q.name === "opusguard_queue_jobs_completed_total")?.values || []
  const failedJobs = queueHealth.find(q => q.name === "opusguard_queue_jobs_failed_total")?.values || []

  // Default CPU/Memory metrics are prefixed with "opusguard_" but collected automatically by prom-client
  // Usually "opusguard_process_resident_memory_bytes", "opusguard_process_cpu_user_seconds_total"
  
  return (
    <Layout title="System Metrics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header Alert */}
        <div className="card" style={{ background: 'var(--bg-surface2)', border: '1px solid var(--brand)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Server size={24} color="var(--brand)" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)' }}>Live Server Observability</div>
            <div style={{ fontSize: 13, color: 'var(--tx-3)', marginTop: 4 }}>Prometheus telemetry automatically refreshes every 15 seconds.</div>
          </div>
        </div>

        <div className="grid-2-1">
          {/* API Latency Table */}
          <div className="card">
            <div className="section-title">
              <Clock size={18} /> API Latency & Traffic
            </div>
            {latencies.length === 0 ? (
              <div style={{ color: 'var(--tx-3)', fontSize: 13 }}>No traffic recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latencies.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{l.labels?.method || 'ANY'}</td>
                        <td>{l.labels?.route || l.labels?.path || '/'}</td>
                        <td>
                          <span className={l.labels?.code >= 400 ? 'badge badge-critical' : 'badge badge-low'}>
                            {l.labels?.code || '200'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--tx-2)' }}>{typeof l.value === 'number' ? l.value.toFixed(2) : l.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Background Queues (BullMQ) */}
          <div className="card">
            <div className="section-title">
              <Layers size={18} /> Background Queues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 12, color: 'var(--tx-2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Incidents Queue</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Waiting Jobs:</span>
                  <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{waitingJobs.find(v => v.labels?.queue === 'incident-queue')?.value || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Completed:</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{completedJobs.find(v => v.labels?.queue === 'incident-queue')?.value || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Failed:</span>
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>{failedJobs.find(v => v.labels?.queue === 'incident-queue')?.value || 0}</span>
                </div>
              </div>
              
              <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 12, color: 'var(--tx-2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Email Queue</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Waiting Jobs:</span>
                  <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{waitingJobs.find(v => v.labels?.queue === 'email-queue')?.value || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Completed:</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{completedJobs.find(v => v.labels?.queue === 'email-queue')?.value || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tx-3)', fontSize: 13 }}>Failed:</span>
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>{failedJobs.find(v => v.labels?.queue === 'email-queue')?.value || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}
