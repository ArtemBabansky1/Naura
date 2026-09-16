import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "motion/react"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import { RevealText } from "./motion"
import MeetsBenefitNumber from "./MeetsBenefitNumber"
import "./MeetsCommunities.css"

export default function MeetsCommunities() {
  const { t } = useTranslation("meets")
  const reduced = useReducedMotion()
  const benefits = t("communities.solution.benefits", { returnObjects: true })
  const orderedBenefits = [benefits[0], benefits[2], benefits[1]]
  const blockMotion = reduced ? {} : {
    initial: "hidden",
    whileInView: "visible",
    viewport: viewportConfig,
    variants: staggerContainer(0.1),
  }

  return (
    <section id="meets-communities" data-section="meets-communities" className="meets-communities section">
      <motion.div className="container" {...blockMotion}>
        <motion.header className="meets-communities__head" variants={fadeUp}>
          <h2 className="meets-communities__title text-h2">
            <RevealText as="span" className="meets-communities__title-accent" text={t("communities.headlineAccent")} />{" "}
            <RevealText as="span" text={t("communities.headlineRest")} delay={0.12} />
          </h2>
        </motion.header>

        <div className="meets-communities__grid">
          <motion.article className="meets-communities__card meets-communities__card--problem" variants={fadeUp}>
            <h3 className="meets-communities__card-title"><RevealText text={t("communities.problem.title")} /></h3>
            <p className="meets-communities__card-desc">{t("communities.problem.description")}</p>
          </motion.article>

          <motion.article className="meets-communities__card meets-communities__card--solution" variants={fadeUp}>
            <div className="meets-communities__solution-intro">
              <h3 className="meets-communities__card-title"><RevealText text={t("communities.solution.title")} /></h3>
              <p className="meets-communities__card-desc">{t("communities.note")}</p>
            </div>
            <dl className="meets-communities__benefits">
              {orderedBenefits.map((benefit, index) => (
                <motion.div className="meets-communities__benefit" key={benefit.title} variants={fadeUp}>
                  <dt className="meets-communities__benefit-title">
                    <MeetsBenefitNumber index={index} />
                    {benefit.title}
                  </dt>
                  <dd className="meets-communities__benefit-desc">{benefit.description}</dd>
                </motion.div>
              ))}
            </dl>
          </motion.article>
        </div>
      </motion.div>
    </section>
  )
}
