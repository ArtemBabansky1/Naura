import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import './AgentTerminal.css'

/* AgentTerminal — the AI-agents demo, rebuilt as a *live* terminal chat.
 * A scripted session types itself out: the MCP `claude mcp add` command (typed
 * like a human), the connect output, then a You ↔ Claude exchange where Claude
 * "thinks" then streams its reply. Loops while in view; renders the finished
 * transcript statically for reduced-motion users. Colours mirror the original
 * Figma mock (traffic-light dots + the prior transcript's syntax palette). */

// ── Scripted content (from the design, extended with a second turn) ──────────
const CMD = [
  { t: '$ ', cls: 'prompt' },
  { t: 'claude mcp add ' },
  { t: '--transport http naura', cls: 'red' },
  { t: ' \\\n  https://api.naura.io/mcp \\\n  ' },
  { t: '--header "Authorization: Bearer naura_pat__…"', cls: 'green' },
]

const OUT = [
  { t: '→ Connected. ' },
  { t: 'naura', cls: 'accent' },
  { t: ' exposes ' },
  { t: '12', cls: 'accent' },
  { t: ' tools\n' },
  { t: 'search_contacts · find_warm_path · log_interaction · …', cls: 'dim' },
]

const USER1 = [{ t: "Who do I know that's done a Series A in fintech?" }]

const CLAUDE1 = [
  { t: 'You have ' },
  { t: '3 warm paths', cls: 'b' },
  { t: '. Strongest: ' },
  { t: 'Anna Sokolova', cls: 'b' },
  { t: ' — 2 handshakes via ' },
  { t: 'Pavel Ivanov', cls: 'b' },
  { t: '.\n' },
  { t: "Want me to draft the intro? I'll mirror your last 4 successful intros — short, no bcc, ask permission.", cls: 'dim' },
]

const CHIPS1 = ['Draft intro', 'Show all 3 paths', 'Skip']

const USER2 = [{ t: 'Draft it.' }]

const CLAUDE2 = [
  { t: "On it — draft's in your " },
  { t: 'Outbox', cls: 'b' },
  { t: ', mirrored from your Pavel intro. Send as-is?\n' },
  { t: 'Kept it to 3 lines · no bcc · clean opt-out for Anna.', cls: 'dim' },
]

const CHIPS2 = ['Send now', 'Tweak opener', 'Later']

const SCRIPT = [
  { kind: 'cmd', segments: CMD },
  { kind: 'output', segments: OUT },
  { kind: 'label', text: 'agent transcript' },
  { kind: 'user', segments: USER1 },
  { kind: 'claude', segments: CLAUDE1 },
  { kind: 'chips', chips: CHIPS1 },
  { kind: 'user', segments: USER2 },
  { kind: 'claude', segments: CLAUDE2 },
  { kind: 'chips', chips: CHIPS2 },
]

// ── Timing (ms) — ~3× faster; plays through once, no loop ────────────────────
const START_DELAY = 130
const USER_LEAD = 160 // pause before the human "starts typing"
const OUTPUT_LEAD = 120
const CHIPS_LEAD = 90
const THINK_MS = 250 // Claude's pondering beat before it streams
const CMD_SPEED = 5
const USER_SPEED = 11
const CLAUDE_SPEED = 5
const JITTER = 9 // human-typing irregularity
// One React update per tick (typing several chars at once), not per keystroke —
// per-char setState at 5-11ms churned the main thread while the page scrolls.
const TYPE_TICK = 35

const TYPED_KINDS = ['cmd', 'user', 'claude']
const CURSOR_KINDS = ['cmd', 'user', 'claude', 'prompt']

const total = (segments) => segments.reduce((sum, s) => sum + s.t.length, 0)

// ── Cancellable timer pool ───────────────────────────────────────────────────
function makeSignal() {
  return { cancelled: false, timers: new Set() }
}

function sleep(ms, signal) {
  return new Promise((resolve) => {
    if (signal.cancelled) return resolve()
    const entry = { resolve }
    entry.id = setTimeout(() => {
      signal.timers.delete(entry)
      resolve()
    }, ms)
    signal.timers.add(entry)
  })
}

function cancel(signal) {
  signal.cancelled = true
  signal.timers.forEach((e) => {
    clearTimeout(e.id)
    e.resolve()
  })
  signal.timers.clear()
}

// ── Item helpers (stable ids so React keeps row mount/animation state) ───────
let _id = 0
const nid = () => ++_id

const push = (setItems, item) => setItems((prev) => [...prev, { id: nid(), ...item }])

const patchLast = (setItems, patch) =>
  setItems((prev) => {
    if (!prev.length) return prev
    const next = [...prev]
    next[next.length - 1] = { ...next[next.length - 1], ...patch }
    return next
  })

// Finished transcript for reduced-motion (everything fully revealed).
function buildFinal() {
  return SCRIPT.map((step) => {
    if (TYPED_KINDS.includes(step.kind)) {
      const len = total(step.segments)
      return { id: nid(), kind: step.kind, segments: step.segments, typed: len, done: true }
    }
    if (step.kind === 'output') {
      return { id: nid(), kind: 'output', segments: step.segments, typed: Infinity }
    }
    if (step.kind === 'label') return { id: nid(), kind: 'label', text: step.text }
    return { id: nid(), kind: 'chips', chips: step.chips }
  })
}

// ── The scripted run ─────────────────────────────────────────────────────────
async function playStep(step, signal, setItems) {
  if (TYPED_KINDS.includes(step.kind)) {
    const len = total(step.segments)

    if (step.kind === 'claude') {
      push(setItems, { kind: 'claude', segments: step.segments, typed: 0, thinking: true })
      await sleep(THINK_MS, signal)
      if (signal.cancelled) return
      patchLast(setItems, { thinking: false })
    } else {
      if (step.kind === 'user') {
        await sleep(USER_LEAD, signal)
        if (signal.cancelled) return
      }
      push(setItems, { kind: step.kind, segments: step.segments, typed: 0 })
    }

    const speed = step.kind === 'user' ? USER_SPEED : step.kind === 'claude' ? CLAUDE_SPEED : CMD_SPEED
    // Same chars-per-second pace as the old per-char loop, batched per tick.
    const perTick = Math.max(1, Math.round(TYPE_TICK / speed))
    let typed = 0
    while (typed < len) {
      if (signal.cancelled) return
      typed = Math.min(len, typed + perTick)
      patchLast(setItems, { typed })
      const jitter = step.kind === 'claude' ? 0 : Math.random() * JITTER
      await sleep(TYPE_TICK + jitter, signal)
    }
    patchLast(setItems, { done: true })
    return
  }

  if (step.kind === 'output') {
    await sleep(OUTPUT_LEAD, signal)
    if (signal.cancelled) return
    push(setItems, { kind: 'output', segments: step.segments, typed: Infinity })
    return
  }

  if (step.kind === 'label') {
    push(setItems, { kind: 'label', text: step.text })
    return
  }

  if (step.kind === 'chips') {
    await sleep(CHIPS_LEAD, signal)
    if (signal.cancelled) return
    push(setItems, { kind: 'chips', chips: step.chips })
  }
}

async function run(signal, setItems) {
  setItems([])
  await sleep(START_DELAY, signal)
  for (const step of SCRIPT) {
    if (signal.cancelled) return
    await playStep(step, signal, setItems)
  }
  if (signal.cancelled) return
  push(setItems, { kind: 'prompt' }) // trailing blinking prompt, held
}

// ── Render fragments ─────────────────────────────────────────────────────────
function Typed({ segments, n }) {
  let remaining = n
  return segments.map((s, i) => {
    if (remaining <= 0) return null
    const slice = s.t.slice(0, remaining)
    remaining -= slice.length
    return (
      <span key={i} className={s.cls ? `tk tk--${s.cls}` : undefined}>
        {slice}
      </span>
    )
  })
}

function Thinking() {
  return (
    <span className="term__thinking">
      <span className="term__dotdot" />
      <span className="term__dotdot" />
      <span className="term__dotdot" />
    </span>
  )
}

const Cursor = () => <span className="term__cursor" />

export default function AgentTerminal() {
  const rootRef = useRef(null)
  const prefersReduced = useReducedMotion()
  const [items, setItems] = useState(() => (prefersReduced ? buildFinal() : []))

  useEffect(() => {
    if (prefersReduced) {
      setItems(buildFinal())
      return
    }
    const root = rootRef.current
    if (!root) return

    const signal = makeSignal()
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect() // first time in view only — never restarts
        run(signal, setItems)
      },
      { threshold: 0.25 },
    )
    io.observe(root)

    return () => {
      io.disconnect()
      cancel(signal)
    }
  }, [prefersReduced])

  return (
    <div className="term" ref={rootRef} aria-hidden="true">
      <div className="term__bar">
        <span className="term__dot term__dot--r" />
        <span className="term__dot term__dot--y" />
        <span className="term__dot term__dot--g" />
        <span className="term__title">~/projects · zsh</span>
      </div>

      <div className="term__body">
        <div className="term__log">
          {items.map((it, idx) => {
            const last = idx === items.length - 1
            const cursor = last && !prefersReduced && CURSOR_KINDS.includes(it.kind) && !it.thinking

            if (it.kind === 'chips') {
              return (
                <div key={it.id} className="term__chips">
                  {it.chips.map((c) => (
                    <span key={c} className="term__chip">
                      {c}
                    </span>
                  ))}
                </div>
              )
            }

            if (it.kind === 'label') {
              return (
                <div key={it.id} className="term__label">
                  {it.text}
                </div>
              )
            }

            if (it.kind === 'prompt') {
              return (
                <div key={it.id} className="term__row term__row--cmd">
                  <span className="term__text">
                    <span className="tk tk--prompt">$ </span>
                    {cursor && <Cursor />}
                  </span>
                </div>
              )
            }

            return (
              <div key={it.id} className={`term__row term__row--${it.kind}`}>
                {it.kind === 'user' && <span className="term__badge term__badge--you">You</span>}
                {it.kind === 'claude' && <span className="term__badge term__badge--claude">Claude</span>}
                <span className="term__text">
                  {it.thinking ? (
                    <Thinking />
                  ) : (
                    <>
                      <Typed segments={it.segments} n={it.typed} />
                      {cursor && <Cursor />}
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
