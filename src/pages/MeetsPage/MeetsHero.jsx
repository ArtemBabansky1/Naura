import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { fadeUp, staggerContainer } from "../../lib/framer"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText } from "./motion"
import MeetsNav from "./MeetsNav"
import hillsAvif from "../../assets/meets/hills-bg.avif"
import hillsWebp from "../../assets/meets/hills-bg.webp"
import "./MeetsHero.css"

export default function MeetsHero() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const sectionRef = useRef(null)

  // Depth parallax while the hero scrolls out: the hills recede slower than
  // the page (slight lift + zoom keeps every edge covered), the headline
  // block drifts up ahead of the scroll and dissolves.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  // Zoom bleed covers the lift: at any progress the scale adds ±15% of
  // height, the shift never exceeds 12% — no edge gaps.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.3])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const introMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
        variants: staggerContainer(0.12, 0.1),
      }

  return (
    <section id="meets-hero" data-section="meets-hero" ref={sectionRef} className="meets-hero">
      <div className="meets-hero__stage">
        {/* Full-bleed backdrop — hills anchored to the bottom, white sky on top
            merges with the page background. */}
        <picture>
          <source srcSet={hillsAvif} type="image/avif" />
          <source srcSet={hillsWebp} type="image/webp" />
          <motion.img
            className="meets-hero__bg"
            src={hillsWebp}
            alt=""
            aria-hidden="true"
            width="1864"
            height="1048"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            style={prefersReduced ? undefined : { y: bgY, scale: bgScale }}
          />
        </picture>

        <MeetsNav />

        <motion.div
          className="meets-hero__content"
          style={prefersReduced ? undefined : { y: contentY, opacity: contentOpacity }}
          {...introMotion}
        >
          <h1 className="meets-hero__headline">
            <RevealText
              as="span"
              className="meets-hero__headline-line meets-hero__headline-line--accent"
              text={t("hero.titleAccent")}
              delay={0.15}
            />
            <RevealText
              as="span"
              className="meets-hero__headline-line"
              text={t("hero.titleRest")}
              delay={0.3}
            />
          </h1>

          <motion.p className="meets-hero__subtitle" variants={fadeUp}>
            {t("hero.subtitle")}
          </motion.p>

          <motion.div className="meets-hero__cta" variants={fadeUp}>
            <a
              href={MEETS_BOT_URL}
              className="meets-btn meets-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("hero.ctaStart")}
            </a>
            <a href="#meets-form" className="meets-btn meets-btn--ghost">
              {t("hero.ctaCommunity")}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
