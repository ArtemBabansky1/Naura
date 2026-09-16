import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "motion/react"
import { fadeUp, viewportConfig } from "../../lib/framer"
import { RevealText } from "./motion"
import MatchingVisual from "./MatchingVisual"
import "./MeetsMatching.css"

export default function MeetsMatching() {
  const { t } = useTranslation("meets")
  const reduced = useReducedMotion()
  const cards = t("matching.cards", { returnObjects: true })
  const days = t("week.days", { returnObjects: true })
  return (
    <section id="meets-matching" data-section="meets-matching" className="meets-matching section">
      <div className="container meets-matching__layout">
        <header className="meets-matching__head">
          <h2 className="meets-matching__title text-h2"><RevealText text={t("matching.headline")} /></h2>
          <p className="meets-matching__desc text-body"><RevealText text={t("matching.description")} stagger={0.025} /></p>
        </header>
        <dl className="meets-matching__grid">
          {cards.map((card, index) => (
            <motion.div key={card.title} className="meets-matching__card" initial={reduced ? false : "hidden"} whileInView="visible" viewport={viewportConfig} variants={fadeUp}>
              <MatchingVisual index={index} days={days} />
              <div className="meets-matching__copy">
                <dt className="meets-matching__card-title">{card.title}</dt>
                <dd className="meets-matching__card-desc text-body">{card.description}</dd>
              </div>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
