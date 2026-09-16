import { useTranslation } from 'react-i18next'
import { useDemoModal } from '../../components/DemoModal/DemoModalContext'
import { CardButton } from '../../components/CardDesign/CardDesign'
import { RevealCopy, RevealTitle } from '../../components/ScrollReveal/ScrollReveal'
import HeroGraph from './HeroGraph'
import { useMediaQuery, BELOW_DESKTOP_QUERY } from '../../hooks/useMediaQuery'
import './HeroSection.css'

export default function HeroSection() {
  const { t } = useTranslation('hero')
  const { openDemo } = useDemoModal()
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_QUERY)
  const [headlineLead, ...headlineRest] = t('headline').split('. ')
  const headlineTail = headlineRest.join('. ')
  return <section id="hero" data-section="hero" className="hero-section">
    <div className="hero-stage">
        <div className="hero-content">
          <RevealTitle
            as="h1"
            className="hero-content__headline"
            text={t('headline')}
            accent={headlineLead.split(/ +/).at(-1)}
            lines={[`${headlineLead}.`, headlineTail]}
          />
          <RevealCopy as="p" className="hero-content__subtitle" delay={0.12}>
            {t('subtitle')}
          </RevealCopy>
          <div className="hero-content__cta">
            <CardButton onClick={openDemo}>
              {t('cta.seeHowItWorks')}
            </CardButton>
          </div>
        </div>


      {!isBelowDesktop && <HeroGraph />}
    </div>
  </section>
}
