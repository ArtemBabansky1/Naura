import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, useMotionValue, useTransform } from "motion/react"
import { gsap, ScrollTrigger } from "../../lib/gsap"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText } from "./motion"
import "./MeetsWeek.css"

const STEPS = 5
/* How many of the 7 (Mon-first) segments are filled at each step. Step 00 is
 * the one-off profile — it sits OUTSIDE the week, so the wheel stays empty
 * through it and through the first Saturday; filling begins on step 02
 * (Пн → 1), then Ср → 3, then Сб → 6. */
const DAY_OF_STEP = [0, 0, 1, 3, 6]
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
const SLIDE = 40
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
      {/* The profile step carries no numeral — a leading «00» read as a glitch,
          and dropping it gives its copy the full column. The week itself still
          counts 01–04. */}
      {index > 0 && (
        <span className="mweek-num" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
      )}
      <div className="mweek-step-body">
        <h3 className="mweek-title text-h3">{step.title}</h3>
        <p className="mweek-desc text-body">{step.description}</p>
      </div>
    </div>
  )
}

/* ── Profile card — the filled-in questionnaire shown on step 00, standing
 * where the wheel appears from step 01 on. Fields mirror what a participant
 * actually sees in the bot: who, where, role, about, looking for, can help.
 * Copy is fictional and lives in the locale. ──────────────────────────────── */
const PROFILE_FIELDS = ["role", "about", "looking", "skills"]

const PROFILE_ICONS = {
  role: "M4 8h16v11H4zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  about: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20a7 7 0 0 1 14 0",
  looking: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z",
  skills: "M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9zM18.5 3.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z",
}

function ProfileCard({ profile }) {
  return (
    <figure className="mweek-profile">
      <div className="mweek-profile__card">
        <div className="mweek-profile__head">
          <span className="mweek-profile__avatar" aria-hidden="true">
            {profile.initials}
          </span>
          <div className="mweek-profile__id">
            <p className="mweek-profile__name">{profile.name}</p>
            <p className="mweek-profile__place">{profile.location}</p>
          </div>
        </div>

        <ul className="mweek-profile__rows">
          {PROFILE_FIELDS.map((field) => (
            <li className="mweek-profile__row" key={field}>
              <svg
                className="mweek-profile__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={PROFILE_ICONS[field]} />
              </svg>
              <span>{profile[field]}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mweek-profile__caption">{profile.caption}</figcaption>
    </figure>
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

/* Static stacking covers short viewports (landscape phones): the panel runs
 * ~720px there against a ~360px screen, and a pinned block taller than the
 * viewport puts its lower half out of reach. Portrait phones keep the pinned
 * step-through — the profile card steps aside there instead (MeetsWeek.css). */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce), (max-height: 600px)"
const readStaticMode = () =>
  typeof window !== "undefined" && window.matchMedia(REDUCED_QUERY).matches

export default function MeetsWeek() {
  const { t, i18n } = useTranslation("meets")
  const steps = t("week.steps", { returnObjects: true })
  const stepDays = t("week.stepDays", { returnObjects: true })
  const dayLabels = t("week.days", { returnObjects: true })
  const profile = t("week.profile", { returnObjects: true })

  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)
  const pinRef = useRef(null)
  const segmentRefs = useRef([])
  const dayRefs = useRef([])
  const centerRef = useRef(null)
  const centerDayRef = useRef(null)
  const centerCountRef = useRef(null)
  // Right-column layers: profile card (step 00) and wheel (step 01 on).
  const cardLayerRef = useRef(null)
  const wheelLayerRef = useRef(null)
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

    // p ∈ [0, STEPS-1]. The fill flows CONTINUOUSLY with the scroll — one
    // uninterrupted pour around the ring (no per-step plateau holds); only
    // the text layers keep their plateau cross-fade.
    const render = (p) => {
      const pc = clamp(p, 0, STEPS - 1)
      const idx = clamp(Math.round(pc), 0, STEPS - 1)
      const lower = Math.floor(pc)
      const upper = Math.min(lower + 1, STEPS - 1)
      const flow = clamp(pc - lower, 0, 1)
      const fill = DAY_OF_STEP[lower] + (DAY_OF_STEP[upper] - DAY_OF_STEP[lower]) * flow

      segmentRefs.current.forEach((el, j) => {
        if (!el) return
        const amount = clamp(fill - j, 0, 1)
        // Draw along the arc (water-fill), not a cross-fade. The round cap
        // pops in as a full-width "dot" at near-zero dash length, so fade
        // the segment in over its first stretch instead of a binary toggle —
        // no snap when the pour hands over to the next segment.
        el.style.strokeDashoffset = String(1 - amount)
        el.style.opacity = String(clamp(amount / 0.15, 0, 1))
      })
      dayRefs.current.forEach((el, j) => {
        if (el) el.classList.toggle("is-on", j < Math.round(fill))
      })
      if (centerDayRef.current) centerDayRef.current.textContent = stepDays[idx]
      // The counter tracks the pour itself, not the step anchors.
      if (centerCountRef.current) centerCountRef.current.textContent = `${Math.round(fill)}/7`
      if (centerRef.current) {
        // Same plateau as the text layers: solid near a step, fading between.
        const away = clamp((Math.abs(pc - idx) - PLATEAU) / (EDGE - PLATEAU), 0, 1)
        centerRef.current.style.opacity = String(1 - away)
      }
      // Right column hand-off: the profile card owns step 00, the wheel takes
      // over from step 01. Same plateau shape as the text layers, so both
      // columns swap on the same beat.
      // Below 768 the card is dropped in CSS (the pinned panel cannot hold both
      // it and the copy on a phone), so the wheel simply stays on from step 00.
      const cardOn = cardLayerRef.current?.offsetParent != null
      const toWheel = cardOn ? clamp((pc - PLATEAU) / (EDGE - PLATEAU), 0, 1) : 1
      if (cardLayerRef.current && cardOn) {
        cardLayerRef.current.style.opacity = String(1 - toWheel)
        cardLayerRef.current.style.visibility = toWheel === 1 ? "hidden" : "visible"
      }
      if (wheelLayerRef.current) {
        wheelLayerRef.current.style.opacity = String(toWheel)
        wheelLayerRef.current.style.visibility = toWheel === 0 ? "hidden" : "visible"
      }
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scroller,
        // The content-sized card pins once its center hits the viewport
        // center and holds for ~4 viewports of scroll; pinSpacing keeps
        // the document flow.
        start: "center center",
        // 140% of scroll per hand-off — four transitions now that step 00
        // joined the row (was 420% for three).
        end: "+=560%",
        pin,
        // Numeric scrub = inertia: progress eases toward the scroll position
        // over ~1.4s instead of tracking it 1:1, smoothing every hand-off.
        scrub: 1.4,
        // anticipatePin compensates the one-frame pin lag that reads as a
        // visible snap on the contrasty card (its early-grab offset is
        // invisible against the static page around the card).
        anticipatePin: 1,
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
    <div className="mweek-cta">
      <a
        href={MEETS_BOT_URL}
        className="meets-btn meets-btn--primary"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("week.cta")}
      </a>
      <a href="#meets-form" className="meets-btn meets-btn--ghost">
        {t("week.ctaSecondary")}
      </a>
    </div>
  )

  // ── Reduced motion: stacked static steps ────────────────────────────────
  if (staticMode) {
    return (
      <section id="meets-week" data-section="meets-week" className="meets-week section is-static meets-gray">
        <div className="container mweek-static-head">{head}</div>
        {steps.map((step, i) => (
          <div className="mweek-static-step container" key={step.title}>
            <div className="mweek-text">
              <StepText step={step} index={i} />
            </div>
            {i === 0 ? (
              <ProfileCard profile={profile} />
            ) : (
              <WeekWheel dayLabels={dayLabels} stepDays={stepDays} staticStep={i} />
            )}
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
          {/* Botticelli (#cae7f7) content-sized card — 100px block padding. */}
          <div className="mweek-panel meets-gray">
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

              {/* Two stacked layers in one cell: the profile card owns step
                  00, the wheel takes over from step 01. Cross-faded from the
                  same scroll progress that drives the text layers. */}
              <div className="mweek-wheel-col">
                <div className="mweek-visual">
                  <div
                    className="mweek-visual__layer mweek-visual__layer--card"
                    ref={cardLayerRef}
                  >
                    <ProfileCard profile={profile} />
                  </div>
                  <div className="mweek-visual__layer" ref={wheelLayerRef}>
                    <WeekWheel dayLabels={dayLabels} stepDays={stepDays} refs={wheelRefs} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
