import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig, easing } from "../../lib/framer"
import { RevealText } from "./motion"
import "./MeetsCommunities.css"

/* Problem and solution slide in from opposite sides — the editorial
 * "versus" pairing from the reference boards. */
const slideFrom = (x) => ({
  hidden: { opacity: 0, x },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easing } },
})

export default function MeetsCommunities() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const benefits = t("communities.solution.benefits", { returnObjects: true })

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
      id="meets-communities"
      data-section="meets-communities"
      className="meets-communities section"
    >
      <motion.div className="container" {...blockMotion}>
        <motion.header className="meets-communities__head" variants={fadeUp}>
          <span className="meets-head__eyebrow text-label">{t("communities.eyebrow")}</span>
          <h2 className="meets-head__title text-h2">
            <RevealText
              as="span"
              className="meets-communities__title-accent"
              text={t("communities.headlineAccent")}
            />{" "}
            <RevealText as="span" text={t("communities.headlineRest")} delay={0.12} />
          </h2>
          <p className="meets-head__desc text-body">{t("communities.note")}</p>
        </motion.header>

        <div className="meets-communities__grid">
          <motion.article
            className="meets-communities__problem"
            variants={prefersReduced ? fadeUp : slideFrom(-60)}
          >
            <h3 className="meets-communities__card-title text-h3">
              {t("communities.problem.title")}
            </h3>
            <p className="meets-communities__problem-desc text-body">
              {t("communities.problem.description")}
            </p>
          </motion.article>

          <motion.article
            className="meets-communities__solution"
            variants={prefersReduced ? fadeUp : slideFrom(60)}
          >
            <h3 className="meets-communities__card-title text-h3">
              {t("communities.solution.title")}
            </h3>
            <p className="meets-communities__solution-desc text-body">
              {t("communities.solution.description")}
            </p>
          </motion.article>
        </div>

        {/* Benefits — a row of bordered cards, same recipe as the how/why
            bento cards. */}
        <motion.ul
          className="meets-communities__benefits"
          variants={staggerContainer(0.1, 0.15)}
        >
          {benefits.map((benefit) => (
            <motion.li
              key={benefit.title}
              className="meets-communities__benefit"
              variants={fadeUp}
            >
              <h4 className="meets-communities__benefit-title text-h4">
                {benefit.title}
              </h4>
              <p className="meets-communities__benefit-desc text-body">
                {benefit.description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  )
}
