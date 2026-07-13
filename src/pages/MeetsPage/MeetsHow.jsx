import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { gsap, ScrollTrigger } from "../../lib/gsap"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText, Counter } from "./motion"
import hillsAvif from "../../assets/meets/hills-bg.avif"
import hillsWebp from "../../assets/meets/hills-bg.webp"
import timeAvif from "../../assets/meets/time-bg.avif"
import timeWebp from "../../assets/meets/time-bg.webp"
import "./MeetsHow.css"

// Cards visible at once on the pinned desktop layout.
const CARDS = 4

// Touch / reduced-motion get a plain native swipe row instead of the pinned
// scroll takeover — pinning horizontal scroll fights touch gestures.
const NATIVE_QUERY = "(max-width: 1023.98px), (prefers-reduced-motion: reduce)"
const readNative = () =>
  typeof window !== "undefined" && window.matchMedia(NATIVE_QUERY).matches

function StatValue({ stat }) {
  return (
    <span className="meets-how__stat-value text-h3">
      <span className="meets-how__stat-num">
        <Counter to={stat.value} />
        {stat.suffix}
      </span>
      {stat.unit && <span className="meets-how__stat-unit"> {stat.unit}</span>}
    </span>
  )
}

/* "Как устроены встречи" — a horizontal card scroller. On desktop the panel
 * pins and the card row slides sideways as the page scrolls (same GSAP
 * mechanic as the landing's product scroller); on touch / reduced motion it is
 * a native swipe row. Four cards are in view at the start; stat cards put the
 * accent number in the title slot and the 1-on-1 photo card closes the row. */
export default function MeetsHow() {
  const { t, i18n } = useTranslation("meets")
  const cards = t("how.cards", { returnObjects: true })
  const stats = t("stats", { returnObjects: true })

  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const headRef = useRef(null)
  const trackRef = useRef(null)
  const barRef = useRef(null)

  // Interleave the three how-cards with the stat cards; the 1-on-1 photo
  // card closes the row.
  const items = [
    { key: "context", type: "text", data: cards[0] },
    { key: "cycle", type: "stat", data: stats[2] },
    { key: "rhythm", type: "text", data: cards[1] },
    { key: "duration", type: "stat", data: stats[1] },
    { key: "protection", type: "text", data: cards[2] },
    { key: "launch", type: "stat", data: stats[0] },
    { key: "format", type: "photo", data: stats[3] },
  ]

  const [nativeMode, setNativeMode] = useState(readNative)
  useEffect(() => {
    const mq = window.matchMedia(NATIVE_QUERY)
    const sync = () => setNativeMode(mq.matches)
    mq.addEventListener("change", sync)
    sync()
    return () => mq.removeEventListener("change", sync)
  }, [])

  // ── Desktop: pin the panel, translate the row sideways with scroll ──────
  useLayoutEffect(() => {
    if (nativeMode) return undefined
    const track = trackRef.current
    const pin = pinRef.current
    const head = headRef.current
    if (!track || !pin || !head) return undefined

    // Size the cards so exactly four align with the header container, and pad
    // the full-bleed row so the first/last card land on the container edges.
    const layout = () => {
      const rect = head.getBoundingClientRect()
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0
      const cardW = (rect.width - (CARDS - 1) * gap) / CARDS
      track.style.setProperty("--card-w", `${cardW}px`)
      track.style.paddingLeft = `${rect.left}px`
      track.style.paddingRight = `${rect.left}px`
    }
    // How far the row must travel so the last card's right edge reaches the
    // container's right edge.
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

    const ctx = gsap.context(() => {
      layout()
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          // Content-height panel pins at the viewport center (not a full
          // 100vh takeover), keeping the page's uniform 200u block gaps.
          start: "center center",
          end: () => `+=${distance()}`,
          pin: true,
          // Hard 1:1 scrub — Lenis already eases the scroll position itself.
          // A numeric scrub adds a second lag layer: on a fast flick the page
          // blows past the pin end while the row is still mid-slide, so the
          // half-finished row scrolls away under the next block.
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: layout,
          onUpdate: (self) => {
            if (barRef.current) {
              barRef.current.style.transform = `scaleX(${self.progress})`
            }
          },
        },
      })
    }, sectionRef)

    scheduleScrollRefresh()
    return () => ctx.revert()
    // i18n.language: RevealText re-renders the headline on language switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeMode, i18n.language])

  // ── Touch / reduced motion: native swipe row drives the progress bar ────
  useEffect(() => {
    if (!nativeMode) return undefined
    const track = trackRef.current
    const bar = barRef.current
    if (!track || !bar) return undefined
    // Drop any inline sizing left over from the pinned layout.
    track.style.removeProperty("--card-w")
    track.style.removeProperty("padding-left")
    track.style.removeProperty("padding-right")

    let raf = 0
    const sync = () => {
      raf = 0
      const max = track.scrollWidth - track.clientWidth
      bar.style.transform = `scaleX(${max > 0 ? track.scrollLeft / max : 0})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync)
    }
    sync()
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      track.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [nativeMode])

  const renderCard = (item) => {
    if (item.type === "stat") {
      // The cycle card is the accent one: purple fill + a giant digit pinned
      // to the card's bottom edge (same device as the Communities giants).
      // The duration card carries the hourglass photo backdrop (white ink).
      const isAccent = item.key === "cycle"
      const isTime = item.key === "duration"
      return (
        <article
          className={`meets-how__card meets-how__card--stat${isAccent ? " meets-how__card--accent" : ""}${isTime ? " meets-how__card--time" : ""}`}
          key={item.key}
        >
          {isTime && (
            <picture>
              <source srcSet={timeAvif} type="image/avif" />
              <source srcSet={timeWebp} type="image/webp" />
              <img
                className="meets-how__photo"
                src={timeWebp}
                alt=""
                aria-hidden="true"
                width="840"
                height="1260"
                loading="lazy"
                decoding="async"
              />
            </picture>
          )}
          <span className="meets-how__badge">{item.data.badge}</span>
          <StatValue stat={item.data} />
          <p className="meets-how__stat-label text-body">{item.data.label}</p>
          {isAccent && (
            <span className="meets-how__giant-digit" aria-hidden="true">
              {item.data.value}
            </span>
          )}
        </article>
      )
    }
    if (item.type === "photo") {
      return (
        <article className="meets-how__card meets-how__card--photo" key={item.key}>
          <picture>
            <source srcSet={hillsAvif} type="image/avif" />
            <source srcSet={hillsWebp} type="image/webp" />
            <img
              className="meets-how__photo"
              src={hillsWebp}
              alt=""
              aria-hidden="true"
              width="1672"
              height="941"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <span className="meets-how__badge">{item.data.badge}</span>
          <StatValue stat={item.data} />
          <p className="meets-how__stat-label text-body">{item.data.label}</p>
          <a
            href={MEETS_BOT_URL}
            className="meets-btn meets-btn--primary meets-how__photo-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("hero.ctaStart")}
          </a>
        </article>
      )
    }
    return (
      <article className="meets-how__card" key={item.key}>
        <span className="meets-how__badge">{item.data.badge}</span>
        <h3 className="meets-how__card-title text-h3 text-balance">{item.data.title}</h3>
        <p className="meets-how__card-desc text-body text-pretty">{item.data.description}</p>
      </article>
    )
  }

  return (
    <section
      id="meets-how"
      data-section="meets-how"
      ref={sectionRef}
      className={`meets-how section ${nativeMode ? "is-native" : "is-pinned"}`}
    >
      <div className="meets-how__pin" ref={pinRef}>
        <div className="container" ref={headRef}>
          <header className="meets-how__head">
            <div className="meets-how__head-main">
              <span className="meets-head__eyebrow text-label">{t("how.eyebrow")}</span>
              <h2 className="meets-how__title text-h2 text-balance">
                <RevealText text={t("how.headline")} />
              </h2>
            </div>
            <p className="meets-how__desc text-body text-pretty">{t("how.description")}</p>
          </header>
        </div>

        <div className="meets-how__track" ref={trackRef}>
          {items.map(renderCard)}
        </div>

        <div className="container">
          <div className="meets-how__progress">
            <span className="meets-how__progress-bar" ref={barRef} />
          </div>
        </div>
      </div>
    </section>
  )
}
