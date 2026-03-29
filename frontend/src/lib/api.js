const BASE = 'http://localhost:8765'

export async function fetchStatus() {
  const r = await fetch(`${BASE}/api/status`)
  if (!r.ok) throw new Error('status failed')
  return r.json()
}

export async function triggerRun(stageId) {
  const r = await fetch(`${BASE}/api/run/${stageId}`, { method: 'POST' })
  if (!r.ok) throw new Error('run failed')
  return r.json()
}

export async function fetchLog(stageId) {
  const r = await fetch(`${BASE}/api/log/${stageId}`)
  if (!r.ok) return { log: 'failed to fetch log' }
  return r.json()
}

export async function fetchRanking(session) {
  const r = await fetch(`${BASE}/api/rank/${session}`)
  if (!r.ok) return { avg: [], sum: [] }
  return r.json()
}

export async function fetchConfig() {
  const r = await fetch(`${BASE}/api/config/s8`)
  if (!r.ok) return null
  return r.json()
}

export async function saveConfig(values) {
  const r = await fetch(`${BASE}/api/config/s8`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!r.ok) throw new Error('config save failed')
  return r.json()
}
