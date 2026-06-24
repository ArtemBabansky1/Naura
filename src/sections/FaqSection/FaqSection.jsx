import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportConfig, easing } from '../../lib/framer'
import './FaqSection.css'

export default function FaqSection() {
  const { t } = useTranslation('faq')
  const sectionRef = useRef(null)
  const prefersReduced = useReducedMotion()
  const items = t('items', { returnObjects: true })

  // Only one panel open at a time; null = all closed.
  const [openIndex, setOpenIndex] = useState(null)
  const toggle = (i) => setOpenIndex((cur) => (cur === i ? null : i))

  // Break the contact line before "Email …" onto a second line.
  const [contactLead, contactEmail] = t('contact').split(/(?=Email)/)

  const panelTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.35, ease: easing }

  return (
    <section id="faq" data-section="faq" ref={sectionRef} className="faq-section section">
      <motion.div
        className="container faq-grid"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={staggerContainer(0.12)}
      >
        <motion.header className="faq-header" variants={fadeUp}>
          <span className="faq-header__eyebrow text-label">{t('eyebrow')}</span>
          <h2 className="faq-header__title text-h2">{t('headline')}</h2>
          <p className="faq-header__contact text-body">
            {contactLead.trim()}
            <br />
            {contactEmail}
          </p>
        </motion.header>

        <motion.div className="faq-accordion" variants={fadeUp}>
          {items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={item.question} className={['faq-item', isOpen ? 'is-open' : ''].join(' ')}>
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
                      animate={{ height: 'auto', opacity: 1 }}
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
        </motion.div>
      </motion.div>
    </section>
  )
}
