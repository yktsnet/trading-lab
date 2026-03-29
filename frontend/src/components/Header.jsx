import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

function utcClock() {
  const now = new Date()
  return now.toUTCString().slice(17, 25) + ' UTC'
}

export default function Header({ page, stageCount, successCount }) {
  const [time, setTime] = useState(utcClock())

  useEffect(() => {
    const id = setInterval(() => setTime(utcClock()), 1000)
    return () => clearInterval(id)
  }, [])

  const PAGE_LABEL = {
    pipeline: '⚡ Pipeline Status',
    ranking:  '📊 Strategy Ranking',
    config:   '⚙️  Config',
  }

  return (
    <div style={{
      height: 44,
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      background: 'var(--bg)',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--bright)',
        letterSpacing: '0.03em',
        flex: 1,
      }}>
        {PAGE_LABEL[page] || page}
      </span>

      {page === 'pipeline' && (
        <span style={{ fontSize: 12, color: 'var(--dim)' }}>
          <span style={{ color: 'var(--accent)' }}>{successCount}</span>
          <span style={{ color: 'var(--muted)' }}>/{stageCount}</span>
          {' '}ok
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--dim)', fontSize: 12 }}>
        <Clock size={12} />
        <span style={{ color: 'var(--text)' }}>{time}</span>
      </div>
    </div>
  )
}
