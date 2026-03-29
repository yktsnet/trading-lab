import { useState, useEffect } from 'react'
import { TrendingUp, Sigma, Trophy, AlertTriangle, JapaneseYen, Euro, DollarSign } from 'lucide-react'
import { fetchRanking } from '../lib/api.js'

const SESSIONS = ['tyo', 'lon', 'nyc']
const SESSION_META = {
  tyo: { label: 'TYO', Icon: JapaneseYen, hours: '00–07 UTC', color: '#89ddff' },
  lon: { label: 'LON', Icon: Euro,         hours: '07–13 UTC', color: '#c792ea' },
  nyc: { label: 'NYC', Icon: DollarSign,   hours: '13–17 UTC', color: '#f78c6c' },
}

function tidColor(id) {
  const n = parseInt(id.replace(/[^0-9]/g, '')) || 1
  const palette = [
    '#89ddff', '#5de4c7', '#c792ea', '#ffcb6b',
    '#f78c6c', '#82aaff', '#f07178', '#b2ccd6',
  ]
  return palette[(n - 1) % palette.length]
}

function PipsBar({ value, max }) {
  const pct = Math.min(Math.abs(value) / Math.max(max, 1) * 100, 100)
  const positive = value >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 80, height: 4,
        background: 'var(--border)',
        borderRadius: 2, overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: positive ? 'var(--success)' : 'var(--fail)',
          borderRadius: 2, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: positive ? 'var(--success)' : 'var(--fail)',
        minWidth: 54, textAlign: 'right',
      }}>
        {value > 0 ? '+' : ''}{value?.toFixed(1)}
      </span>
    </div>
  )
}

export default function RankingExplorer() {
  const [session, setSession] = useState('tyo')
  const [sortBy, setSortBy]   = useState('avg')
  const [data, setData]       = useState({ avg: [], sum: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchRanking(session).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [session])

  const rows = sortBy === 'avg' ? data.avg : data.sum
  const maxPipsSum = Math.max(...rows.map(r => Math.abs(r.pips_sum_total || 0)), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 3, height: 20,
          background: 'linear-gradient(180deg, var(--warn) 0%, var(--orange) 100%)',
          borderRadius: 2,
        }} />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)' }}>
          STRATEGY RANKING
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Session tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SESSIONS.map(s => {
            const m = SESSION_META[s]
            const active = session === s
            const Icon = m.Icon
            return (
              <button
                key={s}
                onClick={() => setSession(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px',
                  fontSize: 12, fontWeight: active ? 700 : 400,
                  letterSpacing: '0.06em',
                  color: active ? m.color : 'var(--dim)',
                  background: active ? 'var(--panel2)' : 'transparent',
                  border: `1px solid ${active ? m.color + '66' : 'var(--border2)'}`,
                  borderRadius: 4,
                  transition: 'all 0.1s',
                }}
              >
                <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                {m.label}
                <span style={{ fontSize: 10, color: active ? m.color + 'aa' : 'var(--muted)' }}>
                  {m.hours}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'avg', icon: TrendingUp, label: 'Avg pips' },
            { id: 'sum', icon: Sigma,      label: 'Total pips' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setSortBy(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', fontSize: 12,
                color: sortBy === id ? 'var(--accent)' : 'var(--dim)',
                background: sortBy === id ? '#0a2922' : 'transparent',
                border: `1px solid ${sortBy === id ? 'var(--accent)66' : 'var(--border2)'}`,
                borderRadius: 4,
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border2)', background: 'var(--panel)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 80px 1fr 110px 140px 90px',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em',
        }}>
          <span>#</span>
          <span>type</span>
          <span>strategy</span>
          <span style={{ textAlign: 'right' }}>entries</span>
          <span>pips total</span>
          <span style={{ textAlign: 'right' }}>avg/entry</span>
        </div>

        {loading && (
          <div style={{ padding: '24px 16px', color: 'var(--muted)', textAlign: 'center', fontSize: 13 }}>
            loading…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div style={{ padding: '24px 16px', color: 'var(--muted)', textAlign: 'center', fontSize: 13 }}>
            <AlertTriangle size={16} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
            No data. Run S8 first.
          </div>
        )}

        {!loading && rows.map((r, i) => {
          const color = tidColor(r.id)
          const rankIcon = i === 0 ? <Trophy size={13} color="#ffcb6b" /> : i === 1 ? <Trophy size={13} color="#b2ccd6" /> : i === 2 ? <Trophy size={13} color="#f78c6c" /> : null
          return (
            <div key={`${r.id}-${r.slug}`} style={{
              display: 'grid',
              gridTemplateColumns: '44px 80px 1fr 110px 140px 90px',
              padding: '10px 16px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#ffffff05'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: i < 3 ? 'var(--warn)' : 'var(--muted)',
                display: 'flex', alignItems: 'center',
              }}>
                {rankIcon || <span style={{ color: 'var(--muted)' }}>{i + 1}</span>}
              </span>

              <span style={{
                display: 'inline-block',
                padding: '2px 8px', fontSize: 11, fontWeight: 700,
                color, background: color + '18',
                border: `1px solid ${color}44`,
                borderRadius: 3, letterSpacing: '0.04em',
              }}>
                {r.id}
              </span>

              <span style={{ color: 'var(--text)', fontSize: 12 }}>
                {r.slug?.replace(/_/g, ' ')}
              </span>

              <span style={{ textAlign: 'right', color: 'var(--dim)', fontSize: 12 }}>
                {Number(r.entries_total)?.toLocaleString()}
              </span>

              <PipsBar value={r.pips_sum_total} max={maxPipsSum} />

              <span style={{
                textAlign: 'right', fontSize: 13, fontWeight: 600,
                color: (r.pips_avg_per_entry || 0) >= 0 ? 'var(--success)' : 'var(--fail)',
              }}>
                {r.pips_avg_per_entry > 0 ? '+' : ''}{Number(r.pips_avg_per_entry)?.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>

      {!loading && rows.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
          {rows.length} strategies · last 12 months
        </div>
      )}
    </div>
  )
}
