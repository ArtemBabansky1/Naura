// Contact-web graph — ported verbatim from the reference prototype.
// 72 procedural nodes, 4 stages (S0 scatter → S1 hub spokes → S2 colored ring
// → S3 dense mesh), morphed by a scroll progress p ∈ [0, 3].
//
// Only deviation from the prototype: node 0 (the "you" core) is pinned to the
// centre in every stage — including S0 — so the purple core never leaves the
// middle and all links radiate from it.

const NS = 'http://www.w3.org/2000/svg'

const ACCENT = '#8642FF'
const GRAY = '#535353'

const N = 72
const CX = 300
const CY = 300
const TAU = Math.PI * 2

// Step-3 relationship groups. The core's connected points (the spokes) are
// tagged into four clusters by angular sector; positions match the screenshot:
// east = Family, south = Neighbors, west = Friends, north = Colleagues.
const COL_COLLEAGUES = '#8642ff'
const COL_FAMILY = '#00c9f6'
const COL_FRIENDS = '#fa0179'
const COL_NEIGHBORS = '#00d93a'
function sectorColor(a) {
  const aa = ((a % TAU) + TAU) % TAU
  if (aa < TAU / 8 || aa >= (7 * TAU) / 8) return COL_FAMILY
  if (aa < (3 * TAU) / 8) return COL_NEIGHBORS
  if (aa < (5 * TAU) / 8) return COL_FRIENDS
  return COL_COLLEAGUES
}

// Group labels (step 3) — viewBox 600 positions + text anchor. Text from i18n.
export const LABELS = [
  { key: 'colleagues', x: 235, y: 188, anchor: 'middle' },
  { key: 'family', x: 392, y: 232, anchor: 'start' },
  { key: 'friends', x: 176, y: 338, anchor: 'end' },
  { key: 'neighbors', x: 370, y: 392, anchor: 'start' },
]

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

function rnd(s) {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
function lerpHex(c1, c2, t) {
  const p = (hex, o) => parseInt(hex.slice(o, o + 2), 16)
  const h1 = c1.replace('#', '')
  const h2 = c2.replace('#', '')
  return 'rgb(' + [0, 2, 4].map((o) => Math.round(lerp(p(h1, o), p(h2, o), t))).join(',') + ')'
}

function buildNodes() {
  return Array.from({ length: N }, (_, i) => {
    const a0 = rnd(i + 1) * TAU
    const r0 = (0.18 + rnd(i + 100) * 0.82) * 240
    let S0 = {
      x: CX + Math.cos(a0) * r0 + (rnd(i + 200) - 0.5) * 30,
      y: CY + Math.sin(a0) * r0 + (rnd(i + 300) - 0.5) * 30,
      r: 2.8,
      col: GRAY,
      op: 0.6,
    }

    let S1
    let ring = null // organized ring position used at S2 (step 3) for i >= 18
    let innerAngle = null // sector angle of a core-connected point (i < 18)
    if (i === 0) {
      S1 = { x: CX, y: CY, r: 8, col: ACCENT, op: 1 }
    } else if (i < 18) {
      innerAngle = ((i - 1) / 17) * TAU + 0.15
      const rd = 78 + rnd(i + 50) * 12
      S1 = { x: CX + Math.cos(innerAngle) * rd, y: CY + Math.sin(innerAngle) * rd, r: 3, col: GRAY, op: 1 }
    } else {
      // Step 2: unconnected points stay scattered like step 1, but pushed
      // outside the hub-spoke ring so they never sit under the central points.
      const dx = S0.x - CX
      const dy = S0.y - CY
      const d = Math.hypot(dx, dy) || 1
      const nd = Math.max(d, 140 + rnd(i + 500) * 50)
      const sx = CX + (dx / d) * nd
      const sy = CY + (dy / d) * nd
      if (i < 45) {
        const a = ((i - 18) / 27) * TAU + 0.3
        const rd = 175 + rnd(i + 60) * 18
        ring = { x: CX + Math.cos(a) * rd, y: CY + Math.sin(a) * rd }
        S1 = { x: sx, y: sy, r: 3, col: GRAY, op: 0.6 }
      } else {
        const a = ((i - 45) / 27) * TAU + 0.5
        const rd = 248 + rnd(i + 70) * 14
        ring = { x: CX + Math.cos(a) * rd, y: CY + Math.sin(a) * rd }
        S1 = { x: sx, y: sy, r: 2.6, col: GRAY, op: 0.5 }
      }
    }

    // Core stays dead-centre and purple in every stage (deviation from prototype).
    if (i === 0) S0 = { x: CX, y: CY, r: 8, col: ACCENT, op: 1 }

    const S2 = { ...S1 }
    if (i === 0) {
      S2.col = ACCENT
      S2.r = 12
    } else if (innerAngle !== null) {
      // Step 3: core-connected points are tagged into colour groups.
      S2.col = sectorColor(innerAngle)
      S2.r = 4.5
    } else {
      // Step 3: the other points form a plain gray ring — no colour, no links.
      S2.col = GRAY
      S2.r = 3
      S2.x = ring.x
      S2.y = ring.y
    }
    S2.op = 1

    const S3 = { ...S2 }
    // Step 4: every outer point takes its sector colour — the same 4 groups as
    // step 3 — so the mesh colours radiate out from the first-ring clusters.
    if (i >= 18) {
      S3.col = sectorColor(Math.atan2(S3.y - CY, S3.x - CX))
      S3.r = 4.5
    }
    // A few bigger sub-hubs for visual rhythm — they keep their sector colour.
    if ([5, 12, 22, 32, 40].includes(i)) {
      S3.r = 7
    }
    if (i >= 18) {
      const dx = S3.x - CX
      const dy = S3.y - CY
      const d = Math.hypot(dx, dy)
      if (d > 0) {
        const nd = d * 0.92
        S3.x = CX + (dx / d) * nd
        S3.y = CY + (dy / d) * nd
      }
      S3.op = 1
    }
    return { S0, S1, S2, S3 }
  })
}

function buildConns() {
  const map = new Map()
  function add(a, b, si, op, fast) {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const k = `${lo}-${hi}`
    if (!map.has(k)) map.set(k, { a: lo, b: hi, ops: [0, 0, 0, 0] })
    const e = map.get(k)
    e.ops[si] = Math.max(e.ops[si], op)
    if (fast) e.fast = true // step-1-only edge: fully gone by p=0.5 (before step 2)
  }
  // Step 1 (S0): 3 links from the core to scattered points + 3 between points.
  ;[30, 47, 58].forEach((b) => add(0, b, 0, 0.5, true))
  ;[[3, 14], [7, 19], [41, 46]].forEach(([a, b]) => add(a, b, 0, 0.35, true))
  for (let i = 1; i < 18; i++) add(0, i, 1, 0.6)
  // Step 2: 3 random links between the scattered points (like step 1). ops[1]
  // only → they fade in by step 2 and fade out again before step 3.
  ;[[41, 57], [48, 61], [70, 71]].forEach(([a, b]) => add(a, b, 1, 0.35))
  for (let i = 1; i < 18; i++) add(0, i, 2, 0.8)
  // Inner→outer links belong to step 4 only (step 3 keeps the ring unconnected).
  ;[[1, 19], [1, 20], [3, 22], [3, 23], [5, 25], [5, 26], [7, 28], [9, 31], [9, 32], [11, 34], [13, 37], [15, 40], [17, 43]]
    .forEach(([a, b]) => add(a, b, 3, 0.5))
  map.forEach(({ ops }) => { ops[3] = Math.max(ops[3], ops[2]) })
  ;[5, 12, 22, 32, 40].forEach((hub) => {
    for (let j = 0; j < N; j++) if (j !== hub && (j * 13 + hub * 7) % 9 < 3) add(hub, j, 3, 0.3)
  })
  for (let i = 18; i < N; i++) {
    if (i % 3 === 0 && i + 5 < N) add(i, i + 5, 3, 0.22)
    if (i % 5 === 0 && i + 11 < N) add(i, i + 11, 3, 0.2)
    if (i % 7 === 0 && i + 9 < N) add(i, i + 9, 3, 0.18)
  }
  return [...map.values()]
}

const KEYS = ['S0', 'S1', 'S2', 'S3']

export function createWeb(dotsG, linesG) {
  const nodes = buildNodes()
  const conns = buildConns()

  const lineEls = conns.map(() => {
    const el = document.createElementNS(NS, 'line')
    el.setAttribute('stroke', GRAY)
    el.setAttribute('stroke-width', '1')
    el.setAttribute('stroke-linecap', 'round')
    el.setAttribute('stroke-opacity', '0')
    linesG.appendChild(el)
    return el
  })

  const dotEls = nodes.map((n) => {
    const el = document.createElementNS(NS, 'circle')
    const s = n.S0
    el.setAttribute('cx', s.x.toFixed(1))
    el.setAttribute('cy', s.y.toFixed(1))
    el.setAttribute('r', s.r)
    el.setAttribute('fill', s.col)
    el.setAttribute('fill-opacity', s.op)
    dotsG.appendChild(el)
    return el
  })

  function render(p) {
    const si = clamp(Math.floor(p), 0, 2)
    const sj = si + 1
    const t = ease(clamp(p - si, 0, 1))
    const Ka = KEYS[si]
    const Kb = KEYS[sj]

    for (let i = 0; i < nodes.length; i++) {
      const A = nodes[i][Ka]
      const B = nodes[i][Kb]
      const el = dotEls[i]
      el.setAttribute('cx', lerp(A.x, B.x, t).toFixed(2))
      el.setAttribute('cy', lerp(A.y, B.y, t).toFixed(2))
      el.setAttribute('r', lerp(A.r, B.r, t).toFixed(2))
      el.setAttribute('fill', lerpHex(A.col, B.col, t))
      el.setAttribute('fill-opacity', lerp(A.op, B.op, t).toFixed(3))
      const cur = (t < 0.5 ? A : B).col
      el.style.filter =
        cur === ACCENT
          ? 'drop-shadow(0 0 6px rgba(134,66,255,.8))'
          : cur !== GRAY
            ? `drop-shadow(0 0 4px ${cur})`
            : ''
    }

    for (let i = 0; i < conns.length; i++) {
      const { a, b, ops } = conns[i]
      const NA = nodes[a]
      const NB = nodes[b]
      const el = lineEls[i]
      const Aa = NA[Ka]
      const Ab = NA[Kb]
      const Ba = NB[Ka]
      const Bb = NB[Kb]
      el.setAttribute('x1', lerp(Aa.x, Ab.x, t).toFixed(2))
      el.setAttribute('y1', lerp(Aa.y, Ab.y, t).toFixed(2))
      el.setAttribute('x2', lerp(Ba.x, Bb.x, t).toFixed(2))
      el.setAttribute('y2', lerp(Ba.y, Bb.y, t).toFixed(2))
      // Step-1-only edges fade out over the first half of the scroll so step 2
      // shows only the hub spokes; all others use the normal stage lerp.
      const op = conns[i].fast
        ? ops[0] * (1 - clamp(p / 0.5, 0, 1))
        : lerp(ops[si], ops[sj], t)
      el.setAttribute('stroke-opacity', op.toFixed(3))
    }
  }

  function destroy() {
    dotEls.forEach((el) => el.remove())
    lineEls.forEach((el) => el.remove())
  }

  return { render, destroy }
}
