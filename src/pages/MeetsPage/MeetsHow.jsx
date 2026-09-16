import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { gsap, ScrollTrigger } from "../../lib/gsap"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"
import { RevealText, Counter } from "./motion"
import how1Avif from "../../assets/meets/how-1.avif"
import how1Webp from "../../assets/meets/how-1.webp"
import how2Avif from "../../assets/meets/how-2.avif"
import how2Webp from "../../assets/meets/how-2.webp"
import how3Avif from "../../assets/meets/how-3.avif"
import how3Webp from "../../assets/meets/how-3.webp"
import how4Avif from "../../assets/meets/how-4.avif"
import how4Webp from "../../assets/meets/how-4.webp"
import how5Avif from "../../assets/meets/how-5.avif"
import how5Webp from "../../assets/meets/how-5.webp"
import how6Avif from "../../assets/meets/how-6.avif"
import how6Webp from "../../assets/meets/how-6.webp"
import how7Avif from "../../assets/meets/how-7.avif"
import how7Webp from "../../assets/meets/how-7.webp"
import how8Avif from "../../assets/meets/how-8.avif"
import how8Webp from "../../assets/meets/how-8.webp"
import how9Avif from "../../assets/meets/how-9.avif"
import how9Webp from "../../assets/meets/how-9.webp"
import how10Avif from "../../assets/meets/how-10.avif"
import how10Webp from "../../assets/meets/how-10.webp"
import "./MeetsHow.css"

// Card backdrops keyed by card — the 1-on-1 shot opens the row (Format).
const PHOTOS = {
  format: { avif: how9Avif, webp: how9Webp },
  context: { avif: how8Avif, webp: how8Webp },
  cycle: { avif: how2Avif, webp: how2Webp },
  duration: { avif: how4Avif, webp: how4Webp },
  rhythm: { avif: how3Avif, webp: how3Webp },
  protection: { avif: how10Avif, webp: how10Webp },
  launch: { avif: how6Avif, webp: how6Webp },
}

function CardPhoto({ photo }) {
  if (!photo) return null
  return (
    <>
      <picture>
        <source srcSet={photo.avif} type="image/avif" />
        <source srcSet={photo.webp} type="image/webp" />
        <img
          className="meets-how__photo"
          src={photo.webp}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      </picture>
    </>
  )
}

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
        {typeof stat.value === "number" ? <Counter to={stat.value} /> : stat.value}
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

  // Wireframe order: Format opens the row (photo card with the bot CTA),
  // then Context, Cycle, Duration; the original Rhythm / Protection /
  // Launch cards continue the row.
  const items = [
    { key: "format", type: "photo", data: stats[2], photo: PHOTOS.format },
    { key: "context", type: "text", data: cards[0], photo: PHOTOS.context },
    { key: "cycle", type: "stat", data: stats[0], photo: PHOTOS.cycle },
    { key: "duration", type: "stat", data: stats[1], photo: PHOTOS.duration },
    { key: "rhythm", type: "text", data: cards[1], photo: PHOTOS.rhythm },
    { key: "protection", type: "text", data: cards[2], photo: PHOTOS.protection },
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
      return (
        <article className="meets-how__card meets-how__card--stat" key={item.key}>
          <CardPhoto photo={item.photo} />
          <span className="meets-how__badge">{item.data.badge}</span>
          <StatValue stat={item.data} />
          <p className="meets-how__stat-label text-body text-pretty">{item.data.label}</p>
        </article>
      )
    }
    if (item.type === "photo") {
      return (
        <article className="meets-how__card meets-how__card--photo" key={item.key}>
          <CardPhoto photo={item.photo} />
          <span className="meets-how__badge">{item.data.badge}</span>
          <StatValue stat={item.data} />
          <p className="meets-how__stat-label text-body text-pretty">{item.data.label}</p>
        </article>
      )
    }
    return (
      <article className="meets-how__card" key={item.key}>
        <CardPhoto photo={item.photo} />
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
