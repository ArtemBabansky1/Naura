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
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  const locale = getLocaleFromPath(pathname)

  const localePath = useCallback(
    (path) => withLocalePath(path, locale),
    [locale],
  )

  const switchLocale = useCallback(() => {
    const next = locale === DEFAULT_LOCALE ? LOCALE_PREFIX : DEFAULT_LOCALE
    navigate({ pathname: switchLocalePath(pathname, next), search, hash })
  }, [locale, navigate, pathname, search, hash])

  return {
    locale,
    localePath,
    switchLocale,
    isRu: locale === LOCALE_PREFIX,
    basePath: stripLocalePrefix(pathname),
  }
}
