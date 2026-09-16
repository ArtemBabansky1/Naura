import { useRef } from "react"
import { useInView, useReducedMotion } from "motion/react"

// The same 320 × 240 miniature UI and staggered entrance vocabulary as the
// digital-card feature illustrations, with scenes specific to Meets.
const ENTRANCES = { rise: "translateY(18px) scale(.97)", left: "translateX(-18px)", right: "translateX(18px)", pop: "scale(.82)" }

function Part({ children, delay = 0, from = "rise" }) {
  return <g className="meets-matching__art-part" style={{ "--matching-enter-delay": `${delay + .16}s`, "--matching-enter-from": ENTRANCES[from] }}>{children}</g>
}

function Avatar({ x, y, tone = "olive" }) {
  return <g className="meets-matching__art-avatar" transform={`translate(${x} ${y})`}>
    <circle cx="20" cy="20" r="20" className={`meets-matching__art-${tone}`} />
    <circle cx="20" cy="15" r="6" className="meets-matching__art-ink" opacity=".65" />
    <path d="M7 35c1-8 6-12 13-12s12 4 13 12" className="meets-matching__art-ink" opacity=".65" />
  </g>
}

function Check({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><circle r="15" className="meets-matching__art-ink meets-matching__art-selected" /><path d="m-6 0 4 4 8-9" className="meets-matching__art-check" /></g>
}

function ProfileIllustration() {
  return <>
    <Part><rect x="55" y="25" width="190" height="190" rx="20" className="meets-matching__art-sand" /></Part>
    <Part delay={.1}><Avatar x={75} y={45} /><rect x="130" y="55" width="85" height="5" rx="2.5" className="meets-matching__art-ink" opacity=".65" /><rect x="130" y="70" width="55" height="3" rx="1.5" className="meets-matching__art-ink" opacity=".25" /></Part>
    <Part delay={.25} from="right">
      <rect x="90" y="105" width="190" height="70" rx="15" className="meets-matching__art-paper meets-matching__art-edge" />
      <rect x="105" y="120" width="85" height="4" rx="2" className="meets-matching__art-ink" opacity=".45" />
      {[0, 1, 2].map(i => <rect key={i} x={105 + i * 50} y="140" width="40" height="20" rx="10" className={i === 1 ? "meets-matching__art-ink meets-matching__art-selected" : "meets-matching__art-olive"} />)}
      <path d="m170 149 3 3 6-6" className="meets-matching__art-check" />
    </Part>
    <Part delay={.4}><rect x="75" y="190" width="90" height="4" rx="2" className="meets-matching__art-ink" opacity=".25" /></Part>
    <Part delay={.55} from="pop"><Check x={240} y={200} /></Part>
  </>
}

function FeedbackIllustration() {
  return <>
    <Part from="left"><rect x="30" y="40" width="150" height="100" rx="20" className="meets-matching__art-olive" /><Avatar x={45} y={55} tone="paper" /><rect x="100" y="65" width="55" height="4" rx="2" className="meets-matching__art-ink" opacity=".45" /><rect x="100" y="80" width="40" height="3" rx="1.5" className="meets-matching__art-ink" opacity=".25" /><path d="M50 115h105" className="meets-matching__art-line" opacity=".2" /></Part>
    <Part delay={.15} from="right"><rect x="115" y="100" width="180" height="105" rx="20" className="meets-matching__art-paper meets-matching__art-edge" /><rect x="135" y="120" width="100" height="4" rx="2" className="meets-matching__art-ink" opacity=".45" /><rect x="135" y="132" width="65" height="3" rx="1.5" className="meets-matching__art-ink" opacity=".25" /></Part>
    {[0, 1, 2].map(i => <Part key={i} delay={.3 + i * .12} from="pop"><g transform={`translate(${150 + i * 45} 170)`}><circle r="15" className={i === 2 ? "meets-matching__art-ink meets-matching__art-selected" : "meets-matching__art-sand"} /><path d="M-6-2h.1M6-2h.1M-6 4q6 7 12 0" className={i === 2 ? "meets-matching__art-check" : "meets-matching__art-line"} /></g></Part>)}
    <Part delay={.7} from="pop"><Check x={280} y={110} /></Part>
  </>
}

function WeekIllustration({ days }) {
  return <>
    <Part><rect x="35" y="35" width="250" height="170" rx="20" className="meets-matching__art-paper" /><path d="M90 25v25M230 25v25" className="meets-matching__art-line" strokeWidth="5" /><rect x="55" y="65" width="80" height="4" rx="2" className="meets-matching__art-ink" opacity=".45" /></Part>
    {days.map((day, i) => <Part key={day} delay={.1 + i * .06}><g transform={`translate(${55 + i * 30} 95)`}><rect width="25" height="40" rx="7" className={i === 5 ? "meets-matching__art-sand" : "meets-matching__art-canvas"} /><text x="12.5" y="15" className="meets-matching__art-day">{day}</text>{i === 5 ? <path d="m8 27 3 3 6-7" className="meets-matching__art-line" /> : <circle cx="12.5" cy="28" r="2" className="meets-matching__art-ink" opacity=".2" />}</g></Part>)}
    <Part delay={.6} from="pop"><rect x="55" y="155" width="100" height="30" rx="10" className="meets-matching__art-ink meets-matching__art-selected" /><path d="m97 170 5 5 9-10" className="meets-matching__art-check" /></Part>
    <Part delay={.7} from="pop"><rect x="165" y="155" width="100" height="30" rx="10" className="meets-matching__art-canvas" /><path d="M210 165l10 10m0-10-10 10" className="meets-matching__art-line" opacity=".5" /></Part>
  </>
}

export default function MatchingVisual({ index, days }) {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(root, { once: true, amount: .4, margin: "0px 0px -10% 0px" })
  return <div ref={root} className="meets-matching__visual" aria-hidden="true" data-reveal={reduced ? "static" : inView ? "visible" : "pending"}>
    <svg viewBox="0 0 320 240" fill="none" focusable="false">
      {index === 0 ? <ProfileIllustration /> : index === 1 ? <FeedbackIllustration /> : <WeekIllustration days={days} />}
    </svg>
  </div>
}
