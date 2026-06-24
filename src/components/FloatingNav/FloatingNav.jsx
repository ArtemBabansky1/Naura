import { useTranslation } from 'react-i18next'
import { useRevealOnScrollUp } from '../../hooks/useRevealOnScrollUp'
import './FloatingNav.css'

/**
 * Floating navigation that flies in from below when the user scrolls up.
 * Four separate shapes butted together (0px gap): a left rectangle holding the
 * logo + links, a circular language toggle and two buttons. The lang toggle and
 * "Sign in" are ghost (black + gray border); "Get started" stays solid purple.
 */
export default function FloatingNav() {
  const { t, i18n } = useTranslation('hero')
  const isVisible = useRevealOnScrollUp('hero')
  const tab = isVisible ? 0 : -1

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en')
  }

  return (
    <div
      className={`float-nav${isVisible ? ' float-nav--visible' : ''}`}
      aria-hidden={!isVisible}
    >
      <div className="float-nav__row">
        {/* Left rectangle — logo + links */}
        <div className="float-nav__bar">
          <a href="#hero" className="float-nav__logo" aria-label="Naura home">
            <svg
              className="float-nav__logo-img"
              width="43"
              height="19"
              viewBox="0 0 43 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2.78903e-06 0.571325L3.20894 0.571325C3.20894 0.571325 3.19751 9.1479 3.19751 14.0606C3.11265 14.1289 3.27922 13.9944 3.19751 14.0606C5.07707 12.5486 7.99256 10.2448 11.0886 8.22285C14.1801 6.20384 17.7422 4.16166 21.4364 2.61958C25.1158 1.08372 29.0295 1.30868e-05 32.7968 0C35.9496 2.39835e-07 38.3963 1.17182 40.0261 2.9527C41.6226 4.6972 42.3857 6.96317 42.4166 9.17388V18.6819H39.2079V9.20781L39.204 9.04781C39.1464 7.39611 38.5558 5.83029 37.5169 4.69502C36.4777 3.55953 34.944 2.79514 32.7968 2.79514C29.6979 2.79515 26.2797 3.69734 22.8232 5.14021C19.3814 6.57692 16.0036 8.50649 13.0136 10.4592C10.028 12.409 8.20047 13.4403 5.63575 15.8288C4.4957 16.8905 2.97088 18.6819 2.97088 18.6819H0L2.78903e-06 0.571325Z"
                fill="white"
              />
            </svg>
          </a>
          <nav className="float-nav__links" aria-label={t('nav.ariaLabel')}>
            <a href="#features" className="float-nav__link">{t('nav.businessCards')}</a>
            <a href="#communities" className="float-nav__link">{t('nav.communities')}</a>
            <a href="#" className="float-nav__link">{t('nav.blog')}</a>
            <a href="#" className="float-nav__link">{t('nav.about')}</a>
          </nav>
        </div>

        {/* Circle — language toggle */}
        <button
          type="button"
          className="float-nav__lang"
          onClick={toggleLang}
          tabIndex={tab}
          aria-label="Switch language"
        >
          {i18n.language === 'en' ? 'RU' : 'EN'}
        </button>

        {/* Two buttons */}
        <a href="#" className="float-nav__btn float-nav__btn--ghost" tabIndex={tab}>
          {t('nav.signIn')}
        </a>
        <a href="#" className="float-nav__btn" tabIndex={tab}>
          {t('nav.getStarted')}
        </a>
      </div>
    </div>
  )
}
