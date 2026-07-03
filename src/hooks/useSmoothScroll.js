import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { registerLenis } from '../lib/scrollLock'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'
import { TOUCH_DEVICE_QUERY } from './useMediaQuery'

/**
 * Site-wide smooth (inertial) scrolling via Lenis, wired to GSAP ScrollTrigger
 * so pinned/scrubbed triggers read Lenis's eased scroll position (not the raw
 * native scrollY) and stay measured against the real document height.
 *
 * Desktop-only: on touch devices Lenis doesn't smooth anyway (syncTouch off),
 * but its non-passive touchstart/touchmove listeners on window force every
 * finger move through the main thread before the compositor may scroll — the
 * root cause of janky finger-scrolling. There we keep native scrolling and let
 * ScrollTrigger drive itself. Also disabled under prefers-reduced-motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchDevice = window.matchMedia(TOUCH_DEVICE_QUERY).matches
    if (prefersReduced || isTouchDevice) {
      // No Lenis: native scroll feeds ScrollTrigger directly. Still re-measure
      // triggers once everything (lazy chunks, fonts) has settled.
      const onLoad = () => scheduleScrollRefresh()
      window.addEventListener('load', onLoad)
      scheduleScrollRefresh()
      return () => window.removeEventListener('load', onLoad)
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    // Expose this instance to the shared scroll lock so overlays (mobile drawer)
    // can freeze the page with lenis.stop() — overflow:hidden alone won't.
    const unregisterLenis = registerLenis(lenis)

    // Push Lenis's eased scroll position into ScrollTrigger every frame it moves.
    lenis.on('scroll', ScrollTrigger.update)

    // One RAF loop, owned by gsap.ticker (lagSmoothing off so Lenis stays smooth).
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // Recompute every trigger's start/end after the first layout settles and on
    // window load (covers fonts + late reflow from lazy sections). Coalesced
    // through the shared scheduler with the per-section mount refreshes.
    const refresh = () => scheduleScrollRefresh()
    window.addEventListener('load', refresh)

    // Initial settle: rAF twice so lazy/Suspense content + fonts get a frame.
    let raf1
    let raf2
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(refresh)
    })

    return () => {
      window.removeEventListener('load', refresh)
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(1000, 16)
      unregisterLenis()
      lenis.destroy()
    }
  }, [])
}
