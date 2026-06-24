import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'

/**
 * Creates a ScrollTrigger scoped to a container ref. Cleans up on unmount.
 *
 * Usage:
 *   const ref = useScrollTrigger(({ trigger }) => ({
 *     trigger,
 *     start: 'top 80%',
 *     onEnter: () => gsap.to('.el', { opacity: 1 }),
 *   }), [])
 *   return <section ref={ref}>...</section>
 */
export function useScrollTrigger(configFn, deps = []) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create(configFn({ trigger: el, ScrollTrigger }))
    }, ref)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
