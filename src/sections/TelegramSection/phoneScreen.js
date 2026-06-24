// Renders the member-directory app UI (redrawn from the reference screenshot in
// the project's design system) onto a high-DPI canvas, used as the texture for
// the 3D phone's screen. No three.js dependency — returns a plain canvas.
//
// Authored at a fixed 1100×2381 (iPhone screen aspect 0.462); every metric is
// scaled by `s = W/1100`, so the layout is resolution-independent.

const SCREEN_ASPECT = 1100 / 2381 // ≈ 0.462

// Design-system colors (mirror src/styles/tokens.css — canvas can't read CSS vars).
const C = {
  bg: '#000000',
  card: '#0d0d0d',
  white: '#ffffff',
  muted: '#535353',
  list: '#cad5e2',
  meta: '#90a1b9',
  accent: '#8642ff',
  borderSubtle: 'rgba(83, 83, 83, 0.45)',
  borderFaint: 'rgba(83, 83, 83, 0.3)',
}

const FONT = "'Vela Sans GX', system-ui, sans-serif"

// Project photos (gender-matched names). Same glob the DirectoryMockup uses.
const WEBP = import.meta.glob('../../assets/people/*.webp', { eager: true, import: 'default' })
const photoUrl = (n) => WEBP[`../../assets/people/photo_${n}.webp`]

const MEMBERS = [
  { n: 1, name: 'Anna Sokolova', role: 'CFO · Northwind Pay', tag: 'fintech' },
  { n: 13, name: 'Leo Park', role: 'Founder · Spool', tag: 'design' },
  { n: 5, name: 'Maya Rivera', role: 'Engineer · Atlas', tag: 'infra' },
  { n: 4, name: 'Noah Adler', role: 'PM · Quietkind', tag: 'climate' },
]

const FILTERS = ['All', 'Founders', 'Investors', 'Designers', 'Eng']
const TABS = ['Members', 'Search', 'Alerts', 'Profile']

// ── small canvas helpers ─────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function pill(ctx, x, y, w, h, { fill, stroke, lineWidth = 2 } = {}) {
  roundRect(ctx, x, y, w, h, h / 2)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke() }
}

function circleImage(ctx, img, cx, cy, d) {
  const r = d / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  // cover-fit the source into the circle
  const ar = img.width / img.height
  let sw = img.width, sh = img.height, sx = 0, sy = 0
  if (ar > 1) { sw = img.height; sx = (img.width - sw) / 2 } else { sh = img.width; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, cx - r, cy - r, d, d)
  ctx.restore()
}

function arrowUpRight(ctx, x, y, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.12
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y + size)
  ctx.lineTo(x + size, y)
  ctx.moveTo(x + size * 0.28, y)
  ctx.lineTo(x + size, y)
  ctx.lineTo(x + size, y + size * 0.72)
  ctx.stroke()
  ctx.restore()
}

// ── status-bar glyphs ────────────────────────────────────────────────────────
function statusIcons(ctx, right, cy, s) {
  ctx.fillStyle = C.white
  // signal — 4 rising bars
  const bw = 7 * s, gap = 4 * s
  let x = right - (bw * 4 + gap * 3) - 130 * s
  for (let i = 0; i < 4; i++) {
    const bh = (8 + i * 6) * s
    roundRect(ctx, x, cy - bh / 2 + 9 * s, bw, bh, 2 * s)
    ctx.fill()
    x += bw + gap
  }
  // wifi — three arcs + dot
  const wx = right - 95 * s, wy = cy + 8 * s
  ctx.strokeStyle = C.white
  ctx.lineWidth = 5 * s
  ctx.lineCap = 'round'
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath()
    ctx.arc(wx, wy, i * 9 * s, Math.PI * 1.25, Math.PI * 1.75)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(wx, wy, 2.5 * s, 0, Math.PI * 2)
  ctx.fill()
  // battery — body + nub + fill + 70
  const bx = right - 64 * s, by = cy - 11 * s, bWid = 50 * s, bHt = 24 * s
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 3 * s
  roundRect(ctx, bx, by, bWid, bHt, 6 * s)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  roundRect(ctx, bx + bWid + 2 * s, by + bHt * 0.3, 4 * s, bHt * 0.4, 2 * s)
  ctx.fill()
  ctx.fillStyle = C.white
  roundRect(ctx, bx + 3 * s, by + 3 * s, (bWid - 6 * s) * 0.7, bHt - 6 * s, 3 * s)
  ctx.fill()
  ctx.font = `600 ${20 * s}px ${FONT}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = C.white
  ctx.fillText('70', bx - 12 * s, cy + 1 * s)
}

// ── tab-bar glyphs (active = accent) ─────────────────────────────────────────
function tabIcon(ctx, name, cx, cy, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size * 0.08
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const r = size / 2
  if (name === 'Members') {
    ctx.beginPath(); ctx.arc(cx - r * 0.5, cy - r * 0.25, r * 0.42, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx + r * 0.55, cy - r * 0.35, r * 0.34, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx - r * 0.5, cy + r * 0.7, r * 0.85, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx + r * 0.55, cy + r * 0.6, r * 0.7, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke()
  } else if (name === 'Search') {
    ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.55, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx + r * 0.25, cy + r * 0.25); ctx.lineTo(cx + r * 0.8, cy + r * 0.8); ctx.stroke()
  } else if (name === 'Alerts') {
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.6, cy + r * 0.45)
    ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.7, cx, cy - r * 0.7)
    ctx.quadraticCurveTo(cx + r * 0.6, cy - r * 0.7, cx + r * 0.6, cy + r * 0.45)
    ctx.closePath(); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.7, r * 0.18, 0, Math.PI); ctx.stroke()
  } else {
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.95, r * 0.75, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke()
  }
  ctx.restore()
}

// ── full screen composition ──────────────────────────────────────────────────
function drawDirectoryScreen(ctx, W, H, photos) {
  const s = W / 1100
  const pad = 70 * s

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Dynamic Island — sits in the safe area above the status row.
  const diW = 210 * s, diH = 54 * s
  roundRect(ctx, (W - diW) / 2, 64 * s, diW, diH, diH / 2)
  ctx.fillStyle = '#000000'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 2 * s
  ctx.stroke()

  // status bar (inset below the rounded top corners)
  const statusY = 108 * s
  ctx.font = `600 ${30 * s}px ${FONT}`
  ctx.fillStyle = C.white
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('9:41', pad, statusY)
  statusIcons(ctx, W - pad, statusY, s)

  // centered "all" chip
  const chipW = 110 * s, chipH = 60 * s, chipX = (W - chipW) / 2, chipY = 178 * s
  pill(ctx, chipX, chipY, chipW, chipH, { fill: '#161616', stroke: C.borderFaint, lineWidth: 2 * s })
  ctx.font = `500 ${30 * s}px ${FONT}`
  ctx.fillStyle = C.list
  ctx.textAlign = 'center'
  ctx.fillText('all', W / 2, chipY + chipH / 2 + 1 * s)

  // title
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const titleY = 360 * s
  ctx.font = `600 ${46 * s}px ${FONT}`
  const t1 = 'Vertex Club'
  const t2 = '  ·  Berlin, est. 2024'
  ctx.fillStyle = C.white
  const w1 = ctx.measureText(t1).width
  ctx.font = `400 ${40 * s}px ${FONT}`
  const w2 = ctx.measureText(t2).width
  const startX = (W - (w1 + w2)) / 2
  ctx.textAlign = 'left'
  ctx.font = `600 ${46 * s}px ${FONT}`
  ctx.fillStyle = C.white
  ctx.fillText(t1, startX, titleY)
  ctx.font = `400 ${40 * s}px ${FONT}`
  ctx.fillStyle = C.muted
  ctx.fillText(t2, startX + w1, titleY)
  ctx.textAlign = 'center'
  ctx.font = `400 ${32 * s}px ${FONT}`
  ctx.fillStyle = C.meta
  ctx.fillText('142 members', W / 2, titleY + 56 * s)

  // filter chips
  const fY = 490 * s, fH = 70 * s
  let fx = pad
  ctx.font = `500 ${30 * s}px ${FONT}`
  ctx.textBaseline = 'middle'
  for (let i = 0; i < FILTERS.length; i++) {
    const label = FILTERS[i]
    const tw = ctx.measureText(label).width
    const cw = tw + 56 * s
    const active = i === 0
    pill(ctx, fx, fY, cw, fH, {
      fill: active ? C.accent : '#101010',
      stroke: active ? null : C.borderFaint,
      lineWidth: 2 * s,
    })
    ctx.fillStyle = active ? C.white : C.list
    ctx.textAlign = 'center'
    ctx.fillText(label, fx + cw / 2, fY + fH / 2 + 1 * s)
    fx += cw + 18 * s
  }
  // right edge fade so the row reads as scrollable
  const fade = ctx.createLinearGradient(W - 130 * s, 0, W, 0)
  fade.addColorStop(0, 'rgba(0,0,0,0)')
  fade.addColorStop(1, C.bg)
  ctx.fillStyle = fade
  ctx.fillRect(W - 130 * s, fY - 10 * s, 130 * s, fH + 20 * s)

  // member cards
  const cardsTop = 620 * s
  const tabTop = H - 240 * s
  const gap = 28 * s
  const cardH = (tabTop - cardsTop - gap * (MEMBERS.length - 1) - 20 * s) / MEMBERS.length
  const cardX = pad
  const cardW = W - pad * 2

  MEMBERS.forEach((m, i) => {
    const y = cardsTop + i * (cardH + gap)
    const ip = 46 * s
    roundRect(ctx, cardX, y, cardW, cardH, 38 * s)
    ctx.fillStyle = C.card
    ctx.fill()
    ctx.strokeStyle = C.borderFaint
    ctx.lineWidth = 2 * s
    ctx.stroke()

    // avatar
    const avD = 116 * s
    const avCx = cardX + ip + avD / 2
    const avCy = y + ip + avD / 2
    const img = photos[m.n]
    if (img) {
      circleImage(ctx, img, avCx, avCy, avD)
    } else {
      ctx.fillStyle = C.accent
      ctx.beginPath(); ctx.arc(avCx, avCy, avD / 2, 0, Math.PI * 2); ctx.fill()
    }

    // name + role
    const tx = cardX + ip + avD + 30 * s
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.font = `600 ${40 * s}px ${FONT}`
    ctx.fillStyle = C.white
    ctx.fillText(m.name, tx, y + ip + 50 * s)
    ctx.font = `400 ${30 * s}px ${FONT}`
    ctx.fillStyle = C.muted
    ctx.fillText(m.role, tx, y + ip + 98 * s)

    // "Ask for intro ↗" — right side, aligned to the name row
    ctx.font = `500 ${28 * s}px ${FONT}`
    const askLabel = 'Ask for intro'
    const askTw = ctx.measureText(askLabel).width
    const arrowSz = 26 * s
    const askW = askTw + arrowSz + 70 * s
    const askH = 64 * s
    const askX = cardX + cardW - ip - askW
    const askY = y + ip + 6 * s
    pill(ctx, askX, askY, askW, askH, { fill: '#161616', stroke: C.borderFaint, lineWidth: 2 * s })
    ctx.fillStyle = C.list
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(askLabel, askX + 30 * s, askY + askH / 2 + 1 * s)
    arrowUpRight(ctx, askX + 30 * s + askTw + 16 * s, askY + askH / 2 - arrowSz / 2, arrowSz, C.list)

    // tag chip — bottom-left
    ctx.font = `500 ${27 * s}px ${FONT}`
    const tagTw = ctx.measureText(m.tag).width
    const tagW = tagTw + 44 * s
    const tagH = 52 * s
    const tagX = cardX + ip
    const tagY = y + cardH - ip - tagH
    pill(ctx, tagX, tagY, tagW, tagH, { fill: '#161616', stroke: C.borderFaint, lineWidth: 2 * s })
    ctx.fillStyle = C.meta
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(m.tag, tagX + tagW / 2, tagY + tagH / 2 + 1 * s)
  })

  // bottom tab bar
  ctx.strokeStyle = C.borderFaint
  ctx.lineWidth = 2 * s
  ctx.beginPath()
  ctx.moveTo(0, tabTop)
  ctx.lineTo(W, tabTop)
  ctx.stroke()
  const tabW = W / TABS.length
  TABS.forEach((label, i) => {
    const cx = tabW * (i + 0.5)
    const active = i === 0
    const color = active ? C.accent : C.muted
    tabIcon(ctx, label, cx, tabTop + 78 * s, 56 * s, color)
    ctx.font = `500 ${24 * s}px ${FONT}`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, cx, tabTop + 142 * s)
  })
  // home indicator
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  roundRect(ctx, W / 2 - 90 * s, H - 26 * s, 180 * s, 9 * s, 5 * s)
  ctx.fill()
}

async function loadPhotos(numbers) {
  const out = {}
  await Promise.all(numbers.map(async (n) => {
    const url = photoUrl(n)
    if (!url) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    try { await img.decode() } catch { /* leave undefined → accent fallback */ return }
    out[n] = img
  }))
  return out
}

/**
 * Build the directory-screen canvas. Awaits the project font + member photos so
 * the first paint is final (no flash of fallback type).
 * @param {{ width?: number }} [opts]
 * @returns {Promise<{ canvas: HTMLCanvasElement, aspect: number }>}
 */
export async function createScreenCanvas({ width = 1100 } = {}) {
  const W = width
  const H = Math.round(W / SCREEN_ASPECT)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Ensure the variable font is ready before measuring/drawing text.
  if (document.fonts?.load) {
    try {
      await Promise.all([
        document.fonts.load(`600 48px ${FONT}`),
        document.fonts.load(`400 40px ${FONT}`),
        document.fonts.ready,
      ])
    } catch { /* fall back to system-ui */ }
  }

  const photos = await loadPhotos(MEMBERS.map((m) => m.n))
  drawDirectoryScreen(ctx, W, H, photos)
  return { canvas, aspect: SCREEN_ASPECT }
}

export { SCREEN_ASPECT }
