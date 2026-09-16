# Meets — 3D-телефон (полный код)

Скролл-управляемый 3D iPhone со страницы Meets: three.js-сцена с GLB-моделью,
canvas-текстура экрана с анимированным мэтч-чатом, параллакс-полёт через
секцию, реакция на курсор и graceful-фолбэк на плоскую картинку.

## Состав

| Файл | Роль |
|---|---|
| `src/pages/MeetsPage/MeetsPhone.jsx` | React-секция: монтаж сцены, ScrollTrigger, параллакс, тилт, rAF-репейнт экрана, фолбэк |
| `src/pages/MeetsPage/MeetsPhone.css` | Раскладка секции и размеры канваса |
| `src/pages/MeetsPage/meetsScreen.js` | Чат-UI, рисуемый на canvas — текстура экрана телефона |
| `src/lib/three/phoneScene.js` | three.js-движок: рендерер, свет, загрузка GLB, экран-плоскость, API управления |

Ассеты и зависимости:

- Модель: `src/assets/3d/iphone-black.glb` (meshopt-компрессия)
- Фолбэк-картинка: `src/assets/telegram/iphone.avif` / `iphone.webp`
- Аватар чата: `src/assets/people/photo_3.webp`
- npm: `three`, `gsap` (ScrollTrigger), `framer-motion`, `react-i18next`

---

## 1. `src/pages/MeetsPage/MeetsPhone.jsx`

```jsx
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import { ScrollTrigger } from "../../lib/gsap"
import { TOUCH_DEVICE_QUERY } from "../../hooks/useMediaQuery"
import { RevealText } from "./motion"
import { createMeetsScreenCanvas } from "./meetsScreen"
import glbUrl from "../../assets/3d/iphone-black.glb?url"
import iphoneAvif from "../../assets/telegram/iphone.avif"
import iphoneWebp from "../../assets/telegram/iphone.webp"
import "./MeetsPhone.css"

const MAX_TILT = 0.14 // rad — peak cursor tilt (~8°)
const FALLOFF = 600   // px — distance at which the tilt roughly halves

function hasWebGL() {
  try {
    const c = document.createElement("canvas")
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")))
  } catch {
    return false
  }
}

/* Scroll-driven 3D iPhone (same rig as the landing's Telegram block) with a
 * Meets match-chat on its screen; flat image fallback for reduced motion or
 * missing WebGL. */
function PhoneCanvas({ chat }) {
  const prefersReduced = useReducedMotion()
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [use3d, setUse3d] = useState(false)

  useEffect(() => {
    if (!prefersReduced && hasWebGL()) setUse3d(true)
  }, [prefersReduced])

  useEffect(() => {
    if (!use3d) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    let scene = null
    let cancelled = false
    let st = null
    let ro = null
    let io = null
    let tiltFrame = 0
    let onMove = null
    let screenApi = null
    let animRaf = 0
    let animating = false
    let animStart = 0
    let wasActive = true

    // Repaint the chat canvas on its own rAF and flag the 3D texture. Uploads
    // are gated to the animation windows (reveal + loop fade); during the hold
    // the settled frame is pushed once, then uploads pause to save bandwidth.
    // Repaints are capped at ~30fps: every flagged frame re-uploads the whole
    // chat canvas to the GPU and regenerates its mip chain — at 60fps that
    // upload traffic alone stutters integrated GPUs, and the 340ms-eased chat
    // reveals look identical at half the rate.
    const DRAW_INTERVAL = 33
    // Below this scroll progress the phone is still turned >90° away, so the
    // screen plane is back-face culled — repainting/uploading its texture
    // would be pure waste right when the scroll-in should feel smooth.
    const SCREEN_FACING_PROGRESS = 0.3
    let screenFacing = false
    let lastDraw = -Infinity
    const drawFrame = () => {
      if (!animating || !scene || !screenApi) return
      animRaf = requestAnimationFrame(drawFrame)
      if (!screenFacing) {
        // Force one settled push when the screen swings back into view.
        wasActive = true
        return
      }
      const now = performance.now()
      if (now - lastDraw < DRAW_INTERVAL) return
      lastDraw = now
      const t = (now - animStart) % screenApi.cycle
      const active = t <= screenApi.settled + 100 || t >= screenApi.cycle - 700
      if (active) {
        screenApi.draw(t)
        scene.redrawScreen()
      } else if (wasActive) {
        screenApi.draw(screenApi.settled)
        scene.redrawScreen()
      }
      wasActive = active
    }
    const startAnim = () => {
      if (animating || !screenApi) return
      animating = true
      animStart = performance.now()
      wasActive = true
      drawFrame()
    }
    const stopAnim = () => {
      animating = false
      cancelAnimationFrame(animRaf)
    }

    const isTouchDevice = window.matchMedia(TOUCH_DEVICE_QUERY).matches

    async function init() {
      // Size the chat texture to what the screen actually occupies on this
      // device instead of a flat 1100px: the phone spans ~fitFrac of the canvas
      // height and its screen is ~41% of the phone height wide. A right-sized
      // canvas cuts every per-frame repaint + GPU upload proportionally (4× on
      // a 1x-DPR laptop) with zero visible loss — it was oversampled before.
      const dpr = Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.5 : 2)
      const stageH = canvas.getBoundingClientRect().height || 900
      const texWidth = Math.max(560, Math.min(1100, Math.round(stageH * 0.41 * dpr)))
      const [{ createPhoneScene }, screen] = await Promise.all([
        import("../../lib/three/phoneScene"),
        createMeetsScreenCanvas({ width: texWidth, chat }),
      ])
      if (cancelled) return
      screenApi = screen

      scene = createPhoneScene(canvas, {
        turnAwayDeg: 135,
        maxPixelRatio: isTouchDevice ? 1.5 : 2,
        // The phone fills nearly the whole (viewport-sized) canvas — the
        // oversized hero prop from the reference boards.
        fitFrac: 0.92,
      })

      const sizeToBox = () => {
        const r = canvas.getBoundingClientRect()
        if (r.width && r.height) scene.setSize(r.width, r.height)
      }

      await scene.load(glbUrl, screen.canvas, screen.aspect)
      if (cancelled) { scene.dispose(); return }

      sizeToBox()
      scene.start()
      startAnim()

      const section = wrap.closest('[data-section="meets-phone"]') || wrap
      const applyProgress = (p) => {
        scene.setProgress(p)
        screenFacing = p > SCREEN_FACING_PROGRESS
      }
      st = ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        end: "center 46%",
        scrub: true,
        onUpdate: (self) => applyProgress(self.progress),
        onRefresh: (self) => applyProgress(self.progress),
      })
      ScrollTrigger.refresh()
      applyProgress(st.progress)

      ro = new ResizeObserver(sizeToBox)
      ro.observe(canvas)

      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) { scene.start(); startAnim() }
          else { scene.stop(); stopAnim() }
        },
        { rootMargin: "200px" },
      )
      io.observe(wrap)

      if (!isTouchDevice) {
        onMove = (e) => {
          cancelAnimationFrame(tiltFrame)
          tiltFrame = requestAnimationFrame(() => {
            if (!scene) return
            const r = canvas.getBoundingClientRect()
            const dx = e.clientX - (r.left + r.width / 2)
            const dy = e.clientY - (r.top + r.height / 2)
            const dist = Math.hypot(dx, dy) || 1
            const fall = FALLOFF / (FALLOFF + dist)
            scene.setTilt((-dy / dist) * MAX_TILT * fall, (dx / dist) * MAX_TILT * fall)
          })
        }
        window.addEventListener("mousemove", onMove)
      }
    }

    init()

    return () => {
      cancelled = true
      animating = false
      cancelAnimationFrame(tiltFrame)
      cancelAnimationFrame(animRaf)
      if (onMove) window.removeEventListener("mousemove", onMove)
      st?.kill()
      ro?.disconnect()
      io?.disconnect()
      scene?.dispose()
      scene = null
    }
    // `chat` is stable for this mount — the parent remounts us on language
    // switch via key={i18n.language}, so it must not retrigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use3d])

  return (
    <div className="meets-phone__stage" ref={wrapRef}>
      {use3d ? (
        <canvas ref={canvasRef} className="meets-phone__canvas" aria-hidden="true" />
      ) : (
        <picture>
          <source srcSet={iphoneAvif} type="image/avif" />
          <source srcSet={iphoneWebp} type="image/webp" />
          <img
            className="meets-phone__img"
            src={iphoneWebp}
            alt=""
            width="313"
            height="539"
            loading="lazy"
            decoding="async"
          />
        </picture>
      )}
    </div>
  )
}

export default function MeetsPhone() {
  const { t, i18n } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const sectionRef = useRef(null)
  const points = t("phone.points", { returnObjects: true })
  const chat = t("phone.chat", { returnObjects: true })

  // Parallax flight: the phone rides ahead of the scroll — enters from
  // below the viewport as the section scrolls in and leaves past the top
  // edge before the section is gone.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const flyY = useTransform(scrollYProgress, [0, 1], ["45vh", "-45vh"])

  const textMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <section
      id="meets-phone"
      data-section="meets-phone"
      ref={sectionRef}
      className="meets-phone section"
    >
      <div className="container meets-phone__grid">
        <motion.div
          className="meets-phone__fly"
          style={prefersReduced ? undefined : { y: flyY }}
        >
          <PhoneCanvas key={i18n.language} chat={chat} />
        </motion.div>

        <motion.div className="meets-phone__text" {...textMotion}>
          <h2 className="meets-phone__title text-h2">
            <RevealText text={t("phone.headline")} />
          </h2>
          <motion.p className="meets-phone__desc text-body-lg" variants={fadeUp}>
            {t("phone.description")}
          </motion.p>
          <ul className="meets-phone__points">
            {points.map((point) => (
              <motion.li className="meets-phone__point text-body" key={point} variants={fadeUp}>
                <span className="meets-phone__point-dot" aria-hidden="true" />
                {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## 2. `src/pages/MeetsPage/MeetsPhone.css`

```css
/* MeetsPhone — oversized scroll-flying 3D iPhone (light match chat on its
 * screen) on the LEFT, copy on the right. The phone parallaxes: rises from
 * below the viewport and exits past its top edge as the section scrolls. */

/* Half the standard block gap above AND below the phone showcase (the
 * following section owns the gap below, hence the sibling rule): the tall
 * fly-canvas already adds its own transparent air around the copy, so a
 * full 200u pair would read as a double gap. */
.meets-phone.section {
  padding-top: calc(var(--section-gap) / 2);
}

.meets-phone + .section {
  padding-top: calc(var(--section-gap) / 2);
}

.meets-phone__grid {
  display: grid;
  /* Even halves — the copy column starts at the screen's midpoint. */
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 0;
}

.meets-phone__text {
  display: flex;
  flex-direction: column;
}

.meets-phone__title {
  color: var(--text-primary);
  margin-top: var(--space-10);
  max-width: 20ch;
}

.meets-phone__desc {
  color: var(--text-list);
  margin-top: var(--space-20);
  max-width: 45ch;
}

.meets-phone__points {
  list-style: none;
  padding: 0;
  margin: var(--space-40) 0 0;
  display: flex;
  flex-direction: column;
}

.meets-phone__point {
  display: flex;
  align-items: center;
  gap: var(--space-15);
  padding-block: var(--space-15);
  color: var(--text-primary);
}

.meets-phone__point-dot {
  flex: none;
  width: calc(10 * var(--u));
  height: calc(10 * var(--u));
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: var(--shadow-glow);
}

/* ── Phone stage — canvas the size of a viewport, phone fills it ──────── */
.meets-phone__fly {
  min-width: 0;
  will-change: transform;
  /* Pull the phone a step further left, toward the page edge. */
  margin-left: calc(-60 * var(--u));
}

/* The phone body only occupies the canvas centre (~0.45 of its height), so
 * the canvas' empty top/bottom zones are pulled out of the flow — the copy
 * and the neighbouring blocks close in while the flight room stays. */
@media (min-width: 1024px) {
  .meets-phone__fly {
    margin-block: calc(-150 * var(--u));
  }
}

.meets-phone__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meets-phone__canvas {
  position: relative;
  /* The phone body spans ~0.45× of the canvas height (fitFrac 0.92 × the
   * model's 0.494 aspect); 0.62× leaves rotation/tilt room while dropping
   * the transparent side margins the GPU otherwise clears, renders and
   * composites every frame. */
  width: min(100%, calc(min(calc(1100 * var(--u)), 105vh) * 0.62));
  height: min(calc(1100 * var(--u)), 105vh);
  display: block;
  margin-inline: auto;
}

.meets-phone__img {
  position: relative;
  width: min(80%, calc(420 * var(--u)));
  height: auto;
  display: block;
  margin-inline: auto;
}

@media (max-width: 1023.98px) {
  .meets-phone__grid {
    grid-template-columns: 1fr;
    gap: var(--space-40);
  }

  .meets-phone__fly {
    margin-left: 0;
  }

  /* Copy first on the stacked layout; the flying phone follows it. */
  .meets-phone__text {
    order: 1;
  }

  .meets-phone__fly {
    order: 2;
  }

  .meets-phone__canvas {
    width: min(100%, calc(min(calc(700 * var(--u)), 85vh) * 0.62));
    height: min(calc(700 * var(--u)), 85vh);
  }
}
```

---

## 3. `src/pages/MeetsPage/meetsScreen.js` — чат-текстура экрана

```js
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
```

---

## 4. `src/lib/three/phoneScene.js` — three.js-движок

```js
// Minimal three.js engine for the scroll-driven 3D iPhone in the Telegram block.
// Owns the renderer/scene/camera/env, loads the meshopt-compressed GLB, swaps the
// screen mesh for a canvas-texture plane, and exposes setProgress/setTilt so the
// React layer can drive it from ScrollTrigger + the cursor. Framework-agnostic.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const FOV = 28
// Phone height as a fraction of the canvas height. The canvas is rendered ~1.62×
// larger than the phone's layout footprint (overscan for rotation/tilt room), so
// 0.56 here makes the facing phone fill ~0.9× the footprint — matching the old
// flat image's width, which the callouts anchor to.
const FIT_FRAC = 0.56
// The source model is ~189 units tall; normalise it so the camera sits a few units
// away with a tight near/far, giving the depth precision a coplanar screen needs.
const NORM_HEIGHT = 2.4

const v3 = new THREE.Vector3()

// Model facts (verified from the source geometry): +Y is the phone's top, and the
// screen is the −Z face (the camera bump protrudes on +Z). So the screen plane
// lives just outside −Z, and "facing the viewer" is a 180° rotation about Y.
function findScreenMesh(root) {
  let found = null
  root.traverse((o) => {
    if (!found && o.isMesh && /display/i.test(o.material?.name || '')) found = o
  })
  return found
}

// Traces a centred rounded rectangle onto a Shape/Path (used for the screen
// plane and for the bezel mask ring's contours).
function traceRoundedRect(path, w, h, r) {
  const x = -w / 2, y = -h / 2
  const rr = Math.min(r, w / 2, h / 2)
  path.moveTo(x + rr, y)
  path.lineTo(x + w - rr, y)
  path.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false)
  path.lineTo(x + w, y + h - rr)
  path.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false)
  path.lineTo(x + rr, y + h)
  path.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false)
  path.lineTo(x, y + rr)
  path.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false)
  return path
}

// A rounded-rectangle plane (facing +Z) with UVs remapped to 0..1, so the screen
// carries the phone's rounded corners instead of a hard rectangle.
function roundedScreenGeometry(w, h, r) {
  const shape = traceRoundedRect(new THREE.Shape(), w, h, r)
  const x = -w / 2, y = -h / 2
  const geom = new THREE.ShapeGeometry(shape, 16)
  const pos = geom.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x) / w
    uv[i * 2 + 1] = (pos.getY(i) - y) / h
  }
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return geom
}

// Near-black graphite finish to match the dark site. The body stays very dark; the
// frame and glass are a touch lighter / glossier so the rim lights catch the edges
// and the silhouette reads against the black background.
function tuneMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return
    const mat = o.material
    if (!mat || Array.isArray(mat)) return
    const name = (mat.name || '').toLowerCase()
    if (/glass|multicoat/.test(name)) {
      mat.color?.setHex(0x17171c)
      if (mat.metalness !== undefined) mat.metalness = 0.5
      if (mat.roughness !== undefined) mat.roughness = 0.3
      mat.envMapIntensity = 1.0
    } else if (/frame|matt|cam body|cam black/.test(name)) {
      // Frame catches the env sheen + rim to define the silhouette against black.
      mat.color?.setHex(0x303038)
      if (mat.metalness !== undefined) mat.metalness = 0.8
      if (mat.roughness !== undefined) mat.roughness = 0.5 // broad highlight, no line
      mat.envMapIntensity = 0.95
    } else {
      mat.color?.setHex(0x282830)
      if (mat.metalness !== undefined) mat.metalness = 0.55
      if (mat.roughness !== undefined) mat.roughness = 0.5
      mat.envMapIntensity = 0.85
    }
  })
}

// A soft top-down gradient used as the reflection environment. Unlike a studio
// env (RoomEnvironment), it has NO hard light sources, so glossy edges reflect a
// smooth falloff instead of blowing out into bright vertical lines.
function gradientEnvTexture() {
  const W = 128, H = 64 // equirect is 2:1; vertical gradient = top sky / bottom floor
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0.0, '#7a7a86') // soft sky/top — bright enough to sheen the body
  g.addColorStop(0.5, '#2a2a30')
  g.addColorStop(1.0, '#070709') // dark floor
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createPhoneScene(canvas, { faceAngleDeg = 180, turnAwayDeg = 135, maxPixelRatio = 2, fitFrac = FIT_FRAC } = {}) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
  // MSAA stays on at every DPR: the white screen against the near-black frame
  // is the highest-contrast edge on the page, and without MSAA it staircases
  // even on 2x backing stores.
  // stencil: false — nothing uses the stencil buffer; skipping it trims the
  // framebuffer memory/bandwidth that MSAA multiplies.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: false, powerPreference: 'high-performance' })
  renderer.setClearAlpha(0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setPixelRatio(pixelRatio)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000)
  camera.position.set(0, 0, 10)

  // Soft, source-free gradient reflections (no hard env lights → no edge lines).
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envSrc = gradientEnvTexture()
  const envRT = pmrem.fromEquirectangular(envSrc)
  scene.environment = envRT.texture
  envSrc.dispose()

  // Neutral lighting that defines a near-black phone against the black page:
  // a soft hemisphere fill shapes the form, a key adds a broad highlight, and a
  // white rim rakes the edges for silhouette. All white (no purple) and — with the
  // source-free env + rough metal — broad, so the rails never become hard lines.
  const hemi = new THREE.HemisphereLight(0xb0b0bc, 0x0c0c0e, 0.95)
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(1.5, 2.5, 3.5)
  const rim = new THREE.DirectionalLight(0xffffff, 1.1)
  rim.position.set(-2.5, 1.5, -2)
  scene.add(hemi, key, rim)

  // tiltGroup (cursor parallax) → pivot (scroll rotation + idle) → model
  const tiltGroup = new THREE.Group()
  const pivot = new THREE.Group()
  tiltGroup.add(pivot)
  scene.add(tiltGroup)

  const clock = new THREE.Clock()
  const faceAngle = THREE.MathUtils.degToRad(faceAngleDeg)
  const turnAway = THREE.MathUtils.degToRad(turnAwayDeg)
  let phoneHeight = 1
  let baseAngle = faceAngle - turnAway // start: turned ~75% away from the viewer
  const tiltTarget = { x: 0, y: 0 }
  let running = false
  let raf = 0
  let screenTexture = null
  let disposed = false

  function fitCamera(height) {
    const dist = height / (2 * fitFrac * Math.tan(THREE.MathUtils.degToRad(FOV) / 2))
    camera.position.set(0, 0, dist)
    camera.near = Math.max(0.01, dist - height)
    camera.far = dist + height * 2
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }

  function attachScreen(model, modelBox, screenCanvas, aspect) {
    const mesh = findScreenMesh(model)
    const tex = new THREE.CanvasTexture(screenCanvas)
    tex.colorSpace = THREE.SRGBColorSpace
    // 4× aniso is enough for the shallow angles the phone ever reaches; 16×
    // noticeably raises the per-sample cost on the near-fullscreen quad.
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    screenTexture = tex

    // Screen bounds in model-local space, read from the real display quad so the
    // UI sits exactly where the model's screen is.
    const size = modelBox.getSize(v3)
    let cx = 0, cy = 0, cz = modelBox.min.z, w = size.x * 0.86, h = w / aspect
    if (mesh) {
      mesh.geometry.computeBoundingBox()
      const b = mesh.geometry.boundingBox.clone()
      const toRoot = new THREE.Matrix4().copy(model.matrixWorld).invert().multiply(mesh.matrixWorld)
      b.applyMatrix4(toRoot)
      const c = b.getCenter(new THREE.Vector3())
      const s = b.getSize(new THREE.Vector3())
      cx = c.x; cy = c.y; cz = c.z; w = s.x; h = s.y // exact display rect — no frame overlap
      // Keep the display quad as a pure-black backing so the rounded UI's corners
      // read as screen, not see-through. Unlit so it stays true black.
      // polygonOffset pushes its depth back proportionally to the surface's
      // screen-space slope: at grazing view angles (phone turned away) the
      // per-pixel depth step otherwise exceeds the tiny gap to the UI plane
      // and the backing wins the depth test in stripes — black bands on the
      // screen. Slope-scaled offset keeps the backing behind at every angle.
      mesh.material?.dispose?.()
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        polygonOffset: true,
        polygonOffsetFactor: 4,
        polygonOffsetUnits: 4,
      })
    }
    // The model's display rim is messy: the black backing quad and the coarse
    // bezel-ring polygons sit coplanar at the front face, so wherever that rim
    // peeks past the UI plane it renders as ragged dark teeth — and a plane
    // sized to hide it starts painting white over the frame instead. Stop
    // fitting the plane to the junk: draw the screen boundary ourselves.
    //
    // Two of our own layers, both in front of the model:
    //  1. the chat plane — FULL display rect, corners tucked under the mask;
    //  2. a black mask ring whose smooth inner arc IS the visible screen
    //     corner, and whose outer edge lands black-on-black on the bezel.
    // Every visible boundary is ours (high-tess arcs + MSAA); the model's rim
    // junk is buried underneath and can't leak at any rotation or tilt.
    const screenR = Math.min(0.145 * size.x, w * 0.5, h * 0.5)
    const zBase = cz - size.z * 0.003
    const plane = new THREE.Mesh(
      roundedScreenGeometry(w, h, screenR),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    )
    plane.position.set(cx, cy, zBase)
    plane.rotation.y = Math.PI
    plane.renderOrder = 10
    model.add(plane)

    // Mask ring: hole overlaps the plane by `lip` (no gap can open under
    // tilt); the outer contour reaches `spread` past the display rect — well
    // over the rim junk, yet still ~3% of body width inside the outer frame
    // silhouette, so it never pokes out at grazing angles.
    const lip = size.x * 0.005
    const spread = size.x * 0.022
    const maskShape = traceRoundedRect(new THREE.Shape(), w + spread * 2, h + spread * 2, screenR + spread)
    maskShape.holes.push(traceRoundedRect(new THREE.Path(), w - lip * 2, h - lip * 2, screenR - lip))
    const mask = new THREE.Mesh(
      new THREE.ShapeGeometry(maskShape, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
    )
    mask.position.set(cx, cy, zBase - size.z * 0.001)
    mask.rotation.y = Math.PI
    mask.renderOrder = 11
    model.add(mask)
  }

  async function load(glbUrl, screenCanvas, aspect) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync(glbUrl)
    if (disposed) return
    const model = gltf.scene
    model.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    tuneMaterials(model)
    attachScreen(model, box, screenCanvas, aspect)

    // Centre at the origin, then normalise the scale so the camera/near-far stay
    // small (depth precision) regardless of the source model's huge units.
    model.position.sub(center)
    const norm = new THREE.Group()
    norm.scale.setScalar(NORM_HEIGHT / size.y)
    norm.add(model)
    pivot.add(norm)
    phoneHeight = NORM_HEIGHT

    fitCamera(NORM_HEIGHT)
    renderer.render(scene, camera)
  }

  // Adaptive frame rate: full 60fps only while the phone is actively driven
  // (scroll rotation / cursor tilt). The idle bob peaks at ~8px/s, so at 20fps
  // it moves ≤0.4px between frames — sub-pixel, indistinguishable — and idle
  // is where the phone spends most of its time, so this caps the block's
  // steady-state GPU load at a third of the driven rate.
  const FAST_WINDOW_MS = 250
  const IDLE_FRAME_MS = 50
  let fastUntil = 0
  let lastRender = 0

  function frame(now = performance.now()) {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const tiltSettled =
      Math.abs(tiltTarget.x - tiltGroup.rotation.x) < 0.001 &&
      Math.abs(tiltTarget.y - tiltGroup.rotation.y) < 0.001
    if (now >= fastUntil && tiltSettled && now - lastRender < IDLE_FRAME_MS) return
    lastRender = now
    const t = clock.getElapsedTime()
    pivot.rotation.y = baseAngle + Math.sin(t * 0.6) * 0.05
    pivot.position.y = Math.sin(t * 0.9) * phoneHeight * 0.012
    tiltGroup.rotation.x += (tiltTarget.x - tiltGroup.rotation.x) * 0.08
    tiltGroup.rotation.y += (tiltTarget.y - tiltGroup.rotation.y) * 0.08
    renderer.render(scene, camera)
  }

  return {
    load,
    // p: 0 = turned ~75% away … 1 = screen facing the viewer (180°).
    setProgress(p) {
      baseAngle = faceAngle - turnAway * (1 - Math.min(1, Math.max(0, p)))
      fastUntil = performance.now() + FAST_WINDOW_MS
    },
    setTilt(rx, ry) { tiltTarget.x = rx; tiltTarget.y = ry },
    setSize(w, h) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (!running) renderer.render(scene, camera)
    },
    start() { if (running) return; running = true; clock.getDelta(); frame() },
    stop() { running = false; cancelAnimationFrame(raf) },
    redrawScreen() { if (screenTexture) screenTexture.needsUpdate = true },
    dispose() {
      disposed = true
      running = false
      cancelAnimationFrame(raf)
      scene.environment = null // drop the ref before disposing the env target
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose()
          const m = o.material
          ;(Array.isArray(m) ? m : [m]).forEach((mm) => {
            mm?.map?.dispose?.()
            mm?.dispose?.()
          })
        }
      })
      screenTexture?.dispose()
      screenTexture = null
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
```

---

## 5. Вспомогательные модули (используются секцией)

### `src/lib/gsap.js`

```js
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }
```

### `src/lib/framer.js` (используемая часть)

```js
export const easing = [0.16, 1, 0.3, 1] // ease-out-expo

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easing } },
}

export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
})

// Trigger when 20% of element is in view, animate once
export const viewportConfig = { once: true, amount: 0.2 }
```

### `src/hooks/useMediaQuery.js` (используемая часть)

```js
/** Touch-primary devices (phones/tablets): no hover, coarse pointer. Used to
 * skip desktop-only JS (Lenis smooth wheel, WebGL phone, cursor effects) —
 * a device class, not a viewport width, so it never flips on resize. */
export const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)'
```

### `src/pages/MeetsPage/motion.jsx` — RevealText (анимация заголовка секции)

```jsx
import { motion, useReducedMotion } from "framer-motion"
import { easing } from "../../lib/framer"

/* ── RevealText — headline reveal, word by word from under a mask ───────
 * The in-view trigger lives on the CONTAINER (words themselves are clipped
 * by their masks while hidden, so an observer on a word would never fire —
 * a clipped element reports zero intersection). Words are variant children
 * with a per-index delay. */
const revealWord = {
  hidden: { y: "110%", rotate: 4 },
  visible: (custom) => ({
    y: "0%",
    rotate: 0,
    transition: { duration: 0.75, ease: easing, delay: custom },
  }),
}

export function RevealText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.045,
  once = true,
}) {
  const prefersReduced = useReducedMotion()
  const words = String(text).split(" ")
  const MotionTag = motion[Tag] ?? motion.span

  if (prefersReduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <MotionTag
      className={`m-reveal ${className}`}
      aria-label={text}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true">
          <span className="m-reveal__mask">
            <motion.span
              className="m-reveal__word"
              variants={revealWord}
              custom={delay + i * stagger}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </MotionTag>
  )
}
```

Сопутствующий CSS (из `src/pages/MeetsPage/MeetsPage.css`):

```css
/* ── RevealText — word-by-word mask reveal (see motion.jsx) ──────────────── */
.m-reveal__mask {
  display: inline-block;
  overflow: clip;
  vertical-align: bottom;
  /* Room for descenders so «р», «у», g, y aren't shaved by the clip. */
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
}

.m-reveal__word {
  display: inline-block;
  transform-origin: left bottom;
  white-space: pre;
  will-change: transform;
}
```

---

## 6. Локализованный контент чата (`src/i18n/locales/*/meets.json` → `phone`)

### en

```json
"phone": {
  "eyebrow": "Telegram Mini App",
  "headline": "Meeting people starts in Telegram",
  "description": "Participants fill out a form and get matches in the Telegram Mini App. No technical integration — just invite them via link.",
  "points": ["Profile and matching — in one chat", "Reminders and check-ins arrive on their own", "One-click feedback after the meeting"],
  "chat": {
    "found": "Match found!",
    "name": "Max",
    "role": "Product lead",
    "msg1": "Hi! We matched this week, when is a good time for a call?",
    "msg2": "Hey! Nice to meet you 🤝 How about Thursday at 7pm?",
    "msg3": "Perfect, see you then! 👌"
  }
}
```

### ru

```json
"phone": {
  "eyebrow": "Telegram Mini App",
  "headline": "Знакомство начинается в Telegram",
  "description": "Участники заполняют анкету и получают пары в Telegram Mini App. Никакой технической интеграции — достаточно пригласить по ссылке.",
  "points": ["Анкета и подбор пары — в одном чате", "Напоминания и чек-ины приходят сами", "Фидбек после встречи в один клик"],
  "chat": {
    "found": "Найдена пара!",
    "name": "Макс",
    "role": "Продакт",
    "msg1": "Привет! Мы сматчились на этой неделе, когда удобно созвониться?",
    "msg2": "Привет! Рад знакомству 🤝 Давай в четверг в 19?",
    "msg3": "Отлично, давай! До встречи 👌"
  }
}
```

---

## Как это работает (карта анимаций)

1. **Появление секции** — `MeetsPhone` вешает framer-motion `useScroll` на секцию и маппит прогресс в `flyY` (`45vh → -45vh`): телефон «пролетает» сквозь секцию быстрее скролла (параллакс).
2. **Разворот телефона** — GSAP `ScrollTrigger` (scrub) отдаёт прогресс `0..1` в `scene.setProgress`: модель поворачивается от «отвёрнута на 135°» до «экраном к зрителю» между `top 78%` и `center 46%` секции.
3. **Idle-анимация** — внутри `phoneScene.frame()`: лёгкое покачивание по Y (`sin`) и вертикальный «боб», адаптивный fps (60 при активности, ~20 в покое).
4. **Тилт от курсора** — `mousemove` (только не-тач): наклон до ~8°, затухает с расстоянием от центра канваса, сглаживается лерпом `0.08`.
5. **Чат на экране** — `meetsScreen.draw(t)` рисует цикл 7 с: пилюля «Match found!» → typing-индикатор → 3 сообщения (ease-out reveal по 340 мс) → hold → fade 600 мс → повтор. React-слой репейнтит его на отдельном rAF (~30 fps), помечает текстуру `needsUpdate`, и приостанавливает загрузки в GPU, пока экран отвёрнут (`progress ≤ 0.3`) или между окнами анимации.
6. **Экономия ресурсов** — `IntersectionObserver` стартует/останавливает рендер за экраном; `ResizeObserver` синхронизирует размер канваса; на тач-устройствах DPR ограничен 1.5 и тилт выключен.
7. **Фолбэк** — при `prefers-reduced-motion` или без WebGL рендерится плоская картинка `iphone.avif/webp`.
