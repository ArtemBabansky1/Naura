import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import './DirectoryMockup.css'

// Optimized avatar pairs (replaces the 4 raster photos embedded in the old
// 901KB directory.svg). Decorative — the whole mockup is aria-hidden.
const AVIF = import.meta.glob('../../assets/people/*.avif', { eager: true, import: 'default' })
const WEBP = import.meta.glob('../../assets/people/*.webp', { eager: true, import: 'default' })
const pic = (n) => ({
  avif: AVIF[`../../assets/people/photo_${n}.avif`],
  webp: WEBP[`../../assets/people/photo_${n}.webp`],
})

// Photo → name genders verified against the actual assets:
// photo_1/5/10 are women, photo_13/4/18 are men.
const MEMBERS = [
  { photo: pic(1),  name: 'Maya Chen',   role: 'Product',   tag: 'SF' },
  { photo: pic(13), name: 'Leo Vance',   role: 'Founder',   tag: 'NYC' },
  { photo: pic(5),  name: 'Emma Hart',   role: 'Design',    tag: 'Remote' },
  { photo: pic(4),  name: 'Adrian Cole', role: 'Engineer',  tag: 'Austin' },
  { photo: pic(10), name: 'Sofia Lang',  role: 'Marketing', tag: 'Berlin' },
  { photo: pic(18), name: 'Daniel Reed', role: 'Investor',  tag: 'London' },
]

const FILTERS = ['All', 'Founders', 'Eng', 'Design', 'Investors']

// ── Motion: a staggered, block-by-block reveal (chrome → filters → cards, and
// inside each card avatar → name/role → pills). A parent variant only needs to
// declare staggerChildren; Framer propagates the visible/hidden state down. ──
const EASE = [0.16, 1, 0.3, 1]

const vMock = { hidden: {}, visible: { transition: { staggerChildren: 0.085, delayChildren: 0.07 } } }
const vRow = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
const vGrid = { hidden: {}, visible: { transition: { staggerChildren: 0.095, delayChildren: 0.05 } } }

const vFadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
const vSlideIn = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
}
const vPop = {
  hidden: { opacity: 0, scale: 0.2 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.48, ease: EASE } },
}
// Card animates itself AND staggers its own children once it lands.
const vCard = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: EASE, staggerChildren: 0.06, delayChildren: 0.12 },
  },
}

// Browser-window mockup of a member directory — chrome bar, filter pills, and a
// 3-column grid of member cards. The whole thing reveals block-by-block on view.
export default function DirectoryMockup() {
  const { t } = useTranslation('communities')
  const prefersReduced = useReducedMotion()
  const root = prefersReduced
    ? { initial: false, animate: 'visible' }
    : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.3 } }

  return (
    <motion.div className="dir-mock" aria-hidden="true" variants={vMock} {...root}>
      <motion.div className="dir-mock__chrome" variants={vRow}>
        <motion.span className="dir-mock__dots" variants={vRow}>
          <motion.i variants={vPop} />
          <motion.i variants={vPop} />
          <motion.i variants={vPop} />
        </motion.span>
        <motion.span className="dir-mock__title" variants={vSlideIn}>{t('features.directory')}</motion.span>
      </motion.div>

      <motion.div className="dir-mock__filters" variants={vRow}>
        {FILTERS.map((f, i) => (
          <motion.span key={f} className={`dir-pill${i === 0 ? ' is-active' : ''}`} variants={vFadeUp}>{f}</motion.span>
        ))}
      </motion.div>

      <motion.div className="dir-mock__grid" variants={vGrid}>
        {MEMBERS.map((m) => (
          <motion.article key={m.name} className="dir-card" variants={vCard}>
            <motion.picture className="dir-card__pic" variants={vPop}>
              <source srcSet={m.photo.avif} type="image/avif" />
              <source srcSet={m.photo.webp} type="image/webp" />
              <img className="dir-card__avatar" src={m.photo.webp} alt=""
                width="42" height="42" loading="lazy" decoding="async" />
            </motion.picture>
            <motion.div className="dir-card__id" variants={vFadeUp}>
              <span className="dir-card__name">{m.name}</span>
              <span className="dir-card__role">{m.role}</span>
            </motion.div>
            <motion.div className="dir-card__pills" variants={vRow}>
              <motion.span className="dir-pill" variants={vFadeUp}>{m.tag}</motion.span>
              <motion.span className="dir-pill is-active" variants={vFadeUp}>{t('introButton')}</motion.span>
            </motion.div>
          </motion.article>
        ))}
      </motion.div>
    </motion.div>
  )
}
