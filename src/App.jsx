import { useState, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import { fetchStatus } from './lib/api.js'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import PipelineStatus from './components/PipelineStatus.jsx'
import RunConsole from './components/RunConsole.jsx'
import RankingExplorer from './components/RankingExplorer.jsx'
import ConfigConsole from './components/ConfigConsole.jsx'

const POLL_MS = 15_000

export default function App() {
  const [page, setPage]           = useState('pipeline')
  const [stages, setStages]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [connected, setConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const successCount = stages.filter(s => s.result === 'success').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        page={page}
        setPage={setPage}
        connected={connected}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 44,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          background: 'var(--bg)',
          flexShrink: 0,
        }}>
          {/* Hamburger - mobile only */}
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'none',
              color: 'var(--dim)',
              padding: 4,
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>

          <Header
            page={page}
            stageCount={stages.length}
            successCount={successCount}
            inline
          />
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '24px 20px',
          overflowY: 'auto',
          maxWidth: 1100,
          width: '100%',
        }}>
          {page === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <PipelineStatus stages={stages} loading={loading} />
              <RunConsole stages={stages} onRunComplete={refresh} />
            </div>
          )}
          {page === 'ranking' && <RankingExplorer />}
          {page === 'config'  && <ConfigConsole onRunComplete={refresh} />}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
