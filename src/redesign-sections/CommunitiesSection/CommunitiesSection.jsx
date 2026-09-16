import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import { fadeUp, staggerContainer, viewportConfig } from '../../lib/framer'
import { APP_URL } from '../../lib/urls'
import { ConnectionLines, CardButton } from '../../components/CardDesign/CardDesign'
import { RevealCopy, RevealTitle } from '../../components/ScrollReveal/ScrollReveal'
import DirectoryMockup from './DirectoryMockup'
import './CommunitiesSection.css'

// Bullet order drives the 01–04 step number shown in the right panel.
const BULLETS = ['directory', 'events', 'askIntro', 'adminControls']

export default function CommunitiesSection() {
  const { t } = useTranslation('communities')
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
          <ConnectionLines />

          {/* ── Left column: header → bullets → buttons (pinned bottom) ── */}
          <motion.div className="communities-left" variants={fadeUp}>
            <header className="communities-header">
              <RevealTitle as="h2" className="communities-header__title text-h2" text={t('headline')} />
              <RevealCopy as="p" className="communities-header__subtitle text-body-lg" delay={0.12}>{t('subtitle')}</RevealCopy>
            </header>

            <div className="communities-bullets">
              {[BULLETS.slice(0, 2), BULLETS.slice(2)].map((row, i) => (
                <div className="communities-bullets__row" key={i}>
                  {row.map((key) => (
                    <div
                      key={key}
                      className="communities-pill"
                    >
                      <span className="communities-pill__title">{t(`features.${key}`)}</span>
                      <span className="communities-pill__sub">{t(`subtitles.${key}`)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="communities-actions">
              <CardButton href={APP_URL}>
                {t('features.forOrganizers')}
              </CardButton>
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
