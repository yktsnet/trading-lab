// DEMO MODE — no backend connection.
// All functions return synthetic data.

// ── Seeded RNG ────────────────────────────────────────────
function seededRand(seed) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = (s ^ (s >>> 16)) >>> 0
    return s / 0xffffffff
  }
}

// ── 200本の架空5分足バー（時:分のみ、日付なし） ──────────
function generateBars() {
  const rand = seededRand(0xc0ffee42)
  const bars = []
  let price = 149.527
  for (let i = 0; i < 200; i++) {
    const mins = i * 5
    const hh   = String(Math.floor(mins / 60)).padStart(2, '0')
    const mm   = String(mins % 60).padStart(2, '0')
    const move = (rand() - 0.495) * 0.14
    const open  = price
    const close = +(price + move).toFixed(3)
    const high  = +(Math.max(open, close) + rand() * 0.07).toFixed(3)
    const low   = +(Math.min(open, close) - rand() * 0.07).toFixed(3)
    bars.push({ time_utc: `${hh}:${mm}`, open: +open.toFixed(3), high, low, close })
    price = close
  }
  return bars
}

const MOCK_BARS = generateBars()

// ── ランキングデータ ───────────────────────────────────────
function mkRow(id, slug, entries, bars5m, pips_sum, pips_avg, sph, max_dd, sess) {
  return { id, slug, entries_total: entries, bars5m_total: bars5m,
    pips_sum_total: pips_sum, pips_avg_per_entry: pips_avg,
    signals_per_hour: sph, max_dd, session: sess }
}

const RANKING = {
  tyo: {
    avg: [
      mkRow('T19','window20_z_min1p0',              312, 14400, 187.4, 0.60, 0.26, 0.18, 'tyo'),
      mkRow('T08','fast9_slow26_slope_min0p01',      284, 14400, 152.6, 0.54, 0.24, 0.22, 'tyo'),
      mkRow('T01','enter70_rsi_period14',            198, 14400,  98.3, 0.50, 0.17, 0.31, 'tyo'),
      mkRow('T16','factor2p5_st_period10',           421, 14400, 176.2, 0.42, 0.35, 0.25, 'tyo'),
      mkRow('T12','atr_period14_lookback3_mult2p0',  156, 14400,  60.1, 0.39, 0.13, 0.19, 'tyo'),
      mkRow('T04','d_period3_enter85_k_period14',    234, 14400,  82.9, 0.35, 0.19, 0.28, 'tyo'),
      mkRow('T24','direction_up_min_streak2',        389, 14400, 120.4, 0.31, 0.32, 0.33, 'tyo'),
      mkRow('T21','bw_pct_max0p25_dev2p0_period20',  167, 14400,  44.8, 0.27, 0.14, 0.41, 'tyo'),
    ],
  },
  lon: {
    avg: [
      mkRow('T06','cci_period20_enter150',           278,  8640, 201.3, 0.72, 0.39, 0.15, 'lon'),
      mkRow('T23','kijun26_mode_above_span_b52_tenkan9', 142, 8640, 96.2, 0.68, 0.20, 0.20, 'lon'),
      mkRow('T19','window30_z_min1p5',               189,  8640, 118.7, 0.63, 0.26, 0.24, 'lon'),
      mkRow('T10','fast12_hist_min0_signal9_slow26', 412,  8640, 218.8, 0.53, 0.57, 0.29, 'lon'),
      mkRow('T14','dev2p0_lookback3_period20',       203,  8640,  96.4, 0.47, 0.28, 0.36, 'lon'),
      mkRow('T18','diff_min0p1_period14',            167,  8640,  72.1, 0.43, 0.23, 0.22, 'lon'),
    ],
  },
  nyc: {
    avg: [
      mkRow('T10','fast12_hist_min0p05_signal12_slow26', 198, 5760, 168.3, 0.85, 0.41, 0.17, 'nyc'),
      mkRow('T16','factor3p0_st_period7',            134,  5760, 104.5, 0.78, 0.28, 0.21, 'nyc'),
      mkRow('T03','mid50_rsi_period8_slope_min0p1',  256,  5760, 181.2, 0.71, 0.53, 0.26, 'nyc'),
      mkRow('T20','lookback55_lower_q0p3_upper_q0p7',172, 5760, 109.6, 0.64, 0.36, 0.30, 'nyc'),
      mkRow('T08','fast12_slow34_slope_min0p02',     211,  5760, 118.4, 0.56, 0.44, 0.34, 'nyc'),
    ],
  },
}
for (const s of ['tyo', 'lon', 'nyc']) {
  RANKING[s].sum = [...RANKING[s].avg]
    .sort((a, b) => b.pips_sum_total - a.pips_sum_total)
    .map((r, i) => ({ ...r, rank: i + 1 }))
  RANKING[s].avg = RANKING[s].avg.map((r, i) => ({ ...r, rank: i + 1 }))
}

// ── パイプラインステージ ──────────────────────────────────
const STAGES = [
  { id: 's1-append',  label: 'S1 append',  description: 'ops2 → OHLC JSONL',        result: 'success', last_run: '2026-04-04T17:05:02Z', currently_running: false, active_state: 'inactive' },
  { id: 's1-export',  label: 'S1 export',  description: 'JSONL → Parquet',           result: 'success', last_run: '2026-04-04T17:10:08Z', currently_running: false, active_state: 'inactive' },
  { id: 's1-enrich',  label: 'S1 enrich',  description: '特徴量焼き込み',            result: 'success', last_run: '2026-04-04T17:21:34Z', currently_running: false, active_state: 'inactive' },
  { id: 's2-gen',     label: 'S2 gen',     description: '戦略パラメータ生成',        result: 'success', last_run: '2026-04-04T17:31:09Z', currently_running: false, active_state: 'inactive' },
  { id: 's3-calc',    label: 'S3 calc',    description: 'エントリーフラグ計算',      result: 'success', last_run: '2026-04-05T00:00:47Z', currently_running: false, active_state: 'inactive' },
  { id: 's4-ban',     label: 'S4 ban',     description: 'Banリスト生成',             result: 'success', last_run: '2026-04-05T00:16:22Z', currently_running: false, active_state: 'inactive' },
  { id: 's5-engine',  label: 'S5 engine',  description: 'ポジションイベント計算',    result: 'success', last_run: '2026-04-05T00:31:58Z', currently_running: false, active_state: 'inactive' },
  { id: 's6-pips',    label: 'S6 pips',    description: 'pips付与',                  result: 'success', last_run: '2026-04-05T01:02:14Z', currently_running: false, active_state: 'inactive' },
  { id: 's7-summary', label: 'S7 summary', description: '月次・四半期・年次集計',    result: 'success', last_run: '2026-04-05T01:17:33Z', currently_running: false, active_state: 'inactive' },
  { id: 's8-rank',    label: 'S8 rank',    description: 'DDフィルタ・戦略ランキング',result: 'success', last_run: '2026-04-05T01:31:05Z', currently_running: false, active_state: 'inactive' },
]

// ── 決済履歴 (パネルを埋めるくらいの量) ─────────────────
// pl = (close - open) * 100000 (USDJPY 10万通貨、概算JPY)
const CLOSED_TODAY = [
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.187, close_price: 149.484, pl:  29700, ts: '00' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.631, close_price: 149.418, pl:  21300, ts: '01' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.091, close_price: 148.998, pl:  -9300, ts: '02' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 148.842, close_price: 149.173, pl:  33100, ts: '03' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.338, close_price: 149.512, pl: -17400, ts: '04' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.204, close_price: 149.517, pl:  31300, ts: '05' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.763, close_price: 149.491, pl:  27200, ts: '06' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.082, close_price: 149.349, pl:  26700, ts: '07' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.558, close_price: 149.623, pl:  -6500, ts: '08' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.311, close_price: 149.688, pl:  37700, ts: '09' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.847, close_price: 149.592, pl:  25500, ts: '10' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 148.974, close_price: 149.261, pl:  28700, ts: '11' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.432, close_price: 149.389, pl:   4300, ts: '12' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.156, close_price: 148.887, pl: -26900, ts: '13' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.701, close_price: 149.448, pl:  25300, ts: '14' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.023, close_price: 149.318, pl:  29500, ts: '15' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.524, close_price: 149.277, pl:  24700, ts: '16' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 148.891, close_price: 149.204, pl:  31300, ts: '17' },
  { time: '--:--', side: 'S', amount: 100000, open_price: 149.617, close_price: 149.803, pl: -18600, ts: '18' },
  { time: '--:--', side: 'L', amount: 100000, open_price: 149.138, close_price: 149.421, pl:  28300, ts: '19' },
]

// ── Stateモックデータ ─────────────────────────────────────
function mkExec(action, side, outcome) {
  return { ts_utc: '--:--', action, side, lots: 0.2, ...(outcome ? { outcome } : {}) }
}
function mkSnap(key, ok = true) {
  return { ts_utc: '--:--', key, ok }
}

const execRows = [
  mkExec('open','BUY'), mkExec('close','BUY','ok'), mkExec('open','SELL'),
  mkExec('open','BUY'), mkExec('open','BUY'), mkExec('close','SELL','ok'),
  mkExec('close','BUY','ok'), mkExec('open','BUY'), mkExec('open','SELL'),
  mkExec('open','BUY'), mkExec('close','BUY','ok'), mkExec('open','BUY'),
  mkExec('close','SELL','ok'), mkExec('open','SELL'), mkExec('open','BUY'),
  mkExec('open','BUY'), mkExec('close','BUY','ok'), mkExec('open','SELL'),
  mkExec('close','SELL','ok'), mkExec('open','BUY'), mkExec('open','BUY'),
  mkExec('close','BUY','ok'), mkExec('open','SELL'), mkExec('open','BUY'),
  mkExec('close','SELL','ok'), mkExec('open','BUY'), mkExec('close','BUY','ok'),
  mkExec('open','SELL'), mkExec('open','BUY'), mkExec('close','SELL','ok'),
]
const entriesRows = [
  mkExec('open','BUY'), mkExec('open','SELL'), mkExec('open','BUY'),
  mkExec('open','BUY'), mkExec('open','SELL'), mkExec('open','BUY'),
  mkExec('open','SELL'), mkExec('open','BUY'), mkExec('open','BUY'),
  mkExec('open','SELL'), mkExec('open','BUY'), mkExec('open','SELL'),
  mkExec('open','BUY'), mkExec('open','BUY'), mkExec('open','SELL'),
  mkExec('open','BUY'), mkExec('open','SELL'), mkExec('open','BUY'),
  mkExec('open','BUY'), mkExec('open','SELL'), mkExec('open','BUY'),
  mkExec('open','SELL'), mkExec('open','BUY'), mkExec('open','BUY'),
  mkExec('open','SELL'), mkExec('open','BUY'), mkExec('open','SELL'),
  mkExec('open','BUY'), mkExec('open','BUY'), mkExec('open','SELL'),
]
const sentRows = [
  mkExec('open','BUY','ok'), mkExec('close','BUY','ok'), mkExec('open','SELL','ok'),
  mkExec('open','BUY','ok'), mkExec('close','SELL','ok'), mkExec('open','BUY','ok'),
  mkExec('close','BUY','ok'), mkExec('open','SELL','ok'), mkExec('open','BUY','ok'),
  mkExec('close','SELL','ok'), mkExec('open','BUY','ok'), mkExec('open','BUY','ok'),
  mkExec('close','BUY','ok'), mkExec('open','SELL','ok'), mkExec('open','BUY','ok'),
  mkExec('open','SELL','ok'), mkExec('close','SELL','ok'), mkExec('open','BUY','ok'),
  mkExec('close','BUY','ok'), mkExec('open','BUY','ok'), mkExec('open','SELL','ok'),
  mkExec('close','SELL','ok'), mkExec('open','BUY','ok'), mkExec('open','BUY','ok'),
  mkExec('close','BUY','ok'), mkExec('open','SELL','ok'), mkExec('open','BUY','ok'),
  mkExec('close','SELL','ok'), mkExec('open','BUY','ok'), mkExec('close','BUY','ok'),
]

const MOCK_STATE = {
  day: '----',
  exec_mode: 'SIMULATED',
  files: {
    exec:    execRows,
    entries: entriesRows,
    sent:    sentRows,
    errors: [
      { ts_utc: '--:--', reason_code: 'ORDER_REJECTED', http_status: 400, retriable: false },
      { ts_utc: '--:--', reason_code: 'TIMEOUT',        http_status: 504, retriable: true  },
      { ts_utc: '--:--', reason_code: 'MARGIN_CALL',    http_status: 403, retriable: false },
    ],
    snap_eod:   [ mkSnap('eod'), mkSnap('eod'), mkSnap('eod') ],
    snap_event: [ mkSnap('session_start'), mkSnap('session_end'), mkSnap('session_start'), mkSnap('margin_ok'), mkSnap('session_end') ],
    snap_spark: [ mkSnap('burst_hl', true), mkSnap('burst_hl', false) ],
  },
}

// ── Exports ───────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms))

export async function fetchStatus() {
  await delay(120)
  return STAGES
}
export async function triggerRun(stageId) {
  await delay(900)
  return { stage_id: stageId, triggered: true, message: 'started' }
}
export async function fetchLog(stageId) {
  await delay(300)
  return { log: `-- demo mode: no real output for ${stageId} --` }
}
export async function fetchRanking(session) {
  await delay(150)
  const s = RANKING[session.toLowerCase()] || { avg: [], sum: [] }
  return { avg: s.avg, sum: s.sum }
}
export async function fetchConfig() {
  await delay(80)
  return { S8_DD_THR: 0.7, S8_RANK_MONTHS: 12, S8_MIN_SIG_PER_HOUR: 0.1 }
}
export async function saveConfig(_values) {
  await delay(200)
  return { ok: true }
}

// price: サイン波ベースのドリフト（149.1〜150.0の間）で3秒ごとに更新される
export async function fetchLivePrice() {
  const drift = Math.sin(Date.now() / 47000) * 0.41 + Math.sin(Date.now() / 13000) * 0.09
  const price = +(149.527 + drift).toFixed(3)
  return { symbol: 'USDJPY', price, bid: +(price - 0.003).toFixed(3), ask: +(price + 0.003).toFixed(3), ts: '--:--' }
}
export async function fetchLiveBars(limit = 200) {
  await delay(80)
  return { bars: MOCK_BARS.slice(-limit) }
}

// positions: 固定ロング100,000通貨 + 価格に連動するP&L（単位: JPY概算）
export async function fetchLivePositions() {
  const drift    = Math.sin(Date.now() / 47000) * 0.41 + Math.sin(Date.now() / 13000) * 0.09
  const curPrice = +(149.527 + drift).toFixed(3)
  const avgOpen  = 149.234
  const amount   = 100000
  const pl       = +((curPrice - avgOpen) * amount).toFixed(0)

  return {
    symbol: 'USDJPY',
    exec_mode: 'SIMULATED',
    trade_guard: { enabled: false, target_profit: '-', max_loss: '-' },
    balance: { cash: 10000000, unrealized: pl, equity: 10000000 + pl },
    netpositions: [{
      NetPositionId: 'USDJPY-demo',
      NetPositionBase: { Uic: 42, Amount: amount, AverageOpenPrice: avgOpen },
      NetPositionView: { CurrentPrice: curPrice, ProfitLossOnTrade: pl },
    }],
    closed_today: CLOSED_TODAY,
  }
}
export async function fetchLiveState(_limit = 200) {
  await delay(80)
  return MOCK_STATE
}
