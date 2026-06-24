import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

/**
 * Wraps GSAP animations in gsap.context() for safe scoping + auto-cleanup.
 *
 * Usage:
 *   const ref = useGsap(() => {
 *     gsap.from('.card', { opacity: 0, y: 40, stagger: 0.1 })
 *   }, [])
 *   return <section ref={ref}>...</section>
 */
export function useGsap(animateFn, deps = []) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => animateFn(), ref)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
