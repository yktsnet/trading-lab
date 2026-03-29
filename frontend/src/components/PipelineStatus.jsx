import { CheckCircle, XCircle, Loader, Clock, Download, Package, Microscope, Dna, Zap, Ban, Wrench, DollarSign, BarChart, Trophy } from 'lucide-react'

const STAGE_META = {
  's1-append':  { icon: Download,    color: '#89ddff' },
  's1-export':  { icon: Package,     color: '#89ddff' },
  's1-enrich':  { icon: Microscope,  color: '#89ddff' },
  's2-gen':     { icon: Dna,         color: '#c792ea' },
  's3-calc':    { icon: Zap,         color: '#ffcb6b' },
  's4-ban':     { icon: Ban,         color: '#f07178' },
  's5-engine':  { icon: Wrench,      color: '#82aaff' },
  's6-pips':    { icon: DollarSign,  color: '#5de4c7' },
  's7-summary': { icon: BarChart,    color: '#f78c6c' },
  's8-rank':    { icon: Trophy,      color: '#5de4c7' },
}

function StatusBadge({ result, running }) {
  if (running) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', fontSize: 11, fontWeight: 600,
      color: 'var(--running)', background: '#0d1a35',
      border: '1px solid #82aaff44', borderRadius: 3,
    }}>
      <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
      RUNNING
    </span>
  )
  const MAP = {
    success: { label: 'SUCCESS', color: 'var(--success)', bg: '#0a2922', icon: CheckCircle },
    failed:  { label: 'FAILED',  color: 'var(--fail)',    bg: '#2a0f10', icon: XCircle },
    unknown: { label: '——',      color: 'var(--muted)',   bg: 'transparent', icon: null },
  }
  const s = MAP[result] ?? MAP.unknown
  const Icon = s.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', fontSize: 11, fontWeight: 600,
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`, borderRadius: 3,
    }}>
      {Icon && <Icon size={10} />}
      {s.label}
    </span>
  )
}

function relTime(iso) {
  if (!iso) return '——'
  const d = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (d < 60)    return `${d}s ago`
  if (d < 3600)  return `${Math.floor(d/60)}m ago`
  if (d < 86400) return `${Math.floor(d/3600)}h ago`
  return `${Math.floor(d/86400)}d ago`
}

function isRecent(iso) {
  if (!iso) return false
  return (Date.now() - new Date(iso)) < 15 * 60 * 1000
}

const COL = '160px 1fr 90px 120px'

export default function PipelineStatus({ stages, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 3, height: 20,
          background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent2) 100%)',
          borderRadius: 2,
        }} />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)' }}>
          PIPELINE STATUS
        </span>
      </div>

      <div style={{ border: '1px solid var(--border2)', background: 'var(--panel)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: COL,
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em',
        }}>
          <span>stage</span>
          <span>description</span>
          <span style={{ textAlign: 'right' }}>last run</span>
          <span style={{ textAlign: 'right' }}>result</span>
        </div>

        {loading && (
          <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13 }}>loading…</div>
        )}

        {!loading && stages.map((s, i) => {
          const meta = STAGE_META[s.id] || { icon: Zap, color: 'var(--dim)' }
          const Icon = meta.icon
          return (
            <div key={s.id} style={{
              display: 'grid', gridTemplateColumns: COL,
              padding: '11px 16px',
              borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#ffffff05'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon size={15} color={meta.color} strokeWidth={2} />
                <span style={{ color: meta.color, fontWeight: 600, fontSize: 13 }}>
                  {s.label}
                </span>
              </div>
              <span style={{ color: 'var(--dim)', fontSize: 13 }}>{s.description}</span>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 12, whiteSpace: 'nowrap',
                color: isRecent(s.last_run) ? 'var(--accent)' : 'var(--muted)' }}>
                <Clock size={10} />
                {relTime(s.last_run)}
                {isRecent(s.last_run) && <span style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--accent)', marginLeft: 4, padding: '1px 4px', border: '1px solid var(--accent)44', borderRadius: 2 }}>NEW</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge result={s.result} running={s.currently_running} />
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
