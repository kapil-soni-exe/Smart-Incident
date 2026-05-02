// Shared UI primitives — badges, spinner, time formatter

export function SeverityBadge({ severity }) {
  return <span className={`badge badge-${severity}`}>{severity}</span>
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{
        width: 24, height: 24,
        border: '2px solid var(--bd)',
        borderTopColor: 'var(--brand)',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }} />
    </div>
  )
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
