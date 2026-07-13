import { useTranslation } from 'react-i18next'
import { useLocale } from '../../hooks/useLocale'
import { APP_URL } from '../../lib/urls'
import './Navbar.css'

export default function Navbar() {
  const { t } = useTranslation('common')
  const { localePath } = useLocale()

  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <a href={localePath('/')} className="navbar__logo" aria-label="Naura home">Naura</a>

        <nav className="navbar__nav" aria-label={t('nav.ariaLabel')}>
          <a href="#features" className="navbar__link text-body-ui">{t('nav.businessCards')}</a>
          <a href="#communities" className="navbar__link text-body-ui">{t('nav.communities')}</a>
          <a href="#" className="navbar__link text-body-ui">{t('nav.blog')}</a>
          <a href="#" className="navbar__link text-body-ui">{t('nav.about')}</a>
        </nav>

        <div className="navbar__actions">
          <a href={APP_URL} className="navbar__btn navbar__btn--secondary text-body-sm">{t('cta.signIn')}</a>
          <a href={APP_URL} className="navbar__btn navbar__btn--primary text-body-sm">{t('cta.getStarted')}</a>
        </div>
      </div>
    </header>
  )
}
