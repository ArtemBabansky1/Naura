import { useTranslation } from "react-i18next"
import { useLocale } from "../../hooks/useLocale"
import { MEETS_BOT_URL } from "../../lib/urls"
import { SiteNavigation } from "../../components/SiteNavigation/SiteNavigation"
import { SiteMenu } from "../../components/SiteNavigation/SiteMenu"
import { useSiteNavigation } from "../../hooks/useSiteNavigation"
import "./MeetsNav.css"

/* Naura Meets wordmark — horizontal lockup: the accent-orange "N" mark
 * followed by the MEETS letterforms (letters follow the text color). */
export function MeetsWordmark() {
  return (
    <svg
      className="meets-nav__logo-mark"
      width="366"
      height="75"
      viewBox="0 0 366 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M1.10465e-05 2.26305L12.7097 2.26305C12.7097 2.26305 12.6644 36.2353 12.6644 55.6947C12.3283 55.9651 12.988 55.4326 12.6644 55.6947C20.1088 49.7056 31.6562 40.58 43.9185 32.5711C56.1632 24.5737 70.2719 16.4845 84.9035 10.3763C99.4762 4.29265 114.978 5.18375e-05 129.898 0C142.386 9.49998e-07 152.077 4.64164 158.532 11.6958C164.855 18.6059 167.878 27.5815 168 36.3382V74H155.291V36.4726L155.276 35.8388C155.047 29.2964 152.708 23.0941 148.593 18.5972C144.477 14.0995 138.403 11.0717 129.898 11.0717C117.625 11.0717 104.086 14.6453 90.396 20.3606C76.7642 26.0515 63.3855 33.6946 51.5429 41.4294C39.7181 49.1525 32.4797 53.2377 22.3216 62.6987C17.8061 66.9043 11.7668 74 11.7668 74H0L1.10465e-05 2.26305Z" fill="#E83600" />
      <path d="M188.78 74H183.5V32H191.3L205.1 68.12H205.4L219.2 32H226.7V74H221.42V39.56H221.12L207.92 74H202.28L189.08 39.56H188.78V74Z" fill="currentColor" />
      <path d="M241.107 55.1V69.2H261.807V74H235.707V32H261.507V36.8H241.107V50.3H259.407V55.1H241.107Z" fill="currentColor" />
      <path d="M275.033 55.1V69.2H295.733V74H269.633V32H295.433V36.8H275.033V50.3H293.333V55.1H275.033Z" fill="currentColor" />
      <path d="M318.573 74H313.173V36.8H299.073V32H332.673V36.8H318.573V74Z" fill="currentColor" />
      <path d="M350.391 74.6C346.071 74.6 342.451 73.54 339.531 71.42C336.611 69.3 334.631 66.26 333.591 62.3L338.391 61.46C340.151 67.02 344.151 69.8 350.391 69.8C353.351 69.8 355.631 69.18 357.231 67.94C358.871 66.7 359.691 64.82 359.691 62.3C359.691 60.66 359.231 59.36 358.311 58.4C357.391 57.44 356.231 56.72 354.831 56.24C353.471 55.72 351.591 55.16 349.191 54.56C346.311 53.88 343.971 53.18 342.171 52.46C340.371 51.7 338.831 50.56 337.551 49.04C336.311 47.48 335.691 45.36 335.691 42.68C335.691 40.36 336.291 38.36 337.491 36.68C338.731 34.96 340.411 33.66 342.531 32.78C344.691 31.86 347.111 31.4 349.791 31.4C353.751 31.4 357.031 32.38 359.631 34.34C362.231 36.3 363.951 39.02 364.791 42.5L359.991 43.34C358.751 38.58 355.351 36.2 349.791 36.2C347.191 36.2 345.091 36.74 343.491 37.82C341.891 38.9 341.091 40.52 341.091 42.68C341.091 44.28 341.551 45.56 342.471 46.52C343.391 47.48 344.531 48.2 345.891 48.68C347.251 49.16 349.111 49.7 351.471 50.3C354.391 51.02 356.751 51.74 358.551 52.46C360.351 53.18 361.891 54.34 363.171 55.94C364.451 57.5 365.091 59.62 365.091 62.3C365.091 66.18 363.771 69.2 361.131 71.36C358.531 73.52 354.951 74.6 350.391 74.6Z" fill="currentColor" />
    </svg>
  )
}

/* Static nav inside the hero stage — same grid recipe as the landing's
 * hero-nav (logo | centered links | actions). */
export default function MeetsNav() {
  const { t, i18n } = useTranslation("meets")
  const { switchLocale } = useLocale()
  const { homeHref } = useSiteNavigation()

  return (
    <div className="meets-nav">
      <a
        href={homeHref}
        className="meets-nav__logo"
        aria-label="Naura home"
      >
        <MeetsWordmark />
      </a>

      <SiteNavigation className="meets-nav__links" linkClassName="meets-nav__link" />

      <div className="meets-nav__actions">
        <button
          type="button"
          className="meets-nav__lang"
          onClick={switchLocale}
          aria-label="Switch language"
        >
          {i18n.language === "en" ? "RU" : "EN"}
        </button>
        {/* Organizer funnel moved up from the hero content — at ≥1200 the nav
            carries both CTAs, so the hero's bottom pair is hidden (the nav is
            static inside the hero: both used to sit on one screen). */}
        <a
          href="#meets-communities"
          className="meets-btn meets-btn--ghost meets-nav__community"
        >
          {t("nav.community")}
        </a>
        <a
          href={MEETS_BOT_URL}
          className="meets-btn meets-btn--primary meets-nav__start"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("nav.start")}
        </a>
        <SiteMenu />
      </div>
    </div>
  )
}
