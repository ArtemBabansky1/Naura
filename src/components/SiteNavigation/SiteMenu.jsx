import { useEffect, useId, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { useSiteNavigation } from "../../hooks/useSiteNavigation"
import { SiteNavigation } from "./SiteNavigation"
import "./SiteMenu.css"

export function SiteMenu({ className = "" }) {
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const { t } = useSiteNavigation()
  const root = useRef(null)
  const trigger = useRef(null)
  const menuId = useId()

  useEffect(() => setOpen(false), [pathname, hash])
  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    const media = window.matchMedia("(min-width: 1200px)")
    const onResize = () => { if (media.matches) setOpen(false) }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("focusin", closeOutside)
    document.addEventListener("keydown", onKeyDown)
    media.addEventListener("change", onResize)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("focusin", closeOutside)
      document.removeEventListener("keydown", onKeyDown)
      media.removeEventListener("change", onResize)
    }
  }, [open])

  return (
    <div className={`site-menu ${className}`.trim()} ref={root}>
      <button ref={trigger} className="site-menu__toggle" type="button" aria-label={t(open ? "nav.menuClose" : "nav.menuOpen")} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d={open ? "M5 5l14 14M19 5L5 19" : "M3 7h18M3 17h18"} />
        </svg>
      </button>
      {open && (
        <div className="site-menu__panel" id={menuId}>
          <SiteNavigation className="site-menu__links" onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
