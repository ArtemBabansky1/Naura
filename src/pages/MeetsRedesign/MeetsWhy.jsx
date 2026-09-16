import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "motion/react"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import { RevealText } from "./motion"
import photo1 from "../../assets/meets-redesign/conversation-1.webp"
import photo2 from "../../assets/meets-redesign/conversation-2.webp"
import photo3 from "../../assets/meets-redesign/conversation-3.webp"
import photo4 from "../../assets/meets-redesign/conversation-4.webp"
import "./MeetsWhy.css"

const PHOTOS = [
  { src: photo1, width: 800, height: 1000 },
  { src: photo2, width: 800, height: 533 },
  { src: photo3, width: 800, height: 1000 },
  { src: photo4, width: 800, height: 800 },
]

export default function MeetsWhy() {
  const { t } = useTranslation("meets")
  const reduced = useReducedMotion()
  const cards = t("why.cards", { returnObjects: true })

  const reveal = reduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1, 0.08),
      }

  return (
    <section
      id="meets-why"
      data-section="meets-why"
      className="meets-why section"
      aria-labelledby="meets-why-title"
    >
      <div className="container">
        <motion.header className="meets-why__head" {...reveal}>
          <h2 id="meets-why-title" className="meets-why__title text-h2">
            <RevealText text={t("why.headline")} stagger={0.035} />
          </h2>
          <motion.p className="meets-why__note text-body" variants={fadeUp}>
            {t("why.note")}
          </motion.p>
        </motion.header>

        <motion.dl className="meets-why__checkerboard" {...reveal}>
          {cards.map((card, index) => {
            const photo = PHOTOS[index]
            return (
              <motion.div className="meets-why__column" key={card.title} variants={fadeUp}>
                <figure className="meets-why__photo">
                  <img
                    src={photo.src}
                    alt=""
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>

                <div className="meets-why__card">
                  <dt className="meets-why__card-title text-h4">{card.title}</dt>
                  <dd className="meets-why__card-desc text-body">{card.description}</dd>
                </div>
              </motion.div>
            )
          })}
        </motion.dl>
      </div>
    </section>
  )
}
