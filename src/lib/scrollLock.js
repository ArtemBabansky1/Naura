/*
 * Cross-component scroll lock for overlays (the mobile burger drawer).
 *
 * Lenis drives scroll from its own rAF loop, so toggling `overflow:hidden` on
 * <body> does NOT stop it — we must call lenis.stop()/start() on the live
 * instance. useSmoothScroll registers it here. `overflow:hidden` is kept as the
 * fallback for the reduced-motion path (where no Lenis exists) and to block any
 * native rubber-band scroll behind the overlay.
 *
 * Reference-counted so nested/overlapping locks don't unlock early.
 */

let lenis = null
let locks = 0

/** Called by useSmoothScroll. Returns an unregister cleanup. */
export function registerLenis(instance) {
  lenis = instance
  return () => {
    if (lenis === instance) lenis = null
  }
}

export function lockScroll() {
  locks += 1
  if (locks > 1) return
  if (lenis) lenis.stop()
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

export function unlockScroll() {
  if (locks === 0) return
  locks -= 1
  if (locks > 0) return
  if (lenis) lenis.start()
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
}
