import { useState } from 'react'
import { Play, Check, AlertCircle, Terminal, ChevronDown, ChevronUp, X, Zap } from 'lucide-react'
import { triggerRun, fetchLog } from '../lib/api.js'

const FAILED_IDS = ['s4-ban', 's7-summary']

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
      let log = ''
      try { const res = await fetchLog(stage.id); log = res.log || '' } catch { log = '(ログ取得失敗)' }
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

  // ステージがFAILED状態かつrunしていないものにヒントを出す
  const failedStages = (stages || []).filter(s =>
    FAILED_IDS.includes(s.id) && s.result === 'failed' && !states[s.id]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 3, height: 20,
          background: 'linear-gradient(180deg, var(--purple) 0%, var(--running) 100%)',
          borderRadius: 2,
        }} />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)' }}>
          手動実行
        </span>
      </div>

      {/* Demo hint - エラーを試してみてのバナー */}
      {failedStages.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#f0717810',
          border: '1px solid #f0717833',
          borderRadius: 6,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          fontSize: 12,
        }}>
          <Zap size={14} color="var(--warn)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <span style={{ color: 'var(--warn)', fontWeight: 600 }}>エラーが発生しているステージがあります。</span>
            <span style={{ color: 'var(--dim)', marginLeft: 6 }}>
              下の <span style={{ color: 'var(--fail)' }}>{failedStages.map(s => s.label).join('・')}</span> の run を押すと、エラーログをその場で確認できます。
            </span>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid var(--border2)', background: 'var(--panel)' }}>
        {(stages || []).map((s, i) => {
          const st = states[s.id]
          const isRunning = st === 'running'
          const isOk = st?.ok
          const isErr = st?.err
          const hasLog = isErr && st.log
          const isExpanded = expanded[s.id]
          const last = (isOk || isErr)
            ? st.at.toUTCString().slice(17, 25) + ' UTC'
            : null

          // 初期状態でFAILEDなステージは赤みがかった背景
          const initFailed = FAILED_IDS.includes(s.id) && s.result === 'failed' && !st

          return (
            <div key={s.id} style={{
              borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 120px 1fr auto',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 16px',
                  background: isErr ? '#f0717808' : initFailed ? '#f0717805' : 'transparent',
                  transition: 'background 0.1s',
                  cursor: isRunning ? 'default' : 'pointer',
                }}
                onClick={() => !isRunning && !isErr && handleRun(s)}
                onMouseEnter={e => { if (!isRunning && !isErr && !initFailed) e.currentTarget.style.background = '#ffffff06' }}
                onMouseLeave={e => { if (!isErr && !initFailed) e.currentTarget.style.background = 'transparent' }}
              >
                {/* icon */}
                <span style={{
                  color: isOk ? 'var(--success)' : isErr || initFailed ? 'var(--fail)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {isRunning ? <Play size={13} /> : isOk ? <Check size={13} /> : isErr || initFailed ? <AlertCircle size={13} /> : <Terminal size={13} />}
                </span>

                {/* label */}
                <span style={{
                  color: isOk ? 'var(--success)' : isErr || initFailed ? 'var(--fail)' : 'var(--bright)',
                  fontWeight: 600, fontSize: 13,
                }}>
                  {isRunning ? s.label + '…' : s.label}
                </span>

                {/* description */}
                <span style={{ color: isErr ? 'var(--fail)' : 'var(--dim)', fontSize: 13 }}>
                  {isRunning ? '実行中…'
                   : isOk ? `完了 · ${last}`
                   : isErr ? `エラー · ${last}`
                   : s.description}
                </span>

                {/* actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isErr && hasLog && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleLog(s.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, color: 'var(--fail)',
                        padding: '2px 8px',
                        border: '1px solid #f0717833', borderRadius: 3,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      ログ
                    </button>
                  )}
                  {isErr && (
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(s.id) }}
                      style={{ color: 'var(--muted)', padding: '2px 4px', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                  {!isErr && (
                    <span style={{
                      fontSize: 11,
                      color: isRunning ? 'var(--running)' : initFailed ? 'var(--fail)' : 'var(--dim)',
                      padding: '3px 10px',
                      border: `1px solid ${isRunning ? 'var(--running)' : initFailed ? '#f0717844' : 'var(--border2)'}`,
                      borderRadius: 3, letterSpacing: '0.05em',
                    }}>
                      {isRunning ? '…' : isOk ? '✓' : 'run'}
                    </span>
                  )}
                </div>
              </div>

              {/* Inline log panel */}
              {isErr && isExpanded && hasLog && (
                <div style={{
                  padding: '12px 16px',
                  background: '#0a0c14',
                  borderTop: '1px solid #f0717822',
                }}>
                  <div style={{
                    fontSize: 10, color: 'var(--fail)', letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}>
                    JOURNAL LOG
                  </div>
                  <pre style={{
                    fontSize: 11, color: '#f07178cc',
                    fontFamily: 'var(--fn)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    lineHeight: 1.6, margin: 0,
                    maxHeight: 200, overflowY: 'auto',
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
