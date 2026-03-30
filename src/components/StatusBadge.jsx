import { CheckCircle, XCircle, Loader } from 'lucide-react'

const MAP = {
  success: { label: 'SUCCESS', color: 'var(--success)', bg: '#0a2922', icon: CheckCircle },
  failed:  { label: 'FAILED',  color: 'var(--fail)',    bg: '#2a0f10', icon: XCircle },
  unknown: { label: '——',      color: 'var(--muted)',   bg: 'transparent', icon: null },
}

export default function StatusBadge({ result, running }) {
  if (running) return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        color: 'var(--running)',
        background: '#0d1a35',
        border: '1px solid #82aaff44',
        borderRadius: 3,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <Loader size={10} style={{ animation: 'spin 1s linear infinite', display: 'block' }} />
      <span className="badge-label">RUNNING</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </span>
  )

  const s = MAP[result] ?? MAP.unknown
  const Icon = s.icon

  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}33`,
        borderRadius: 3,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      {Icon && <Icon size={10} style={{ display: 'block' }} />}
      <span className="badge-label">{s.label}</span>
    </span>
  )
}
