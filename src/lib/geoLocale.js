// Countries whose visitors get the Russian locale by default (ISO 3166-1 alpha-2).
const RU_LOCALE_COUNTRIES = new Set(["RU", "BY", "KZ"])

// Free geo-IP endpoint: no key, CORS-enabled, returns {"country":"RU","ip":"..."}.
const GEO_ENDPOINT = "https://get.geojs.io/v1/ip/country.json"
const GEO_TIMEOUT_MS = 2000

// Set once the geo check has completed, so we never override a later manual
// locale switch. Holds the detected country code for debugging.
export const GEO_CHECKED_KEY = "naura-geo-country"

export const shouldRunGeoDetect = () => {
  if (typeof window === "undefined") return false
  try {
    return !window.localStorage.getItem(GEO_CHECKED_KEY)
  } catch {
    // localStorage unavailable (privacy mode) — a redirect we can't remember
    // would repeat on every visit, so skip detection entirely.
    return false
  }
}

export const markGeoChecked = (countryCode) => {
  try {
    window.localStorage.setItem(GEO_CHECKED_KEY, countryCode)
  } catch {
    // Ignore: worst case the check re-runs next visit.
  }
}

export const fetchCountryCode = async () => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS)

  try {
    const response = await fetch(GEO_ENDPOINT, { signal: controller.signal })
    if (!response.ok) return null
    const data = await response.json()
    return typeof data.country === "string" ? data.country.toUpperCase() : null
  } catch {
    // Network error, timeout or ad-blocker — fall back to the default locale.
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const isRuLocaleCountry = (countryCode) => RU_LOCALE_COUNTRIES.has(countryCode)
