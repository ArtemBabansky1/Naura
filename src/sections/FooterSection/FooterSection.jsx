import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './FooterSection.css'

export default function FooterSection({ onOpenLegal }) {
  const { t } = useTranslation('footer')
  const sectionRef = useRef(null)

  const productLinks = [
    { key: 'home', href: '#hero' },
    { key: 'businessCards', href: '#features' },
    { key: 'communities', href: '#communities' },
    { key: 'blog', href: '#' },
  ]

  return (
    <footer id="footer" data-section="footer" ref={sectionRef} className="footer-section">
      <div className="footer-panel">
        <div className="footer-content">
          <div className="footer-brand">
            <svg
              className="footer-brand__logo"
              width="364"
              height="162"
              viewBox="0 0 364 162"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Naura"
            >
              <path
                d="M2.39341e-05 4.95424L27.5377 4.95424C27.5377 4.95424 27.4395 79.3259 27.4395 121.926C26.7113 122.518 28.1407 121.352 27.4395 121.926C43.569 108.815 68.5885 88.8373 95.1568 71.3043C121.687 53.7965 152.256 36.0878 183.958 22.7157C215.532 9.39743 249.118 0.000113482 281.447 0C308.503 2.07973e-06 329.5 10.1614 343.486 25.6043C357.186 40.7317 363.735 60.381 364 79.5512V162H336.464V79.8454L336.431 78.4579C335.936 64.1353 330.868 50.5573 321.952 40.7128C313.035 30.8664 299.873 24.238 281.447 24.238C254.854 24.2381 225.521 32.0614 195.858 44.5733C166.322 57.0317 137.335 73.7639 111.676 90.6968C86.0559 107.604 70.3727 116.547 48.3634 137.259C38.58 146.466 25.4947 162 25.4947 162H0L2.39341e-05 4.95424Z"
                fill="url(#footer-logo-grad)"
              />
              <defs>
                <linearGradient
                  id="footer-logo-grad"
                  x1="182"
                  y1="0"
                  x2="182"
                  y2="146.195"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#8642FF" />
                  <stop offset="1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <nav className="footer-col footer-col--product" aria-label={t('product.heading')}>
            <h3 className="footer-col__heading">{t('product.heading')}</h3>
            <ul className="footer-col__list">
              {productLinks.map(({ key, href }) => (
                <li key={key}>
                  <a href={href} className="footer-link">{t(`product.links.${key}`)}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-col footer-col--contacts">
            <h3 className="footer-col__heading">{t('contacts.heading')}</h3>
            <ul className="footer-col__list">
              <li><a href="mailto:hello@naura.io" className="footer-link">{t('contacts.email')}</a></li>
              <li><a href="https://t.me/naura_crm" className="footer-link">{t('contacts.telegram')}</a></li>
            </ul>
          </div>

          <ul className="footer-col__list footer-legal">
            <li><button type="button" className="footer-link" onClick={() => onOpenLegal?.('privacy')}>{t('legal.privacy')}</button></li>
            <li><button type="button" className="footer-link" onClick={() => onOpenLegal?.('terms')}>{t('legal.terms')}</button></li>
          </ul>

          <p className="footer-copy text-body-sm">{t('legal.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
