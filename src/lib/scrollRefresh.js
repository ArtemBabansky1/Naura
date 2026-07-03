import { ScrollTrigger } from './gsap'

/*
 * Coalesced ScrollTrigger.refresh().
 *
 * Every lazy section refreshes triggers on mount, and useSmoothScroll refreshes
 * on settle/load. Each refresh() re-measures the whole document (forced reflow),
 * so a burst of section mounts used to cost 5-8 full reflows — a visible hitch
 * mid-scroll on phones. Funnel them all through one trailing-debounced call.
 */

const DEBOUNCE_MS = 150

let timer = 0

export function scheduleScrollRefresh() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = 0
    ScrollTrigger.refresh()
  }, DEBOUNCE_MS)
}
