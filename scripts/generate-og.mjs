import { mkdir, writeFile } from 'node:fs/promises'
import { TrendingUp } from 'lucide-static'

const width = 1200
const height = 630

const title = 'Trading Lab'
const desc = 'Backtest pipeline and strategy ranking console'
const url = 'trading-lab.pages.dev'

const icon = TrendingUp
  .replace('<svg', '<svg x="0" y="0"')
  .replace('width="24"', 'width="160"')
  .replace('height="24"', 'height="160"')
  .replace('stroke="currentColor"', 'stroke="#5de4c7"')
  .replace('class="lucide lucide-trending-up"', '')

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#080a10"/>
      <stop offset="1" stop-color="#111520"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#5de4c7"/>
      <stop offset="1" stop-color="#89ddff"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <g opacity="0.18">
    <path d="M0 520H1200" stroke="#2a3050"/>
    <path d="M0 420H1200" stroke="#2a3050"/>
    <path d="M0 320H1200" stroke="#2a3050"/>
    <path d="M0 220H1200" stroke="#2a3050"/>
    <path d="M0 120H1200" stroke="#2a3050"/>
    <path d="M180 0V630" stroke="#2a3050"/>
    <path d="M360 0V630" stroke="#2a3050"/>
    <path d="M540 0V630" stroke="#2a3050"/>
    <path d="M720 0V630" stroke="#2a3050"/>
    <path d="M900 0V630" stroke="#2a3050"/>
  </g>

  

  <g transform="translate(92 88)">
    ${icon}
  </g>

  <text x="92" y="320" fill="#ccd6f6" font-size="76" font-weight="700" font-family="Inter, Arial, sans-serif">
    ${title}
  </text>

  <text x="92" y="382" fill="#8892b0" font-size="30" font-family="Inter, Arial, sans-serif">
    ${desc}
  </text>

  <rect x="92" y="456" width="246" height="46" rx="23" fill="#5de4c71a" stroke="#5de4c755"/>
  <text x="120" y="486" fill="#5de4c7" font-size="24" font-weight="600" font-family="Inter, Arial, sans-serif">
    LIVE DEMO
  </text>

  <text x="92" y="574" fill="#5a6a94" font-size="24" font-family="Inter, Arial, sans-serif">
    ${url}
  </text>
</svg>
`.trim()

await mkdir('public', { recursive: true })
await writeFile('public/og-image.svg', svg)
console.log('generated: public/og-image.svg')
