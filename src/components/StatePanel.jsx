import { useState, useEffect, useRef } from 'react'
import { Terminal, AlertTriangle, Zap, Clock, Radio, Layers, Send, Inbox } from 'lucide-react'
import { fetchLiveState } from '../lib/api.js'
import HintBanner from './HintBanner.jsx'

const POLL_MS  = 5 * 60_000
const MOBILE_BP = 700

function usePolled(fn, intervalMs) {
  const [data, setData]           = useState(null)
  const [firstLoad, setFirstLoad] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const r = await fnRef.current()
        if (!cancelled) { setData(r); setFirstLoad(false) }
      } catch { if (!cancelled) setFirstLoad(false) }
    }
    run()
    const id = setInterval(run, intervalMs)
    return () => { cancelled = true; clearInterval(id) }
  }, [intervalMs])
  return { data, firstLoad }
}

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

function timeHM(obj) {
  const ts = String(obj.ts_utc || obj.time_utc || obj.t || obj.timestamp || obj.created_at || obj.at_utc || '')
  const part = ts.includes('T') ? ts.split('T')[1]
             : ts.includes(' ') && ts.length > 10 ? ts.split(' ')[1]
             : ts
  return part.slice(0, 5)
}

function parse(obj, fileKey) {
  if (obj._raw) return { type: 'raw', text: obj._raw.slice(0, 120) }
  const t = timeHM(obj)
  if (fileKey === 'errors') {
    return { type: 'error', time: t, label: obj.reason_code || obj.code || 'error',
      detail: [obj.http_status, obj.retriable === true ? 'retriable' : obj.retriable === false ? 'non-ret' : ''].filter(Boolean).join(' ') }
  }
  if (fileKey.startsWith('snap')) {
    return { type: 'snap', time: t,
      label: obj.key || obj.reason || (obj.pid != null ? `PID:${obj.pid}` : ''),
      detail: [obj.side || '', obj.amount ?? obj.total ?? '',
               obj.ok === true ? 'ok' : obj.ok === false ? 'fail' : '',
               obj.status_code || ''].filter(v => v !== '' && v != null).join(' ') }
  }
  const action = (obj.action || obj.type || '').replace('open', 'o').replace('close', 'cl')
  const side   = (obj.side || '').replace('BUY', 'B').replace('SELL', 'S')
  const qty    = obj.lots != null ? String(obj.lots) : obj.amount != null ? String(obj.amount) : ''
  const out    = obj.outcome || (obj.ok === true ? 'ok' : obj.ok === false ? 'fail' : '')
  const err    = obj.reason_code || obj.reason || obj.error || obj.err || ''
  return { type: 'exec', time: t, action, side, qty, out, err }
}

const FS = 13

function Row({ obj, fileKey, last }) {
  const p   = parse(obj, fileKey)
  const sep = { borderBottom: last ? 'none' : '1px solid var(--border)', padding: '3px 0' }
  if (p.type === 'raw')   return <div style={{ ...sep, fontSize: FS, color: 'var(--dim)', lineHeight: 1.7 }}>{p.text}</div>
  if (p.type === 'snap')  return (
    <div style={{ ...sep, display: 'flex', gap: 7, fontSize: FS, lineHeight: 1.7, alignItems: 'baseline' }}>
      {p.time   && <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{p.time}</span>}
      <span style={{ color: 'var(--text)' }}>{p.label || '—'}</span>
      {p.detail && <span style={{ color: 'var(--dim)', fontSize: FS - 1 }}>{p.detail}</span>}
    </div>
  )
  if (p.type === 'error') return (
    <div style={{ ...sep, display: 'flex', gap: 7, fontSize: FS, lineHeight: 1.7, alignItems: 'baseline' }}>
      {p.time   && <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{p.time}</span>}
      <span style={{ color: 'var(--fail)', fontWeight: 600 }}>{p.label}</span>
      {p.detail && <span style={{ color: 'var(--dim)', fontSize: FS - 1 }}>{p.detail}</span>}
    </div>
  )
  const sideC = p.side === 'B' ? 'var(--success)' : p.side === 'S' ? 'var(--fail)' : 'var(--dim)'
  return (
    <div style={{ ...sep, display: 'flex', gap: 7, fontSize: FS, lineHeight: 1.7, alignItems: 'baseline' }}>
      {p.time   && <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{p.time}</span>}
      {p.action && <span style={{ color: 'var(--dim)',   flexShrink: 0 }}>{p.action}</span>}
      {p.side   && <span style={{ color: sideC, fontWeight: 700, flexShrink: 0 }}>{p.side}</span>}
      {p.qty    && <span style={{ color: 'var(--text)',  flexShrink: 0 }}>{p.qty}</span>}
      {p.out    && <span style={{ fontSize: FS - 1, color: p.out === 'ok' ? 'var(--success)' : p.out === 'fail' ? 'var(--fail)' : 'var(--dim)' }}>{p.out}</span>}
      {p.err    && <span style={{ color: 'var(--fail)',  fontSize: FS - 1 }}>{p.err}</span>}
    </div>
  )
}

const FILE_META = {
  exec:       { label: 'Outbox',  icon: Inbox,         color: 'var(--accent)'  },
  entries:    { label: 'Entries', icon: Layers,        color: 'var(--accent2)' },
  sent:       { label: 'Sent',    icon: Send,          color: 'var(--running)' },
  errors:     { label: 'Errors',  icon: AlertTriangle, color: 'var(--fail)'    },
  snap_eod:   { label: 'EOD',     icon: Clock,         color: 'var(--warn)'    },
  snap_event: { label: 'Event',   icon: Radio,         color: 'var(--purple)'  },
  snap_spark: { label: 'Spark',   icon: Zap,           color: 'var(--orange)'  },
}

function FilePanel({ fileKey, rows, style = {} }) {
  const meta = FILE_META[fileKey], Icon = meta.icon, color = meta.color
  const empty = rows.length === 0, sorted = [...rows].reverse()
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border2)',
      borderRadius: 6, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
        paddingBottom: 10, marginBottom: 8, borderBottom: `1px solid ${color}33`,
      }}>
        <div style={{ width: 3, height: 14, background: color, borderRadius: 2 }} />
        <Icon size={13} color={color} />
        <span style={{ fontSize: 12, letterSpacing: '0.08em', color, fontWeight: 700, flex: 1 }}>{meta.label}</span>
        <span style={{
          fontSize: 11, color: empty ? 'var(--muted)' : color,
          background: empty ? 'transparent' : `${color}18`,
          padding: '1px 7px', borderRadius: 10,
          border: `1px solid ${empty ? 'transparent' : color + '44'}`,
        }}>{rows.length}</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {empty ? <div style={{ fontSize: FS, color: 'var(--muted)' }}>—</div>
               : sorted.map((r, i) => <Row key={i} obj={r} fileKey={fileKey} last={i === sorted.length - 1} />)}
      </div>
    </div>
  )
}

function MiniPanel({ fileKey, rows, borderBottom = false }) {
  const meta = FILE_META[fileKey], Icon = meta.icon, color = meta.color
  const empty = rows.length === 0, sorted = [...rows].reverse()
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      flex: 1, minHeight: 0,
      borderBottom: borderBottom ? '1px solid var(--border2)' : 'none',
      padding: '10px 14px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        paddingBottom: 8, marginBottom: 6, borderBottom: `1px solid ${color}33`,
      }}>
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
        <Icon size={12} color={color} />
        <span style={{ fontSize: 11, letterSpacing: '0.08em', color, fontWeight: 700, flex: 1 }}>{meta.label}</span>
        <span style={{
          fontSize: 10, color: empty ? 'var(--muted)' : color,
          background: empty ? 'transparent' : `${color}18`,
          padding: '1px 6px', borderRadius: 10,
          border: `1px solid ${empty ? 'transparent' : color + '44'}`,
        }}>{rows.length}</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {empty ? <div style={{ fontSize: FS, color: 'var(--muted)' }}>—</div>
               : sorted.map((r, i) => <Row key={i} obj={r} fileKey={fileKey} last={i === sorted.length - 1} />)}
      </div>
    </div>
  )
}

function StackedColumn({ topKey, bottomKey, topRows, bottomRows, style = {} }) {
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border2)',
      borderRadius: 6, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', ...style,
    }}>
      <MiniPanel fileKey={topKey}    rows={topRows}    borderBottom={true} />
      <MiniPanel fileKey={bottomKey} rows={bottomRows} borderBottom={false} />
    </div>
  )
}

export default function StatePanel() {
  const { data, firstLoad } = usePolled(() => fetchLiveState(200), POLL_MS)
  const files  = data?.files    || {}
  const mode   = data?.exec_mode || ''
  const day    = data?.day       || ''
  const width  = useWindowWidth()
  const mobile = width <= MOBILE_BP

  const modeColor = mode === 'LIVE' ? 'var(--fail)' : mode === 'SIMULATED' ? 'var(--accent)' : 'var(--warn)'

  return (
    <div style={{
      flex: mobile ? undefined : 1,
      minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 3, height: 16, background: 'var(--purple)', borderRadius: 2 }} />
        <Terminal size={13} color="var(--purple)" />
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)', flex: 1 }}>STATE</span>
        <span style={{ fontSize: 12, color: 'var(--dim)' }}>{day}</span>
        <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 8, color: modeColor }}>
          [{mode}]
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 10 }}>5min</span>
      </div>

      {/* ヒントバナー */}
      <HintBanner
        hintKey="state"
        color="var(--purple)"
        body="自動売買エンジンが出力するログファイルをリアルタイムで表示します。Outbox は送信待ちの注文、Entries は検出したエントリーシグナル、Sent は送信済みの注文、Errors はエラー履歴。EOD / Event / Spark は各種スナップショットのイベントログです。"
      />

      {firstLoad ? (
        <div style={{ color: 'var(--muted)', fontSize: FS }}>connecting…</div>
      ) : mobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['exec', 'entries', 'sent', 'errors', 'snap_eod', 'snap_event', 'snap_spark'].map(key => (
            <FilePanel key={key} fileKey={key} rows={files[key] || []} style={{ maxHeight: 240 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
          <FilePanel fileKey="exec"    rows={files.exec    || []} />
          <FilePanel fileKey="entries" rows={files.entries || []} />
          <FilePanel fileKey="sent"    rows={files.sent    || []} />
          <StackedColumn
            topKey="errors"      topRows={files.errors     || []}
            bottomKey="snap_event" bottomRows={files.snap_event || []}
          />
          <StackedColumn
            topKey="snap_eod"    topRows={files.snap_eod   || []}
            bottomKey="snap_spark" bottomRows={files.snap_spark || []}
          />
        </div>
      )}
    </div>
  )
}
