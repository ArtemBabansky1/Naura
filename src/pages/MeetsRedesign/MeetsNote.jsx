import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react"
import { ConnectionLines } from "../../components/CardDesign/CardDesign"
import { RevealText } from "./motion"
import "./MeetsNote.css"

export default function MeetsNote() {
  const { t } = useTranslation("meets")
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const paragraphs = t("note.paragraphs", { returnObjects: true })
  // Same 0.88 → 1 scroll entrance as the digital-card platform panel.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "start 15%"] })
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const scale = useTransform(progress, [0, 1], [0.88, 1])
  const y = useTransform(progress, [0, 1], [80, 0])

  return (
    <section id="meets-note" data-section="meets-note" className="meets-note section">
      <div className="container" ref={ref}>
        <motion.figure className="meets-note__panel meets-dark" style={reduced ? undefined : { scale, y }}>
          <ConnectionLines />
          <span className="meets-note__mark" aria-hidden="true"><RevealText text="“" /></span>
          <blockquote className="meets-note__quote">
            {paragraphs.map((text, i) => (
              <p key={text} className={`meets-note__p${i === 0 ? " meets-note__p--lead" : ""}`}>
                <RevealText text={text} stagger={i === 0 ? 0.045 : 0.008} />
              </p>
            ))}
          </blockquote>
          <figcaption className="meets-note__sign"><RevealText text={t("note.signature")} stagger={0.025} /></figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
