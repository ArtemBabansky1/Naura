// Renders the Meets match-chat UI onto a high-DPI canvas, used as the texture
// for the 3D phone's screen (same contract as TelegramSection/phoneScreen.js).
// No three.js dependency — returns a plain canvas plus a `draw(now)` that
// advances a looping reveal animation, so the React layer can repaint it and
// flag the texture each frame.
//
// Authored at a fixed 1100×2381 (iPhone screen aspect 0.462); every metric is
// scaled by `s = W/1100`, so the layout is resolution-independent.

const SCREEN_ASPECT = 1100 / 2381 // ≈ 0.462
const CYCLE = 7000 // ms — full animation loop (reveal → hold → fade → repeat)

// Design-system colors (mirror src/styles/tokens.css — canvas can't read CSS
// vars). Light chat: white screen, bordered white incoming bubbles, accent
// outgoing — matching the page's light theme.
const C = {
  bg: '#ffffff',
  bubble: '#ffffff',
  text: '#414141',
  body: '#464646',
  muted: '#8b8b92',
  white: '#ffffff',
  accent: '#8642ff',
  border: 'rgba(83, 83, 83, 0.16)',
  borderFaint: 'rgba(83, 83, 83, 0.3)',
  island: '#0e0e11',
  typing: '#b6b6bd',
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

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// ── status-bar glyphs (iOS-style, dark monochrome on the white screen) ───────
function drawSignal(ctx, x, baseline, s, color) {
  ctx.fillStyle = color
  const bw = 11 * s
  const gap = 7 * s
  const heights = [16, 24, 32, 40]
  heights.forEach((hh, i) => {
    const h = hh * s
    roundRect(ctx, x + i * (bw + gap), baseline - h, bw, h, 3 * s)
    ctx.fill()
  })
}

function drawWifi(ctx, cx, baseline, s, color) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'
  const dotY = baseline - 4 * s
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 10 * s
    ctx.beginPath()
    ctx.arc(cx, dotY, (14 + i * 15) * s, Math.PI * 1.25, Math.PI * 1.75)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, dotY, 5 * s, 0, Math.PI * 2)
  ctx.fill()
}

function drawBattery(ctx, x, cy, s, color) {
  const w = 58 * s
  const h = 28 * s
  const y = cy - h / 2
  // shell
  ctx.strokeStyle = color
  ctx.lineWidth = 3 * s
  ctx.globalAlpha = 0.45
  roundRect(ctx, x, y, w, h, 8 * s)
  ctx.stroke()
  ctx.globalAlpha = 1
  // positive nub
  ctx.fillStyle = color
  roundRect(ctx, x + w + 4 * s, cy - 6 * s, 6 * s, 12 * s, 3 * s)
  ctx.fill()
  // charge level
  const pad = 6 * s
  roundRect(ctx, x + pad, y + pad, (w - pad * 2) * 0.82, h - pad * 2, 4 * s)
  ctx.fill()
  // charging bolt (white cut-out over the level)
  const bx = x + w * 0.5
  const by = cy
  const u = 8 * s
  ctx.fillStyle = C.white
  ctx.beginPath()
  ctx.moveTo(bx + 0.5 * u, by - 1.2 * u)
  ctx.lineTo(bx - 0.7 * u, by + 0.2 * u)
  ctx.lineTo(bx - 0.05 * u, by + 0.2 * u)
  ctx.lineTo(bx - 0.5 * u, by + 1.2 * u)
  ctx.lineTo(bx + 0.7 * u, by - 0.2 * u)
  ctx.lineTo(bx + 0.05 * u, by - 0.2 * u)
  ctx.closePath()
  ctx.fill()
}

/**
 * Draws the chat and returns { canvas, aspect, draw, cycle }.
 * `chat` = { found, name, role, msg1, msg2, msg3 } — localized strings.
 * `draw(now)` repaints the canvas for animation time `now` (ms); the caller
 * flags the 3D texture dirty after each call.
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

  // ── pre-measure the chat bubbles once (positions are static; only their
  // reveal changes each frame) ──────────────────────────────────────────────
  const bubbleFont = `400 ${38 * s}px ${FONT}`
  const lineH = 54 * s
  const padX = 44 * s
  const padY = 34 * s
  const maxText = 620 * s
  const gap = 34 * s

  const measure = (text, outgoing) => {
    ctx.font = bubbleFont
    const lines = wrapLines(ctx, text, maxText)
    const textW = Math.max(...lines.map((l) => ctx.measureText(l).width))
    const w = textW + padX * 2
    const h = lines.length * lineH + padY * 2 - (lineH - 46 * s)
    const x = outgoing ? W - 70 * s - w : 70 * s
    return { lines, x, w, h, outgoing }
  }

  const pillFont = `600 ${34 * s}px ${FONT}`
  ctx.font = pillFont
  const pillW = ctx.measureText(chat.found).width + 90 * s
  const pill = { x: (W - pillW) / 2, y: 430 * s, w: pillW, h: 84 * s }

  let y = 610 * s
  const bubbles = []
  ;[[chat.msg1, false], [chat.msg2, true], [chat.msg3, false]].forEach(([text, out]) => {
    const b = measure(text, out)
    b.y = y
    bubbles.push(b)
    y += b.h + gap
  })

  // Reveal schedule (ms). Incoming bubbles get a typing indicator in the gap
  // before they land.
  const T = { pill: 200, type1: [760, 1500], msg1: 1500, msg2: 2140, type3: [2620, 3320], msg3: 3320 }
  const SETTLED = 3700 // everything on-screen, before the loop's fade

  // ── static chrome (repainted every frame under the animated chat) ─────────
  function drawStatusBar() {
    // Dynamic Island — also masks the model's notch area at the screen top.
    const iw = 340 * s
    const ih = 96 * s
    roundRect(ctx, (W - iw) / 2, 40 * s, iw, ih, ih / 2)
    ctx.fillStyle = C.island
    ctx.fill()

    ctx.fillStyle = C.text
    ctx.font = `600 ${46 * s}px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText('9:41', 86 * s, 92 * s)

    const iconY = 92 * s
    drawSignal(ctx, 806 * s, iconY + 20 * s, s, C.text)
    drawWifi(ctx, 928 * s, iconY + 20 * s, s, C.text)
    drawBattery(ctx, 984 * s, iconY, s, C.text)
  }

  function drawHeader() {
    const headY = 250 * s
    if (avatar) circleImage(ctx, avatar, 145 * s, headY, 110 * s)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
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
  }

  function drawInputBar() {
    const inputY = H - 210 * s
    roundRect(ctx, 70 * s, inputY, W - 320 * s, 110 * s, 55 * s)
    ctx.fillStyle = C.bubble
    ctx.fill()
    ctx.strokeStyle = C.borderFaint
    ctx.lineWidth = 2 * s
    ctx.stroke()

    const sendCx = W - 130 * s
    const sendCy = inputY + 55 * s
    ctx.beginPath()
    ctx.arc(sendCx, sendCy, 55 * s, 0, Math.PI * 2)
    ctx.fillStyle = C.accent
    ctx.fill()
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
  }

  // ── animated chat pieces ──────────────────────────────────────────────────
  function reveal(t, at) {
    return easeOut(clamp01((t - at) / 340))
  }

  function drawPill(alpha) {
    if (alpha <= 0) return
    const yOff = (1 - alpha) * 24 * s
    ctx.globalAlpha = alpha
    roundRect(ctx, pill.x, pill.y + yOff, pill.w, pill.h, pill.h / 2)
    ctx.fillStyle = C.accent
    ctx.fill()
    ctx.fillStyle = C.white
    ctx.font = pillFont
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(chat.found, W / 2, pill.y + yOff + pill.h / 2)
    ctx.globalAlpha = 1
  }

  function drawBubble(b, alpha) {
    if (alpha <= 0) return
    const yOff = (1 - alpha) * 24 * s
    const by = b.y + yOff
    ctx.globalAlpha = alpha
    roundRect(ctx, b.x, by, b.w, b.h, 40 * s)
    ctx.fillStyle = b.outgoing ? C.accent : C.bubble
    ctx.fill()
    if (!b.outgoing) {
      ctx.strokeStyle = C.borderFaint
      ctx.lineWidth = 2 * s
      ctx.stroke()
    }
    ctx.fillStyle = b.outgoing ? C.white : C.body
    ctx.font = bubbleFont
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    b.lines.forEach((l, i) => {
      ctx.fillText(l, b.x + padX, by + padY + 20 * s + i * lineH)
    })
    ctx.globalAlpha = 1
  }

  // Incoming "typing…" bubble with three bouncing dots, shown in the slot of
  // the message that is about to arrive.
  function drawTyping(slot, now, alpha) {
    if (alpha <= 0) return
    const w = 150 * s
    const h = 92 * s
    const x = 70 * s
    ctx.globalAlpha = alpha
    roundRect(ctx, x, slot, w, h, 40 * s)
    ctx.fillStyle = C.bubble
    ctx.fill()
    ctx.strokeStyle = C.borderFaint
    ctx.lineWidth = 2 * s
    ctx.stroke()
    for (let i = 0; i < 3; i++) {
      const phase = Math.sin(now / 1000 * 6 + i * 0.7)
      const dy = phase * 6 * s
      const a = 0.4 + 0.6 * clamp01((phase + 1) / 2)
      ctx.globalAlpha = alpha * a
      ctx.fillStyle = C.typing
      ctx.beginPath()
      ctx.arc(x + 44 * s + i * 32 * s, slot + h / 2 + dy, 9 * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function draw(now) {
    const t = ((now % CYCLE) + CYCLE) % CYCLE
    // Chat fades out over the last 600ms, then the loop restarts empty.
    const chatFade = t >= CYCLE - 600 ? clamp01((CYCLE - t) / 600) : 1

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, W, H)

    drawStatusBar()
    drawHeader()

    drawPill(reveal(t, T.pill) * chatFade)
    if (t >= T.type1[0] && t < T.type1[1]) drawTyping(bubbles[0].y, now, chatFade)
    drawBubble(bubbles[0], reveal(t, T.msg1) * chatFade)
    drawBubble(bubbles[1], reveal(t, T.msg2) * chatFade)
    if (t >= T.type3[0] && t < T.type3[1]) drawTyping(bubbles[2].y, now, chatFade)
    drawBubble(bubbles[2], reveal(t, T.msg3) * chatFade)

    drawInputBar()
  }

  // First paint so the texture is never blank before the rAF loop starts.
  draw(0)

  return { canvas, aspect: SCREEN_ASPECT, draw, cycle: CYCLE, settled: SETTLED }
}
