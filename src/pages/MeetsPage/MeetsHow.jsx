import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText, Counter } from "./motion"
import hillsAvif from "../../assets/meets/hills-bg.avif"
import hillsWebp from "../../assets/meets/hills-bg.webp"
import "./MeetsHow.css"

/* Card icons — the lucide set the source meets page uses, inlined. */
function ClipboardIcon() {
  return (
    <svg className="meets-how__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="meets-how__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="meets-how__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

const ICONS = [ClipboardIcon, CalendarIcon, ShieldIcon]

function StatValue({ stat }) {
  return (
    <span className="meets-how__stat-value">
      <span className="meets-how__stat-num">
        <Counter to={stat.value} />
        {stat.suffix}
      </span>
      {stat.unit && <span className="meets-how__stat-unit"> {stat.unit}</span>}
    </span>
  )
}

/* "Как устроены встречи" — merged how + stats bento in the landing
 * FeaturesSection manner: two rows of mixed-width containers.
 *   Row A: [how 01][how 02 + 7-days stat][20–30 min stat]
 *   Row B: [10-min stat][how 03][hills-photo card with the 1-on-1 stat] */
export default function MeetsHow() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const cards = t("how.cards", { returnObjects: true })
  const stats = t("stats", { returnObjects: true })

  // Optical parallax inside the photo card: the oversized hills drift against
  // the scroll behind the clipped card frame (scale covers the travel).
  const photoCardRef = useRef(null)
  const { scrollYProgress: photoProgress } = useScroll({
    target: photoCardRef,
    offset: ["start end", "end start"],
  })
  const photoY = useTransform(photoProgress, [0, 1], ["8%", "-8%"])

  const gridMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.08),
      }

  const howCard = (i, extra = null) => {
    const Icon = ICONS[i]
    return (
      <motion.article className="meets-how__card meets-how__card--md" variants={fadeUp}>
        <Icon />
        <h3 className="meets-how__card-title text-h3 text-balance">{cards[i].title}</h3>
        <p className="meets-how__card-desc text-body text-pretty">{cards[i].description}</p>
        {extra}
      </motion.article>
    )
  }

  const statCard = (stat) => (
    <motion.article className="meets-how__card meets-how__card--sm" variants={fadeUp}>
      <StatValue stat={stat} />
      <p className="meets-how__stat-label text-body">{stat.label}</p>
    </motion.article>
  )

  return (
    <section id="meets-how" data-section="meets-how" className="meets-how section">
      <div className="container">
        <header className="meets-how__head">
          <span className="meets-head__eyebrow text-label">{t("how.eyebrow")}</span>
          <h2 className="meets-how__title text-h2 text-balance">
            <RevealText text={t("how.headline")} />
          </h2>
          <p className="meets-how__desc text-body-lg text-pretty">{t("how.description")}</p>
        </header>

        <motion.div className="meets-how__grid" {...gridMotion}>
          <div className="meets-how__row meets-how__row--a">
            {howCard(0)}
            {howCard(
              1,
              <div className="meets-how__card-stat">
                <StatValue stat={stats[2]} />
                <span className="meets-how__stat-label text-body">{stats[2].label}</span>
              </div>,
            )}
            {statCard(stats[1])}
          </div>

          <div className="meets-how__row meets-how__row--b">
            {statCard(stats[0])}
            {howCard(2)}

            {/* Photo card — the hero hills carry the 1-on-1 stat + CTA. */}
            <motion.article
              ref={photoCardRef}
              className="meets-how__card meets-how__card--md meets-how__card--photo"
              variants={fadeUp}
            >
              <picture>
                <source srcSet={hillsAvif} type="image/avif" />
                <source srcSet={hillsWebp} type="image/webp" />
                <motion.img
                  className="meets-how__photo"
                  src={hillsWebp}
                  alt=""
                  aria-hidden="true"
                  width="1864"
                  height="1048"
                  loading="lazy"
                  decoding="async"
                  style={prefersReduced ? undefined : { y: photoY, scale: 1.2 }}
                />
              </picture>
              <div className="meets-how__photo-body">
                <StatValue stat={stats[3]} />
                <p className="meets-how__stat-label text-body">{stats[3].label}</p>
                <a
                  href={MEETS_BOT_URL}
                  className="meets-btn meets-btn--primary meets-how__photo-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("hero.ctaStart")}
                </a>
              </div>
            </motion.article>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
