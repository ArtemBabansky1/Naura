import { useTranslation } from 'react-i18next'
import { useLocale } from '../../hooks/useLocale'
import HeroGraph from './HeroGraph'
import UnicornScene from '../../components/UnicornScene/UnicornScene'
import BurgerButton from '../../components/MobileNav/BurgerButton'
import { useMediaQuery, BELOW_DESKTOP_QUERY } from '../../hooks/useMediaQuery'
import { APP_URL } from '../../lib/urls'
import './HeroSection.css'

// Naura wordmark (was naura-logo.svg) — inline so it ships with the JS, no request.
function NauraWordmark() {
  return (
    <svg className="hero-nav__logo-img" width="223" height="19" viewBox="0 0 223 19"
      fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Naura">
      <path d="M87.2384 0.317636V18.4287H84.0296V5.0223C83.9479 5.08849 83.8647 5.15593 83.7798 5.2242C81.9003 6.73621 79.2458 8.7548 76.1499 10.7767C73.0583 12.7957 69.4963 14.8379 65.8021 16.38C62.1228 17.9159 58.2089 18.9996 54.4417 18.9996C51.2471 18.9995 48.7798 17.7967 47.1515 15.9795C45.557 14.2001 44.8144 11.8937 44.821 9.655C44.8277 7.41617 45.584 5.11264 47.1791 3.3364C48.8072 1.52344 51.2663 0.317651 54.4417 0.317636H87.2384ZM54.4417 3.11265C52.2965 3.11266 50.7534 3.89274 49.7065 5.05854C48.6266 6.26108 48.0351 7.92932 48.03 9.66219C48.0248 11.3952 48.6063 13.0605 49.681 14.2598C50.7218 15.4213 52.2684 16.2044 54.4417 16.2044C57.5405 16.2044 60.9588 15.3022 64.4154 13.8593C67.8571 12.4226 71.235 10.4931 74.225 8.54036C77.2105 6.59059 79.7795 4.63751 81.6028 3.17074C81.6269 3.15133 81.6508 3.13188 81.6747 3.11265H54.4417Z" fill="white" />
      <path d="M132.65 18.4287H129.441C129.441 18.4287 129.453 9.85209 129.453 4.9394C129.537 4.87113 129.371 5.00558 129.453 4.9394C127.573 6.4514 124.658 8.75524 121.562 10.7772C118.47 12.7962 114.908 14.8383 111.214 16.3804C107.534 17.9163 103.621 19 99.8533 19C96.7005 19 94.2537 17.8282 92.6239 16.0473C91.0275 14.3028 90.2644 12.0368 90.2334 9.82612V0.318086H93.4422V9.79219L93.4461 9.95219C93.5037 11.6039 94.0943 13.1697 95.1332 14.305C96.1724 15.4405 97.7061 16.2049 99.8533 16.2049C102.952 16.2048 106.37 15.3027 109.827 13.8598C113.269 12.4231 116.647 10.4935 119.637 8.54081C122.622 6.59103 124.45 5.5597 127.014 3.17119C128.154 2.10946 129.679 0.318086 129.679 0.318086H132.65V18.4287Z" fill="white" />
      <path d="M135.71 0.31767V18.4287H138.919V5.02224C139.001 5.08842 139.084 5.15587 139.169 5.22414C141.048 6.73614 143.703 8.75473 146.799 10.7766C149.89 12.7956 153.452 14.8378 157.146 16.3799C160.826 17.9158 164.74 18.9995 168.507 18.9995C171.701 18.9995 174.169 17.7967 175.797 15.9794C177.392 14.2 178.134 11.8936 178.128 9.65493C178.121 7.4161 177.365 5.11258 175.77 3.33633C174.141 1.52338 171.682 0.317587 168.507 0.317572L135.71 0.31767ZM168.507 3.11258C170.652 3.1126 172.195 3.89268 173.242 5.05848C174.322 6.26102 174.913 7.92925 174.919 9.66213C174.924 11.3951 174.342 13.0604 173.268 14.2597C172.227 15.4213 170.68 16.2043 168.507 16.2043C165.408 16.2043 161.99 15.3022 158.533 13.8593C155.091 12.4226 151.714 10.493 148.724 8.54029C145.738 6.59052 143.169 4.63744 141.346 3.17067C141.322 3.15127 141.298 3.13182 141.274 3.11258H168.507Z" fill="white" />
      <path d="M223 0.317379V18.4287H219.791V5.02204C219.709 5.08823 219.626 5.15567 219.541 5.22394C217.662 6.73595 215.007 8.75454 211.911 10.7764C208.82 12.7954 205.258 14.8376 201.564 16.3797C197.884 17.9156 193.97 18.9993 190.203 18.9993C187.009 18.9993 184.541 17.7965 182.913 15.9792C181.319 14.1998 180.576 11.8934 180.583 9.65474C180.589 7.41592 181.346 5.11239 182.941 3.33614C184.569 1.52319 187.028 0.317394 190.203 0.317379H223ZM190.203 3.11239C188.058 3.11241 186.515 3.89249 185.468 5.05828C184.388 6.26082 183.797 7.92907 183.792 9.66194C183.786 11.3949 184.368 13.0602 185.443 14.2595C186.483 15.4211 188.03 16.2041 190.203 16.2042C193.302 16.2042 196.72 15.302 200.177 13.8591C203.619 12.4224 206.997 10.4928 209.987 8.5401C212.972 6.59033 215.541 4.63725 217.364 3.17048C217.388 3.15107 217.412 3.13163 217.436 3.11239H190.203Z" fill="white" />
      <path d="M2.78903e-06 0.571325L3.20894 0.571325C3.20894 0.571325 3.19751 9.1479 3.19751 14.0606C3.11265 14.1289 3.27922 13.9944 3.19751 14.0606C5.07707 12.5486 7.99256 10.2448 11.0886 8.22285C14.1801 6.20384 17.7422 4.16166 21.4364 2.61958C25.1158 1.08372 29.0295 1.30868e-05 32.7968 0C35.9496 2.39835e-07 38.3963 1.17182 40.0261 2.9527C41.6226 4.6972 42.3857 6.96317 42.4166 9.17388V18.6819H39.2079V9.20781L39.204 9.04781C39.1464 7.39611 38.5558 5.83029 37.5169 4.69502C36.4777 3.55953 34.944 2.79514 32.7968 2.79514C29.6979 2.79515 26.2797 3.69734 22.8232 5.14021C19.3814 6.57692 16.0036 8.50649 13.0136 10.4592C10.028 12.409 8.20047 13.4403 5.63575 15.8288C4.4957 16.8905 2.97088 18.6819 2.97088 18.6819H0L2.78903e-06 0.571325Z" fill="white" />
    </svg>
  )
}

export default function HeroSection({ menuOpen, onMenuToggle }) {
  const { t, i18n } = useTranslation('hero')
  const { localePath, switchLocale } = useLocale()

  // Below the 1200 boundary (tablet + phone) the contact-web "паутина" is
  // removed entirely — not hidden. Not mounting HeroGraph tears down its GSAP
  // ticker + rAF parallax (INP/battery) and avoids the nodes overlapping on a
  // narrower stage. The animated purple background (UnicornScene) still runs.
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_QUERY)

  function toggleLang() {
    switchLocale()
  }

  // Break the headline after the first sentence so "net worth." stays on line one
  const [headlineLead, ...headlineRest] = t('headline').split('. ')
  const headlineTail = headlineRest.join('. ')

  return (
    <section id="hero" data-section="hero" className="hero-section">
      <div className="hero-stage">
        <UnicornScene className="hero-unicorn" eager />

        {/* Static nav inside the stage — not a fixed header */}
        <div className="hero-nav">
          <a href={localePath('/')} className="hero-nav__logo" aria-label="Naura home">
            <NauraWordmark />
          </a>
          <nav className="hero-nav__links" aria-label={t('nav.ariaLabel')}>
            <a href="#features" className="hero-nav__link">{t('nav.businessCards')}</a>
            <a href="#communities" className="hero-nav__link">{t('nav.communities')}</a>
            <a href="#" className="hero-nav__link">{t('nav.blog')}</a>
            <a href="#" className="hero-nav__link">{t('nav.about')}</a>
          </nav>
          <div className="hero-nav__actions">
            <button type="button" className="hero-nav__lang" onClick={toggleLang} aria-label="Switch language">
              {i18n.language === 'en' ? 'RU' : 'EN'}
            </button>
            <a href={APP_URL} className="hero-nav__btn hero-nav__btn--secondary">{t('nav.signIn')}</a>
            <a href={APP_URL} className="hero-nav__btn hero-nav__btn--primary">{t('nav.getStarted')}</a>
          </div>

          {/* Static burger (≤1199) — scrolls away with the hero, like the desktop
              bar. The floating scroll-up burger lives in MobileNav. */}
          {isBelowDesktop && (
            <BurgerButton
              open={menuOpen}
              onClick={onMenuToggle}
              className="hero-nav__burger"
              label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
              controls="mobile-nav-panel"
            />
          )}
        </div>

        <div className="hero-content">
          <h1 className="hero-content__headline">
            {headlineLead}.<br />
            {headlineTail}
          </h1>
          <p className="hero-content__subtitle">
            {t('subtitle')}
          </p>
          <div className="hero-content__cta">
            <a href={APP_URL} className="btn-hero btn-hero--primary">
              {t('cta.startFree')}
            </a>
            <a href={APP_URL} className="btn-hero btn-hero--ghost">
              <svg
                className="btn-hero__icon"
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.4" />
                <path d="M6.5 5.5L11 8L6.5 10.5V5.5Z" fill="currentColor" />
              </svg>
              {t('cta.seeDemo')}
            </a>
          </div>
        </div>

        {!isBelowDesktop && <HeroGraph />}
      </div>
    </section>
  )
}
