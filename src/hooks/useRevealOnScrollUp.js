import { useEffect, useState } from 'react'

// Distance the user must scroll UP before the floating nav flies in.
const REVEAL_THRESHOLD = 100

// While the hero (first screen, which already has its own static nav) is still
// within this many px of the top, the floating nav stays hidden.
const HERO_VISIBLE_MARGIN = 80

/**
 * Reveals a floating element when the user scrolls up by REVEAL_THRESHOLD px.
 * Hides it again on any downward scroll, and keeps it hidden while the hero
 * section is still on screen.
 *
 * @param {string} heroId - id of the first-screen section to suppress against
 * @returns {boolean} whether the floating element should be visible
 */
export function useRevealOnScrollUp(heroId = 'hero') {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let upDistance = 0
    const hero = document.getElementById(heroId)

    function onScroll() {
      const y = window.scrollY
      const delta = y - lastY
      lastY = y

      // First screen still in view → suppress (its own nav is showing).
      const heroVisible = hero
        ? hero.getBoundingClientRect().bottom > HERO_VISIBLE_MARGIN
        : y < window.innerHeight
      if (heroVisible) {
        upDistance = 0
        setIsVisible(false)
        return
      }

      if (delta < 0) {
        upDistance += -delta
        if (upDistance >= REVEAL_THRESHOLD) setIsVisible(true)
      } else if (delta > 0) {
        upDistance = 0
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [heroId])

  return isVisible
}
