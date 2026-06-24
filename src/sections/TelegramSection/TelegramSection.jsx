import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportConfig } from '../../lib/framer'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import PhoneShowcase from './PhoneShowcase'
import './TelegramSection.css'

// Callouts scattered around the phone (positions live in CSS per key).
const FEATURES = ['askGraph', 'forwardSave', 'voiceNotes', 'noAccount']

function Feature({ feature }) {
  const { t } = useTranslation('telegram')
  return (
    <div className={`telegram-feature telegram-feature--${feature}`}>
      <h3 className="telegram-feature__title text-h4">{t(`features.${feature}.title`)}</h3>
      <p className="telegram-feature__desc text-body-sm">{t(`features.${feature}.description`)}</p>
    </div>
  )
}

export default function TelegramSection() {
  const { t } = useTranslation('telegram')
  const prefersReduced = useReducedMotion()
  const stageRef = useRef(null)

  // Scroll-scrubbed callouts: each starts tucked behind the phone (converged to
  // its centre, faded out) and slides out to its resting spot as you scroll —
  // synced to the same window that turns the phone to face the viewer. Driven
  // deterministically from progress (same pattern as the phone) so it always
  // lands on the right state, even when the page loads mid-section. Desktop +
  // motion only; on mobile the callouts stack and stay static.
  useEffect(() => {
    if (prefersReduced) return
    const stage = stageRef.current
    if (!stage) return
    const section = stage.closest('[data-section="telegram"]') || stage

    const FADE_START = 0.4 // hold hidden until the callout has cleared the phone

    const mm = gsap.matchMedia()
    mm.add('(min-width: 690px)', () => {
      const phone = stage.querySelector('.telegram-phone')
      const features = gsap.utils.toArray(stage.querySelectorAll('.telegram-feature'))
      if (!phone || !features.length) return

      // Offset from each callout's resting centre to the phone centre. Measured
      // via layout (offsetLeft/Top) so it ignores the live transform; recomputed
      // on every refresh/resize.
      const offsets = new Map()
      const measure = () => {
        const px = phone.offsetLeft + phone.offsetWidth / 2
        const py = phone.offsetTop + phone.offsetHeight / 2
        features.forEach((el) => {
          offsets.set(el, {
            dx: px - (el.offsetLeft + el.offsetWidth / 2),
            dy: py - (el.offsetTop + el.offsetHeight / 2),
          })
        })
      }

      const apply = (p) => {
        const op = gsap.utils.clamp(0, 1, (p - FADE_START) / (1 - FADE_START))
        features.forEach((el) => {
          const { dx, dy } = offsets.get(el)
          el.style.transform = `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) scale(${0.8 + 0.2 * p})`
          el.style.opacity = op
        })
      }

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top 78%',
        end: 'center 46%',
        scrub: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => {
          measure()
          apply(self.progress)
        },
      })

      measure()
      apply(st.progress)

      return () => {
        features.forEach((el) => {
          el.style.transform = ''
          el.style.opacity = ''
        })
      }
    })

    return () => mm.revert()
  }, [prefersReduced])

  const sectionMotion = prefersReduced
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: viewportConfig,
        variants: staggerContainer(0.12),
      }

  return (
    <section id="telegram" data-section="telegram" className="telegram-section section">
      <motion.div className="container" {...sectionMotion}>
        <motion.header className="telegram-header" variants={fadeUp}>
          <span className="telegram-header__eyebrow text-label">{t('eyebrow')}</span>
          <h2 className="telegram-header__title text-h2">{t('headline')}</h2>
        </motion.header>

        <motion.div className="telegram-stage" variants={fadeUp} ref={stageRef}>
          {FEATURES.map((f) => (
            <Feature key={f} feature={f} />
          ))}

          <PhoneShowcase />
        </motion.div>

        <motion.div className="telegram-actions" variants={fadeUp}>
          <a href="#" className="telegram-btn telegram-btn--primary">{t('cta.openBot')}</a>
          <a href="#" className="telegram-btn telegram-btn--ghost">{t('cta.howItStores')}</a>
        </motion.div>
      </motion.div>
    </section>
  )
}
