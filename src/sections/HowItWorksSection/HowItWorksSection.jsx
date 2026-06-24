import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { createWeb, LABELS } from './webGraph'
import './HowItWorksSection.css'

const STEP_KEYS = ['step01', 'step02', 'step03', 'step04']
const STEPS = STEP_KEYS.length

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ── Inline step numerals (was 4 SVG <img> assets) ────────────────────────────
// Each numeral is a purple→black vertical gradient. One gradient id per step
// keeps it namespaced (the two glyph paths share it). Sized by CSS .hiw-num.
const NUMERAL_GRAD = (id) => (
  <linearGradient id={id} x1="0" y1="1.5" x2="0" y2="63.5" gradientUnits="userSpaceOnUse">
    <stop stopColor="#8642FF" />
    <stop offset="1" />
  </linearGradient>
)

function StepNumeral({ index, label }) {
  const id = `hiw-num-${index}`
  const fill = `url(#${id})`
  const common = { className: 'hiw-num', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', role: 'img', 'aria-label': label, draggable: false }
  if (index === 0) {
    return (
      <svg width="93" height="75" viewBox="0 0 93 75" {...common}>
        <path d="M28.75 75C24.2167 75 20.1667 74.1667 16.6 72.5C13.0667 70.8333 10.0667 68.4167 7.6 65.25C5.13333 62.05 3.25 58.1167 1.95 53.45C0.65 48.7833 0 43.4667 0 37.5C0 31.5 0.65 26.1833 1.95 21.55C3.25 16.8833 5.13333 12.9667 7.6 9.8C10.0667 6.6 13.0667 4.16666 16.6 2.5C20.1667 0.833333 24.2167 0 28.75 0C33.25 0 37.2667 0.833333 40.8 2.5C44.3667 4.16666 47.3833 6.6 49.85 9.8C52.3167 12.9667 54.2 16.8833 55.5 21.55C56.8 26.1833 57.45 31.5 57.45 37.5C57.45 43.4667 56.8 48.7833 55.5 53.45C54.2 58.1167 52.3167 62.05 49.85 65.25C47.3833 68.4167 44.3667 70.8333 40.8 72.5C37.2667 74.1667 33.25 75 28.75 75ZM28.75 65.05C31.5833 65.05 34.0833 64.4333 36.25 63.2C38.45 61.9667 40.3 60.1667 41.8 57.8C43.3 55.4333 44.4333 52.55 45.2 49.15C45.9667 45.7167 46.35 41.8333 46.35 37.5C46.35 33.1333 45.9667 29.25 45.2 25.85C44.4333 22.45 43.3 19.5667 41.8 17.2C40.3 14.8333 38.45 13.0333 36.25 11.8C34.0833 10.5667 31.5833 9.95 28.75 9.95C25.8833 9.95 23.35 10.5667 21.15 11.8C18.9833 13.0333 17.15 14.8333 15.65 17.2C14.15 19.5333 13.0167 22.4167 12.25 25.85C11.4833 29.25 11.1 33.1333 11.1 37.5C11.1 41.8333 11.4833 45.7167 12.25 49.15C13.0167 52.55 14.1333 55.4333 15.6 57.8C17.1 60.1667 18.95 61.9667 21.15 63.2C23.35 64.4333 25.8833 65.05 28.75 65.05Z" fill={fill} />
        <path d="M82.1031 73.5V13.65L68.6531 21.75L63.4531 12.7L82.1031 1.5H92.6531V73.5H82.1031Z" fill={fill} />
        <defs>{NUMERAL_GRAD(id)}</defs>
      </svg>
    )
  }
  if (index === 1) {
    return (
      <svg width="121" height="75" viewBox="0 0 121 75" {...common}>
        <path d="M28.75 75C24.2167 75 20.1667 74.1667 16.6 72.5C13.0667 70.8333 10.0667 68.4167 7.6 65.25C5.13333 62.05 3.25 58.1167 1.95 53.45C0.65 48.7833 0 43.4667 0 37.5C0 31.5 0.65 26.1833 1.95 21.55C3.25 16.8833 5.13333 12.9667 7.6 9.8C10.0667 6.6 13.0667 4.16666 16.6 2.5C20.1667 0.833333 24.2167 0 28.75 0C33.25 0 37.2667 0.833333 40.8 2.5C44.3667 4.16666 47.3833 6.6 49.85 9.8C52.3167 12.9667 54.2 16.8833 55.5 21.55C56.8 26.1833 57.45 31.5 57.45 37.5C57.45 43.4667 56.8 48.7833 55.5 53.45C54.2 58.1167 52.3167 62.05 49.85 65.25C47.3833 68.4167 44.3667 70.8333 40.8 72.5C37.2667 74.1667 33.25 75 28.75 75ZM28.75 65.05C31.5833 65.05 34.0833 64.4333 36.25 63.2C38.45 61.9667 40.3 60.1667 41.8 57.8C43.3 55.4333 44.4333 52.55 45.2 49.15C45.9667 45.7167 46.35 41.8333 46.35 37.5C46.35 33.1333 45.9667 29.25 45.2 25.85C44.4333 22.45 43.3 19.5667 41.8 17.2C40.3 14.8333 38.45 13.0333 36.25 11.8C34.0833 10.5667 31.5833 9.95 28.75 9.95C25.8833 9.95 23.35 10.5667 21.15 11.8C18.9833 13.0333 17.15 14.8333 15.65 17.2C14.15 19.5333 13.0167 22.4167 12.25 25.85C11.4833 29.25 11.1 33.1333 11.1 37.5C11.1 41.8333 11.4833 45.7167 12.25 49.15C13.0167 52.55 14.1333 55.4333 15.6 57.8C17.1 60.1667 18.95 61.9667 21.15 63.2C23.35 64.4333 25.8833 65.05 28.75 65.05Z" fill={fill} />
        <path d="M77.7344 71.45L70.6844 63.55L101.134 35.9C102.634 34.5667 103.918 33.3 104.984 32.1C106.051 30.8667 106.918 29.6667 107.584 28.5C108.284 27.3 108.801 26.1167 109.134 24.95C109.468 23.75 109.634 22.5 109.634 21.2C109.634 19.3 109.284 17.65 108.584 16.25C107.918 14.8167 106.968 13.6333 105.734 12.7C104.534 11.7667 103.118 11.0833 101.484 10.65C99.851 10.1833 98.0844 9.95 96.1844 9.95C94.0844 9.95 92.151 10.25 90.3844 10.85C88.651 11.45 87.1177 12.3167 85.7844 13.45C84.4844 14.55 83.3844 15.9167 82.4844 17.55C81.6177 19.1833 81.001 21.0167 80.6344 23.05L69.4844 21.15C70.1844 17.85 71.301 14.9 72.8344 12.3C74.401 9.66666 76.3177 7.45 78.5844 5.65C80.8844 3.85 83.501 2.46667 86.4344 1.5C89.401 0.53333 92.6177 0.0499964 96.0844 0.0499964C99.4844 0.0499964 102.684 0.499998 105.684 1.4C108.718 2.26667 111.334 3.58333 113.534 5.35C115.734 7.08333 117.468 9.3 118.734 12C120.001 14.6667 120.601 17.7833 120.534 21.35C120.534 23.55 120.218 25.65 119.584 27.65C118.951 29.65 118.134 31.5333 117.134 33.3C116.168 35.0333 115.068 36.65 113.834 38.15C112.601 39.6167 111.351 40.9333 110.084 42.1L77.7344 71.45ZM70.6844 73.5V63.55H120.584V73.5H70.6844Z" fill={fill} />
        <defs>{NUMERAL_GRAD(id)}</defs>
      </svg>
    )
  }
  if (index === 2) {
    return (
      <svg width="123" height="75" viewBox="0 0 123 75" {...common}>
        <path d="M28.75 75C24.2167 75 20.1667 74.1667 16.6 72.5C13.0667 70.8333 10.0667 68.4167 7.6 65.25C5.13333 62.05 3.25 58.1167 1.95 53.45C0.65 48.7833 0 43.4667 0 37.5C0 31.5 0.65 26.1833 1.95 21.55C3.25 16.8833 5.13333 12.9667 7.6 9.8C10.0667 6.6 13.0667 4.16666 16.6 2.5C20.1667 0.833333 24.2167 0 28.75 0C33.25 0 37.2667 0.833333 40.8 2.5C44.3667 4.16666 47.3833 6.6 49.85 9.8C52.3167 12.9667 54.2 16.8833 55.5 21.55C56.8 26.1833 57.45 31.5 57.45 37.5C57.45 43.4667 56.8 48.7833 55.5 53.45C54.2 58.1167 52.3167 62.05 49.85 65.25C47.3833 68.4167 44.3667 70.8333 40.8 72.5C37.2667 74.1667 33.25 75 28.75 75ZM28.75 65.05C31.5833 65.05 34.0833 64.4333 36.25 63.2C38.45 61.9667 40.3 60.1667 41.8 57.8C43.3 55.4333 44.4333 52.55 45.2 49.15C45.9667 45.7167 46.35 41.8333 46.35 37.5C46.35 33.1333 45.9667 29.25 45.2 25.85C44.4333 22.45 43.3 19.5667 41.8 17.2C40.3 14.8333 38.45 13.0333 36.25 11.8C34.0833 10.5667 31.5833 9.95 28.75 9.95C25.8833 9.95 23.35 10.5667 21.15 11.8C18.9833 13.0333 17.15 14.8333 15.65 17.2C14.15 19.5333 13.0167 22.4167 12.25 25.85C11.4833 29.25 11.1 33.1333 11.1 37.5C11.1 41.8333 11.4833 45.7167 12.25 49.15C13.0167 52.55 14.1333 55.4333 15.6 57.8C17.1 60.1667 18.95 61.9667 21.15 63.2C23.35 64.4333 25.8833 65.05 28.75 65.05Z" fill={fill} />
        <path d="M122.684 51.45C122.684 55.1167 122.034 58.4167 120.734 61.35C119.434 64.25 117.618 66.7167 115.284 68.75C112.984 70.7833 110.234 72.3333 107.034 73.4C103.834 74.4667 100.318 75 96.4844 75C93.051 75 89.801 74.5667 86.7344 73.7C83.6677 72.8667 80.9177 71.55 78.4844 69.75C76.051 67.95 73.9677 65.65 72.2344 62.85C70.501 60.05 69.251 56.7167 68.4844 52.85L79.2844 51.2C79.7844 53.4333 80.4844 55.4167 81.3844 57.15C82.3177 58.8833 83.4844 60.35 84.8844 61.55C86.2844 62.7167 87.951 63.6167 89.8844 64.25C91.8177 64.85 94.0844 65.15 96.6844 65.15C98.951 65.15 101.001 64.8 102.834 64.1C104.701 63.4 106.284 62.45 107.584 61.25C108.918 60.05 109.934 58.65 110.634 57.05C111.368 55.4167 111.734 53.6833 111.734 51.85C111.734 47.6833 110.401 44.55 107.734 42.45C105.101 40.3167 101.351 39.25 96.4844 39.25H88.6344V30.65H96.6844C100.884 30.65 104.584 31.0833 107.784 31.95C111.018 32.8167 113.734 34.1167 115.934 35.85C118.134 37.5833 119.801 39.75 120.934 42.35C122.101 44.95 122.684 47.9833 122.684 51.45ZM72.5344 1.5H119.834V11.35H72.5344V1.5ZM106.884 11.35H119.834L93.1844 38.95L88.6344 30.65L106.884 11.35Z" fill={fill} />
        <defs>{NUMERAL_GRAD(id)}</defs>
      </svg>
    )
  }
  return (
    <svg width="124" height="75" viewBox="0 0 124 75" {...common}>
      <path d="M28.75 75C24.2167 75 20.1667 74.1667 16.6 72.5C13.0667 70.8333 10.0667 68.4167 7.6 65.25C5.13333 62.05 3.25 58.1167 1.95 53.45C0.65 48.7833 0 43.4667 0 37.5C0 31.5 0.65 26.1833 1.95 21.55C3.25 16.8833 5.13333 12.9667 7.6 9.8C10.0667 6.6 13.0667 4.16666 16.6 2.5C20.1667 0.833333 24.2167 0 28.75 0C33.25 0 37.2667 0.833333 40.8 2.5C44.3667 4.16666 47.3833 6.6 49.85 9.8C52.3167 12.9667 54.2 16.8833 55.5 21.55C56.8 26.1833 57.45 31.5 57.45 37.5C57.45 43.4667 56.8 48.7833 55.5 53.45C54.2 58.1167 52.3167 62.05 49.85 65.25C47.3833 68.4167 44.3667 70.8333 40.8 72.5C37.2667 74.1667 33.25 75 28.75 75ZM28.75 65.05C31.5833 65.05 34.0833 64.4333 36.25 63.2C38.45 61.9667 40.3 60.1667 41.8 57.8C43.3 55.4333 44.4333 52.55 45.2 49.15C45.9667 45.7167 46.35 41.8333 46.35 37.5C46.35 33.1333 45.9667 29.25 45.2 25.85C44.4333 22.45 43.3 19.5667 41.8 17.2C40.3 14.8333 38.45 13.0333 36.25 11.8C34.0833 10.5667 31.5833 9.95 28.75 9.95C25.8833 9.95 23.35 10.5667 21.15 11.8C18.9833 13.0333 17.15 14.8333 15.65 17.2C14.15 19.5333 13.0167 22.4167 12.25 25.85C11.4833 29.25 11.1 33.1333 11.1 37.5C11.1 41.8333 11.4833 45.7167 12.25 49.15C13.0167 52.55 14.1333 55.4333 15.6 57.8C17.1 60.1667 18.95 61.9667 21.15 63.2C23.35 64.4333 25.8833 65.05 28.75 65.05Z" fill={fill} />
      <path d="M105.584 73.5V60.25H69.4844V50.4L93.2844 1.5H104.834L81.0344 50.4H105.584V27H116.134V50.4H123.134V60.25H116.134V73.5H105.584Z" fill={fill} />
      <defs>{NUMERAL_GRAD(id)}</defs>
    </svg>
  )
}

// ── Business card (step 01 visual) ──────────────────────────────────────────
function ContactCard() {
  const { t } = useTranslation('howItWorks')
  const contacts = ['phone', 'site', 'email', 'telegram']
  return (
    <div className="hiw-card" aria-label={t('card.name')}>
      <div className="hiw-card__head">
        <p className="hiw-card__name">{t('card.name')}</p>
        <p className="hiw-card__role">{t('card.role')}</p>
      </div>
      <ul className="hiw-card__contacts">
        {contacts.map((key) => (
          <li key={key} className="hiw-card__contact">
            <span className="hiw-card__dot" aria-hidden="true" />
            <span className="hiw-card__value">{t(`card.${key}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Centered section header (eyebrow + headline) — matches other sections ────
function SectionHeader() {
  const { t } = useTranslation('howItWorks')
  return (
    <div className="container">
      <header className="hiw-header">
        <span className="hiw-header__eyebrow text-label">{t('eyebrow')}</span>
        <h2 className="hiw-header__title text-h2">{t('headline')}</h2>
      </header>
    </div>
  )
}

// ── Left column text block (number + title + description, card on step 01) ───
function StepText({ index }) {
  const { t } = useTranslation('howItWorks')
  const key = STEP_KEYS[index]
  return (
    <>
      <StepNumeral index={index} label={t(`steps.${key}.number`)} />
      <h3 className="hiw-title">{t(`steps.${key}.title`)}</h3>
      <p className="hiw-desc">{t(`steps.${key}.description`)}</p>
      {index === 0 && <ContactCard />}
    </>
  )
}

// ── Static web snapshot at a fixed stage (mobile / reduced-motion fallback) ──
function WebSnapshot({ stage }) {
  const { t } = useTranslation('howItWorks')
  const dotsRef = useRef(null)
  const linesRef = useRef(null)
  useEffect(() => {
    if (!dotsRef.current || !linesRef.current) return
    const web = createWeb(dotsRef.current, linesRef.current)
    web.render(stage)
    return () => web.destroy()
  }, [stage])
  return (
    <svg className="hiw-graph-svg" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g className="hiw-graph-lines" ref={linesRef} />
      <g className="hiw-graph-dots" ref={dotsRef} />
      {stage === 2 && (
        <g className="hiw-graph-labels" style={{ opacity: 1 }}>
          {LABELS.map((l) => (
            <text key={l.key} x={l.x} y={l.y} textAnchor={l.anchor}>
              {t(`labels.${l.key}`)}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}

// Scroll-morph (pinned) lives ONLY where the desktop pinned-graph CSS layout
// exists: >=1200px, the zoom boundary defined in tokens.css. Below it — and for
// reduced motion — render plain stacked static steps. Querying the SAME boundary
// the CSS uses guarantees JS mode and CSS layout can never disagree (the old
// 768px JS threshold vs 1199px CSS threshold left a band where JS pinned a panel
// the CSS had already reflowed).
const SCROLL_QUERY = '(min-width: 1200px)'
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

const readStaticMode = () => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia(REDUCED_QUERY).matches ||
    !window.matchMedia(SCROLL_QUERY).matches
  )
}

export default function HowItWorksSection() {
  const { t } = useTranslation('howItWorks')
  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)
  const pinRef = useRef(null)
  const textRefs = useRef([])
  const dotsRef = useRef(null)
  const linesRef = useRef(null)
  const labelsRef = useRef(null)

  // Reduced-motion + below the desktop zoom boundary → plain stacked steps.
  // REACTIVE (not frozen at mount): crossing the boundary — by resizing OR by
  // reloading at a new width in DevTools — flips this, which swaps the markup and
  // lets the layout effect below tear down / rebuild the ScrollTrigger pin. That
  // kills the stale position:fixed graph panel that used to bleed over neighbours.
  const [staticMode, setStaticMode] = useState(readStaticMode)

  useEffect(() => {
    const scrollMq = window.matchMedia(SCROLL_QUERY)
    const reducedMq = window.matchMedia(REDUCED_QUERY)
    const sync = () => setStaticMode(reducedMq.matches || !scrollMq.matches)
    scrollMq.addEventListener('change', sync)
    reducedMq.addEventListener('change', sync)
    sync() // resync in case the width changed between first render and this effect
    return () => {
      scrollMq.removeEventListener('change', sync)
      reducedMq.removeEventListener('change', sync)
    }
  }, [])

  useLayoutEffect(() => {
    if (staticMode) return
    const scroller = scrollerRef.current
    const pin = pinRef.current
    const dotsG = dotsRef.current
    const linesG = linesRef.current
    const texts = textRefs.current.filter(Boolean)
    if (!scroller || !pin || !dotsG || !linesG) return

    const { render, destroy } = createWeb(dotsG, linesG)
    const labelsG = labelsRef.current

    const setActive = (p) => {
      const a = clamp(Math.round(p), 0, STEPS - 1)
      texts.forEach((el, i) => el.classList.toggle('is-active', i === a))
    }
    // Group labels belong to step 3 (p=2) only — fade with distance from it.
    const setLabels = (p) => {
      if (labelsG) labelsG.style.opacity = String(clamp(1 - Math.abs(p - 2), 0, 1))
    }

    // ScrollTrigger pins the panel and drives the morph from scroll progress.
    // Lenis is wired into ScrollTrigger globally (useSmoothScroll), so progress
    // tracks the eased scroll position. invalidateOnRefresh re-measures start/end
    // after lazy sections + fonts change the document height; anticipatePin
    // avoids the unpinned flash smooth scroll otherwise exposes.
    // (CSS position:sticky is unusable here — body has overflow-x:hidden.)
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scroller,
        start: 'top top',
        end: 'bottom bottom',
        pin,
        pinSpacing: false,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress * (STEPS - 1)
          render(p)
          setActive(p)
          setLabels(p)
        },
      })
    }, sectionRef)

    render(0)
    setActive(0)
    setLabels(0)

    // This section mounts lazily; its own creation just changed the document
    // height. Refresh so this trigger (and any created earlier) re-measure now.
    ScrollTrigger.refresh()

    return () => {
      ctx.revert()
      destroy()
    }
  }, [staticMode])

  // ── Reduced motion / mobile: stacked static steps ─────────────────────────
  if (staticMode) {
    return (
      <section id="how-it-works" data-section="how-it-works" className="how-it-works-section is-static">
        <SectionHeader />
        {STEP_KEYS.map((key, i) => (
          <div className="hiw-static-step container" key={key}>
            <div className="hiw-text">
              <StepText index={i} />
            </div>
            <div className="hiw-graph-col">
              <WebSnapshot stage={i} />
            </div>
          </div>
        ))}
      </section>
    )
  }

  // ── Scroll mode: panel pinned, text swaps per step, web morphs ────────────
  return (
    <section
      id="how-it-works"
      data-section="how-it-works"
      ref={sectionRef}
      className="how-it-works-section is-scroll"
    >
      <SectionHeader />
      <div className="hiw-scroller" ref={scrollerRef}>
        <div className="hiw-pin" ref={pinRef}>
          <div className="hiw-inner container">
          <div className="hiw-text-col">
            {STEP_KEYS.map((key, i) => (
              <div
                className={`hiw-text${i === 0 ? ' is-active' : ''}`}
                key={key}
                ref={(el) => { textRefs.current[i] = el }}
              >
                <StepText index={i} />
              </div>
            ))}
          </div>

          <div className="hiw-graph-col">
            <svg
              className="hiw-graph-svg"
              viewBox="0 0 600 600"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <g className="hiw-graph-lines" ref={linesRef} />
              <g className="hiw-graph-dots" ref={dotsRef} />
              <g className="hiw-graph-labels" ref={labelsRef}>
                {LABELS.map((l) => (
                  <text key={l.key} x={l.x} y={l.y} textAnchor={l.anchor}>
                    {t(`labels.${l.key}`)}
                  </text>
                ))}
              </g>
            </svg>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
