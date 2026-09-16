import { useTranslation } from 'react-i18next'
import { useLocale } from '../../hooks/useLocale'
import { APP_URL } from '../../lib/urls'
import { SiteNavigation } from '../SiteNavigation/SiteNavigation'
import './Navbar.css'

export default function Navbar() {
  const { t } = useTranslation('common')
  const { localePath } = useLocale()

  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <a href={localePath('/')} className="navbar__logo" aria-label="Naura home">Naura</a>

        <SiteNavigation className="navbar__nav" linkClassName="navbar__link text-body-ui" />

        <div className="navbar__actions">
          <a href={APP_URL} className="navbar__btn navbar__btn--secondary text-body-sm">{t('cta.signIn')}</a>
          <a href={APP_URL} className="navbar__btn navbar__btn--primary text-body-sm">{t('cta.getStarted')}</a>
        </div>
      </div>
    </header>
  )
}
