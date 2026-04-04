import { Activity, BarChart2, Radio, TrendingUp, Satellite, Terminal } from 'lucide-react'

const LIVE_NAV = [
  { id: 'live',  icon: Satellite, label: 'Live',  sub: 'Positions · Bars' },
  { id: 'state', icon: Terminal,  label: 'State', sub: 'Exec pipeline'     },
]
const BT_NAV = [
  { id: 'pipeline', icon: Activity,  label: 'Pipeline', sub: 'S1→S8 · config'  },
  { id: 'ranking',  icon: BarChart2, label: 'Ranking',  sub: 'Strategy results' },
]

function NavItem({ icon: Icon, label, sub, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        width: '100%', padding: '8px 12px', borderRadius: 5, marginBottom: 2,
        background: active ? 'var(--panel2)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        textAlign: 'left', cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon size={15} color={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth={active ? 2.5 : 2} />
      <div>
        <div style={{
          fontSize: 13, fontWeight: active ? 600 : 400,
          color: active ? 'var(--bright)' : 'var(--text)',
          letterSpacing: '0.02em',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  )
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)',
      padding: '10px 12px 4px', userSelect: 'none',
    }}>
      {children}
    </div>
  )
}

export default function Sidebar({ page, setPage, connected }) {
  return (
    <div
      className="sidebar"
      style={{
        width: 'var(--sidebar-w)', minHeight: '100vh',
        background: 'var(--bg)', borderRight: '1px solid var(--border2)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--panel2)', borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrendingUp size={14} color="var(--accent)" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--bright)' }}>
            Trading Lab
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.05em' }}>USDJPY · M5</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <Radio size={10} color={connected ? 'var(--success)' : 'var(--fail)'} />
          <span style={{ color: connected ? 'var(--success)' : 'var(--fail)' }}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
          <span style={{ color: 'var(--muted)', marginLeft: 2 }}>demo</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '6px 8px 0', flex: 1 }}>
        <Label>LIVE</Label>
        {LIVE_NAV.map(n => (
          <NavItem key={n.id} {...n} active={page === n.id} onClick={() => setPage(n.id)} />
        ))}
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />
        <Label>BACKTEST</Label>
        {BT_NAV.map(n => (
          <NavItem key={n.id} {...n} active={page === n.id} onClick={() => setPage(n.id)} />
        ))}
      </div>

      {/* DEMO badge */}
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
  )
}
