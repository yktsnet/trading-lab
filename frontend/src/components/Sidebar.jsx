import { Activity, BarChart2, Settings, Radio, TrendingUp } from 'lucide-react'

const NAV = [
  { id: 'pipeline', icon: Activity,  label: 'Pipeline',  sub: 'S1 → S8 status' },
  { id: 'ranking',  icon: BarChart2, label: 'Ranking',   sub: 'Strategy results' },
  { id: 'config',   icon: Settings,  label: 'Config',    sub: 'S8 parameters' },
]

export default function Sidebar({ page, setPage, connected }) {
  return (
    <div style={{
      width: 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--bg)',
      borderRight: '1px solid var(--border2)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        padding: '28px 20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
        }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--panel2)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={17} color="var(--accent)" strokeWidth={2.5} />
          </div>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--bright)',
          }}>Trading Lab</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: '0.05em' }}>
          backtest · strategy selection
        </div>

        {/* Connection status */}
        <div style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 11,
          letterSpacing: '0.05em',
        }}>
          <Radio size={12} color={connected ? 'var(--success)' : 'var(--fail)'} />
          <span style={{ color: connected ? 'var(--success)' : 'var(--fail)' }}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
          <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--muted)' }}>het</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 8px', flex: 1 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          color: 'var(--muted)',
          padding: '4px 12px 8px',
        }}>NAVIGATE</div>

        {NAV.map(({ id, icon: Icon, label, sub }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                marginBottom: 2,
                background: active ? 'var(--panel2)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                textAlign: 'left',
                transition: 'all 0.1s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon
                size={16}
                color={active ? 'var(--accent)' : 'var(--dim)'}
                strokeWidth={active ? 2.5 : 2}
              />
              <div>
                <div style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--bright)' : 'var(--text)',
                  letterSpacing: '0.02em',
                }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--muted)',
        letterSpacing: '0.05em',
      }}>
        USDJPY M5 · 2021–2026
      </div>
    </div>
  )
}
