// Renders the Meets match-chat UI onto a high-DPI canvas, used as the texture
// for the 3D phone's screen (same contract as TelegramSection/phoneScreen.js).
// No three.js dependency — returns a plain canvas.
//
// Authored at a fixed 1100×2381 (iPhone screen aspect 0.462); every metric is
// scaled by `s = W/1100`, so the layout is resolution-independent.

const SCREEN_ASPECT = 1100 / 2381 // ≈ 0.462

// Design-system colors (mirror src/styles/tokens.css — canvas can't read CSS
// vars). Light chat: white screen, bordered white incoming bubbles, accent
// outgoing — matching the page's light theme.
const C = {
  bg: '#ffffff',
  bubble: '#ffffff',
  text: '#414141',
  body: '#464646',
  muted: '#535353',
  white: '#ffffff',
  accent: '#8642ff',
  borderFaint: 'rgba(83, 83, 83, 0.3)',
}

const FONT = "'Vela Sans GX', system-ui, sans-serif"

// Match partner photo — same optimized set the rest of the page uses.
const WEBP = import.meta.glob('../../assets/people/*.webp', { eager: true, import: 'default' })
const AVATAR_URL = WEBP['../../assets/people/photo_3.webp']

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

function circleImage(ctx, img, cx, cy, d) {
  const r = d / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  const ar = img.width / img.height
  let sw = img.width, sh = img.height, sx = 0, sy = 0
  if (ar > 1) { sw = img.height; sx = (img.width - sw) / 2 } else { sh = img.width; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, cx - r, cy - r, d, d)
  ctx.restore()
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const probe = line ? `${line} ${word}` : word
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = probe
    }
  }
  if (line) lines.push(line)
  return lines
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * Draws the chat and returns { canvas, aspect }.
 * `chat` = { found, name, role, msg1, msg2, msg3 } — localized strings.
 */
export async function createMeetsScreenCanvas({ width = 1100, chat }) {
  const W = width
  const H = Math.round(W / SCREEN_ASPECT)
  const s = W / 1100

  const [avatar] = await Promise.all([
    loadImage(AVATAR_URL),
    // Make sure the brand font is ready before rasterizing text.
    document.fonts?.load?.(`600 ${40 * s}px ${FONT}`).catch(() => {}) ?? Promise.resolve(),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // background
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // ── status bar ────────────────────────────────────────────────────────────
  ctx.fillStyle = C.text
  ctx.font = `600 ${44 * s}px ${FONT}`
  ctx.textBaseline = 'middle'
  ctx.fillText('9:41', 90 * s, 105 * s)

  // ── chat header: avatar + name + role ─────────────────────────────────────
  const headY = 250 * s
  if (avatar) circleImage(ctx, avatar, 145 * s, headY, 110 * s)
  ctx.fillStyle = C.text
  ctx.font = `600 ${46 * s}px ${FONT}`
  ctx.fillText(chat.name, 225 * s, headY - 26 * s)
  ctx.fillStyle = C.muted
  ctx.font = `400 ${34 * s}px ${FONT}`
  ctx.fillText(chat.role, 225 * s, headY + 30 * s)

  ctx.strokeStyle = C.borderFaint
  ctx.lineWidth = 2 * s
  ctx.beginPath()
  ctx.moveTo(0, 350 * s)
  ctx.lineTo(W, 350 * s)
  ctx.stroke()

  // ── "match found" pill, centered ──────────────────────────────────────────
  ctx.font = `600 ${34 * s}px ${FONT}`
  const foundW = ctx.measureText(chat.found).width + 90 * s
  roundRect(ctx, (W - foundW) / 2, 430 * s, foundW, 84 * s, 42 * s)
  ctx.fillStyle = C.accent
  ctx.fill()
  ctx.fillStyle = C.white
  ctx.textAlign = 'center'
  ctx.fillText(chat.found, W / 2, 474 * s)
  ctx.textAlign = 'left'

  // ── message bubbles ───────────────────────────────────────────────────────
  const bubbleFont = `400 ${38 * s}px ${FONT}`
  const lineH = 54 * s
  const padX = 44 * s
  const padY = 36 * s
  const maxText = 620 * s

  let y = 610 * s

  const bubble = (text, outgoing) => {
    ctx.font = bubbleFont
    const lines = wrapLines(ctx, text, maxText)
    const textW = Math.max(...lines.map((l) => ctx.measureText(l).width))
    const w = textW + padX * 2
    const h = lines.length * lineH + padY * 2 - (lineH - 46 * s)
    const x = outgoing ? W - 70 * s - w : 70 * s

    roundRect(ctx, x, y, w, h, 40 * s)
    ctx.fillStyle = outgoing ? C.accent : C.bubble
    ctx.fill()
    if (!outgoing) {
      ctx.strokeStyle = C.borderFaint
      ctx.lineWidth = 2 * s
      ctx.stroke()
    }

    ctx.fillStyle = outgoing ? C.white : C.body
    lines.forEach((l, i) => {
      ctx.fillText(l, x + padX, y + padY + 20 * s + i * lineH)
    })

    y += h + 40 * s
  }

  bubble(chat.msg1, false)
  bubble(chat.msg2, true)
  bubble(chat.msg3, false)

  // ── input bar pinned to the bottom ────────────────────────────────────────
  const inputY = H - 210 * s
  roundRect(ctx, 70 * s, inputY, W - 320 * s, 110 * s, 55 * s)
  ctx.fillStyle = C.bubble
  ctx.fill()
  ctx.strokeStyle = C.borderFaint
  ctx.lineWidth = 2 * s
  ctx.stroke()

  // send button
  const sendCx = W - 130 * s
  const sendCy = inputY + 55 * s
  ctx.beginPath()
  ctx.arc(sendCx, sendCy, 55 * s, 0, Math.PI * 2)
  ctx.fillStyle = C.accent
  ctx.fill()
  // arrow-up glyph
  ctx.strokeStyle = C.white
  ctx.lineWidth = 8 * s
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(sendCx, sendCy + 22 * s)
  ctx.lineTo(sendCx, sendCy - 22 * s)
  ctx.moveTo(sendCx - 18 * s, sendCy - 2 * s)
  ctx.lineTo(sendCx, sendCy - 22 * s)
  ctx.lineTo(sendCx + 18 * s, sendCy - 2 * s)
  ctx.stroke()

  return { canvas, aspect: SCREEN_ASPECT }
}
