import { useState, useEffect, useCallback } from 'react'
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

      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} connected={connected} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <Header
          page={page}
          stageCount={stages.length}
          successCount={successCount}
        />

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '28px 28px',
          overflowY: 'auto',
          maxWidth: 1100,
          width: '100%',
        }}>
          {page === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <PipelineStatus stages={stages} loading={loading} />
              <RunConsole stages={stages} onRunComplete={refresh} />
            </div>
          )}
          {page === 'ranking' && <RankingExplorer />}
          {page === 'config'  && <ConfigConsole onRunComplete={refresh} />}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '7px 28px',
          fontSize: 11,
          color: 'var(--muted)',
          display: 'flex',
          gap: 16,
          background: 'var(--bg)',
          flexShrink: 0,
        }}>
          <span>auto-refresh <span style={{ color: 'var(--dim)' }}>{POLL_MS/1000}s</span></span>
          <span style={{ color: 'var(--border2)' }}>│</span>
          <span>backtest pipeline console</span>
        </div>
      </div>
    </div>
  )
}
