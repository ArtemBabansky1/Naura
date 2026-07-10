import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig, easing } from "../../lib/framer"
import { RevealText } from "./motion"
import "./MeetsFaq.css"

/* Two question groups (participants / owners), one open panel at a time
 * across the whole section — same accordion recipe as the landing FAQ. */
export default function MeetsFaq() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const groups = t("faq.groups", { returnObjects: true })

  const [openKey, setOpenKey] = useState(null)
  const toggle = (key) => setOpenKey((cur) => (cur === key ? null : key))

  const panelTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.35, ease: easing }

  const sectionMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.12),
      }

  return (
    <section id="meets-faq" data-section="meets-faq" className="meets-faq section">
      <motion.div className="container" {...sectionMotion}>
        <motion.header className="meets-faq__head" variants={fadeUp}>
          <h2 className="meets-head__title text-h2">
            <RevealText text={t("faq.headline")} />
          </h2>
        </motion.header>

        <div className="meets-faq__grid">
          {groups.map((group, g) => (
            <motion.div
              key={group.title}
              className="meets-faq__group"
              variants={staggerContainer(0.08)}
            >
              <motion.h3 className="meets-faq__group-title text-h4" variants={fadeUp}>
                {group.title}
              </motion.h3>

              <div className="meets-faq__accordion">
                {group.items.map((item, i) => {
                  const key = `${g}-${i}`
                  const isOpen = openKey === key
                  return (
                    <motion.div
                      key={item.question}
                      className={["meets-faq__item", isOpen ? "is-open" : ""].join(" ")}
                      variants={fadeUp}
                    >
                      <button
                        type="button"
                        className="meets-faq__trigger"
                        id={`meets-faq-trigger-${key}`}
                        aria-expanded={isOpen}
                        aria-controls={`meets-faq-panel-${key}`}
                        onClick={() => toggle(key)}
                      >
                        <span className="meets-faq__question text-body-lg">
                          {item.question}
                        </span>
                        <span className="meets-faq__icon" aria-hidden="true" />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="panel"
                            id={`meets-faq-panel-${key}`}
                            role="region"
                            aria-labelledby={`meets-faq-trigger-${key}`}
                            className="meets-faq__panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={panelTransition}
                          >
                            <p className="meets-faq__answer text-body">{item.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
