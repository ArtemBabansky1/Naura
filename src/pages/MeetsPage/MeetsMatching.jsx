import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "motion/react"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import { RevealText } from "./motion"
import "./MeetsMatching.css"

/* «Подбор идёт под тебя» — the positioning core (wireframe S7): headline,
 * one-line intro, then three cards — direction at the start, rating after
 * the meeting, weekly decision. */
export default function MeetsMatching() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const cards = t("matching.cards", { returnObjects: true })

  const blockMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <section
      id="meets-matching"
      data-section="meets-matching"
      className="meets-matching section"
    >
      <motion.div className="container" {...blockMotion}>
        <motion.header className="meets-matching__head" variants={fadeUp}>
          <h2 className="meets-matching__title text-h2">
            <RevealText text={t("matching.headline")} />
          </h2>
          <p className="meets-matching__desc text-body">{t("matching.description")}</p>
        </motion.header>

        <div className="meets-matching__grid">
          {cards.map((card) => (
            <motion.article key={card.title} className="meets-matching__card" variants={fadeUp}>
              <h3 className="meets-matching__card-title text-h4">{card.title}</h3>
              <p className="meets-matching__card-desc text-body-sm">{card.description}</p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
