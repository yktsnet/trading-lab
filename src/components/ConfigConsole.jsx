import { useState, useEffect } from 'react'
import { Play, Info, TrendingDown, CalendarDays, Target } from 'lucide-react'
import { fetchConfig, saveConfig, triggerRun } from '../lib/api.js'

const PARAMS = [
  {
    key: 'S8_DD_THR',
    label: 'DD Threshold',
    Icon: TrendingDown,
    iconColor: '#f07178',
    description: 'Max drawdown ratio. Strategies exceeding this over full period are excluded.',
    min: 0.3, max: 1.0, step: 0.05, default: 0.7,
    format: v => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: 'S8_RANK_MONTHS',
    label: 'Ranking Period',
    Icon: CalendarDays,
    iconColor: '#89ddff',
    description: 'Number of recent months used for ranking evaluation.',
    min: 3, max: 36, step: 3, default: 12,
    format: v => `${v}mo`,
  },
  {
    key: 'S8_MIN_ENTRIES',
    label: 'Min Entries',
    Icon: Target,
    iconColor: '#5de4c7',
    description: 'Minimum number of entries in the ranking period to qualify.',
    min: 5, max: 100, step: 5, default: 20,
    format: v => `${v}`,
  },
]

function Slider({ param, value, onChange }) {
  const pct = ((value - param.min) / (param.max - param.min)) * 100
  const Icon = param.Icon

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border2)',
      borderRadius: 6,
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: param.iconColor + '18',
            border: `1px solid ${param.iconColor}33`,
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={17} color={param.iconColor} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--bright)', fontSize: 14 }}>
              {param.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 3, maxWidth: 360, lineHeight: 1.5 }}>
              {param.description}
            </div>
          </div>
        </div>
        <div style={{
          fontSize: 24, fontWeight: 700,
          color: 'var(--accent)',
          minWidth: 70, textAlign: 'right',
          letterSpacing: '-0.02em',
        }}>
          {param.format(value)}
        </div>
      </div>

      {/* Custom slider */}
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          background: 'var(--border2)', borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', left: 0, width: `${pct}%`, height: 4,
          background: `linear-gradient(90deg, var(--accent2), var(--accent))`,
          borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 1px)`,
          width: 2, height: 16,
          background: 'var(--accent)',
          borderRadius: 1,
          boxShadow: '0 0 6px var(--accent)',
          pointerEvents: 'none',
        }} />
        <input
          type="range"
          min={param.min} max={param.max} step={param.step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', left: 0, right: 0,
            width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--muted)', marginTop: 6,
      }}>
        <span>{param.format(param.min)}</span>
        <span>{param.format(param.max)}</span>
      </div>
    </div>
  )
}

export default function ConfigConsole({ onRunComplete }) {
  const [values, setValues] = useState({
    S8_DD_THR: 0.7,
    S8_RANK_MONTHS: 12,
    S8_MIN_ENTRIES: 20,
  })
  const [runState, setRunState] = useState(null)

  useEffect(() => {
    fetchConfig().then(cfg => {
      if (cfg) setValues(v => ({ ...v, ...cfg }))
    }).catch(() => {})
  }, [])

  async function handleApply() {
    setRunState('running')
    try {
      await saveConfig(values)
      await triggerRun('s8-rank')
      setRunState('ok')
      onRunComplete?.()
      setTimeout(() => setRunState(null), 4000)
    } catch {
      setRunState('err')
      setTimeout(() => setRunState(null), 4000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 3, height: 20,
          background: 'linear-gradient(180deg, var(--warn) 0%, var(--accent) 100%)',
          borderRadius: 2,
        }} />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)' }}>
          S8 PARAMETERS
        </span>
      </div>

      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        padding: '12px 16px',
        background: '#89ddff10',
        border: '1px solid #89ddff22',
        borderRadius: 6, fontSize: 12, color: 'var(--dim)',
      }}>
        <Info size={14} style={{ marginTop: 1, flexShrink: 0, color: 'var(--accent2)' }} />
        <span>
          Changing these parameters only re-runs <strong style={{ color: 'var(--bright)' }}>S8</strong>.
          Full pipeline re-runs (S3–S7) must be triggered manually from Pipeline view.
        </span>
      </div>

      {PARAMS.map(p => (
        <Slider
          key={p.key}
          param={p}
          value={values[p.key]}
          onChange={v => setValues(prev => ({ ...prev, [p.key]: v }))}
        />
      ))}

      <button
        onClick={handleApply}
        disabled={runState === 'running'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '14px',
          background: runState === 'ok' ? '#0a2922' : runState === 'err' ? '#2a0f10' : 'var(--accent)',
          color: runState === 'ok' ? 'var(--success)' : runState === 'err' ? 'var(--fail)' : '#0d0f17',
          border: 'none', borderRadius: 6,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
          cursor: runState === 'running' ? 'default' : 'pointer',
          opacity: runState === 'running' ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        <Play size={14} />
        {runState === 'running' ? 'Running S8…'
         : runState === 'ok' ? 'S8 triggered'
         : runState === 'err' ? 'Failed'
         : 'Apply & Run S8'}
      </button>
    </div>
  )
}
