import { Activity, BarChart2, Settings, Radio, TrendingUp, X, Menu } from 'lucide-react'

const NAV = [
  { id: 'pipeline', icon: Activity,  label: 'Pipeline',  sub: 'S1 → S8 status' },
  { id: 'ranking',  icon: BarChart2, label: 'Ranking',   sub: 'Strategy results' },
  { id: 'config',   icon: Settings,  label: 'Config',    sub: 'S8 parameters' },
]

export default function Sidebar({ page, setPage, connected, open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 40,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <div style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--bg)',
        borderRight: '1px solid var(--border2)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}
        className={`sidebar ${open ? 'sidebar-open' : ''}`}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                background: 'var(--panel2)',
                border: '1px solid var(--border2)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <TrendingUp size={17} color="var(--accent)" strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: 15, fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--bright)',
              }}>Trading Lab</span>
            </div>
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="mobile-only"
              style={{ color: 'var(--dim)', padding: 4, display: 'none' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.05em', marginTop: 6 }}>
            backtest · strategy selection
          </div>

          {/* Connection status */}
          <div style={{
            marginTop: 14,
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 11, letterSpacing: '0.05em',
          }}>
            <Radio size={11} color={connected ? 'var(--success)' : 'var(--fail)'} />
            <span style={{ color: connected ? 'var(--success)' : 'var(--fail)' }}>
              {connected ? 'CONNECTED' : 'OFFLINE'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>VPS#1</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '12px 8px', flex: 1 }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.12em',
            color: 'var(--muted)', padding: '4px 12px 8px',
          }}>NAVIGATE</div>

          {NAV.map(({ id, icon: Icon, label, sub }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => { setPage(id); onClose?.() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '10px 12px',
                  borderRadius: 6, marginBottom: 2,
                  background: active ? 'var(--panel2)' : 'transparent',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  textAlign: 'left', transition: 'all 0.1s', cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={16}
                  color={active ? 'var(--accent)' : 'var(--dim)'}
                  strokeWidth={active ? 2.5 : 2}
                />
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? 'var(--bright)' : 'var(--text)',
                    letterSpacing: '0.02em',
                  }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Demo badge */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: 10, color: 'var(--warn)',
          letterSpacing: '0.08em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            padding: '2px 6px',
            background: '#ffcb6b18',
            border: '1px solid #ffcb6b44',
            borderRadius: 3,
          }}>DEMO</span>
          <span style={{ color: 'var(--muted)' }}>mock data only</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
          }
          .sidebar.sidebar-open {
            transform: translateX(0);
          }
          .mobile-overlay { display: block !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </>
  )
}
