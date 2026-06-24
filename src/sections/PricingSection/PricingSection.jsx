import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportConfig } from '../../lib/framer'
import { APP_URL } from '../../lib/urls'
import UnicornScene from '../../components/UnicornScene/UnicornScene'
import './PricingSection.css'

const PLANS = ['free', 'pro', 'team']
const FEATURED = 'pro'

// Cursor parallax for the glow under the cards.
const GLOW_FACTOR = 0.06
const GLOW_MAX = 60 // px

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}

function CheckIcon() {
  return (
    <svg className="pricing-check" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlanCard({ plan }) {
  const { t } = useTranslation('pricing')
  const prefersReduced = useReducedMotion()
  const cardRef = useRef(null)
  const base = `plans.${plan}`
  const features = t(`${base}.features`, { returnObjects: true })
  const isFeatured = plan === FEATURED

  // Purple shadow on the featured card that grows on the edge nearest the cursor.
  useEffect(() => {
    if (!isFeatured || prefersReduced) return
    const el = cardRef.current
    if (!el) return
    let frame = 0
    function onMove(e) {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const dist = Math.hypot(dx, dy) || 1
        const proximity = clamp(1 - dist / (Math.max(r.width, r.height) * 1.7), 0, 1)
        // Offset the glow toward the cursor; intensify it as the cursor nears.
        const reach = 9 * (0.4 + 0.6 * proximity)
        el.style.setProperty('--glow-x', `${((dx / dist) * reach).toFixed(1)}px`)
        el.style.setProperty('--glow-y', `${((dy / dist) * reach).toFixed(1)}px`)
        el.style.setProperty('--glow-spread', `${(2 + 6 * proximity).toFixed(0)}px`)
        el.style.setProperty('--glow-alpha', (0.1 + 0.18 * proximity).toFixed(2))
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [isFeatured, prefersReduced])

  return (
    <motion.article
      ref={cardRef}
      variants={fadeUp}
      className={['pricing-card', isFeatured ? 'pricing-card--featured' : ''].join(' ')}
    >
      {isFeatured && <UnicornScene className="pricing-unicorn" />}

      <div className="pricing-card__body">
        <span className="pricing-card__name text-label">{t(`${base}.name`)}</span>

        <div className="pricing-card__price">
          <span className="pricing-card__amount">{t(`${base}.price`)}</span>
          <span className="pricing-card__period text-body-sm">{t(`${base}.period`)}</span>
        </div>

        <ul className="pricing-card__features">
          {features.map((feature) => (
            <li key={feature} className="pricing-card__feature text-body-sm">
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <a href={APP_URL} className="pricing-card__cta pricing-card__cta--ghost">
        {t(`${base}.cta`)}
      </a>
    </motion.article>
  )
}

export default function PricingSection() {
  const { t } = useTranslation('pricing')
  const prefersReduced = useReducedMotion()
  const glowRef = useRef(null)
  const [glow, setGlow] = useState({ x: 0, y: 0 })

  // Glow drifts toward the cursor anywhere on the page (capped).
  useEffect(() => {
    if (prefersReduced) return
    let frame = 0
    function onMove(e) {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = glowRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        setGlow({
          x: clamp(dx * GLOW_FACTOR, -GLOW_MAX, GLOW_MAX),
          y: clamp(dy * GLOW_FACTOR, -GLOW_MAX, GLOW_MAX),
        })
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [prefersReduced])

  const sectionMotion = prefersReduced
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <section id="pricing" data-section="pricing" className="pricing-section section">
      <motion.div className="container" {...sectionMotion}>
        <motion.header className="pricing-header" variants={fadeUp}>
          <span className="pricing-header__eyebrow text-label">{t('eyebrow')}</span>
          <h2 className="pricing-header__title text-h2">{t('headline')}</h2>
          <p className="pricing-header__beta text-body">{t('betaBadge')}</p>
        </motion.header>

        <div className="pricing-cards">
          <div className="pricing-glow" aria-hidden="true">
            {/* Inline blurred purple blob (was under-card.svg) — drifts with cursor. */}
            <svg
              ref={glowRef}
              width="1454"
              height="1427"
              viewBox="0 0 1454 1427"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: `translate(${glow.x}px, ${glow.y}px)` }}
            >
              <g filter="url(#pricing-glow-blur)">
                <path d="M692.717 598.061C841.297 746.64 1188.33 546.524 998.679 736.179C809.024 925.833 730.134 1122.88 581.554 974.298C432.974 825.718 305.761 678.706 495.416 489.051C685.071 299.396 544.138 449.481 692.717 598.061Z" fill="url(#pricing-glow-grad)" fillOpacity="0.6" />
              </g>
              <defs>
                <filter id="pricing-glow-blur" x="0" y="0" width="1453.99" height="1426.46" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur" />
                </filter>
                <linearGradient id="pricing-glow-grad" x1="624.563" y1="607.303" x2="870.053" y2="852.793" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8642FF" />
                  <stop offset="1" stopColor="#502899" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {PLANS.map((plan) => (
            <PlanCard key={plan} plan={plan} />
          ))}
        </div>

        <motion.p className="pricing-note text-body-sm" variants={fadeUp}>
          {t('note')}
        </motion.p>
      </motion.div>
    </section>
  )
}
