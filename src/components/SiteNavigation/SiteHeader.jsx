import { useLocale } from "../../hooks/useLocale"
import { useSiteNavigation } from "../../hooks/useSiteNavigation"
import { SiteNavigation } from "./SiteNavigation"
import { SiteMenu } from "./SiteMenu"
import { APP_URL } from "../../lib/urls"
import "./SiteHeader.css"

export function SiteHeader({ className = "", brand = "Naura", brandLabel = "Naura home", action, children }) {
  const { homeHref, t } = useSiteNavigation()
  const { isRu, switchLocale } = useLocale()
  return (
    <header className={`site-header ${className}`.trim()}>
      <div className="site-header__inner container">
        <a className="site-header__brand" href={homeHref} aria-label={brandLabel}>{brand}</a>
        <SiteNavigation className="site-header__links" />
        <div className="site-header__actions">
          <button type="button" className="site-header__language" onClick={switchLocale} aria-label={t("nav.language")}>{isRu ? "EN" : "RU"}</button>
          {action || <a className="site-header__start" href={APP_URL}>{t("cta.getStarted")}</a>}
          <SiteMenu />
        </div>
      </div>
      {children}
    </header>
  )
}
