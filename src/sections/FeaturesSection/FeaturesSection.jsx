import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportConfig } from '../../lib/framer'
import './FeaturesSection.css'

/* Decorative card graphics, inlined as JSX so each can be animated (slides
 * up + fades in) when its card scrolls into view. Each graphic is anchored
 * to a card edge and bleeds past it — the card's `overflow: clip` trims the
 * overflow. Gradient/clip ids are namespaced per graphic so multiple cards
 * can't collide. */
function HandshakeChain() {
  const { t } = useTranslation('features')
  const base = 'cards.handshake.chain'
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="516" height="168" fill="none" viewBox="0 0 516 168" className="hsc">
      {/* Left->right reveal masks for the connectors (a clip rect scaled in CSS,
          so dashes reveal in place without compressing). */}
      <defs>
        <clipPath id="hsc-wipe-solid"><rect className="hsc-wipe hsc-wipe--solid" x="99" y="39" width="96" height="18" /></clipPath>
        <clipPath id="hsc-wipe-dashed"><rect className="hsc-wipe hsc-wipe--dashed" x="307" y="39" width="96" height="18" /></clipPath>
      </defs>
      {/* gray base connectors — both present from the start (solid + dashed) */}
      <path className="hsc-base" stroke="#535353" strokeLinecap="round" strokeWidth="1.3" d="M100.5 47.9h93" />
      <path className="hsc-base" stroke="#535353" strokeDasharray="8.09 8.09" strokeLinecap="round" strokeWidth="1.3" d="M308.1 47.9h93.1" />
      {/* white fills load over the gray base left->right (gray -> white) */}
      <path className="hsc-fill--solid" clipPath="url(#hsc-wipe-solid)" stroke="#fff" strokeLinecap="round" strokeWidth="1.3" d="M100.5 47.9h93" />
      <path className="hsc-fill--dashed" clipPath="url(#hsc-wipe-dashed)" stroke="#fff" strokeDasharray="8.09 8.09" strokeLinecap="round" strokeWidth="1.3" d="M308.1 47.9h93.1" />

      {/* Stage 1 — You */}
      <g className="hsc-stage hsc-stage--1">
        <circle className="hsc-dot" cx="43.1" cy="43.1" r="43.1" fill="#8642ff" />
        <text className="hsc-initial" x="43.1" y="43.1" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="500" fill="#fff">{t(`${base}.you.initial`)}</text>
        <text className="hsc-name" x="43.1" y="118" textAnchor="middle" fontSize="13" fontWeight="500" fill="#fff">{t(`${base}.you.name`)}</text>
      </g>

      {/* Stage 2 — Anna */}
      <g className="hsc-stage hsc-stage--2">
        <circle className="hsc-dot" cx="250.8" cy="43.1" r="43.1" fill="#a16cff" />
        <text className="hsc-initial" x="250.8" y="43.1" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="500" fill="#fff">{t(`${base}.anna.initial`)}</text>
        <text className="hsc-name" x="250.8" y="118" textAnchor="middle" fontSize="13" fontWeight="500" fill="#fff">{t(`${base}.anna.name`)}</text>
        <text className="hsc-sub" x="250.8" y="143" textAnchor="middle" fontSize="12" fill="#535353">{t(`${base}.anna.sub`)}</text>
      </g>

      {/* Stage 3 — Head of Marketing */}
      <g className="hsc-stage hsc-stage--3">
        <circle className="hsc-dot" cx="458.5" cy="43.1" r="43.1" fill="#5d25c0" />
        <text className="hsc-initial" x="458.5" y="43.1" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="500" fill="#fff">{t(`${base}.target.initial`)}</text>
        <text className="hsc-name" x="458.5" y="118" textAnchor="middle" fontSize="13" fontWeight="500" fill="#fff">{t(`${base}.target.name`)}</text>
        <text className="hsc-sub" x="458.5" y="143" textAnchor="middle" fontSize="12" fill="#8642ff">{t(`${base}.target.sub`)}</text>
      </g>
    </svg>
  )
}

function DigitTwo() {
  return (
    <svg width="166" height="194" viewBox="0 0 166 194" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26.8004 232.329L3.89824 206.624L102.816 116.653C107.689 112.314 111.858 108.193 115.323 104.288C118.788 100.275 121.603 96.3701 123.769 92.5739C126.043 88.6692 127.721 84.8187 128.804 81.0225C129.887 77.1178 130.429 73.0504 130.429 68.8203C130.429 62.6379 129.292 57.2689 127.018 52.7134C124.852 48.0495 121.766 44.199 117.759 41.162C113.861 38.125 109.259 35.9015 103.953 34.4915C98.6471 32.973 92.908 32.2138 86.7358 32.2138C79.9139 32.2138 73.6334 33.1899 67.8943 35.1423C62.2635 37.0946 57.2824 39.9147 52.9511 43.6024C48.728 47.1818 45.1546 51.6288 42.2309 56.9435C39.4155 62.2582 37.4123 68.2237 36.2211 74.84L0 68.6576C2.27397 57.9197 5.9015 48.3206 10.8826 39.8604C15.972 31.2918 22.1983 24.079 29.5616 18.2219C37.0333 12.3649 45.5336 7.86364 55.0626 4.71818C64.6999 1.57273 75.1494 0 86.411 0C97.456 0 107.851 1.46427 117.597 4.3928C127.451 7.21286 135.951 11.4972 143.098 17.2458C150.245 22.8859 155.875 30.0987 159.99 38.8843C164.105 47.5614 166.054 57.7027 165.838 69.3084C165.838 76.467 164.809 83.3002 162.751 89.808C160.694 96.3159 158.041 102.444 154.793 108.193C151.652 113.833 148.079 119.093 144.072 123.974C140.066 128.747 136.005 133.031 131.89 136.827L26.8004 232.329ZM3.89824 239V206.624H166V239H3.89824Z" fill="#0A0A0A" />
    </svg>
  )
}

function McpIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="378" height="379" fill="none" viewBox="0 0 378 379">
      <path fill="#0a0a0a" d="M74.1 251.5h.1l72.8-40.9q1.5-.8 2-2.4l.4-1a2.3 2.3 0 0 0-2.2-3H145l-12.4-.8-42.5-1.2-36.9-1.5-34.1-1.8q-1.5 0-3.2-.4l-1-.3c-4.1-.8-7.8-3.2-10.3-6.5L1.7 188a6.5 6.5 0 0 1 1.5-9.4l1.8-1.2q3.5-2.2 7.5-1.9l6.7.6 24 1.6 35.9 2.5 26 1.5 38.6 4h4.8a1.8 1.8 0 0 0 1-3.2l-1-.8q-1.5-1.6-3.4-2.7l-35.3-24-40.2-26.6-21-15.3-8.6-5.8a22 22 0 0 1-5-4.6v-.1q-3.7-4.5-4.5-10.1l-.4-2.7A16 16 0 0 1 47 71.4l5 .3a12 12 0 0 1 6.7 2.5l12 9.3 30.1 23.3 39.2 28.9 4.3 3.6q1.5 1 3 0l.3-.1a1.5 1.5 0 0 0 .4-2l-2.2-3.8-21.4-38.6-22.7-39.2-4.8-7.7a70 70 0 0 1-8.4-20c-1.4-6.3.8-12.7 4.7-17.9l3.4-4.7a13 13 0 0 1 11.7-5l8 1.1a17 17 0 0 1 13 9.9l8.3 18.8 15.8 35.2 24.5 47.7 4 8q3.1 6.2 5 12.8l2 6.5 1 3a1.5 1.5 0 0 0 2.9-.4v-.9l2-26.9 3.7-33 3.6-42.5.8-7q.5-5 2.4-9.6l2.1-5.1q1.9-4.6 6-7.4l1.9-1.2a12.3 12.3 0 0 1 16.8 3.3l1.7 2.3q3.9 5.9 3 12.8L232.3 57l-8.8 45.8-5.3 28.1a2 2 0 0 0 3.5 1.9l3.2-3.2 15.5-20.6 26-32.6L278 63.4l12-12.8 3-2.6 2-1.7a18.5 18.5 0 0 1 26.8 4.2l.8 1.3a21 21 0 0 1 2.8 18l-1 3.4q-1.5 5.3-5 9.7L306 99.8l-13.8 18-20 26.8-11.9 20.5a1.7 1.7 0 0 0 1.7 2.5l2-.2 44.9-9.5 24.3-4.4 23.4-4a18 18 0 0 1 10.7 1.4l4.5 2a8 8 0 0 1 4 10.3l-1 2.5c-2 5-6.3 8.7-11.5 10l-22.7 5.6-36.4 7.2-54 12.8-.3.1q-.5.4 0 1v.1l.6.3 24 2.3 10.5.5h25.5l38.8 3q8.8.6 16.2 5.5l2 1.3q3 2 5.2 5l3.2 4.2a8.4 8.4 0 0 1-3 12.4l-7.2 3.8a25 25 0 0 1-16.9 2l-17-4-60.3-14.4-20.4-5-.6-.2h-1.3a1.2 1.2 0 0 0-.9 2.1l16.9 16.5 31.6 28.5 36.7 34.1q2.7 2.7 3.6 6.4l.4 1.7q.7 3.6-1.3 6.7l-.8 1a6 6 0 0 1-8.8 1.4L293 292.4l-13.4-11.8-30-25.2a1.5 1.5 0 0 0-2.3 1.2v.5q0 .8.3 1.2l6.7 9.7 32.6 49q4.3 6.6 5.2 14.3l.7 6.7a9 9 0 0 1-5.8 9.3l-2.4.8q-3.7 1.3-7.6.6h-.3c-4-.8-7.7-3-10.1-6.5l-17.9-25-22.3-34.2-17.1-29.2a1.7 1.7 0 0 0-3.2.7l-10.1 109.3a13 13 0 0 1-8.6 11.3l-.6.2a14.7 14.7 0 0 1-18.8-7.9l-.7-1.7a22 22 0 0 1-1.3-13.4l3.6-16.4 6-30.3 5-24.1 4.6-30 2.6-9.8v-.3q-.1-.5-.7-.5l-1 .2q-.7 0-1 .7L163 272.2l-34.4 46.4L103 346a10 10 0 0 1-12.2 2.1l-.4-.2a11.2 11.2 0 0 1-4.1-16.3l4.7-6.9 37.6-47.9 22.7-29.6 14.2-16.6q.5-.5.4-1.3v-1a.7.7 0 0 0-1-.6l-95 61.6q-4.8 3-10.6 4l-6.9.8A11 11 0 0 1 40 282.3l.2-2.4q.3-4 3.1-7l.6-.7.6-.4L74 251.4" className="m-item" />
    </svg>
  )
}

function WorkspacesMark() {
  return (
    <svg width="447" height="396" viewBox="0 0 447 396" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path className="wm-ring" d="M285.717 171.015C387.123 132.959 500.179 184.314 538.235 285.72C576.291 387.126 524.936 500.182 423.53 538.238C322.124 576.294 209.068 524.939 171.012 423.533C132.956 322.127 184.311 209.071 285.717 171.015ZM404.819 488.38C478.689 460.658 516.099 378.301 488.377 304.431C460.655 230.561 378.298 193.151 304.428 220.873C230.558 248.595 193.148 330.952 220.87 404.822C248.592 478.692 330.949 516.102 404.819 488.38Z" fill="#0A0A0A" />
      <path className="wm-arc wm-arc--1" d="M209.649 266.824C197.071 259.206 192.918 242.691 202.169 231.259C222.44 206.208 248.667 186.426 278.626 173.832C308.585 161.238 341.069 156.341 373.15 159.385C387.79 160.774 396.684 175.296 393.326 189.613V189.613C389.968 203.93 375.599 212.546 360.907 211.9C339.905 210.975 318.843 214.693 299.262 222.924C279.681 231.156 262.289 243.602 248.255 259.255C238.438 270.204 222.228 274.442 209.649 266.824V266.824Z" fill="#A16CFF" />
      <path className="wm-arc wm-arc--2" d="M186.138 369.571C171.487 370.835 158.396 359.945 159.126 345.258C160.288 321.903 165.618 298.94 174.863 277.462C180.678 263.955 197.228 259.945 209.824 267.534V267.534C222.42 275.123 226.212 291.444 221.088 305.228C216.843 316.65 214.076 328.57 212.856 340.694C211.383 355.325 200.79 368.307 186.138 369.571V369.571Z" fill="#5D25C0" />
    </svg>
  )
}

function RemindersCurve() {
  return (
    <svg width="377" height="246" viewBox="0 0 377 246" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* right background part — drawn first so it sits BEHIND the front icon */}
      <path className="rc-bg" stroke="url(#rc-paint0-linear)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" d="M362 309.925C362 251.458 327.301 197.154 292.603 171.13C304.008 162.573 313.129 151.336 319.157 138.414C325.185 125.492 327.935 111.283 327.163 97.0453C326.391 82.8072 322.121 68.979 314.731 56.7844C307.342 44.5898 297.06 34.4049 284.796 27.131" />
      {/* front person icon (head ring + shoulders) — drawn on top */}
      <path className="rc-front" stroke="url(#rc-paint0-linear)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" d="M292.589 327.288C292.589 290.477 277.966 255.174 251.937 229.145C225.908 203.116 190.605 188.493 153.795 188.493M153.795 188.493C116.984 188.493 81.681 203.116 55.652 229.145C29.623 255.174 15 290.477 15 327.288M153.795 188.493C201.703 188.493 240.541 149.655 240.541 101.747C240.541 53.8378 201.703 15 153.795 15C105.886 15 67.048 53.8378 67.048 101.747C67.048 149.655 105.886 188.493 153.795 188.493Z" />
      <defs>
        <linearGradient id="rc-paint0-linear" x1="188.5" y1="15" x2="188.5" y2="244" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A16CFF" />
          <stop offset="1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* Bento layout, two rows.
 * Row A: [md contact] [md handshake] [sm telegram]
 * Row B: [sm mcp]     [md workspaces][md reminders]
 * `media` picks the anchor/bleed treatment defined in the CSS.
 * `Graphic` is the inline SVG component rendered inside `.feature-card__media`.
 * Each card key maps to a translation node under features.cards.* */
const ROW_A = [
  { key: 'contactGraph', Graphic: null,            size: 'md', media: 'none' },
  { key: 'handshake',    Graphic: HandshakeChain,  size: 'md', media: 'chain' },
  { key: 'telegramBot',  Graphic: DigitTwo,        size: 'sm', media: 'corner-br' },
]

const ROW_B = [
  { key: 'mcpAgents',  Graphic: McpIllustration, size: 'sm', media: 'corner-bl' },
  { key: 'workspaces', Graphic: RemindersCurve,  size: 'md', media: 'mark' },
  { key: 'reminders',  Graphic: WorkspacesMark,  size: 'md', media: 'corner-br', chips: true },
]

function FeatureCard({ card }) {
  const { t } = useTranslation('features')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const base = `cards.${card.key}`
  const chips = card.chips ? t(`${base}.chips`, { returnObjects: true }) : null

  return (
    <motion.article
      ref={ref}
      variants={fadeUp}
      className={[
        'feature-card',
        `feature-card--${card.size}`,
        `feature-card--${card.key}`,
        `feature-card--media-${card.media}`,
        inView ? 'is-inview' : '',
      ].join(' ')}
    >
      <div className="feature-card__body">
        <span className="feature-card__label text-label">{t(`${base}.title`)}</span>
        <h3 className="feature-card__tagline text-h3">{t(`${base}.tagline`)}</h3>
        <p className="feature-card__desc text-body">{t(`${base}.description`)}</p>
      </div>

      {Array.isArray(chips) && chips.length > 0 && (
        <div className="feature-card__chips" aria-hidden="true">
          {chips.map((chip) => (
            <span key={chip} className="feature-card__chip text-body">{chip}</span>
          ))}
        </div>
      )}

      {card.Graphic && (
        <div className="feature-card__media" aria-hidden="true">
          <card.Graphic />
        </div>
      )}
    </motion.article>
  )
}

export default function FeaturesSection() {
  const { t } = useTranslation('features')
  const prefersReduced = useReducedMotion()

  const gridMotion = prefersReduced
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: viewportConfig,
        variants: staggerContainer(0.08),
      }

  return (
    <section id="features" data-section="features" className="features-section section">
      <div className="container">
        <header className="features-header">
          <span className="features-header__eyebrow text-label">{t('eyebrow')}</span>
          <h2 className="features-header__title text-h2">{t('headline')}</h2>
          <p className="features-header__subtitle text-body-lg">{t('subtitle')}</p>
        </header>

        <motion.div className="features-grid" {...gridMotion}>
          <div className="features-row features-row--a">
            {ROW_A.map((card) => (
              <FeatureCard key={card.key} card={card} />
            ))}
          </div>
          <div className="features-row features-row--b">
            {ROW_B.map((card) => (
              <FeatureCard key={card.key} card={card} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
