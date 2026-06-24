import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

/**
 * Vertical scroll parallax on the returned ref. Uses transform only (compositor-safe).
 *
 * @param {number} speed  Fraction of element height to shift. Negative = opposite scroll.
 *
 * Usage:
 *   const ref = useParallax(0.3)
 *   return <div ref={ref} className="will-change-transform">...</div>
 */
export function useParallax(speed = 0.3) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: speed * -100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    })
    return () => ctx.revert()
  }, [speed])

  return ref
}
