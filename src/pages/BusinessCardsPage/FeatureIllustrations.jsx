import { useRef } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { SampleCode } from './CinematicScenes'
import { NauraLogo } from '../../components/NauraLogo/NauraLogo'
import './FeatureIllustrations.css'

// One drawing system for all six scenes. SVG coordinates keep the miniature
// cards, symbols and connectors in proportion at every tile width.
const ENTRANCES = {
  rise: 'translateY(18px) scale(.97)',
  left: 'translateX(-18px)',
  right: 'translateX(18px)',
  pop: 'scale(.82)',
  turn: 'rotate(-50deg) scale(.9)',
  fade: 'none',
}

// Animate an outer group so the drawing's own SVG transforms stay untouched.
function IllustrationPart({ children, delay = 0, from = 'rise' }) {
  return (
    <g className="nf-reveal-part" style={{
      '--nf-enter-delay': `${delay + 0.16}s`,
      '--nf-enter-from': ENTRANCES[from],
    }}>
      {children}
    </g>
  )
}

function Avatar({ x, y, size = 32, tone = 'olive' }) {
  return (
    <g className={`nf-avatar nf-avatar--${tone}`} transform={`translate(${x} ${y}) scale(${size / 32})`}>
      <circle cx="16" cy="16" r="16" className={`nf-fill-${tone}`} />
      <circle cx="16" cy="12" r="5" className="nf-fill-ink" opacity=".65" />
      <path d="M6 27c0-6 4-10 10-10s10 4 10 10" className="nf-fill-ink" opacity=".65" />
    </g>
  )
}

function Check({ x, y, tone = 'olive' }) {
  return (
    <g className="nf-check" transform={`translate(${x} ${y})`}>
      <circle r="11" className={`nf-fill-${tone}`} />
      <path d="m-4 0 3 3 5-6" className="nf-stroke-ink" fill="none" strokeWidth="1.6" />
    </g>
  )
}

function ProfileCard({ x, y, tone = 'paper', variant = 'full' }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="112" height="152" rx="14" className={`nf-fill-${tone} nf-card-edge`} />
      <NauraLogo variant="mark" x={14} y={15} width={32} className="nf-brand" decorative />
      <Avatar x={14} y={44} size={32} tone={tone === 'olive' ? 'paper' : 'olive'} />
      <rect x="14" y="89" width="56" height="5" rx="2.5" className="nf-fill-ink" opacity=".65" />
      <rect x="14" y="101" width="38" height="3" rx="1.5" className="nf-fill-ink" opacity=".25" />
      {variant === 'full' && <>
        <path d="M14 116h84" className="nf-stroke-ink" opacity=".15" />
        <rect x="14" y="130" width="31" height="3" rx="1.5" className="nf-fill-ink" opacity=".35" />
        <SampleCode className="nf-code" x="77" y="122" width="21" height="21" />
      </>}
    </g>
  )
}

function QrIllustration() {
  return (
    <>
      <IllustrationPart from="fade">
        <path d="M88 60V42h18m108 0h18v18M88 180v18h18m108 0h18v-18" className="nf-guide" />
      </IllustrationPart>
      <IllustrationPart delay={0.08}>
        <rect x="103" y="36" width="114" height="168" rx="16" className="nf-fill-paper" />
        <NauraLogo variant="mark" x={120} y={51} width={32} className="nf-brand" decorative />
        <rect x="126" y="183" width="68" height="3" rx="1.5" className="nf-fill-ink" opacity=".22" />
      </IllustrationPart>
      <IllustrationPart delay={0.3} from="pop">
        <SampleCode className="nf-code" x="117" y="81" width="86" height="86" />
      </IllustrationPart>
      <IllustrationPart delay={0.56} from="pop"><Check x={216} y={195} /></IllustrationPart>
    </>
  )
}

function MultipleIllustration() {
  return (
    <>
      <IllustrationPart><ProfileCard x={30} y={28} tone="olive" /></IllustrationPart>
      <IllustrationPart delay={0.16}><ProfileCard x={104} y={44} tone="sand" /></IllustrationPart>
      <IllustrationPart delay={0.32}><ProfileCard x={178} y={60} /></IllustrationPart>
    </>
  )
}

function LinksIllustration() {
  return (
    <>
      <IllustrationPart delay={0.24} from="fade">
        <path d="M83 106H62q-12 0-12-12V72m186 34h22q12 0 12-12V72M160 166v32" className="nf-guide" />
      </IllustrationPart>
      <IllustrationPart>
        <rect x="80" y="66" width="160" height="108" rx="16" className="nf-fill-paper nf-card-edge" />
        <Avatar x={96} y={83} size={30} />
        <NauraLogo variant="mark" x={138} y={85} width={32} className="nf-brand" decorative />
        <rect x="138" y="107" width="59" height="3" rx="1.5" className="nf-fill-ink" opacity=".25" />
        <rect x="96" y="131" width="128" height="26" rx="7" className="nf-fill-canvas" />
        <path d="m107 144 4 4 7-8" className="nf-stroke-ink" fill="none" strokeWidth="1.5" />
        <rect x="127" y="143" width="75" height="3" rx="1.5" className="nf-fill-ink" opacity=".4" />
      </IllustrationPart>
      <IllustrationPart delay={0.38} from="pop">
        <rect x="25" y="25" width="50" height="50" rx="14" className="nf-fill-paper" />
        <g className="nf-stroke-ink" fill="none" strokeWidth="1.5">
          <circle cx="50" cy="50" r="12" />
          <ellipse cx="50" cy="50" rx="5" ry="12" />
          <path d="M38 50h24" />
        </g>
      </IllustrationPart>
      <IllustrationPart delay={0.48} from="pop">
        <rect x="245" y="25" width="50" height="50" rx="14" className="nf-fill-paper" />
        <path d="m256 47 26-9-6 23-9-8-6 5 1-10 20-10" className="nf-stroke-ink" fill="none" strokeWidth="1.5" />
      </IllustrationPart>
      <IllustrationPart delay={0.58} from="pop">
        <rect x="135" y="183" width="50" height="38" rx="12" className="nf-fill-paper" />
        <path d="m155 203 10-6a4 4 0 0 1 4 7l-6 4m-6-8-6 4a4 4 0 0 0 4 7l9-5" className="nf-stroke-ink" fill="none" strokeWidth="1.5" />
      </IllustrationPart>
    </>
  )
}

function CaptureIllustration() {
  return (
    <>
      <IllustrationPart from="left">
        <rect x="34" y="64" width="84" height="112" rx="14" className="nf-fill-olive nf-card-edge" />
        <Avatar x={59} y={82} size={34} tone="paper" />
        <rect x="51" y="130" width="50" height="4" rx="2" className="nf-fill-ink" opacity=".6" />
        <rect x="59" y="142" width="34" height="3" rx="1.5" className="nf-fill-ink" opacity=".25" />
      </IllustrationPart>
      <IllustrationPart delay={0.24} from="left">
        <path d="M118 120h24m-5-5 5 5-5 5" className="nf-guide nf-guide--ink" />
      </IllustrationPart>
      <IllustrationPart delay={0.12}>
        <rect x="150" y="32" width="136" height="176" rx="16" className="nf-fill-paper nf-card-edge" />
        <NauraLogo variant="mark" x={166} y={47} width={32} className="nf-brand" decorative />
      </IllustrationPart>
      {[0, 1, 2].map((row) => (
        <IllustrationPart key={row} delay={0.36 + row * 0.12} from="left">
          <g transform={`translate(0 ${row * 40})`}>
            <Avatar x={166} y={76} size={27} tone={['olive', 'sand', 'canvas'][row]} />
            <rect x="202" y="83" width="42" height="4" rx="2" className="nf-fill-ink" opacity=".6" />
            <rect x="202" y="94" width="28" height="3" rx="1.5" className="nf-fill-ink" opacity=".22" />
            <path d="m258 89 3 3 5-6" className="nf-stroke-ink" fill="none" strokeWidth="1.5" />
          </g>
        </IllustrationPart>
      ))}
    </>
  )
}

function UpdatesIllustration() {
  return (
    <>
      <IllustrationPart from="left"><ProfileCard x={22} y={44} tone="sand" /></IllustrationPart>
      <IllustrationPart delay={0.16} from="right"><ProfileCard x={186} y={44} /></IllustrationPart>
      <IllustrationPart delay={0.3} from="fade">
        <path d="M80 29c43-21 117-21 160 0m-3-10 3 10-11 1M240 211c-43 21-117 21-160 0m3 10-3-10 11-1" className="nf-guide" />
      </IllustrationPart>
      <IllustrationPart delay={0.4} from="turn">
        <circle cx="160" cy="120" r="23" className="nf-fill-rust" />
        <g className="nf-stroke-paper" strokeWidth="1.7" fill="none">
          <path d="M150 118a10 10 0 0 1 18-5m0-6v6h-6M170 122a10 10 0 0 1-18 5m0 6v-6h6" />
        </g>
      </IllustrationPart>
      <IllustrationPart delay={0.64} from="pop"><Check x={290} y={188} /></IllustrationPart>
    </>
  )
}

function CustomizeIllustration() {
  return (
    <>
      <IllustrationPart>
        <rect x="144" y="28" width="130" height="176" rx="16" className="nf-fill-olive" />
        <NauraLogo variant="mark" x={160} y={44} width={32} className="nf-brand" decorative />
        <Avatar x={160} y={74} size={38} tone="paper" />
        <rect x="160" y="129" width="68" height="5" rx="2.5" className="nf-fill-ink" opacity=".65" />
        <rect x="160" y="142" width="44" height="3" rx="1.5" className="nf-fill-ink" opacity=".3" />
        <path d="M160 166h97" className="nf-stroke-ink" opacity=".2" />
        <rect x="160" y="183" width="39" height="3" rx="1.5" className="nf-fill-ink" opacity=".45" />
        <SampleCode className="nf-code" x="234" y="173" width="22" height="22" />
      </IllustrationPart>
      <IllustrationPart delay={0.2} from="left">
        <rect x="34" y="68" width="138" height="112" rx="16" className="nf-fill-paper nf-card-edge" />
        <text x="52" y="121" className="nf-type">Aa</text>
        <path d="M129 91h22m-22 8h15m-15 8h18" className="nf-stroke-ink" strokeWidth="2" opacity=".35" />
      </IllustrationPart>
      <IllustrationPart delay={0.4} from="pop"><circle cx="62" cy="151" r="9" className="nf-fill-canvas nf-card-edge" /></IllustrationPart>
      <IllustrationPart delay={0.48} from="pop"><circle cx="91" cy="151" r="9" className="nf-fill-olive" /></IllustrationPart>
      <IllustrationPart delay={0.56} from="pop"><circle cx="120" cy="151" r="9" className="nf-fill-rust" /></IllustrationPart>
      <IllustrationPart delay={0.68} from="pop"><path d="m87 151 3 3 5-6" className="nf-stroke-ink" fill="none" strokeWidth="1.5" /></IllustrationPart>
    </>
  )
}

const ILLUSTRATIONS = [
  QrIllustration,
  MultipleIllustration,
  LinksIllustration,
  CaptureIllustration,
  UpdatesIllustration,
  CustomizeIllustration,
]

export function FeatureVisual({ index }) {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(root, { once: true, amount: 0.4, margin: '0px 0px -10% 0px' })
  const Illustration = ILLUSTRATIONS[index]
  return (
    <div ref={root} className="nc-feature-art" aria-hidden="true" data-reveal={reduced ? 'static' : inView ? 'visible' : 'pending'}>
      <svg className="nf-illustration" viewBox="0 0 320 240" fill="none" focusable="false">
        <Illustration />
      </svg>
    </div>
  )
}
