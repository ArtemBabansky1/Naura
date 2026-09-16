import { ChevronRight } from "../../components/ChevronRight/ChevronRight"
import { useEffect, useLayoutEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import createVisual from "../../assets/business-cards/journey-create-reference.webp"
import shareVisual from "../../assets/business-cards/journey-share-reference.webp"
import collectVisual from "../../assets/business-cards/journey-collect-reference.webp"
import "./BusinessCardsJourney.css"

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const JOURNEY_VISUALS = [createVisual, shareVisual, collectVisual]

export default function BusinessCardsJourney() {
  const { t } = useTranslation("businessCards")
  const rootRef = useRef(null)
  const pinRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const progressRef = useRef(null)
  const dragRef = useRef(null)
  const prefersReduced = useMediaQuery(REDUCED_QUERY)
  const mode = prefersReduced ? "static" : "native"
  const steps = t("journey.steps", { returnObjects: true })

  const scrollJourney = (direction) => {
    const viewport = viewportRef.current
    const track = trackRef.current
    const panel = track?.firstElementChild
    if (!viewport || !track || !panel) return
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0
    viewport.scrollBy({ left: direction * (panel.getBoundingClientRect().width + gap), behavior: "smooth" })
  }

  const handlePointerDown = (event) => {
    const viewport = viewportRef.current
    if (!viewport || event.pointerType !== "mouse" || event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: viewport.scrollLeft }
    viewport.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    const viewport = viewportRef.current
    const drag = dragRef.current
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return
    viewport.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX)
  }

  const stopPointerDrag = (event) => {
    const viewport = viewportRef.current
    const drag = dragRef.current
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId)
    dragRef.current = null
  }

  useLayoutEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollLeft = 0
  }, [mode])

  useEffect(() => {
    if (mode !== "native") return undefined
    const root = rootRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    const progress = progressRef.current
    if (!root || !viewport || !track || !progress) return undefined

    let raf = 0
    const update = () => {
      raf = 0
      const distance = Math.max(1, viewport.scrollWidth - viewport.clientWidth)
      const value = clamp(viewport.scrollLeft / distance)
      progress.style.transform = `scaleX(${value})`
      root.dataset.activeStep = String(Math.min(steps.length - 1, Math.round(value * (steps.length - 1))))
      root.dataset.journeyProgress = value.toFixed(3)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

      const maxScroll = viewport.scrollWidth - viewport.clientWidth
      const next = viewport.scrollLeft + event.deltaY
      const canMove = (event.deltaY < 0 && viewport.scrollLeft > 0) || (event.deltaY > 0 && viewport.scrollLeft < maxScroll)
      if (!canMove) return

      event.preventDefault()
      viewport.scrollLeft = clamp(next, 0, maxScroll)
    }

    viewport.addEventListener("scroll", onScroll, { passive: true })
    viewport.addEventListener("wheel", onWheel, { passive: false })
    update()
    return () => {
      viewport.removeEventListener("scroll", onScroll)
      viewport.removeEventListener("wheel", onWheel)
      cancelAnimationFrame(raf)
      progress.style.removeProperty("transform")
    }
  }, [mode, steps.length])

  return (
    <section id="how-it-works" className="bc-journey section" aria-labelledby="bc-journey-title">
      <div
        ref={rootRef}
        className="bc-journey__stage"
        data-journey-mode={mode}
        data-active-step="0"
        data-journey-progress="0"
      >
        <div ref={pinRef} className="bc-journey__pin">
          <div className="container bc-journey__heading">
            <p className="bc-eyebrow">{t("journey.eyebrow")}</p>
            <h2 id="bc-journey-title" className="text-h2">{t("journey.title")}</h2>
          </div>

          <div className="container bc-journey__status" aria-hidden="true">
            <span>01</span>
            <span className="bc-journey__progress"><i ref={progressRef} /></span>
            <span>03</span>
          </div>

          <div className="container bc-journey__native-controls">
            <button type="button" onClick={() => scrollJourney(-1)} aria-controls="bc-journey-viewport" aria-label={t("journey.previous")}><ChevronRight className="naura-chevron--left" /></button>
            <button type="button" onClick={() => scrollJourney(1)} aria-controls="bc-journey-viewport" aria-label={t("journey.next")}><ChevronRight /></button>
          </div>

          <div
            id="bc-journey-viewport"
            ref={viewportRef}
            className="bc-journey__viewport"
            data-lenis-prevent
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPointerDrag}
            onPointerCancel={stopPointerDrag}
          >
            <div ref={trackRef} className="bc-journey__track">
              {steps.map((step, index) => (
                <article key={step.title} className="bc-journey__panel">
                  <div className="container bc-journey__panel-inner">
                    <div className="bc-journey__copy">
                      <span className="bc-journey__number">0{index + 1}</span>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                    <div
                      className={`bc-journey__visual bc-journey__visual--${index + 1}`}
                      aria-hidden="true"
                      style={{ backgroundImage: `url(${JOURNEY_VISUALS[index]})` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
