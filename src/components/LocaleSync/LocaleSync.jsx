import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getLocaleFromPath } from "../../lib/locale"

export const LocaleSync = () => {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    const locale = getLocaleFromPath(pathname)
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [pathname, i18n])

  return null
}
