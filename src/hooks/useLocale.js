import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  DEFAULT_LOCALE,
  LOCALE_PREFIX,
  getLocaleFromPath,
  stripLocalePrefix,
  switchLocalePath,
  withLocalePath,
} from "../lib/locale"

export const useLocale = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const locale = getLocaleFromPath(pathname)

  const localePath = useCallback(
    (path) => withLocalePath(path, locale),
    [locale],
  )

  const switchLocale = useCallback(() => {
    const next = locale === DEFAULT_LOCALE ? LOCALE_PREFIX : DEFAULT_LOCALE
    navigate(switchLocalePath(pathname, next))
  }, [locale, navigate, pathname])

  return {
    locale,
    localePath,
    switchLocale,
    isRu: locale === LOCALE_PREFIX,
    basePath: stripLocalePrefix(pathname),
  }
}
