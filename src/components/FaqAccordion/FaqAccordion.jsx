import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { easing } from "../../lib/framer"
import "./FaqAccordion.css"

export const FaqAccordion = () => {
  const { t } = useTranslation("faq")
  const prefersReduced = useReducedMotion()
  const items = t("items", { returnObjects: true })
  const [openIndex, setOpenIndex] = useState(null)
  const toggle = (i) => setOpenIndex((cur) => (cur === i ? null : i))

  const panelTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.35, ease: easing }

  return (
    <div className="faq-accordion">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={item.question} className={["faq-item", isOpen ? "is-open" : ""].join(" ")}>
            <button
              type="button"
              className="faq-item__trigger"
              id={`faq-trigger-${i}`}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              onClick={() => toggle(i)}
            >
              <span className="faq-item__question text-body-lg">{item.question}</span>
              <span className="faq-item__icon" aria-hidden="true" />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className="faq-item__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={panelTransition}
                >
                  <p className="faq-item__answer text-body">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
