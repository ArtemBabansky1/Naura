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

    const isTouchDevice = window.matchMedia(TOUCH_DEVICE_QUERY).matches

    async function init() {
      const [{ createPhoneScene }, screen] = await Promise.all([
        import("../../lib/three/phoneScene"),
        createMeetsScreenCanvas({ width: 1100, chat }),
      ])
      if (cancelled) return

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

      const section = wrap.closest('[data-section="meets-phone"]') || wrap
      st = ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        end: "center 46%",
        scrub: true,
        onUpdate: (self) => scene.setProgress(self.progress),
        onRefresh: (self) => scene.setProgress(self.progress),
      })
      ScrollTrigger.refresh()
      scene.setProgress(st.progress)

      ro = new ResizeObserver(sizeToBox)
      ro.observe(canvas)

      io = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) scene.start(); else scene.stop() },
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
      cancelAnimationFrame(tiltFrame)
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
