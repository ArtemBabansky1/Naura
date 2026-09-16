import { useEffect } from "react"
import { useLocation } from "react-router-dom"

// A deep link can arrive before a lazy section and the content above it have
// mounted. Keep its position aligned during initial layout, then yield as soon
// as the visitor interacts with the page.
export function HashNavigation() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return undefined
    let id
    try { id = decodeURIComponent(hash.slice(1)) } catch { return undefined }
    let stopped = false
    let frame = 0
    const align = () => {
      if (stopped) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ behavior: "instant", block: "start" })
      })
    }
    const mutations = new MutationObserver(align)
    const resize = new ResizeObserver(align)
    const stop = () => {
      stopped = true
      cancelAnimationFrame(frame)
      mutations.disconnect()
      resize.disconnect()
      window.removeEventListener("load", align)
      for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
        window.removeEventListener(event, stop)
      }
    }
    mutations.observe(document.body, { childList: true, subtree: true })
    resize.observe(document.body)
    window.addEventListener("load", align)
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      window.addEventListener(event, stop, { passive: true })
    }
    document.fonts?.ready.then(align)
    align()
    const timer = window.setTimeout(stop, 8000)
    return () => { clearTimeout(timer); stop() }
  }, [pathname, hash])

  return null
}
