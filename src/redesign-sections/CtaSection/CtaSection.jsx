import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportConfig } from '../../lib/framer'
import { useDemoModal } from '../../components/DemoModal/DemoModalContext'
import './CtaSection.css'
import { ConnectionLines, CardButton } from '../../components/CardDesign/CardDesign'
import { RevealCopy, RevealTitle } from '../../components/ScrollReveal/ScrollReveal'

// Friendly, diverse faces for social proof — optimized AVIF + WebP pairs.
const AVIF = import.meta.glob('../../assets/people/*.avif', { eager: true, import: 'default' })
const WEBP = import.meta.glob('../../assets/people/*.webp', { eager: true, import: 'default' })
const pic = (n) => ({
  avif: AVIF[`../../assets/people/photo_${n}.avif`],
  webp: WEBP[`../../assets/people/photo_${n}.webp`],
})
const AVATARS = [pic(18), pic(23), pic(9), pic(5), pic(3)]

export default function CtaSection() {
  const { t } = useTranslation('cta')
  const { openDemo } = useDemoModal()
  const sectionRef = useRef(null)

  return (
    <section id="cta" data-section="cta" ref={sectionRef} className="cta-section">
      <ConnectionLines />
      <motion.div
        className="container cta-content"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={staggerContainer(0.1)}
      >
        <RevealTitle as="h2" className="cta-headline" text={t('headline')} accent={t('headline').split(/ +/).slice(-2).join(" ")} />

        <RevealCopy as="p" className="cta-subtitle text-body" delay={0.12}>{t('subtitle')}</RevealCopy>

        <CardButton onClick={openDemo}>{t('cta')}</CardButton>

        <motion.div className="cta-proof" variants={fadeUp}>
          <div className="cta-proof__avatars">
            {AVATARS.map((a, i) => (
              <picture key={a.webp} className="cta-proof__pic" style={{ zIndex: AVATARS.length - i }}>
                <source srcSet={a.avif} type="image/avif" />
                <source srcSet={a.webp} type="image/webp" />
                <img
                  src={a.webp}
                  alt=""
                  aria-hidden="true"
                  className="cta-proof__avatar"
                  width="30"
                  height="30"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            ))}
          </div>
          <span className="cta-proof__text text-body-sm">{t('socialProof')}</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
