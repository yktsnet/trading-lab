// Demo mode — static mock data. No backend connection.

const STAGE_DEFS = [
  { id: 's1-append',  label: 'S1 append',  description: '市場データを取得・追記',                result: 'success', offsetH: 5  },
  { id: 's1-export',  label: 'S1 export',  description: '列指向フォーマット（Parquet）に変換',   result: 'success', offsetH: 17 },
  { id: 's1-enrich',  label: 'S1 enrich',  description: 'テクニカル指標を事前計算',              result: 'success', offsetH: 17 },
  { id: 's2-gen',     label: 'S2 gen',     description: '戦略パラメータを展開・生成',            result: 'success', offsetH: 16 },
  { id: 's3-calc',    label: 'S3 calc',    description: '全戦略のエントリーシグナルを計算',      result: 'success', offsetH: 12 },
  { id: 's4-ban',     label: 'S4 ban',     description: 'セッション別の除外リストを構築',        result: 'failed',  offsetH: 12 },
  { id: 's5-engine',  label: 'S5 engine',  description: 'TP/SL/EODに基づきポジションを計算',   result: 'success', offsetH: 11 },
  { id: 's6-pips',    label: 'S6 pips',    description: 'ポジションごとのnet pipsを付与',       result: 'success', offsetH: 11 },
  { id: 's7-summary', label: 'S7 summary', description: '月次・四半期・年次で成績を集計',        result: 'failed',  offsetH: 11 },
  { id: 's8-rank',    label: 'S8 rank',    description: 'DDフィルタ後に戦略をスコアリング',      result: 'success', offsetH: 10 },
]

const ERROR_LOGS = {
  's4-ban': `Mar 29 07:12:43 vps python3[38421]: s4: months=3 min_rate=0.1 max_rate=0.5 jaccard=0.7
Mar 29 07:12:44 vps python3[38421]: s4 [session-a]: total=134 rate_ban=88 jaccard_ban=0 ok=46
Mar 29 07:12:45 vps python3[38421]: Traceback (most recent call last):
Mar 29 07:12:45 vps python3[38421]:   File "core/s4_ban_build.py", line 119, in run
Mar 29 07:12:45 vps python3[38421]:     banned_dd = dd_df[(dd_df["max_dd"] >= dd_thr) | (dd_df["total_pips"] < 0)]
Mar 29 07:12:45 vps python3[38421]: KeyError: 'total_pips'
Mar 29 07:12:45 vps systemd[1]: backtest-s4-ban.service: Main process exited, code=exited, status=1/FAILURE`,
  's7-summary': `Mar 29 07:18:02 vps python3[39104]: s7: 6821 monthly records
Mar 29 07:18:03 vps python3[39104]: WARN .../pos_events/T03/slope_min0p1/year=2023/11.parquet: Can only use .str accessor with string values!
Mar 29 07:18:03 vps python3[39104]: WARN .../pos_events/T05/enter10_k21/year=2021/02.parquet: Can only use .str accessor with string values!
Mar 29 07:18:04 vps python3[39104]: Traceback (most recent call last):
Mar 29 07:18:04 vps python3[39104]:   File "core/s7_position_summary.py", line 98, in run
Mar 29 07:18:04 vps python3[39104]:     qdf = mdf.groupby(["year","quarter","session","id","slug"]).agg(...)
Mar 29 07:18:04 vps python3[39104]: ValueError: Cannot convert non-finite values (NA or inf) to integer
Mar 29 07:18:04 vps systemd[1]: backtest-s7-summary.service: Main process exited, code=exited, status=1/FAILURE`,
}

const state = STAGE_DEFS.map(s => ({
  ...s,
  last_run: new Date(Date.now() - 1000 * 60 * 60 * s.offsetH).toISOString(),
  currently_running: false,
}))

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

export async function fetchStatus() {
  await delay(250)
  return state.map(s => ({ ...s }))
}

export async function triggerRun(stageId) {
  await delay(150)
  const s = state.find(x => x.id === stageId)
  if (!s) return { triggered: false }

  s.currently_running = true
  s.result = 'unknown'

  const runDuration = ['s3-calc', 's5-engine'].includes(stageId) ? 4000 : 1800
  const willFail = stageId === 's4-ban' || stageId === 's7-summary'

  await delay(runDuration)
  s.currently_running = false

  if (willFail) {
    s.result = 'failed'
    s.last_run = new Date().toISOString()
    throw new Error('stage failed')
  }

  s.result = 'success'
  s.last_run = new Date().toISOString()
  return { stage_id: stageId, triggered: true, message: 'started' }
}

export async function fetchLog(stageId) {
  await delay(300)
  const log = ERROR_LOGS[stageId]
  if (log) return { log }
  return { log: `[demo] ${stageId} — エラーなし。正常終了しました。` }
}

const RANKING = {
  'session-a': {
    avg: [
      { id:'T06', slug:'zone_high_fast14_lvl150',    entries_total:98,   pips_sum_total:2891.8, pips_avg_per_entry:29.51, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow20_lvl200',    entries_total:23,   pips_sum_total:664.8,  pips_avg_per_entry:28.90, max_dd:0.00 },
      { id:'T01', slug:'osc_high_p8_thr75',          entries_total:97,   pips_sum_total:2800.1, pips_avg_per_entry:28.87, max_dd:0.00 },
      { id:'T04', slug:'cross_d7_thr85_k9',          entries_total:43,   pips_sum_total:1236.4, pips_avg_per_entry:28.76, max_dd:0.05 },
      { id:'T04', slug:'cross_d3_thr90_k9',          entries_total:41,   pips_sum_total:1177.2, pips_avg_per_entry:28.71, max_dd:0.00 },
      { id:'T24', slug:'trend_up_streak2',            entries_total:431,  pips_sum_total:12188.0,pips_avg_per_entry:28.28, max_dd:0.00 },
      { id:'T01', slug:'osc_high_p8_thr70',          entries_total:182,  pips_sum_total:5193.8, pips_avg_per_entry:28.54, max_dd:0.00 },
      { id:'T08', slug:'slope_up_f9_s34_min0p02',    entries_total:62,   pips_sum_total:1773.1, pips_avg_per_entry:28.60, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p05',    entries_total:465,  pips_sum_total:9541.0, pips_avg_per_entry:20.52, max_dd:0.00 },
      { id:'T14', slug:'band_lower_p20_dev1p5_lb1',  entries_total:458,  pips_sum_total:8723.0, pips_avg_per_entry:19.05, max_dd:0.00 },
    ],
    sum: [
      { id:'T24', slug:'trend_up_streak2',            entries_total:431,  pips_sum_total:12188.0,pips_avg_per_entry:28.28, max_dd:0.00 },
      { id:'T18', slug:'vortex_pos_p7_d0p05',        entries_total:805,  pips_sum_total:9607.0, pips_avg_per_entry:11.93, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p05',    entries_total:465,  pips_sum_total:9541.0, pips_avg_per_entry:20.52, max_dd:0.00 },
      { id:'T14', slug:'band_lower_p20_dev1p5_lb1',  entries_total:458,  pips_sum_total:8723.0, pips_avg_per_entry:19.05, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl100',    entries_total:311,  pips_sum_total:8597.0, pips_avg_per_entry:27.64, max_dd:0.00 },
      { id:'T18', slug:'vortex_pos_p14_d0p05',       entries_total:924,  pips_sum_total:8043.0, pips_avg_per_entry:8.70,  max_dd:0.00 },
      { id:'T23', slug:'cloud_above_tk7_kj22_sb44',  entries_total:515,  pips_sum_total:7513.0, pips_avg_per_entry:14.59, max_dd:0.02 },
      { id:'T06', slug:'zone_high_slow30_lvl100',    entries_total:314,  pips_sum_total:7187.0, pips_avg_per_entry:22.89, max_dd:0.00 },
      { id:'T01', slug:'osc_high_p8_thr65',          entries_total:257,  pips_sum_total:6941.0, pips_avg_per_entry:27.01, max_dd:0.00 },
      { id:'T04', slug:'cross_d3_thr80_k14',         entries_total:202,  pips_sum_total:5557.0, pips_avg_per_entry:27.51, max_dd:0.00 },
    ],
  },
  'session-b': {
    avg: [
      { id:'T06', slug:'zone_high_fast14_lvl200',    entries_total:124,  pips_sum_total:3553.0, pips_avg_per_entry:28.65, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl150',    entries_total:640,  pips_sum_total:17946.0,pips_avg_per_entry:28.04, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow20_lvl150',    entries_total:647,  pips_sum_total:17663.0,pips_avg_per_entry:27.30, max_dd:0.00 },
      { id:'T04', slug:'cross_d3_thr90_k9',          entries_total:190,  pips_sum_total:5160.0, pips_avg_per_entry:27.16, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl100',    entries_total:1468, pips_sum_total:40245.0,pips_avg_per_entry:27.41, max_dd:0.00 },
      { id:'T24', slug:'trend_up_streak2',            entries_total:1966, pips_sum_total:53601.0,pips_avg_per_entry:27.26, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p05',    entries_total:1871, pips_sum_total:43249.0,pips_avg_per_entry:23.11, max_dd:0.00 },
      { id:'T14', slug:'band_lower_p20_dev1p5_lb1',  entries_total:1822, pips_sum_total:36822.0,pips_avg_per_entry:20.21, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow30_lvl100',    entries_total:1508, pips_sum_total:31653.0,pips_avg_per_entry:20.99, max_dd:0.00 },
      { id:'T23', slug:'cloud_above_tk7_kj22_sb44',  entries_total:2107, pips_sum_total:33760.0,pips_avg_per_entry:16.02, max_dd:0.00 },
    ],
    sum: [
      { id:'T24', slug:'trend_up_streak2',            entries_total:1966, pips_sum_total:53601.0,pips_avg_per_entry:27.26, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p05',    entries_total:1871, pips_sum_total:43249.0,pips_avg_per_entry:23.11, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl100',    entries_total:1468, pips_sum_total:40245.0,pips_avg_per_entry:27.41, max_dd:0.00 },
      { id:'T18', slug:'vortex_pos_p7_d0p05',        entries_total:3037, pips_sum_total:37254.0,pips_avg_per_entry:12.27, max_dd:0.00 },
      { id:'T14', slug:'band_lower_p20_dev1p5_lb1',  entries_total:1822, pips_sum_total:36822.0,pips_avg_per_entry:20.21, max_dd:0.00 },
      { id:'T23', slug:'cloud_above_tk7_kj22_sb44',  entries_total:2107, pips_sum_total:33760.0,pips_avg_per_entry:16.02, max_dd:0.00 },
      { id:'T01', slug:'osc_high_p8_thr65',          entries_total:1351, pips_sum_total:32458.0,pips_avg_per_entry:24.02, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow30_lvl100',    entries_total:1508, pips_sum_total:31653.0,pips_avg_per_entry:20.99, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p1',     entries_total:1521, pips_sum_total:28938.0,pips_avg_per_entry:19.03, max_dd:0.00 },
      { id:'T18', slug:'vortex_pos_p14_d0p05',       entries_total:3327, pips_sum_total:37253.0,pips_avg_per_entry:11.20, max_dd:0.00 },
    ],
  },
  'session-c': {
    avg: [
      { id:'T08', slug:'slope_up_f9_s34_min0p02',    entries_total:62,   pips_sum_total:1819.8, pips_avg_per_entry:29.35, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl200',    entries_total:75,   pips_sum_total:2185.5, pips_avg_per_entry:29.14, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow20_lvl200',    entries_total:94,   pips_sum_total:2743.0, pips_avg_per_entry:29.18, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl150',    entries_total:429,  pips_sum_total:12090.0,pips_avg_per_entry:28.18, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow20_lvl150',    entries_total:411,  pips_sum_total:11185.0,pips_avg_per_entry:27.21, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl100',    entries_total:1205, pips_sum_total:31970.0,pips_avg_per_entry:26.53, max_dd:0.00 },
      { id:'T24', slug:'trend_up_streak2',            entries_total:1883, pips_sum_total:48298.0,pips_avg_per_entry:25.65, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p05',    entries_total:1848, pips_sum_total:36300.0,pips_avg_per_entry:19.64, max_dd:0.00 },
      { id:'T14', slug:'band_lower_p20_dev1p5_lb1',  entries_total:1594, pips_sum_total:30840.0,pips_avg_per_entry:19.34, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow30_lvl100',    entries_total:1102, pips_sum_total:24140.0,pips_avg_per_entry:21.91, max_dd:0.00 },
    ],
    sum: [
      { id:'T24', slug:'trend_up_streak2',            entries_total:1883, pips_sum_total:48298.0,pips_avg_per_entry:25.65, max_dd:0.00 },
      { id:'T18', slug:'vortex_pos_p7_d0p05',        entries_total:3407, pips_sum_total:39893.0,pips_avg_per_entry:11.71, max_dd:0.00 },
      { id:'T03', slug:'mid_trend_up_p14_sl0p05',    entries_total:1848, pips_sum_total:36300.0,pips_avg_per_entry:19.64, max_dd:0.00 },
      { id:'T06', slug:'zone_high_fast14_lvl100',    entries_total:1205, pips_sum_total:31970.0,pips_avg_per_entry:26.53, max_dd:0.00 },
      { id:'T14', slug:'band_lower_p20_dev1p5_lb1',  entries_total:1594, pips_sum_total:30840.0,pips_avg_per_entry:19.34, max_dd:0.00 },
      { id:'T18', slug:'vortex_pos_p14_d0p05',       entries_total:2891, pips_sum_total:28434.0,pips_avg_per_entry:9.84,  max_dd:0.00 },
      { id:'T23', slug:'cloud_above_tk7_kj22_sb44',  entries_total:1644, pips_sum_total:26324.0,pips_avg_per_entry:16.01, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow30_lvl100',    entries_total:1102, pips_sum_total:24140.0,pips_avg_per_entry:21.91, max_dd:0.00 },
      { id:'T01', slug:'osc_high_p8_thr65',          entries_total:998,  pips_sum_total:21849.0,pips_avg_per_entry:21.89, max_dd:0.00 },
      { id:'T06', slug:'zone_high_slow20_lvl150',    entries_total:411,  pips_sum_total:11185.0,pips_avg_per_entry:27.21, max_dd:0.00 },
    ],
  },
}

export async function fetchRanking(session) {
  await delay(400)
  const map = { tyo: 'session-a', lon: 'session-b', nyc: 'session-c' }
  return RANKING[map[session]] || { avg: [], sum: [] }
}

export async function fetchConfig() {
  await delay(200)
  return { S8_DD_THR: 0.7, S8_RANK_MONTHS: 12, S8_MIN_ENTRIES: 20 }
}

export async function saveConfig(values) {
  await delay(300)
  return { ok: true }
}
