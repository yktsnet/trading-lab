import { useState, useEffect, useRef } from 'react'
import {
  TrendingUp, TrendingDown, Minus,
  Shield, ShieldOff, Activity, BarChart2, AlertTriangle, Info, X,
} from 'lucide-react'
import { fetchLivePrice, fetchLivePositions, fetchLiveBars } from '../lib/api.js'

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

const f3  = v => v == null ? '—' : Number(v).toFixed(3)
const fpl = v => { if (v == null) return '—'; const n = Number(v); return (n >= 0 ? '+' : '') + n.toLocaleString() }
const plC = v => v == null ? 'var(--dim)' : Number(v) >= 0 ? 'var(--success)' : 'var(--fail)'

// ── デモ説明バナー ────────────────────────────────────────
function DemoNotice({ onDismiss }) {
  return (
    <div style={{
      background: '#ffcb6b0d',
      border: '1px solid #ffcb6b33',
      borderRadius: 6,
      padding: '12px 16px',
      marginBottom: 14,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      flexShrink: 0,
    }}>
      <Info size={14} color="var(--warn)" style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)', letterSpacing: '0.06em', marginBottom: 4 }}>
          DEMO — すべて架空データです
        </div>
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>
          表示されている価格・ポジション・履歴はシミュレーションによる架空のものです。実際の取引・相場とは一切関係ありません。
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            ['現在価格', '3秒ごと'],
            ['ポジション', '60秒ごと'],
            ['バー', '5分ごと'],
          ].map(([label, freq]) => (
            <span key={label} style={{ fontSize: 11, color: 'var(--dim)' }}>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              {' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>↻ {freq}に自動更新</span>
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{ color: 'var(--muted)', padding: '2px 4px', flexShrink: 0, marginTop: -2 }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

function SectionHeader({ icon: Icon, label, color = 'var(--accent)', right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexShrink: 0 }}>
      <div style={{ width: 3, height: 15, background: color, borderRadius: 2 }} />
      <Icon size={13} color={color} />
      <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--dim)', flex: 1 }}>{label}</span>
      {right}
    </div>
  )
}

// ── Positionsパネル ───────────────────────────────────────
function PositionsPanel({ posData, priceData, mobile }) {
  const d      = posData || {}
  const nets   = d.netpositions || []
  const closed = d.closed_today || []
  const bal    = d.balance || {}
  const tg     = d.trade_guard || {}
  const mode   = d.exec_mode || 'DRY'

  const net    = nets.find(n => (n.NetPositionBase?.Uic === 42) || String(n.NetPositionId || '').includes('USDJPY'))
  const view   = net?.NetPositionView || {}
  const base   = net?.NetPositionBase || {}
  const amt    = parseFloat(base.Amount || 0)
  const SideIcon = amt > 0 ? TrendingUp : amt < 0 ? TrendingDown : Minus
  const sideC    = amt > 0 ? 'var(--success)' : amt < 0 ? 'var(--fail)' : 'var(--dim)'
  const sideL    = amt > 0 ? 'L' : amt < 0 ? 'S' : ''

  const curPrice = view.CurrentPrice ?? priceData?.price
  const bid      = priceData?.bid
  const ask      = priceData?.ask
  const avg      = parseFloat(base.AverageOpenPrice || view.AverageOpenPrice || 0)
  const pl       = view.ProfitLossOnTrade ?? view.UnrealizedProfitLoss
  const pips     = (net && curPrice != null && avg)
    ? ((parseFloat(curPrice) - avg) * 100 * (amt > 0 ? 1 : -1))
    : null

  const totalClosed = closed.reduce((s, t) => s + t.pl, 0)

  const modeColor = mode === 'LIVE' ? 'var(--fail)' : mode === 'SIMULATED' ? 'var(--accent)' : 'var(--warn)'
  const modeLabel = mode === 'LIVE' ? '● LIVE' : mode === 'SIMULATED' ? '⊙ SIM' : '○ DRY'

  const panelStyle = mobile
    ? { background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: 6, padding: '14px 16px', marginBottom: 12 }
    : { flex: 1, minWidth: 0, background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: 6, padding: '16px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }

  return (
    <div style={panelStyle}>
      <SectionHeader
        icon={Activity} label="POSITIONS" color="var(--success)"
        right={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>↻ 3s / 60s</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: modeColor, padding: '2px 7px', borderRadius: 3,
              border: `1px solid ${modeColor}55`,
            }}>
              {modeLabel}
            </span>
            <span style={{
              fontSize: 11, color: tg.enabled ? 'var(--accent)' : 'var(--muted)',
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 3,
              border: `1px solid ${tg.enabled ? 'var(--accent)' : 'var(--border2)'}`,
            }}>
              {tg.enabled
                ? <><Shield size={10}/> tp={tg.target_profit} ml={tg.max_loss}</>
                : <><ShieldOff size={10}/> guard off</>}
            </span>
          </div>
        }
      />

      {/* 現在価格 */}
      <div style={{ padding: '12px 14px', background: 'var(--panel2)', borderRadius: 6, marginBottom: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: mobile ? 26 : 32, fontWeight: 700, letterSpacing: '-0.02em',
            color: curPrice != null ? 'var(--bright)' : 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {curPrice != null ? Number(curPrice).toFixed(3) : '—'}
          </span>
          {bid != null && ask != null && (
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              {Number(bid).toFixed(3)} / {Number(ask).toFixed(3)}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>↻ 3秒ごとに自動更新</span>
        </div>

        {net ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <SideIcon size={15} color={sideC} />
            <span style={{ fontSize: 13, color: sideC, fontWeight: 700 }}>{d.symbol} {sideL}</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>qty={Math.abs(amt).toLocaleString()}</span>
            <span style={{ fontSize: 13, color: 'var(--dim)' }}>avg={f3(avg)}</span>
            <span style={{ fontSize: 13, color: 'var(--dim)' }}>cur={f3(curPrice)}</span>
            <span style={{ fontSize: 13, color: plC(pl), fontWeight: 600 }}>pl={fpl(pl)}</span>
            {pips != null && <span style={{ fontSize: 13, color: plC(pips), fontWeight: 600 }}>pip={pips.toFixed(1)}</span>}
            {bal.equity != null && <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--bright)', fontWeight: 600 }}>eq={Number(bal.equity).toLocaleString()}</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Minus size={14} color="var(--dim)" />
            <span style={{ fontSize: 13, color: 'var(--dim)' }}>{d.symbol || 'USDJPY'} flat</span>
            {bal.equity != null && <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--bright)', fontWeight: 600 }}>eq={Number(bal.equity).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {/* Closed today */}
      <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 8, flexShrink: 0 }}>
        closed {closed.length} · total{' '}
        <span style={{ color: plC(totalClosed), fontWeight: 600 }}>{fpl(totalClosed)}</span>
        {closed.length > 0 && <span style={{ color: 'var(--muted)', marginLeft: 8 }}>avg {(totalClosed / closed.length).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}</span>}
      </div>

      {closed.length > 0 && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden',
          ...(mobile ? { maxHeight: 260 } : { flex: 1, display: 'flex', flexDirection: 'column' }),
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '44px 18px 72px 66px 66px 72px',
            padding: '5px 10px', fontSize: 11, color: 'var(--muted)',
            borderBottom: '1px solid var(--border)', background: 'var(--panel2)', flexShrink: 0,
          }}>
            <span>time</span><span>S</span><span>qty</span>
            <span>op</span><span>cl</span><span style={{ textAlign: 'right' }}>pl (JPY)</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {closed.map((t, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '44px 18px 72px 66px 66px 72px',
                padding: '5px 10px', fontSize: 12,
                borderBottom: i < closed.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: 'var(--dim)' }}>{t.time}</span>
                <span style={{ color: t.side === 'L' ? 'var(--success)' : 'var(--fail)', fontWeight: 700 }}>{t.side}</span>
                <span style={{ color: 'var(--text)' }}>{Number(t.amount).toLocaleString()}</span>
                <span style={{ color: 'var(--dim)' }}>{f3(t.open_price)}</span>
                <span style={{ color: 'var(--dim)' }}>{f3(t.close_price)}</span>
                <span style={{ textAlign: 'right', color: plC(t.pl), fontWeight: 600 }}>{fpl(t.pl)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {posData?.error && (
        <div style={{ color: 'var(--fail)', fontSize: 12, marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <AlertTriangle size={12}/> {posData.error}
        </div>
      )}
    </div>
  )
}

// ── ATR/ADX 計算 ──────────────────────────────────────────
function calcIndicators(rows, period = 14) {
  const result = rows.map(r => ({ ...r, atr: null, adx: null }))
  let prevClose = null, prevHigh = null, prevLow = null
  const trBuf = [], pdmBuf = [], ndmBuf = [], dxBuf = []
  for (let i = 0; i < result.length; i++) {
    const h = result[i].high, l = result[i].low, c = result[i].close
    let tr, pdm, ndm
    if (prevClose == null) { tr = h - l; pdm = 0; ndm = 0 }
    else {
      tr = Math.max(h - l, Math.abs(h - prevClose), Math.abs(l - prevClose))
      const up = h - prevHigh, down = prevLow - l
      pdm = (up > down && up > 0) ? up : 0
      ndm = (down > up && down > 0) ? down : 0
    }
    prevClose = c; prevHigh = h; prevLow = l
    trBuf.push(tr); pdmBuf.push(pdm); ndmBuf.push(ndm)
    if (trBuf.length > period) { trBuf.shift(); pdmBuf.shift(); ndmBuf.shift() }
    if (trBuf.length < period) continue
    const atr = trBuf.reduce((s, v) => s + v, 0) / period
    result[i].atr = atr
    const totalTr = trBuf.reduce((s, v) => s + v, 0)
    if (totalTr <= 0) continue
    const plusDI  = (pdmBuf.reduce((s, v) => s + v, 0) / totalTr) * 100
    const minusDI = (ndmBuf.reduce((s, v) => s + v, 0) / totalTr) * 100
    const denom   = plusDI + minusDI
    if (denom <= 0) continue
    const dx = (Math.abs(plusDI - minusDI) / denom) * 100
    dxBuf.push(dx)
    if (dxBuf.length > period) dxBuf.shift()
    if (dxBuf.length < period) continue
    result[i].adx = dxBuf.reduce((s, v) => s + v, 0) / dxBuf.length
  }
  return result
}

const TF = [{ l: '5m', m: 5 }, { l: '15m', m: 15 }, { l: '1h', m: 60 }, { l: '4h', m: 240 }]

function resample(bars, mins) {
  const s = {}
  for (const b of bars) {
    const raw   = String(b.time_utc || '')
    const parts = raw.split(':')
    if (parts.length < 2) continue
    const tot = parseInt(parts[0]) * 60 + parseInt(parts[1])
    const sm  = Math.floor(tot / mins) * mins
    const key = `${String(Math.floor(sm / 60)).padStart(2, '0')}:${String(sm % 60).padStart(2, '0')}`
    if (!s[key]) s[key] = { time: key, open: b.open, high: b.high, low: b.low, close: b.close }
    else {
      if (b.high > s[key].high) s[key].high = b.high
      if (b.low  < s[key].low)  s[key].low  = b.low
      s[key].close = b.close
    }
  }
  return Object.values(s).sort((a, b) => a.time.localeCompare(b.time))
}

// ── Barsパネル ────────────────────────────────────────────
function BarsPanel({ data, firstLoad, mobile }) {
  const [tf, setTf] = useState(0)
  const bars     = data?.bars || []
  const withInds = calcIndicators(resample(bars, TF[tf].m), 14)
  const rows     = [...withInds.slice(-60)].reverse()
  const showInds = !mobile
  const cols     = showInds
    ? '48px 68px 68px 68px 68px 58px 58px'
    : '44px 1fr 1fr 1fr 1fr'

  const panelStyle = mobile
    ? { background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: 6, padding: '14px 16px' }
    : { flex: 1, minWidth: 0, background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: 6, padding: '16px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }

  return (
    <div style={panelStyle}>
      <SectionHeader
        icon={BarChart2} label="BARS" color="var(--accent2)"
        right={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>↻ 5分ごと</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {TF.map((t, i) => (
                <button key={i} onClick={() => setTf(i)} style={{
                  padding: '2px 7px', fontSize: 11,
                  color: tf === i ? 'var(--accent2)' : 'var(--dim)',
                  background: tf === i ? '#89ddff14' : 'transparent',
                  border: `1px solid ${tf === i ? 'var(--accent2)55' : 'var(--border2)'}`,
                  borderRadius: 3,
                }}>{t.l}</button>
              ))}
            </div>
          </div>
        }
      />

      {firstLoad ? (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>connecting…</div>
      ) : bars.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>no data</div>
      ) : (
        <div style={mobile ? { overflowY: 'auto', maxHeight: 360 } : { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: cols,
            fontSize: 11, color: 'var(--muted)',
            padding: '4px 0 6px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <span>time</span>
            <span style={{ textAlign: 'right' }}>open</span>
            <span style={{ textAlign: 'right' }}>high</span>
            <span style={{ textAlign: 'right' }}>low</span>
            <span style={{ textAlign: 'right' }}>close</span>
            {showInds && <span style={{ textAlign: 'right' }}>ATR14</span>}
            {showInds && <span style={{ textAlign: 'right' }}>ADX14</span>}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {rows.map((r, i) => {
              const bull = parseFloat(r.close) >= parseFloat(r.open)
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: cols,
                  fontSize: mobile ? 12 : 13, padding: '4px 0',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ color: 'var(--dim)' }}>{r.time}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text)'  }}>{Number(r.open).toFixed(3)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--dim)'   }}>{Number(r.high).toFixed(3)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--dim)'   }}>{Number(r.low).toFixed(3)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: bull ? 'var(--success)' : 'var(--fail)' }}>
                    {Number(r.close).toFixed(3)}
                  </span>
                  {showInds && <span style={{ textAlign: 'right', color: 'var(--dim)' }}>{r.atr != null ? Number(r.atr).toFixed(3) : '—'}</span>}
                  {showInds && <span style={{ textAlign: 'right', color: 'var(--dim)' }}>{r.adx != null ? Number(r.adx).toFixed(2) : '—'}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── LiveDashboard ─────────────────────────────────────────
export default function LiveDashboard({ mobile }) {
  const [noticeVisible, setNoticeVisible] = useState(true)

  const { data: priceData }                          = usePolled(fetchLivePrice,            3_000)
  const { data: posData }                            = usePolled(fetchLivePositions,       60_000)
  const { data: barsData, firstLoad: barsFirstLoad } = usePolled(() => fetchLiveBars(200), 5 * 60_000)

  const notice = noticeVisible && (
    <DemoNotice onDismiss={() => setNoticeVisible(false)} />
  )

  if (mobile) {
    return (
      <div>
        {notice}
        <PositionsPanel posData={posData} priceData={priceData} mobile={true} />
        <BarsPanel data={barsData} firstLoad={barsFirstLoad} mobile={true} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {notice}
      <div className="live-top-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        <PositionsPanel posData={posData} priceData={priceData} mobile={false} />
        <BarsPanel data={barsData} firstLoad={barsFirstLoad} mobile={false} />
      </div>
    </div>
  )
}
