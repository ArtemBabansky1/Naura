import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useLocale } from "./useLocale"
import { isMeetsHost, siteHref, SITE_NAVIGATION, SITE_RESOURCES } from "../lib/siteNavigation"

export function useSiteNavigation() {
  const { t } = useTranslation("common")
  const { locale, basePath } = useLocale()
  const { hash } = useLocation()
  const hostname = window.location.hostname
  const pagePath = basePath === "/" && isMeetsHost(hostname) ? "/meets" : basePath
  const resolve = ({ id, path, hash: targetHash = "" }) => ({
    id,
    label: t(`nav.${id}`),
    href: siteHref(path, locale, hostname, targetHash),
    current: pagePath === path && (targetHash ? hash === targetHash : !hash || path !== "/")
      ? (targetHash ? "location" : "page")
      : undefined,
  })

  return {
    links: SITE_NAVIGATION.map(resolve),
    resources: SITE_RESOURCES.map(resolve),
    homeHref: siteHref("/", locale, hostname),
    t,
  }
}
