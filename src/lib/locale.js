export const LOCALES = ["en", "ru"]
export const DEFAULT_LOCALE = "en"
export const LOCALE_PREFIX = "ru"

export const getLocaleFromPath = (pathname) => {
  if (pathname === `/${LOCALE_PREFIX}` || pathname.startsWith(`/${LOCALE_PREFIX}/`)) {
    return LOCALE_PREFIX
  }
  return DEFAULT_LOCALE
}

export const stripLocalePrefix = (pathname) => {
  if (pathname === `/${LOCALE_PREFIX}`) return "/"
  if (pathname.startsWith(`/${LOCALE_PREFIX}/`)) {
    return pathname.slice(`/${LOCALE_PREFIX}`.length) || "/"
  }
  return pathname
}

export const withLocalePath = (path, locale) => {
  const normalized = path.startsWith("/") ? path : `/${path}`

  if (locale === LOCALE_PREFIX) {
    return normalized === "/" ? `/${LOCALE_PREFIX}` : `/${LOCALE_PREFIX}${normalized}`
  }

  return normalized
}

export const switchLocalePath = (pathname, locale) => withLocalePath(stripLocalePrefix(pathname), locale)
