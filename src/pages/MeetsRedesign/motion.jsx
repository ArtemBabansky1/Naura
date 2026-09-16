import { useEffect, useRef } from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  animate,
} from "motion/react"
import { easing } from "../../lib/framer"
import { RevealWords } from "../../components/ScrollReveal/ScrollReveal"

/* Shared meets-page motion primitives (monolog-style):
 * word-mask text reveals, scroll parallax and count-up numbers.
 * All of them collapse to static content under prefers-reduced-motion. */

export function RevealText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.045,
  accent = "",
}) {
  return <RevealWords key={text} as={Tag} text={text} accent={accent} className={className} delay={delay} stagger={stagger} />
}

/* ── ParallaxY — child drifts vertically as its box crosses the viewport ─ */
export function ParallaxY({ children, from = 40, to = -40, className = "" }) {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [from, to])

  return (
    <motion.div ref={ref} className={className} style={prefersReduced ? undefined : { y }}>
      {children}
    </motion.div>
  )
}

/* ── Counter — number counts up when it scrolls into view ─────────────── */
export function Counter({ to, duration = 1.4, className = "" }) {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.7 })
  const value = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      if (ref.current) ref.current.textContent = String(to)
      return
    }
    const controls = animate(value, to, {
      duration,
      ease: easing,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v))
      },
    })
    return () => controls.stop()
  }, [inView, to, duration, prefersReduced, value])

  return (
    <span ref={ref} className={className}>
      0
    </span>
  )
}
