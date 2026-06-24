import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportConfig } from '../../lib/framer'
import UnicornScene from '../../components/UnicornScene/UnicornScene'
import DirectoryMockup from './DirectoryMockup'
import './CommunitiesSection.css'

// Bullet order drives the 01–04 step number shown in the right panel.
const BULLETS = ['directory', 'events', 'askIntro', 'adminControls']

export default function CommunitiesSection() {
  const { t } = useTranslation('communities')
  const [activeKey, setActiveKey] = useState('askIntro')
  const prefersReduced = useReducedMotion()

  const frameMotion = prefersReduced
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <section id="communities" data-section="communities" className="communities-section section">
      <div className="container">
        <motion.div className="communities-frame" {...frameMotion}>
          <UnicornScene className="communities-unicorn" />

          {/* ── Left column: header → bullets → buttons (pinned bottom) ── */}
          <motion.div className="communities-left" variants={fadeUp}>
            <header className="communities-header">
              <span className="communities-header__eyebrow text-label">{t('eyebrow')}</span>
              <h2 className="communities-header__title text-h2">{t('headline')}</h2>
              <p className="communities-header__subtitle text-body-lg">{t('subtitle')}</p>
            </header>

            <div className="communities-bullets">
              {[BULLETS.slice(0, 2), BULLETS.slice(2)].map((row, i) => (
                <div className="communities-bullets__row" key={i}>
                  {row.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={['communities-pill', activeKey === key ? 'is-active' : ''].join(' ')}
                      aria-pressed={activeKey === key}
                      onClick={() => setActiveKey(key)}
                    >
                      <span className="communities-pill__title">{t(`features.${key}`)}</span>
                      <span className="communities-pill__sub">{t(`subtitles.${key}`)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="communities-actions">
              <a href="#" className="communities-btn communities-btn--primary">
                {t('features.forOrganizers')}
              </a>
              <a href="#" className="communities-btn communities-btn--ghost">
                {t('seeProduct')}
              </a>
            </div>
          </motion.div>

          {/* ── Right column: directory mockup, full frame height ── */}
          <motion.div className="communities-visual" variants={fadeUp} aria-hidden="true">
            <DirectoryMockup />
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}
