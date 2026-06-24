import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import {
  NODES, EDGES, EDGE_GROUPS, TIER_NODES,
  PARALLAX, SVG_W, SVG_H,
} from './graphConfig'

// Final scale per depth — outer nodes render smaller for visual hierarchy
const DEPTH_SCALE = { 0: 1.0, 1: 0.88, 2: 0.78, 3: 0.68, 4: 0.60 }

// ── Helpers ──────────────────────────────────────────────────────────────────

function edgeKey(a, b) { return [a, b].sort().join('|') }

function nodeCenter(node) {
  return { x: (node.cx / 100) * SVG_W, y: (node.cy / 100) * SVG_H }
}

function lineLen(na, nb) {
  const a = nodeCenter(na)
  const b = nodeCenter(nb)
  return Math.hypot(b.x - a.x, b.y - a.y)
}

// BFS path from 'mary' to target node id
function findPath(from, to) {
  if (from === to) return [from]
  const adj = new Map()
  EDGES.forEach(([a, b]) => {
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a).push(b)
    adj.get(b).push(a)
  })
  const visited = new Set([from])
  const queue = [[from, [from]]]
  while (queue.length) {
    const [cur, path] = queue.shift()
    for (const next of adj.get(cur) || []) {
      if (visited.has(next)) continue
      visited.add(next)
      const newPath = [...path, next]
      if (next === to) return newPath
      queue.push([next, newPath])
    }
  }
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroGraph() {
  const { t } = useTranslation('hero')
  const containerRef = useRef(null)
  const nodeEls = useRef({})   // id → inner animated div
  const lineRefs = useRef({})  // edgeKey → SVG line element
  const readyRef = useRef(false) // hover highlight is enabled only after the web has fully drawn

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]))

  // Pre-computed edge lengths (Euclidean distance in SVG space)
  const lineLengths = Object.fromEntries(
    EDGES.map(([a, b]) => [edgeKey(a, b), lineLen(nodeMap[a], nodeMap[b])])
  )

  // ── GSAP entrance animation ────────────────────────────────────────────────
  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      NODES.forEach(n => {
        const el = nodeEls.current[n.id]
        if (!el) return
        const props = { opacity: 1, scale: DEPTH_SCALE[n.depth] ?? 1 }
        if (n.id === 'mary') props.boxShadow = '0px 0px 30px 0px rgba(134, 66, 255, 0.5)'
        gsap.set(el, props)
      })
      EDGES.forEach(([a, b]) => {
        const line = lineRefs.current[edgeKey(a, b)]
        if (line) gsap.set(line, { strokeDashoffset: 0 })
      })
      readyRef.current = true
      return
    }

    // Set initial hidden state
    NODES.forEach(n => {
      const el = nodeEls.current[n.id]
      if (el) gsap.set(el, { opacity: 0, scale: (DEPTH_SCALE[n.depth] ?? 1) * 0.7, transformOrigin: 'center center' })
    })
    EDGES.forEach(([a, b]) => {
      const key = edgeKey(a, b)
      const line = lineRefs.current[key]
      const len = lineLengths[key]
      if (line) gsap.set(line, { strokeDasharray: len, strokeDashoffset: len })
    })

    const tl = gsap.timeline({ paused: true })

    // 1. Mary center appears
    const maryEl = nodeEls.current['mary']
    if (maryEl) {
      tl.to(maryEl, {
        opacity: 1,
        scale: DEPTH_SCALE[0],
        boxShadow: '0px 0px 30px 0px rgba(134, 66, 255, 0.5)',
        duration: 0.6,
        ease: 'back.out(1.7)',
      })
    }

    // 2. Each ring: draw lines, then reveal nodes
    EDGE_GROUPS.forEach((group, groupIdx) => {
      const tier = groupIdx + 1

      // Rings (stage 2+) ripple outward as one continuous, smooth wave:
      // every tier overlaps the previous one and uses a soft ease (no bounce),
      // so the levels flow into each other instead of popping in step by step.
      group.forEach(([a, b], i) => {
        const key = edgeKey(a, b)
        const line = lineRefs.current[key]
        if (!line) return
        const pos = i === 0
          ? (groupIdx === 0 ? '+=0.05' : '<0.2') // next tier starts while the prev is still revealing
          : '<0.05'
        tl.to(
          line,
          { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' },
          pos
        )
      })

      const tierNodeIds = TIER_NODES[tier] || []
      tierNodeIds.forEach((nodeId, i) => {
        const el = nodeEls.current[nodeId]
        if (!el) return
        tl.to(
          el,
          { opacity: 1, scale: DEPTH_SCALE[nodeMap[nodeId]?.depth ?? 1], duration: 0.5, ease: 'power2.out' },
          i === 0 ? '<0.12' : '<0.06' // nodes fade in while their lines are still drawing
        )
      })
    })

    // After all lines are drawn, remove dash constraints so the ticker can freely
    // update line endpoints without dash-length mismatches during parallax
    tl.call(() => {
      EDGES.forEach(([a, b]) => {
        const line = lineRefs.current[edgeKey(a, b)]
        if (line) {
          line.removeAttribute('stroke-dasharray')
          line.removeAttribute('stroke-dashoffset')
        }
      })
      // Whole web is now drawn — hover highlighting may begin.
      readyRef.current = true
    })

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 85%',
      once: true,
      onEnter: () => tl.play(),
    })

    return () => {
      tl.kill()
      trigger.kill()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mouse parallax ────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const container = containerRef.current
    if (!container) return
    const stage = container.parentElement
    if (!stage) return

    const quickTos = {}
    NODES.forEach(n => {
      const el = nodeEls.current[n.id]
      if (!el || n.depth === 0) return
      quickTos[n.id] = {
        x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power2.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power2.out' }),
      }
    })

    let rafId = null

    // Cache stage size for SVG↔DOM coordinate conversion
    let stageW = stage.getBoundingClientRect().width
    let stageH = stage.getBoundingClientRect().height
    function onResize() {
      const r = stage.getBoundingClientRect()
      stageW = r.width
      stageH = r.height
    }
    window.addEventListener('resize', onResize, { passive: true })

    // Each frame: reposition SVG line endpoints to follow their node cards
    function tickLines() {
      const scaleX = SVG_W / stageW
      const scaleY = SVG_H / stageH
      EDGES.forEach(([a, b]) => {
        const na = nodeMap[a]
        const nb = nodeMap[b]
        const line = lineRefs.current[edgeKey(a, b)]
        const elA = nodeEls.current[a]
        const elB = nodeEls.current[b]
        if (!line || !na || !nb) return
        const axOff = elA ? (gsap.getProperty(elA, 'x') || 0) : 0
        const ayOff = elA ? (gsap.getProperty(elA, 'y') || 0) : 0
        const bxOff = elB ? (gsap.getProperty(elB, 'x') || 0) : 0
        const byOff = elB ? (gsap.getProperty(elB, 'y') || 0) : 0
        line.setAttribute('x1', na.cx / 100 * SVG_W + axOff * scaleX)
        line.setAttribute('y1', na.cy / 100 * SVG_H + ayOff * scaleY)
        line.setAttribute('x2', nb.cx / 100 * SVG_W + bxOff * scaleX)
        line.setAttribute('y2', nb.cy / 100 * SVG_H + byOff * scaleY)
      })
    }
    gsap.ticker.add(tickLines)

    function onMove(e) {
      // Hold nodes still until the web is drawn, otherwise parallax stretches
      // the lines past their dash length and reveals gray slivers.
      if (!readyRef.current) return
      const mx = e.clientX - (stage.getBoundingClientRect().left + stageW / 2)
      const my = e.clientY - (stage.getBoundingClientRect().top + stageH / 2)
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        NODES.forEach(n => {
          if (n.depth === 0) return
          const f = PARALLAX[n.depth]
          quickTos[n.id]?.x(mx * f)
          quickTos[n.id]?.y(my * f)
        })
      })
    }

    function onLeave() {
      if (!readyRef.current) return
      NODES.forEach(n => {
        if (n.depth === 0) return
        quickTos[n.id]?.x(0)
        quickTos[n.id]?.y(0)
      })
    }

    stage.addEventListener('mousemove', onMove, { passive: true })
    stage.addEventListener('mouseleave', onLeave, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      gsap.ticker.remove(tickLines)
      window.removeEventListener('resize', onResize)
      stage.removeEventListener('mousemove', onMove)
      stage.removeEventListener('mouseleave', onLeave)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hover highlight ───────────────────────────────────────────────────────
  function handleNodeEnter(nodeId) {
    // Ignore hovers until the web has fully drawn — otherwise hovering a
    // not-yet-revealed node would flash fragments of the gray web.
    if (!readyRef.current) return
    const path = findPath('mary', nodeId)
    if (!path || path.length <= 1) return

    const pathKeys = new Set()
    for (let i = 0; i < path.length - 1; i++) {
      pathKeys.add(edgeKey(path[i], path[i + 1]))
    }

    EDGES.forEach(([a, b]) => {
      const key = edgeKey(a, b)
      const line = lineRefs.current[key]
      if (!line) return
      if (pathKeys.has(key)) {
        line.setAttribute('stroke', '#8642ff') // --accent-primary
        gsap.to(line, { opacity: 1, strokeWidth: 1.5, duration: 0.2 })
      } else {
        // Keep the gray web visible — only the path stands out.
        line.setAttribute('stroke', 'rgba(255,255,255,0.2)')
        gsap.to(line, { opacity: 1, strokeWidth: 1, duration: 0.2 })
      }
    })
  }

  function handleNodeLeave() {
    if (!readyRef.current) return
    EDGES.forEach(([a, b]) => {
      const key = edgeKey(a, b)
      const line = lineRefs.current[key]
      if (!line) return
      line.setAttribute('stroke', 'rgba(255,255,255,0.2)')
      gsap.to(line, { opacity: 1, strokeWidth: 1, duration: 0.3 })
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="hero-graph" aria-hidden="true">
      {/* SVG lines layer */}
      <svg
        className="hero-graph__svg"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {EDGES.map(([a, b]) => {
          const na = nodeMap[a]
          const nb = nodeMap[b]
          if (!na || !nb) return null
          const key = edgeKey(a, b)
          const ac = nodeCenter(na)
          const bc = nodeCenter(nb)
          return (
            <line
              key={key}
              ref={el => { lineRefs.current[key] = el }}
              x1={ac.x} y1={ac.y}
              x2={bc.x} y2={bc.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Node cards */}
      {NODES.map(node => (
        <div
          key={node.id}
          className="graph-node-anchor"
          style={{ left: `${node.cx}%`, top: `${node.cy}%` }}
        >
          <div
            ref={el => { nodeEls.current[node.id] = el }}
            className={`graph-node graph-node--depth-${node.depth}`}
            style={{ '--node-filter-blur': node.filterBlur }}
            onMouseEnter={() => !node.isCenter && handleNodeEnter(node.id)}
            onMouseLeave={() => !node.isCenter && handleNodeLeave()}
          >
            <picture>
              <source srcSet={node.avatar.avif} type="image/avif" />
              <source srcSet={node.avatar.webp} type="image/webp" />
              <img
                src={node.avatar.webp}
                alt=""
                className="graph-node__avatar"
                draggable="false"
                decoding="async"
              />
            </picture>
            <div className="graph-node__info">
              <span className="graph-node__name">{node.name}</span>
              <span className="graph-node__role">
                {t(`contact.${node.roleKey}`)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
