import { useState } from 'react'
import { Info, X } from 'lucide-react'

/**
 * hintKey  : localStorage のキー（同じキーは一度閉じると再表示しない）
 * title    : 太字の見出し（省略可）
 * body     : 説明文
 * color    : アクセントカラー（デフォルト #89ddff）
 */
export default function HintBanner({ hintKey, title, body, color = '#89ddff', style = {} }) {
  const storageKey = `hint:${hintKey}`
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(storageKey) } catch { return true }
  })

  if (!visible) return null

  function dismiss() {
    try { localStorage.setItem(storageKey, '1') } catch {}
    setVisible(false)
  }

  return (
    <div style={{
      background: `${color}0d`,
      border: `1px solid ${color}2e`,
      borderRadius: 5,
      padding: '9px 13px',
      marginBottom: 12,
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      flexShrink: 0,
      ...style,
    }}>
      <Info size={13} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{
            fontSize: 11, fontWeight: 700, color,
            letterSpacing: '0.06em', marginBottom: 3,
          }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.75 }}>{body}</div>
      </div>
      <button
        onClick={dismiss}
        style={{ color: 'var(--muted)', padding: '1px 3px', flexShrink: 0, marginTop: 1 }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
