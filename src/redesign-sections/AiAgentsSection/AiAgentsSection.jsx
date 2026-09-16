import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AgentTerminal from './AgentTerminal'
import { RevealCopy, RevealWords } from '../../components/ScrollReveal/ScrollReveal'
import './AiAgentsSection.css'

// Three capability cards (Read / Plan / Act), keyed to i18n.
const CAPABILITIES = ['read', 'plan', 'act']

export default function AiAgentsSection() {
  const { t } = useTranslation('aiAgents')
  const sectionRef = useRef(null)
  const badges = t('privacyBadges', { returnObjects: true })
  const headline = t('headline')
  const headlineAccent = t('headlineAccent')
  const headlineWordCount = headline.split(/ +/).filter(Boolean).length

  return (
    <section
      id="ai-agents"
      data-section="ai-agents"
      ref={sectionRef}
      className="ai-agents-section section"
    >
      <div className="container ai-agents-grid">

        {/* ── Left panel: copy + capability cards pinned to the bottom ── */}
        <div className="ai-panel ai-panel--intro">
          <div className="ai-intro__top">
            <div className="ai-intro__privacy">
              <ul className="ai-intro__privacy-list">
                {badges.slice(1).map((badge) => (
                  <li key={badge}>{badge}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="ai-intro__title text-h2" aria-label={`${headline} ${headlineAccent}`}>
            <RevealWords text={headline} ariaHidden />{' '}
            <span className="ai-intro__accent" aria-hidden="true">
              <RevealWords text={headlineAccent} delay={headlineWordCount * 0.065} ariaHidden />
            </span>
          </h2>
          <RevealCopy as="p" className="ai-intro__subtitle" delay={0.12}>{t('subtitle')}</RevealCopy>

          <div className="ai-caps">
            {CAPABILITIES.map((key) => (
              <div key={key} className="ai-cap">
                <h3 className="ai-cap__label">{t(`capabilities.${key}.label`)}</h3>
                <p className="ai-cap__desc">{t(`capabilities.${key}.description`)}</p>
              </div>
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
