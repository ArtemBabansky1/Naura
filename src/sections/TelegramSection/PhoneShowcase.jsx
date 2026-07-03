import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ScrollTrigger } from '../../lib/gsap'
import { TOUCH_DEVICE_QUERY } from '../../hooks/useMediaQuery'
import { createScreenCanvas } from './phoneScreen'
import glbUrl from '../../assets/3d/iphone-black.glb?url'
import iphoneAvif from '../../assets/telegram/iphone.avif'
import iphoneWebp from '../../assets/telegram/iphone.webp'

const MAX_TILT = 0.14 // rad — peak cursor tilt (~8°)
const FALLOFF = 600   // px — distance at which the tilt roughly halves

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/**
 * The Telegram block's phone: a scroll-driven 3D iPhone (turned ~135° away →
 * rotating to face the viewer, screen showing the redrawn directory UI). Falls
 * back to the flat image for reduced-motion users and browsers without WebGL.
 * three.js + the screen texture load lazily, only once this mounts in view.
 * Touch devices keep the 3D phone but run it cheaper: lower device-pixel cap
 * and no cursor-tilt listener (there is no cursor to follow).
 */
export default function PhoneShowcase() {
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

    const isTouchDevice = window.matchMedia(TOUCH_DEVICE_QUERY).matches

    async function init() {
      const [{ createPhoneScene }, screen] = await Promise.all([
        import('../../lib/three/phoneScene'),
        createScreenCanvas({ width: 1100 }),
      ])
      if (cancelled) return

      // Phones: cap the backing-store resolution harder. Mobile GPUs are
      // fill-rate-bound and their DPR is 2.6-3; ×2 would render ~4× the pixels
      // of ×1.5 for no visible gain on a ~330px-wide phone model.
      scene = createPhoneScene(canvas, {
        turnAwayDeg: 135,
        maxPixelRatio: isTouchDevice ? 1.5 : 2,
      })

      const sizeToBox = () => {
        const r = canvas.getBoundingClientRect()
        if (r.width && r.height) scene.setSize(r.width, r.height)
      }

      await scene.load(glbUrl, screen.canvas, screen.aspect)
      if (cancelled) { scene.dispose(); return }

      sizeToBox()
      scene.start()

      // Scroll: rotate from turned-away (progress 0) to facing (progress 1).
      // onRefresh keeps the angle correct when the page loads already scrolled
      // to the section (a fresh trigger's .progress is 0 until the first tick).
      const section = wrap.closest('[data-section="telegram"]') || wrap
      st = ScrollTrigger.create({
        trigger: section,
        start: 'top 78%',
        end: 'center 46%',
        scrub: true,
        onUpdate: (self) => scene.setProgress(self.progress),
        onRefresh: (self) => scene.setProgress(self.progress),
      })
      ScrollTrigger.refresh()
      scene.setProgress(st.progress)

      ro = new ResizeObserver(sizeToBox)
      ro.observe(canvas)

      // Pause the render loop while the phone is off-screen.
      io = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) scene.start(); else scene.stop() },
        { rootMargin: '200px' },
      )
      io.observe(wrap)

      // Cursor parallax tilt (same falloff feel as the old flat phone).
      // Pointless on touch devices — no cursor — so don't even subscribe.
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
        window.addEventListener('mousemove', onMove)
      }
    }

    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(tiltFrame)
      if (onMove) window.removeEventListener('mousemove', onMove)
      st?.kill()
      ro?.disconnect()
      io?.disconnect()
      scene?.dispose()
      scene = null
    }
  }, [use3d])

  return (
    <div className="telegram-phone" ref={wrapRef}>
      {use3d ? (
        <canvas ref={canvasRef} className="telegram-phone__canvas" aria-hidden="true" />
      ) : (
        <picture>
          <source srcSet={iphoneAvif} type="image/avif" />
          <source srcSet={iphoneWebp} type="image/webp" />
          <img
            className="telegram-phone__img"
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
