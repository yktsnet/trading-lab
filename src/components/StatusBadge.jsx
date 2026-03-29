const STYLES = {
  success: { color: 'var(--success)', label: 'success' },
  failed:  { color: 'var(--danger)',  label: 'failed'  },
  running: { color: '#89ddff',        label: 'running' },
  skip:    { color: 'var(--skip)',    label: 'skip'    },
  unknown: { color: 'var(--muted)',   label: '—'       },
}

export default function StatusBadge({ result }) {
  const s = STYLES[result] ?? STYLES.unknown
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      color: s.color,
      fontSize: 12,
    }}>
      <span style={{
        width: 6, height: 6,
        borderRadius: '50%',
        background: s.color,
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  )
}
