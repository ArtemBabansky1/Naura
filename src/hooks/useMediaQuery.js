import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query and re-render when it flips.
 *
 * Used to gate JS-driven work at responsive boundaries — e.g. NOT mounting the
 * Hero contact-web below 1200 (kills its GSAP ticker + rAF parallax) and
 * swapping the desktop nav for the burger below 768. CSS handles the *look*;
 * this hook handles the *mount/teardown* decisions CSS can't.
 *
 * Plain CSR (Vite) — but we still guard `window` so it's SSR-safe and never
 * throws during the first synchronous render.
 *
 * @param {string} query - e.g. '(max-width: 767.98px)'
 * @returns {boolean} whether the query currently matches
 */
export function useMediaQuery(query) {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false

  const [matches, setMatches] = useState(getMatch)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    // Sync once in case the query changed between render and effect.
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Canonical breakpoint helpers — mirror the --bp-* tokens / @media literals. */
export const MOBILE_QUERY = '(max-width: 767.98px)'

/** Everything below the 1200 zoom boundary (tablet + phone). */
export const BELOW_DESKTOP_QUERY = '(max-width: 1199.98px)'
