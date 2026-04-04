import { useState, useEffect, useRef } from 'react'
import { fetchLiveMetrics } from '../lib/api.js'

const POLL_MS = 5 * 60_000

export function useLiveMetrics() {
  const [latency, setLatency] = useState([])
  const [barLag,  setBarLag]  = useState([])
  const timer = useRef(null)

  async function load() {
    try {
      const json = await fetchLiveMetrics()
      setLatency(json.latency ?? [])
      setBarLag (json.bar_lag ?? [])
    } catch {}
  }

  useEffect(() => {
    load()
    timer.current = setInterval(load, POLL_MS)
    return () => clearInterval(timer.current)
  }, [])

  return { latency, barLag }
}

// ── カラー ────────────────────────────────────────────────

const C_BASE = '#4a7d8c'
const C_WARN = '#7a6535'
const C_FAIL = '#7a4040'
const C_GRID = '#2a2a2a'

function barColor(v, heatMode) {
  if (!heatMode) return C_BASE
  const r = v / 300
  if (r > 0.85) return C_FAIL
  if (r > 0.55) return C_WARN
  return C_BASE
}

function niceMax(raw) {
  if (raw <= 0) return 1
  const exp  = Math.pow(10, Math.floor(Math.log10(raw)))
  const nice = [1, 2, 5, 10].map(f => f * exp).find(n => n >= raw)
  return nice || raw * 1.2
}

function fmtSec(s) {
  if (s === 0) return '0s'
  if (s >= 60) return `${Math.round(s / 60)}m`
  return `${Math.round(s)}s`
}

const SVG_W = 600
const Y_PAD = 28

function MiniBar({ data, height = 54, heatMode = false }) {
  if (!data || !data.length) return (
    <div style={{ height, display: 'flex', alignItems: 'center', paddingLeft: Y_PAD }}>
      <span style={{ fontSize: 10, color: '#555' }}>no data</span>
    </div>
  )

  const rawMax = heatMode ? 300 : Math.max(...data.map(d => d.v))
  const max    = heatMode ? 300 : niceMax(rawMax * 1.05)
  const ticks  = [max, max / 2, 0]

  return (
    <div style={{ position: 'relative', height }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: Y_PAD, height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        paddingBottom: 1,
      }}>
        {ticks.map((t, i) => (
          <span key={i} style={{
            fontSize: 9, color: '#484848', lineHeight: 1,
            textAlign: 'right', paddingRight: 4,
          }}>
            {fmtSec(t)}
          </span>
        ))}
      </div>

      <div style={{ position: 'absolute', top: 0, left: Y_PAD, right: 0, height: '100%' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${height}`}
          width="100%" height="100%"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          {ticks.map((t, i) => {
            const y = height - (t / max) * height
            return <line key={i} x1={0} y1={y} x2={SVG_W} y2={y} stroke={C_GRID} strokeWidth={1} />
          })}
          {data.map((d, i) => {
            const barW = Math.max(1.5, SVG_W / data.length - 1)
            const x    = (i / data.length) * SVG_W
            const barH = Math.max(2, Math.min(d.v / max, 1) * height)
            return (
              <rect key={i} x={x} y={height - barH} width={barW} height={barH}
                fill={barColor(d.v, heatMode)} rx={1} />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function MetricBox({ label, desc, data, heatMode = false }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--panel)',
      border: '1px solid var(--border2)',
      borderRadius: 6,
      padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
          color: 'var(--dim)', fontWeight: 600,
        }}>
          {label}
        </span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>{desc}</span>
      </div>
      <MiniBar data={data?.slice(-80)} height={80} heatMode={heatMode} />
    </div>
  )
}

export function MetricRow({ latency, barLag, mobile }) {
  if (!latency.length && !barLag.length) return null

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      flexShrink: 0,
      flexDirection: mobile ? 'column' : 'row',
    }}>
      <MetricBox label="latency" desc="bar close → order send (s)" data={latency} />
      <MetricBox label="freshness" desc="bar data lag (s)" data={barLag} heatMode />
    </div>
  )
}
