import { Clock, Download, Package, Microscope, Dna, Zap, Ban, Wrench, DollarSign, BarChart, Trophy } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'

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

function relTime(iso) {
  if (!iso) return '——'
  const d = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (d < 60) return `${d}s ago`
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

function isRecent(iso) {
  if (!iso) return false
  return (Date.now() - new Date(iso)) < 15 * 60 * 1000
}

export default function PipelineStatus({ stages, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 3,
            height: 20,
            background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent2) 100%)',
            borderRadius: 2,
          }}
        />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)' }}>
          PIPELINE STATUS
        </span>
      </div>

      <div style={{ border: '1px solid var(--border2)', background: 'var(--panel)' }}>
        <div
          className="pipeline-grid"
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--muted)',
            letterSpacing: '0.06em',
          }}
        >
          <span>stage</span>
          <span className="col-desc">description</span>
          <span className="col-time" style={{ textAlign: 'right' }}>last run</span>
          <span style={{ textAlign: 'right' }}>result</span>
        </div>

        {loading && (
          <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13 }}>
            loading…
          </div>
        )}

        {!loading && stages.map((s, i) => {
          const meta = STAGE_META[s.id] || { icon: Zap, color: 'var(--dim)' }
          const Icon = meta.icon

          return (
            <div
              key={s.id}
              className="pipeline-grid"
              style={{
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

              <span
                className="col-desc"
                style={{
                  color: 'var(--dim)',
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.description}
              </span>

              <div
                className="col-time"
                style={{
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 4,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  color: isRecent(s.last_run) ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                <Clock size={10} />
                {relTime(s.last_run)}
                {isRecent(s.last_run) && (
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      color: 'var(--accent)',
                      marginLeft: 4,
                      padding: '1px 4px',
                      border: '1px solid var(--accent)44',
                      borderRadius: 2,
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <StatusBadge result={s.result} running={s.currently_running} />
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
  .pipeline-grid {
    display: grid;
    grid-template-columns: 140px 1fr 90px 110px;
  }

  @media (max-width: 600px) {
    .pipeline-grid {
      grid-template-columns: minmax(0, 1fr) 28px;
    }

    .col-desc { display: none; }
    .col-time { display: none; }
    .badge-label { display: none !important; }

    .status-badge {
      width: 22px;
      height: 22px;
      min-width: 22px;
      padding: 0 !important;
      gap: 0 !important;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .status-badge svg {
      width: 12px;
      height: 12px;
    }
  }
`}</style>
    </div>
  )
}
