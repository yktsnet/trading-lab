import { useState } from 'react'
import { Play, Check, AlertCircle, Terminal, ChevronDown, ChevronUp, X } from 'lucide-react'
import { triggerRun, fetchLog } from '../lib/api.js'

// state: null | 'running' | { ok: true, at: Date } | { err: true, at: Date, log: string }
export default function RunConsole({ stages, onRunComplete }) {
  const [states, setStates] = useState({})
  const [expanded, setExpanded] = useState({})

  async function handleRun(stage) {
    setStates(s => ({ ...s, [stage.id]: 'running' }))
    setExpanded(e => ({ ...e, [stage.id]: false }))

    try {
      await triggerRun(stage.id)
      const at = new Date()
      setStates(s => ({ ...s, [stage.id]: { ok: true, at } }))
      onRunComplete?.()
    } catch {
      const at = new Date()
      // fetch journal log for context
      let log = ''
      try {
        const res = await fetchLog(stage.id)
        log = res.log || ''
      } catch { log = '(log unavailable)' }
      setStates(s => ({ ...s, [stage.id]: { err: true, at, log } }))
    }
  }

  function dismiss(id) {
    setStates(s => ({ ...s, [id]: null }))
    setExpanded(e => ({ ...e, [id]: false }))
  }

  function toggleLog(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 3, height: 20,
          background: 'linear-gradient(180deg, var(--purple) 0%, var(--running) 100%)',
          borderRadius: 2,
        }} />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)' }}>
          MANUAL RUN
        </span>
      </div>

      <div style={{ border: '1px solid var(--border2)', background: 'var(--panel)' }}>
        {stages.map((s, i) => {
          const st = states[s.id]
          const isRunning = st === 'running'
          const isOk = st?.ok
          const isErr = st?.err
          const hasLog = isErr && st.log
          const isExpanded = expanded[s.id]
          const last = isOk || isErr
            ? st.at.toUTCString().slice(17, 25) + ' UTC'
            : null

          return (
            <div key={s.id} style={{
              borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              {/* Main row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 140px 1fr auto',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 16px',
                  background: isErr ? '#f0717808' : 'transparent',
                  transition: 'background 0.1s',
                  cursor: isRunning ? 'default' : 'pointer',
                }}
                onClick={() => !isRunning && !isErr && handleRun(s)}
                onMouseEnter={e => { if (!isRunning && !isErr) e.currentTarget.style.background = '#ffffff06' }}
                onMouseLeave={e => { if (!isErr) e.currentTarget.style.background = 'transparent' }}
              >
                {/* icon */}
                <span style={{
                  color: isOk ? 'var(--success)' : isErr ? 'var(--fail)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {isRunning ? <Play size={13} /> : isOk ? <Check size={13} /> : isErr ? <AlertCircle size={13} /> : <Terminal size={13} />}
                </span>

                {/* command name */}
                <span style={{
                  color: isOk ? 'var(--success)' : isErr ? 'var(--fail)' : 'var(--bright)',
                  fontWeight: 600, fontSize: 13,
                }}>
                  {isRunning ? s.label + '…' : s.label.toLowerCase().replace(' ', '-')}
                </span>

                {/* description / status */}
                <span style={{ color: isErr ? 'var(--fail)' : 'var(--dim)', fontSize: 13 }}>
                  {isRunning ? 'starting…'
                   : isOk ? `triggered · ${last}`
                   : isErr ? `failed · ${last}`
                   : s.description}
                </span>

                {/* right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isErr && hasLog && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleLog(s.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, color: 'var(--fail)',
                        padding: '2px 8px',
                        border: '1px solid #f0717833',
                        borderRadius: 3,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      log
                    </button>
                  )}
                  {isErr && (
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(s.id) }}
                      style={{
                        display: 'flex', alignItems: 'center',
                        color: 'var(--muted)', padding: '2px 4px',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                  {!isErr && (
                    <span style={{
                      fontSize: 11,
                      color: isRunning ? 'var(--running)' : 'var(--dim)',
                      padding: '3px 10px',
                      border: `1px solid ${isRunning ? 'var(--running)' : 'var(--border2)'}`,
                      borderRadius: 3,
                      letterSpacing: '0.05em',
                    }}>
                      {isRunning ? '…' : isOk ? '✓' : 'run'}
                    </span>
                  )}
                </div>
              </div>

              {/* Log panel */}
              {isErr && isExpanded && hasLog && (
                <div style={{
                  padding: '12px 16px',
                  background: '#0a0c14',
                  borderTop: '1px solid #f0717822',
                }}>
                  <pre style={{
                    fontSize: 11,
                    color: '#f07178cc',
                    fontFamily: 'var(--fn)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                    margin: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {st.log}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
