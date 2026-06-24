import { useEffect, useRef, useState } from 'react'
import './UnicornScene.css'

// The UnicornStudio project embedded as an interactive background.
const PROJECT_ID = 'QET53i7Em2t5mYoTrh1z'
const SCRIPT_SRC =
  'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.5/dist/unicornStudio.umd.js'

// Render resolution scale (0.25–1) and frame cap. The scene is a slow ambient
// background, so a reduced scale + ~30fps cap saves fill-rate with no visible
// change. Tune here once for all instances.
const RENDER_SCALE = 0.75
const RENDER_FPS = 30

// Start init / resume render this far before the element enters the viewport;
// pause once it's this far past. Multiple of 5 per design system.
const ROOT_MARGIN = '200px'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// ── Shared engine loader ────────────────────────────────────────────────────
// The UMD bundle is loaded exactly once across all <UnicornScene> instances.
let scriptPromise = null

function loadEngine() {
  if (window.UnicornStudio && window.UnicornStudio.addScene) {
    return Promise.resolve(window.UnicornStudio)
  }
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-unicorn-studio]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.UnicornStudio))
      existing.addEventListener('error', reject)
      if (window.UnicornStudio && window.UnicornStudio.addScene) {
        resolve(window.UnicornStudio)
      }
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.setAttribute('data-unicorn-studio', '')
    script.addEventListener('load', () => resolve(window.UnicornStudio))
    script.addEventListener('error', reject)
    document.head.appendChild(script)
  })

  return scriptPromise
}

// requestIdleCallback with a safe fallback for Safari / older browsers.
function scheduleIdle(fn, timeout = 200) {
  if (typeof window.requestIdleCallback === 'function') {
    return { type: 'idle', id: window.requestIdleCallback(fn, { timeout }) }
  }
  return { type: 'timeout', id: window.setTimeout(fn, 1) }
}

function cancelIdle(handle) {
  if (!handle) return
  if (handle.type === 'idle' && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle.id)
  } else {
    window.clearTimeout(handle.id)
  }
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  )
}

/**
 * Embeds the UnicornStudio scene as a recolored background layer, kept cheap:
 *   - inits only when the host nears the viewport (IntersectionObserver)
 *   - pauses the render loop (scene.paused) when scrolled off-screen
 *   - pauses when the tab is hidden (visibilitychange)
 *   - renders a static recolored panel under prefers-reduced-motion (no WebGL)
 *   - defers heavy init to requestIdleCallback so it never blocks first paint
 *   - loads the UMD engine exactly once, shared across all instances
 *
 * @param {string}  className - positioning class for the host element
 * @param {boolean} eager     - above-the-fold (Hero): skip the "near viewport"
 *                              gate but STILL defer init to idle. Off-screen
 *                              instances leave this false.
 */
export default function UnicornScene({ className = '', eager = false }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  // Live "should this scene render" signal, read by every gate.
  const inViewRef = useRef(eager)
  const [reduced, setReduced] = useState(prefersReducedMotion)

  // Track the OS reduced-motion setting live.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(REDUCED_MOTION_QUERY)
    const onChange = (e) => setReduced(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Skip WebGL only when the OS asks for reduced motion (an accessibility
  // preference, not a device class). The animated background otherwise runs on
  // every device, phones included.
  const skipEngine = reduced

  useEffect(() => {
    // Skip path: never load the engine, never init. The CSS recolor still
    // paints a static purple poster, so the look degrades gracefully.
    if (skipEngine) return

    const el = containerRef.current
    if (!el) return

    let cancelled = false
    let idleHandle = null
    let observer = null

    // Apply the current "should render" decision to the live scene.
    const applyPlayState = () => {
      const scene = sceneRef.current
      if (!scene) return
      const shouldRender = inViewRef.current && !document.hidden
      scene.paused = !shouldRender
      el.classList.toggle('is-paused', !shouldRender)
    }

    // Deferred, idle-time init of THIS element only (addScene, not init, so we
    // never re-scan or re-init sibling instances).
    const startScene = () => {
      idleHandle = scheduleIdle(() => {
        if (cancelled) return
        loadEngine()
          .then((us) => {
            if (cancelled || !us || !us.addScene) return undefined
            return us.addScene({
              element: el,
              projectId: PROJECT_ID,
              scale: RENDER_SCALE,
              fps: RENDER_FPS,
              lazyLoad: true,
            })
          })
          .then((scene) => {
            if (cancelled) {
              if (scene && typeof scene.destroy === 'function') scene.destroy()
              return
            }
            if (!scene) return
            sceneRef.current = scene
            applyPlayState()
          })
          .catch(() => {
            /* engine failed to load — static recolored panel remains */
          })
      })
    }

    if (eager) {
      // Above the fold: effectively always in view — skip the scroll gate but
      // still defer the heavy init to idle so it never blocks first paint.
      inViewRef.current = true
      startScene()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) return
          inViewRef.current = entry.isIntersecting
          if (entry.isIntersecting && !sceneRef.current && !idleHandle) {
            startScene()
          } else {
            applyPlayState()
          }
        },
        { rootMargin: ROOT_MARGIN, threshold: 0 }
      )
      observer.observe(el)
    }

    const onVisibility = () => applyPlayState()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      cancelIdle(idleHandle)
      if (observer) observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      const scene = sceneRef.current
      if (scene && typeof scene.destroy === 'function') scene.destroy()
      sceneRef.current = null
    }
  }, [skipEngine, eager])

  return (
    <div
      ref={containerRef}
      className={`unicorn-scene ${className}`.trim()}
      data-us-project={PROJECT_ID}
      aria-hidden="true"
    />
  )
}
