import { useTranslation } from 'react-i18next'
import { APP_URL } from '../../lib/urls'
import './Navbar.css'

export default function Navbar() {
  const { t, i18n } = useTranslation('common')

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en')
  }

  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <a href="/" className="navbar__logo" aria-label="Naura home">Naura</a>

        <nav className="navbar__nav" aria-label={t('nav.ariaLabel')}>
          <a href="#features" className="navbar__link text-body-ui">{t('nav.businessCards')}</a>
          <a href="#communities" className="navbar__link text-body-ui">{t('nav.communities')}</a>
          <a href="#" className="navbar__link text-body-ui">{t('nav.blog')}</a>
          <a href="#" className="navbar__link text-body-ui">{t('nav.about')}</a>
        </nav>

        <div className="navbar__actions">
          <button type="button" className="navbar__lang text-body-sm" onClick={toggleLang} aria-label="Switch language">
            {i18n.language === 'en' ? 'RU' : 'EN'}
          </button>
          <a href={APP_URL} className="navbar__btn navbar__btn--secondary text-body-sm">{t('cta.signIn')}</a>
          <a href={APP_URL} className="navbar__btn navbar__btn--primary text-body-sm">{t('cta.getStarted')}</a>
        </div>
      </div>
    </header>
  )
}
