import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { gsap, ScrollTrigger } from "../../lib/gsap"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText } from "./motion"
import "./MeetsWeek.css"

const STEPS = 4
/* How many of the 7 (Mon-first) segments are filled at each step. The first
 * Saturday starts the story with an EMPTY wheel; filling begins on step 02
 * (Пн → 1), then Ср → 3, then Сб → 6. */
const DAY_OF_STEP = [0, 1, 3, 6]
const SEGMENTS = 7

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* ── Wheel geometry — 7 stroked arcs on a 600×600 viewBox ─────────────── */
const CENTER = 300
const RADIUS = 215
const LABEL_RADIUS = 272
/* Round line caps extend ~5.3° past each arc end at this radius/stroke —
 * a 14° gap keeps neighbouring segments from ever touching. */
const GAP_DEG = 14
const SPAN_DEG = 360 / SEGMENTS

const polar = (angleDeg, radius) => {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(a), CENTER + radius * Math.sin(a)]
}

const segmentPath = (j) => {
  const [x1, y1] = polar(j * SPAN_DEG + GAP_DEG / 2, RADIUS)
  const [x2, y2] = polar((j + 1) * SPAN_DEG - GAP_DEG / 2, RADIUS)
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`
}

const labelPos = (j) => polar(j * SPAN_DEG + SPAN_DEG / 2, LABEL_RADIUS)

/* ── Cross-fade step layer — plateau at full opacity, fade done by the
 * midpoint between steps. A short plateau (0.2 of a step) stretches each
 * transition across most of the inter-step scroll, so swaps read as one
 * long glide instead of a snap. ─────────────────────────────────────────── */
const SLIDE = 24
const SCALE_REST = 0.96
const PLATEAU = 0.2
const EDGE = 0.5

const getStepRanges = (index, lastIndex) => {
  if (index === 0) {
    return {
      input: [0, PLATEAU, EDGE],
      opacity: [1, 1, 0],
      y: [0, 0, -SLIDE],
      scale: [1, 1, SCALE_REST],
    }
  }
  if (index === lastIndex) {
    return {
      input: [index - EDGE, index - PLATEAU, index],
      opacity: [0, 1, 1],
      y: [SLIDE, 0, 0],
      scale: [SCALE_REST, 1, 1],
    }
  }
  return {
    input: [index - EDGE, index - PLATEAU, index + PLATEAU, index + EDGE],
    opacity: [0, 1, 1, 0],
    y: [SLIDE, 0, 0, -SLIDE],
    scale: [SCALE_REST, 1, 1, SCALE_REST],
  }
}

function WeekStepLayer({ index, progress, children }) {
  const ranges = useMemo(() => getStepRanges(index, STEPS - 1), [index])
  const opacity = useTransform(progress, ranges.input, ranges.opacity)
  const y = useTransform(progress, ranges.input, ranges.y)
  const scale = useTransform(progress, ranges.input, ranges.scale)

  return (
    <motion.div
      className="mweek-text"
      style={{ opacity, y, scale, willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  )
}

/* Numeral beside the step copy — the mockup's row layout. */
function StepText({ step, index }) {
  return (
    <div className="mweek-step-row">
      <span className="mweek-num" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="mweek-step-body">
        <h3 className="mweek-title text-h3">{step.title}</h3>
        <p className="mweek-desc text-body">{step.description}</p>
      </div>
    </div>
  )
}

/* ── The week wheel. In scroll mode segment/center refs are driven
 * imperatively from the ScrollTrigger; in static mode `staticStep` renders
 * one fixed state. ─────────────────────────────────────────────────────── */
function WeekWheel({ dayLabels, stepDays, refs, staticStep }) {
  const isStatic = staticStep != null
  const fill = isStatic ? DAY_OF_STEP[staticStep] : 0

  return (
    <div className="mweek-wheel">
      <svg
        className="mweek-wheel__svg"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* base ring — always visible */}
        {Array.from({ length: SEGMENTS }, (_, j) => (
          <path key={`base-${j}`} className="mweek-seg" d={segmentPath(j)} />
        ))}
        {/* active overlay — each segment DRAWS itself along the arc
            (dashoffset 1 → 0, like liquid running clockwise) */}
        {Array.from({ length: SEGMENTS }, (_, j) => (
          <path
            key={`on-${j}`}
            className="mweek-seg mweek-seg--on"
            d={segmentPath(j)}
            pathLength="1"
            style={
              isStatic
                ? { strokeDashoffset: j < fill ? 0 : 1, opacity: j < fill ? 1 : 0 }
                : undefined
            }
            ref={isStatic ? undefined : (el) => { refs.segments.current[j] = el }}
          />
        ))}
        {/* weekday labels around the ring */}
        {dayLabels.map((label, j) => {
          const [x, y] = labelPos(j)
          return (
            <text
              key={label}
              className={`mweek-day${isStatic && j < fill ? " is-on" : ""}`}
              x={x}
              y={y}
              textAnchor="middle"
              ref={isStatic ? undefined : (el) => { refs.days.current[j] = el }}
            >
              {label}
            </text>
          )
        })}
      </svg>

      {/* center readout — active step's day + fill count */}
      <div
        className="mweek-wheel__center"
        ref={isStatic ? undefined : refs.center}
      >
        <span className="mweek-wheel__day" ref={isStatic ? undefined : refs.centerDay}>
          {isStatic ? stepDays[staticStep] : stepDays[0]}
        </span>
        <span className="mweek-wheel__count" ref={isStatic ? undefined : refs.centerCount}>
          {isStatic ? `${fill}/7` : `${DAY_OF_STEP[0]}/7`}
        </span>
      </div>
    </div>
  )
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const readStaticMode = () =>
  typeof window !== "undefined" && window.matchMedia(REDUCED_QUERY).matches

export default function MeetsWeek() {
  const { t, i18n } = useTranslation("meets")
  const steps = t("week.steps", { returnObjects: true })
  const stepDays = t("week.stepDays", { returnObjects: true })
  const dayLabels = t("week.days", { returnObjects: true })

  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)
  const pinRef = useRef(null)
  const segmentRefs = useRef([])
  const dayRefs = useRef([])
  const centerRef = useRef(null)
  const centerDayRef = useRef(null)
  const centerCountRef = useRef(null)
  const progress = useMotionValue(0)

  const wheelRefs = {
    segments: segmentRefs,
    days: dayRefs,
    center: centerRef,
    centerDay: centerDayRef,
    centerCount: centerCountRef,
  }

  // Reduced motion → plain stacked steps (mirrors HowItWorksSection).
  const [staticMode, setStaticMode] = useState(readStaticMode)
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_QUERY)
    const sync = () => setStaticMode(mq.matches)
    mq.addEventListener("change", sync)
    sync()
    return () => mq.removeEventListener("change", sync)
  }, [])

  useLayoutEffect(() => {
    if (staticMode) return
    const scroller = scrollerRef.current
    const pin = pinRef.current
    if (!scroller || !pin) return

    // p ∈ [0, STEPS-1]. The fill HOLDS its value across each step's plateau
    // (matching the text layers) and flows between the two days only inside
    // the transition zone — so nothing trickles in while a step is resting.
    const render = (p) => {
      const pc = clamp(p, 0, STEPS - 1)
      const idx = clamp(Math.round(pc), 0, STEPS - 1)
      const lower = Math.floor(pc)
      const upper = Math.min(lower + 1, STEPS - 1)
      const flow = clamp((pc - lower - PLATEAU) / (1 - 2 * PLATEAU), 0, 1)
      const fill = DAY_OF_STEP[lower] + (DAY_OF_STEP[upper] - DAY_OF_STEP[lower]) * flow

      segmentRefs.current.forEach((el, j) => {
        if (!el) return
        const amount = clamp(fill - j, 0, 1)
        // Draw along the arc (water-fill), not a cross-fade. Opacity only
        // hides the round-cap "dot" a zero-length dash would leave behind.
        el.style.strokeDashoffset = String(1 - amount)
        el.style.opacity = amount > 0.01 ? "1" : "0"
      })
      dayRefs.current.forEach((el, j) => {
        if (el) el.classList.toggle("is-on", j < Math.round(fill))
      })
      if (centerDayRef.current) centerDayRef.current.textContent = stepDays[idx]
      if (centerCountRef.current) centerCountRef.current.textContent = `${DAY_OF_STEP[idx]}/7`
      if (centerRef.current) {
        // Same plateau as the text layers: solid near a step, fading between.
        const away = clamp((Math.abs(pc - idx) - PLATEAU) / (EDGE - PLATEAU), 0, 1)
        centerRef.current.style.opacity = String(1 - away)
      }
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scroller,
        // The content-sized card pins once its center hits the viewport
        // center and holds for ~4 viewports of scroll; pinSpacing keeps the
        // document flow, so the 30px sheet gaps around the block survive.
        start: "center center",
        end: "+=420%",
        pin,
        // Numeric scrub = inertia: progress eases toward the scroll position
        // over ~1.4s instead of tracking it 1:1, smoothing every hand-off.
        scrub: 1.4,
        // No anticipatePin: it grabs the pin a frame early (offset scales
        // with scroll velocity) — invisible on a full-screen white panel,
        // but a visible snap now that the card sits on the open backdrop.
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress * (STEPS - 1)
          progress.set(p)
          render(p)
        },
      })
    }, sectionRef)

    progress.set(0)
    render(0)
    scheduleScrollRefresh()

    return () => ctx.revert()
    // stepDays is captured by render — rebuild on language switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode, i18n.language])

  const head = (
    <h2 className="mweek-headline text-h2">
      <RevealText text={t("week.headline")} />
    </h2>
  )

  const cta = (
    <a
      href={MEETS_BOT_URL}
      className="meets-btn meets-btn--primary mweek-cta"
      target="_blank"
      rel="noopener noreferrer"
    >
      {t("week.cta")}
    </a>
  )

  // ── Reduced motion: stacked static steps ────────────────────────────────
  if (staticMode) {
    return (
      <section id="meets-week" data-section="meets-week" className="meets-week section is-static">
        <div className="container mweek-static-head">{head}</div>
        {steps.map((step, i) => (
          <div className="mweek-static-step container" key={step.title}>
            <div className="mweek-text">
              <StepText step={step} index={i} />
            </div>
            <WeekWheel dayLabels={dayLabels} stepDays={stepDays} staticStep={i} />
          </div>
        ))}
        <div className="container mweek-static-cta">{cta}</div>
      </section>
    )
  }

  // ── Scroll mode: pinned panel, text swaps, wheel fills per day ─────────
  return (
    <section
      id="meets-week"
      data-section="meets-week"
      ref={sectionRef}
      className="meets-week section is-scroll"
    >
      <div className="mweek-scroller" ref={scrollerRef}>
        <div className="mweek-pin" ref={pinRef}>
          {/* The white card is content-sized (100px block padding) — during
              the pinned animation the backdrop stays visible around it. */}
          <div className="mweek-panel">
            <div className="mweek-inner container">
              <div className="mweek-text-col">
                {head}
                <div className="mweek-layers">
                  {steps.map((step, i) => (
                    <WeekStepLayer key={step.title} index={i} progress={progress}>
                      <StepText step={step} index={i} />
                    </WeekStepLayer>
                  ))}
                </div>
                {cta}
              </div>

              <div className="mweek-wheel-col">
                <WeekWheel dayLabels={dayLabels} stepDays={stepDays} refs={wheelRefs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
