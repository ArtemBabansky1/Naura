import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LOCALE_PREFIX, getLocaleFromPath, withLocalePath } from "../../lib/locale"
import {
  fetchCountryCode,
  isRuLocaleCountry,
  markGeoChecked,
  shouldRunGeoDetect,
} from "../../lib/geoLocale"

// First-visit geo redirect: RU/BY/KZ visitors land on the /ru locale, everyone
// else stays on the default English locale. Runs once per browser — after that
// the URL and the manual locale switcher are the only sources of truth.
export const GeoLocaleRedirect = () => {
  const navigate = useNavigate()

  useEffect(() => {
    if (!shouldRunGeoDetect()) return undefined

    let cancelled = false

    const run = async () => {
      const country = await fetchCountryCode()
      // On failure the flag stays unset, so detection retries next visit.
      if (!country) return
      markGeoChecked(country)

      if (cancelled || !isRuLocaleCountry(country)) return

      const { pathname, search, hash } = window.location
      // Explicit /ru URLs are already where the visitor should be.
      if (getLocaleFromPath(pathname) === LOCALE_PREFIX) return

      navigate(`${withLocalePath(pathname, LOCALE_PREFIX)}${search}${hash}`, { replace: true })
    }

    run()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return null
}
