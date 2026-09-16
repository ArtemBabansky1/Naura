import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { fadeUp, staggerContainer } from "../../lib/framer"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText } from "./motion"
import MeetsNav from "./MeetsNav"
import heroAvif from "../../assets/meets/hero-photo5.avif"
import heroWebp from "../../assets/meets/hero-photo5.webp"
// Phone-only backdrop: the lawn shot puts its pair 36% of the frame apart,
// which a portrait viewport cannot hold; on hills-bg they sit centred and
// narrow, so both stay in frame.
import heroPhoneAvif from "../../assets/meets/hills-bg.avif"
import heroPhoneWebp from "../../assets/meets/hills-bg.webp"
import "./MeetsHero.css"

export default function MeetsHero() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const sectionRef = useRef(null)

  // Depth parallax while the hero scrolls out: the photo recedes slower than
  // the page (slight lift + zoom keeps every edge covered). The copy scrolls
  // away naturally with the section — no drift, no fade.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  // Zoom bleed covers the lift: at any progress the scale adds ±15% of
  // height, the shift never exceeds 12% — no edge gaps.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.3])

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
        {/* Backdrop photo — a sunny lawn under a blue sky filling the
            rounded stage. */}
        <picture>
          {/* Phone sources come first — the browser takes the first entry whose
              media matches and whose type it supports. */}
          <source media="(max-width: 767.98px)" srcSet={heroPhoneAvif} type="image/avif" />
          <source media="(max-width: 767.98px)" srcSet={heroPhoneWebp} type="image/webp" />
          <source srcSet={heroAvif} type="image/avif" />
          <source srcSet={heroWebp} type="image/webp" />
          <motion.img
            className="meets-hero__bg"
            src={heroWebp}
            alt=""
            aria-hidden="true"
            width="1672"
            height="941"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            style={prefersReduced ? undefined : { y: bgY, scale: bgScale }}
          />
        </picture>

        <MeetsNav />

        <motion.div className="meets-hero__content" {...introMotion}>
          <div className="meets-hero__copy">
            <h1 className="meets-hero__headline">
              {t("hero.titleLines", { returnObjects: true }).map((line, i) => (
                <RevealText
                  as="span"
                  className="meets-hero__headline-line"
                  key={line}
                  text={line}
                  delay={0.15 + i * 0.15}
                />
              ))}
            </h1>

            {/* Split key pair, same recipe as communities.headlineAccent /
                headlineRest: the closing word carries the emphasis. */}
            <motion.p className="meets-hero__subtitle" variants={fadeUp}>
              {t("hero.subtitle")}{" "}
              <strong className="meets-hero__subtitle-accent">
                {t("hero.subtitleAccent")}
              </strong>
            </motion.p>
          </div>

          {/* Two CTAs = two funnels: participants go to the bot, organizers
              jump to the communities container. */}
          <motion.div className="meets-hero__cta" variants={fadeUp}>
            <a
              href={MEETS_BOT_URL}
              className="meets-btn meets-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("hero.ctaStart")}
            </a>
            <a href="#meets-communities" className="meets-btn meets-btn--ghost">
              {t("hero.ctaCommunity")}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
