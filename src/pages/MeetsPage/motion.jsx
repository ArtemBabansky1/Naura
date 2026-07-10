import { useEffect, useRef } from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  animate,
} from "framer-motion"
import { easing } from "../../lib/framer"

/* Shared meets-page motion primitives (monolog-style):
 * word-mask text reveals, scroll parallax and count-up numbers.
 * All of them collapse to static content under prefers-reduced-motion. */

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

