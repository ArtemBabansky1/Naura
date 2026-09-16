import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "motion/react"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import "./MeetsNote.css"

/* Founders' note — the origin story, sitting between «Зачем идти на встречу»
 * and «Подбор идёт под тебя». A change of voice rather than a section: no
 * headline, narrow measure, signed by the three founders. Its job is to make
 * the matching block below read as care instead of machinery. An oversized
 * quotation mark opens it, so the block reads as speech at a glance. */
export default function MeetsNote() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const paragraphs = t("note.paragraphs", { returnObjects: true })

  const blockMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <section id="meets-note" data-section="meets-note" className="meets-note section">
      <motion.div className="container" {...blockMotion}>
        {/* Botticelli panel inside the dark band — the same light card the
            week block uses, so the note reads as a lifted aside. */}
        <motion.figure className="meets-note__panel meets-gray" variants={fadeUp}>
          <span className="meets-note__mark" aria-hidden="true">
            &ldquo;
          </span>

          <blockquote className="meets-note__quote">
            {paragraphs.map((text, i) => (
              <p
                key={text}
                className={`meets-note__p${i === 0 ? " meets-note__p--lead" : ""}`}
              >
                {text}
              </p>
            ))}
          </blockquote>

          <figcaption className="meets-note__sign">
            <span className="meets-note__name">{t("note.signature")}</span>
          </figcaption>
        </motion.figure>
      </motion.div>
    </section>
  )
}
