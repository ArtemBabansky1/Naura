import { useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion"
import "./MeetsMarquee.css"

/* Scroll-reactive editorial marquee (the motion.dev scroll-velocity recipe):
 * two copies of the phrase row loop seamlessly while the track drifts on its
 * own; scrolling boosts the speed and flips the direction, and the smoothed
 * scroll velocity adds a slight optical skew. Static under
 * prefers-reduced-motion. */

const BASE_SPEED = 1.8 // %/s — idle drift, ~28s per loop
const MAX_BOOST = 4 // scroll velocity multiplies the drift up to (1 + MAX_BOOST)×
const VELOCITY_SPAN = 1200 // px/s of scroll mapped to full boost/skew

const wrapRange = (min, max, v) => {
  const range = max - min
  return min + (((v - min) % range) + range) % range
}

export default function MeetsMarquee() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const items = t("marquee", { returnObjects: true })

  const baseX = useMotionValue(0)
  const x = useTransform(baseX, (v) => `${v}%`)
  // 1 = leftwards (scrolling down), -1 = rightwards; keeps the last scroll direction while idle.
  const direction = useRef(1)

  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(
    smoothVelocity,
    [-VELOCITY_SPAN, VELOCITY_SPAN],
    [-MAX_BOOST, MAX_BOOST],
    { clamp: false },
  )
  const skewX = useTransform(smoothVelocity, [-VELOCITY_SPAN, VELOCITY_SPAN], [-3, 3])

  useAnimationFrame((_, delta) => {
    if (prefersReduced) return
    const boost = velocityFactor.get()
    if (boost < 0) direction.current = -1
    else if (boost > 0) direction.current = 1

    const moveBy =
      direction.current * -BASE_SPEED * (delta / 1000) * (1 + Math.min(Math.abs(boost), MAX_BOOST))
    baseX.set(wrapRange(-50, 0, baseX.get() + moveBy))
  })

  const row = (copy) => (
    <div className="meets-marquee__row" aria-hidden={copy ? "true" : undefined}>
      {items.map((item, i) => (
        <span className="meets-marquee__item" key={`${copy}-${item}`}>
          <span className={i % 2 ? "meets-marquee__text" : "meets-marquee__text meets-marquee__text--accent"}>
            {item}
          </span>
          <span className="meets-marquee__dot" aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="meets-marquee" aria-label={items.join(" · ")}>
      <motion.div
        className="meets-marquee__track"
        style={prefersReduced ? undefined : { x, skewX, willChange: "transform" }}
      >
        {row(0)}
        {row(1)}
      </motion.div>
    </div>
  )
}
