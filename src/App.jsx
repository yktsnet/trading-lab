import { useState, useEffect, useCallback } from 'react'
import { fetchStatus } from './lib/api.js'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import RankingExplorer from './components/RankingExplorer.jsx'
import LiveDashboard from './components/LiveDashboard.jsx'
import StatePanel from './components/StatePanel.jsx'
import PipelineConsole from './components/PipelineConsole.jsx'
import { Satellite, Terminal, Activity, BarChart2 } from 'lucide-react'

const MOBILE_NAV = [
  { id: 'live',     icon: Satellite, label: 'Live'     },
  { id: 'state',    icon: Terminal,  label: 'State'    },
  { id: 'pipeline', icon: Activity,  label: 'Pipeline' },
  { id: 'ranking',  icon: BarChart2, label: 'Ranking'  },
]

const POLL_MS = 15_000

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 700
}

export default function App() {
  const [page, setPage]           = useState('live')
  const [stages, setStages]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [connected, setConnected] = useState(false)
  const [mobile, setMobile]       = useState(isMobile())

  useEffect(() => {
    const handler = () => setMobile(isMobile())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const data = await fetchStatus()
      setStages(data)
      setConnected(true)
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const isFullHeight = !mobile && (page === 'live' || page === 'state')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar page={page} setPage={setPage} connected={connected} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header
          page={page}
          stageCount={stages.length}
          successCount={stages.filter(s => s.result === 'success').length}
        />

        <div
          className="main-content"
          style={{
            flex: 1, minHeight: 0,
            padding: isFullHeight ? '16px 16px 0' : '20px 20px 80px',
            overflowY: isFullHeight ? 'hidden' : 'auto',
            display: isFullHeight ? 'flex' : 'block',
            flexDirection: 'column',
          }}
        >
          {page === 'live'     && <LiveDashboard mobile={mobile} />}
          {page === 'state'    && <StatePanel />}
          {page === 'pipeline' && <PipelineConsole stages={stages} loading={loading} onRunComplete={refresh} />}
          {page === 'ranking'  && <RankingExplorer />}
        </div>

        <div className="desktop-footer" style={{
          borderTop: '1px solid var(--border)', padding: '6px 20px',
          fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 16,
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <span>Trading Lab</span>
          <span style={{ color: 'var(--border2)' }}>│</span>
          <span>price <span style={{ color: 'var(--dim)' }}>3s</span></span>
          <span>positions <span style={{ color: 'var(--dim)' }}>60s</span></span>
          <span>bars / state <span style={{ color: 'var(--dim)' }}>5m</span></span>
        </div>

        {/* Mobile bottom nav */}
        <div className="mobile-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--bg)', borderTop: '1px solid var(--border2)',
          display: 'none', justifyContent: 'space-around', alignItems: 'stretch',
          zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {MOBILE_NAV.map(({ id, icon: Icon, label }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '9px 4px', gap: 3,
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  background: 'none',
                  borderTop: active ? '2px solid var(--accent)' : '2px solid transparent',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 9, letterSpacing: '0.04em', fontWeight: active ? 700 : 400 }}>
                  {label.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
