import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AgentTerminal from './AgentTerminal'
import './AiAgentsSection.css'

/* ── Inline capability-orb glows ──────────────────────────────────────────
 * Each orb is a blurred gradient blob clipped to a circle. The three orbs
 * reuse identical Figma node structures, so every id (filter / gradient /
 * clipPath) is namespaced with a per-graphic prefix (read- / plan- / act-)
 * to avoid url(#id) collisions when all three mount in the same document. */

function OrbRead(props) {
  return (
    <svg width="370" height="370" viewBox="0 0 370 370" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#read-clip0)">
        <g filter="url(#read-filter0_f)">
          <path d="M218.616 226.125C322.945 121.796 242.015 -62.2971 333.878 29.5655C425.74 121.428 534.049 146.773 429.721 251.102C325.392 355.43 224.32 446.912 132.457 355.049C40.5949 263.187 114.288 330.454 218.616 226.125Z" fill="url(#read-paint0_linear)" />
        </g>
      </g>
      <defs>
        <filter id="read-filter0_f" x="-109.293" y="-195.35" width="781.719" height="788.221" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur" />
        </filter>
        <linearGradient id="read-paint0_linear" x1="216.678" y1="265.552" x2="389.054" y2="93.176" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8642FF" />
          <stop offset="1" stopColor="#502899" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="read-clip0">
          <rect width="370" height="370" rx="185" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function OrbPlan(props) {
  return (
    <svg width="411" height="411" viewBox="0 0 411 411" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#plan-clip0)">
        <g filter="url(#plan-filter0_f)">
          <path d="M99.6772 107.246C-11.8956 218.818 74.6537 415.694 -23.5874 317.453C-121.829 219.212 -237.658 192.107 -126.085 80.5346C-14.5126 -31.0382 93.5774 -128.872 191.818 -30.6308C290.06 67.6104 211.25 -4.32718 99.6772 107.246Z" fill="url(#plan-paint0_linear)" />
        </g>
      </g>
      <defs>
        <filter id="plan-filter0_f" x="-371.756" y="-271.078" width="808.225" height="815.178" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur" />
        </filter>
        <linearGradient id="plan-paint0_linear" x1="101.75" y1="65.0808" x2="-82.5945" y2="249.426" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8642FF" />
          <stop offset="1" stopColor="#502899" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="plan-clip0">
          <rect width="411" height="411" rx="205.5" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function OrbAct(props) {
  return (
    <svg width="370" height="370" viewBox="0 0 370 370" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#act-clip0)">
        <g filter="url(#act-filter0_f)">
          <path d="M107.995 195.672C245.489 333.785 488.892 227.433 367.281 348.499C245.671 469.565 211.873 612.551 74.3782 474.438C-63.1167 336.325 -183.652 202.552 -62.0418 81.4857C59.5685 -39.5801 -29.5003 57.5588 107.995 195.672Z" fill="url(#act-paint0_linear)" />
        </g>
      </g>
      <defs>
        <filter id="act-filter0_f" x="-312.242" y="-173.514" width="912.541" height="904.58" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur" />
        </filter>
        <linearGradient id="act-paint0_linear" x1="55.9224" y1="192.994" x2="283.097" y2="421.19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8642FF" />
          <stop offset="1" stopColor="#502899" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="act-clip0">
          <rect width="370" height="370" rx="185" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Three capability orbs (glow component + label/desc), keyed to i18n + asset.
const ORBS = [
  { key: 'read', Glow: OrbRead },
  { key: 'plan', Glow: OrbPlan },
  { key: 'act', Glow: OrbAct },
]

export default function AiAgentsSection() {
  const { t } = useTranslation('aiAgents')
  const sectionRef = useRef(null)
  const badges = t('privacyBadges', { returnObjects: true })

  return (
    <section
      id="ai-agents"
      data-section="ai-agents"
      ref={sectionRef}
      className="ai-agents-section section"
    >
      <div className="container ai-agents-grid">

        {/* ── Left panel: copy + capability orbs that bleed past the bottom ── */}
        <div className="ai-panel ai-panel--intro">
          <div className="ai-intro__top">
            <span className="text-label ai-intro__eyebrow">{t('eyebrow')}</span>
            <div className="ai-intro__privacy">
              <p className="ai-intro__privacy-title">{badges[0]}</p>
              <ul className="ai-intro__privacy-list">
                {badges.slice(1).map((badge) => (
                  <li key={badge}>{badge}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="ai-intro__title text-h2">
            {t('headline')}{' '}
            <span className="ai-intro__accent">{t('headlineAccent')}</span>
          </h2>
          <p className="ai-intro__subtitle">{t('subtitle')}</p>

          <div className="ai-orbs">
            {ORBS.map(({ key, Glow }) => (
              <figure key={key} className={`ai-orb ai-orb--${key}`}>
                <Glow className="ai-orb__glow" aria-hidden="true" draggable={false} />
                <figcaption className="ai-orb__text">
                  <span className="ai-orb__label">{t(`capabilities.${key}.label`)}</span>
                  <span className="ai-orb__desc">{t(`capabilities.${key}.description`)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* ── Right panel: a live, self-typing terminal chat (You ↔ Claude) ── */}
        <div className="ai-panel ai-panel--demo">
          <AgentTerminal />
        </div>

      </div>
    </section>
  )
}
