import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig, easing } from "../../lib/framer"
import { RevealText, ParallaxY } from "./motion"
import "./MeetsWhy.css"

/* "В чем магия встречи" — light section like the rest of the page. Left
 * column: eyebrow, headline, and a note + organizers CTA pinned to the
 * bottom. Right: a 2×2 grid of value cards (title top, description
 * bottom). */
export default function MeetsWhy() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const cards = t("why.cards", { returnObjects: true })

  const panelReveal = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96, y: 40 },
        whileInView: { opacity: 1, scale: 1, y: 0 },
        viewport: viewportConfig,
        transition: { duration: 0.9, ease: easing },
      }

  const innerMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1, 0.25),
      }

  return (
    <section id="meets-why" data-section="meets-why" className="meets-why section">
      <div className="container">
        {/* Soft parallax drift — the whole black panel rides slightly ahead
            of the scroll on top of its own in-view reveal. */}
        <ParallaxY from={50} to={-25}>
          <motion.div className="meets-why__panel" {...panelReveal}>
            <motion.div className="meets-why__inner" {...innerMotion}>
              <div className="meets-why__left">
                <h2 className="meets-why__title text-h2">
                  <RevealText text={t("why.headline")} stagger={0.035} />
                </h2>

                <motion.div className="meets-why__foot" variants={fadeUp}>
                  <p className="meets-why__note text-body">{t("why.note")}</p>
                  <a href="#meets-form" className="meets-btn meets-btn--primary meets-why__cta">
                    {t("why.cta")}
                  </a>
                </motion.div>
              </div>

              <div className="meets-why__grid">
                {cards.map((card) => (
                  <motion.article key={card.title} className="meets-why__card" variants={fadeUp}>
                    <h3 className="meets-why__card-title text-h4">{card.title}</h3>
                    <p className="meets-why__card-desc text-body-sm">{card.description}</p>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </ParallaxY>
      </div>
    </section>
  )
}
