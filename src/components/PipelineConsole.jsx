import { useState, useEffect } from 'react'
import {
  Loader, Clock,
  Download, Package, Microscope, Dna, Zap, Ban,
  Wrench, DollarSign, BarChart, Trophy,
  Play, ChevronDown, ChevronUp, X,
  TrendingDown, CalendarDays, Target, Info,
} from 'lucide-react'
import { triggerRun, fetchLog, fetchConfig, saveConfig } from '../lib/api.js'

const STAGE_META = {
  's1-append':  { icon: Download,   color: '#89ddff', desc: 'ops2 → OHLC JSONL'       },
  's1-export':  { icon: Package,    color: '#89ddff', desc: 'JSONL → Parquet'          },
  's1-enrich':  { icon: Microscope, color: '#89ddff', desc: '特徴量焼き込み'            },
  's2-gen':     { icon: Dna,        color: '#c792ea', desc: '戦略パラメータ生成'        },
  's3-calc':    { icon: Zap,        color: '#ffcb6b', desc: 'エントリーフラグ計算'      },
  's4-ban':     { icon: Ban,        color: '#f07178', desc: 'Banリスト生成'             },
  's5-engine':  { icon: Wrench,     color: '#82aaff', desc: 'ポジションイベント計算'    },
  's6-pips':    { icon: DollarSign, color: '#5de4c7', desc: 'pips付与'                 },
  's7-summary': { icon: BarChart,   color: '#f78c6c', desc: '月次・四半期・年次集計'   },
  's8-rank':    { icon: Trophy,     color: '#5de4c7', desc: 'DDフィルタ・戦略ランキング'},
}

function relTime(iso) {
  if (!iso) return '——'
  const d = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (d < 60)    return `${d}s`
  if (d < 3600)  return `${Math.floor(d / 60)}m`
  if (d < 86400) return `${Math.floor(d / 3600)}h`
  return `${Math.floor(d / 86400)}d`
}

function isRecent(iso) {
  return iso && (Date.now() - new Date(iso)) < 15 * 60 * 1000
}

// ─── S8 Config ────────────────────────────────────────────

const S8_PARAMS = [
  {
    key: 'S8_DD_THR', label: 'DD Threshold', Icon: TrendingDown, iconColor: '#f07178',
    desc: 'Max drawdown ratio over full period.',
    min: 0.3, max: 1.0, step: 0.05, default: 0.7,
    fmt: v => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: 'S8_RANK_MONTHS', label: 'Ranking Period', Icon: CalendarDays, iconColor: '#89ddff',
    desc: 'Recent months used for ranking.',
    min: 3, max: 36, step: 3, default: 12,
    fmt: v => `${v}mo`,
  },
  {
    key: 'S8_MIN_SIG_PER_HOUR', label: 'Min Sig/h', Icon: Target, iconColor: '#5de4c7',
    desc: 'Min avg signals/hour to qualify.',
    min: 0.05, max: 1.0, step: 0.05, default: 0.1,
    fmt: v => `${v.toFixed(2)}/h`,
  },
]

function S8Config({ onRunComplete }) {
  const [values, setValues] = useState({ S8_DD_THR: 0.7, S8_RANK_MONTHS: 12, S8_MIN_SIG_PER_HOUR: 0.1 })
  const [runState, setRunState] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchConfig().then(cfg => { if (cfg) setValues(v => ({ ...v, ...cfg })) }).catch(() => {})
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
    <div style={{ border: '1px solid var(--border2)', borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: 'var(--panel)',
          fontSize: 11, letterSpacing: '0.10em', color: 'var(--dim)',
          WebkitTapHighlightColor: 'transparent', outline: 'none',
        }}
      >
        <div style={{ width: 3, height: 13, background: 'var(--warn)', borderRadius: 2 }} />
        <Trophy size={12} color="var(--warn)" />
        <span style={{ flex: 1, textAlign: 'left' }}>S8 PARAMETERS</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {S8_PARAMS.map(p => p.fmt(values[p.key])).join(' · ')}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div style={{ padding: '16px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', gap: 8, padding: '10px 12px',
            background: '#89ddff10', border: '1px solid #89ddff22', borderRadius: 5,
            fontSize: 11, color: 'var(--dim)',
          }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent2)' }} />
            <span>Changing these parameters re-runs <strong style={{ color: 'var(--bright)' }}>S8 only</strong>. Full pipeline re-runs must be triggered from the table above.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {S8_PARAMS.map(p => {
              const v = values[p.key]
              const pct = ((v - p.min) / (p.max - p.min)) * 100
              const Icon = p.Icon
              return (
                <div key={p.key} style={{
                  background: 'var(--panel)', border: '1px solid var(--border2)',
                  borderRadius: 5, padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 30, height: 30,
                      background: p.iconColor + '18', border: `1px solid ${p.iconColor}33`,
                      borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={p.iconColor} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bright)' }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.desc}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                      {p.fmt(v)}
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: 'var(--border2)', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 3, background: 'linear-gradient(90deg, var(--accent2), var(--accent))', borderRadius: 2 }} />
                    <input type="range" min={p.min} max={p.max} step={p.step} value={v}
                      onChange={e => setValues(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                      style={{ position: 'absolute', left: 0, right: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                    <span>{p.fmt(p.min)}</span><span>{p.fmt(p.max)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleApply}
            disabled={runState === 'running'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px',
              background: runState === 'ok' ? '#0a2922' : runState === 'err' ? '#2a0f10' : 'var(--accent)',
              color: runState === 'ok' ? 'var(--success)' : runState === 'err' ? 'var(--fail)' : '#0d0f17',
              border: 'none', borderRadius: 5,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              opacity: runState === 'running' ? 0.7 : 1,
              WebkitTapHighlightColor: 'transparent', outline: 'none',
            }}
          >
            <Play size={13} />
            {runState === 'running' ? 'Running S8…' : runState === 'ok' ? 'S8 triggered' : runState === 'err' ? 'Failed' : 'Apply & Run S8'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Stage row ────────────────────────────────────────────

function StageRow({ stage, last, mobile }) {
  const [runState, setRunState]     = useState(null)   // null | 'running' | {ok} | {err, log}
  const [logOpen, setLogOpen]       = useState(false)   // セッション中エラーのログ開閉
  const [savedLog, setSavedLog]     = useState(null)    // 既存 failed のログ文字列
  const [savedOpen, setSavedOpen]   = useState(false)   // 既存 failed のログ開閉

  const meta = STAGE_META[stage.id] || { icon: Zap, color: 'var(--dim)', desc: '' }
  const Icon = meta.icon

  const isRunning = runState === 'running'
  const isOk      = runState?.ok
  const isErr     = runState?.err

  // ページ読み込み時点で failed なら自動ログ取得
  useEffect(() => {
    if (stage.result === 'failed') {
      fetchLog(stage.id)
        .then(r => { if (r?.log) setSavedLog(r.log) })
        .catch(() => {})
    }
  }, [stage.id, stage.result])

  async function handleRun() {
    if (isRunning) return
    // 既存ログ表示をリセット
    setSavedOpen(false)
    setRunState('running')
    try {
      await triggerRun(stage.id)
      setRunState({ ok: true, at: new Date() })
    } catch {
      let log = ''
      try { const r = await fetchLog(stage.id); log = r.log || '' } catch {}
      setRunState({ err: true, at: new Date(), log })
      setLogOpen(true)   // ← 失敗したら即ログを開く
    }
  }

  const resultColor = stage.result === 'success' ? 'var(--success)'
                    : stage.result === 'failed'  ? 'var(--fail)'
                    : 'var(--muted)'

  const gridCols = mobile ? '1fr auto auto' : '140px 1fr 70px 90px 80px'

  // ログパネルを表示すべきか
  const showSessionLog = isErr && logOpen && runState?.log
  const showSavedLog   = stage.result === 'failed' && !isErr && !isOk && savedOpen && savedLog
  const anyLogOpen     = showSessionLog || showSavedLog

  return (
    <>
      <div
        className="stage-row"
        onClick={handleRun}
        style={{
          display: 'grid', gridTemplateColumns: gridCols,
          alignItems: 'center', gap: mobile ? 8 : 12,
          padding: mobile ? '10px 12px' : '10px 16px',
          borderBottom: last && !anyLogOpen ? 'none' : '1px solid var(--border)',
          background: (isErr || (stage.result === 'failed' && !isOk)) ? '#f0717808' : 'transparent',
          cursor: isRunning ? 'default' : 'pointer',
        }}
      >
        {/* Stage label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon size={13} color={meta.color} strokeWidth={2} />
          <span style={{ color: meta.color, fontWeight: 600, fontSize: mobile ? 12 : 13 }}>{stage.label}</span>
        </div>

        {/* Description (PC only) */}
        {!mobile && (
          <span style={{ color: isErr ? 'var(--fail)' : 'var(--dim)', fontSize: 13 }}>
            {isRunning ? 'starting…'
              : isOk  ? `triggered · ${runState.at.toUTCString().slice(17, 25)} UTC`
              : isErr  ? `failed · ${runState.at.toUTCString().slice(17, 25)} UTC`
              : stage.description}
          </span>
        )}

        {/* Last run (PC only) */}
        {!mobile && (
          <div style={{
            textAlign: 'right', fontSize: 11,
            color: isRecent(stage.last_run) ? 'var(--accent)' : 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
          }}>
            <Clock size={9} />{relTime(stage.last_run)}
          </div>
        )}

        {/* Result */}
        <div style={{ textAlign: 'right' }}>
          {stage.currently_running ? (
            <span style={{ fontSize: 10, color: 'var(--running)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Loader size={9} style={{ animation: 'spin 1s linear infinite' }} />
              {!mobile && 'RUNNING'}
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: resultColor }}>
              {stage.result === 'success' ? '✓' : stage.result === 'failed' ? '✗' : '—'}
              {!mobile && (stage.result === 'success' ? ' ok' : stage.result === 'failed' ? ' fail' : '')}
            </span>
          )}
        </div>

        {/* Action */}
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
          {/* セッション中エラー: ログ開閉 + クリア */}
          {isErr && (
            <>
              {runState.log && (
                <button onClick={e => { e.stopPropagation(); setLogOpen(o => !o) }}
                  style={{ fontSize: 10, color: 'var(--fail)', padding: '2px 6px', border: '1px solid #f0717833', borderRadius: 3, outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                  {logOpen ? <ChevronUp size={9}/> : <ChevronDown size={9}/>}
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); setRunState(null); setLogOpen(false) }}
                style={{ color: 'var(--muted)', padding: '2px 3px', outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                <X size={10}/>
              </button>
            </>
          )}
          {/* 既存 failed: ログ開閉ボタン */}
          {stage.result === 'failed' && !isErr && !isOk && savedLog && (
            <button onClick={e => { e.stopPropagation(); setSavedOpen(o => !o) }}
              style={{ fontSize: 10, color: 'var(--fail)', padding: '2px 6px', border: '1px solid #f0717833', borderRadius: 3, outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
              {savedOpen ? <ChevronUp size={9}/> : <ChevronDown size={9}/>}
            </button>
          )}
          {/* 通常の run ボタン */}
          {!isErr && (
            <span style={{
              fontSize: 11, padding: mobile ? '2px 8px' : '2px 10px',
              color: isRunning ? 'var(--running)' : isOk ? 'var(--success)' : 'var(--dim)',
              border: `1px solid ${isRunning ? 'var(--running)' : isOk ? 'var(--success)' : 'var(--border2)'}`,
              borderRadius: 3,
            }}>
              {isRunning ? '…' : isOk ? '✓' : 'run'}
            </span>
          )}
        </div>
      </div>

      {/* セッション中エラーのログ */}
      {showSessionLog && (
        <div style={{
          padding: '10px 16px', background: '#0a0c14',
          borderBottom: last ? 'none' : '1px solid var(--border)',
          borderTop: '1px solid #f0717822',
        }}>
          <pre style={{
            fontSize: 11, color: '#f07178cc', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            maxHeight: 200, overflowY: 'auto', margin: 0,
          }}>{runState.log}</pre>
        </div>
      )}

      {/* 既存 failed のログ */}
      {showSavedLog && (
        <div style={{
          padding: '10px 16px', background: '#0a0c14',
          borderBottom: last ? 'none' : '1px solid var(--border)',
          borderTop: '1px solid #f0717822',
        }}>
          <pre style={{
            fontSize: 11, color: '#f07178cc', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            maxHeight: 200, overflowY: 'auto', margin: 0,
          }}>{savedLog}</pre>
        </div>
      )}
    </>
  )
}

// ─── PipelineConsole ──────────────────────────────────────

export default function PipelineConsole({ stages, loading, onRunComplete }) {
  const mobile = typeof window !== 'undefined' && window.innerWidth <= 700
  const successCount = stages.filter(s => s.result === 'success').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent2) 100%)', borderRadius: 2 }} />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)', flex: 1 }}>PIPELINE</span>
        {!loading && (
          <span style={{ fontSize: 12, color: 'var(--dim)' }}>
            <span style={{ color: 'var(--accent)' }}>{successCount}</span>
            <span style={{ color: 'var(--muted)' }}>/{stages.length}</span>{' '}ok
          </span>
        )}
      </div>

      <div style={{ border: '1px solid var(--border2)', background: 'var(--panel)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr auto auto' : '140px 1fr 70px 90px 80px',
          padding: mobile ? '7px 12px' : '8px 16px', gap: mobile ? 8 : 12,
          borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em',
        }}>
          <span>stage</span>
          {!mobile && <span>description</span>}
          {!mobile && <span style={{ textAlign: 'right' }}>last</span>}
          <span style={{ textAlign: 'right' }}>result</span>
          <span style={{ textAlign: 'right' }}>action</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13 }}>loading…</div>
        ) : (
          stages.map((s, i) => (
            <StageRow key={s.id} stage={s} last={i === stages.length - 1} mobile={mobile} />
          ))
        )}
      </div>

      <S8Config onRunComplete={onRunComplete} />

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
