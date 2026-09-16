import { useRef } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { NauraLogo } from '../../components/NauraLogo/NauraLogo'
import './CrmFeatureVisuals.css'

function Scene({ scene, children }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { once: true, amount: 0.4, margin: '0px 0px -10% 0px' })

  return (
    <div
      ref={ref}
      className={`crm-feature-art crm-feature-art--${scene}`}
      data-reveal={reduced ? 'static' : inView ? 'visible' : 'pending'}
      aria-hidden="true"
    >
      <svg className="crm-feature-art__svg" viewBox="0 0 320 240" fill="none" focusable="false">
        {children}
      </svg>
    </div>
  )
}

function Part({ children, delay = 0, from = 'rise' }) {
  return (
    <g
      className={`crm-feature-art__part crm-feature-art__part--${from}`}
      style={{ '--crm-art-delay': `${delay + 0.16}s` }}
    >
      {children}
    </g>
  )
}

function Avatar({ x, y, size = 32, tone = 'olive' }) {
  return (
    <g className={`crm-fi-avatar crm-fi-avatar--${tone}`} transform={`translate(${x} ${y}) scale(${size / 32})`}>
      <circle cx="16" cy="16" r="16" className={`crm-fi-fill--${tone}`} />
      <circle cx="16" cy="12" r="5" className="crm-fi-fill--ink" opacity=".65" />
      <path d="M6 27c0-6 4-10 10-10s10 4 10 10" className="crm-fi-fill--ink" opacity=".65" />
    </g>
  )
}

function Check({ x, y }) {
  return (
    <g className="crm-fi-check" transform={`translate(${x} ${y})`}>
      <circle r="11" className="crm-fi-fill--olive" />
      <path d="m-4 0 3 3 5-6" className="crm-fi-stroke--ink" fill="none" strokeWidth="1.6" />
    </g>
  )
}

function ProfileCard({ x, y, scale = 1, tone = 'paper' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect width="112" height="152" rx="14" className={`crm-fi-fill--${tone} crm-fi-card-edge`} />
      <NauraLogo variant="mark" x={14} y={15} width={32} className="crm-fi-brand" decorative />
      <Avatar x={14} y={44} size={32} tone={tone === 'olive' ? 'paper' : 'olive'} />
      <rect x="14" y="89" width="56" height="5" rx="2.5" className="crm-fi-fill--ink" opacity=".65" />
      <rect x="14" y="101" width="38" height="3" rx="1.5" className="crm-fi-fill--ink" opacity=".25" />
      <path d="M14 116h84" className="crm-fi-stroke--ink" opacity=".15" />
      <rect x="14" y="130" width="31" height="3" rx="1.5" className="crm-fi-fill--ink" opacity=".35" />
      <circle cx="91" cy="131" r="8" className="crm-fi-fill--canvas crm-fi-card-edge" />
      <path d="m87 131 3 3 5-6" className="crm-fi-stroke--ink" fill="none" strokeWidth="1.4" />
    </g>
  )
}

function HandshakePath() {
  return (
    <Scene scene="handshakePath">
      <Part from="left"><ProfileCard x={42} y={43} scale={0.95} tone="olive" /></Part>
      <Part delay={0.16} from="right"><ProfileCard x={172} y={43} scale={0.95} /></Part>
    </Scene>
  )
}

/* A forwarded Telegram message becomes a structured contact card. The
 * Telegram tile is pinned to the message's lower-right corner. */
function TelegramSave() {
  return (
    <Scene scene="telegramSave">
      <Part from="left">
        <rect x="18" y="64" width="112" height="108" rx="16" className="crm-fi-fill--paper crm-fi-card-edge" />
        <Avatar x={34} y={79} size={30} tone="sand" />
        <rect x="72" y="86" width="38" height="4" rx="2" className="crm-fi-fill--ink" opacity=".55" />
        <rect x="34" y="126" width="76" height="4" rx="2" className="crm-fi-fill--ink" opacity=".22" />
        <rect x="34" y="139" width="54" height="3" rx="1.5" className="crm-fi-fill--ink" opacity=".16" />
      </Part>
      <Part delay={0.18} from="pop">
        <rect x="92" y="132" width="50" height="50" rx="14" className="crm-fi-fill--paper crm-fi-card-edge" />
        <path d="m103 154 27-10-7 24-8-8-7 5 1-10 21-11" className="crm-fi-stroke--ink" fill="none" strokeWidth="1.5" />
      </Part>
      <Part delay={0.28} from="fade">
        <path d="M131 118h32m-7-7 7 7-7 7" className="crm-fi-guide crm-fi-guide--ink" />
      </Part>
      <Part delay={0.16} from="right"><ProfileCard x={178} y={30} scale={0.88} tone="olive" /></Part>
      <Part delay={0.52} from="pop"><Check x={281} y={171} /></Part>
    </Scene>
  )
}

function PersonTile({ x, y, tone = 'olive' }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="58" height="58" rx="15" className="crm-fi-fill--paper crm-fi-card-edge" />
      <Avatar x={14} y={14} size={30} tone={tone} />
    </g>
  )
}

function McpNetwork() {
  return (
    <Scene scene="mcpNetwork">
      <Part from="rise">
        <rect x="111" y="124" width="98" height="82" rx="17" className="crm-fi-fill--paper crm-fi-card-edge" />
        <NauraLogo variant="mark" x={126} y={139} width={30} className="crm-fi-brand" decorative />
        <text x="166" y="156" className="crm-fi-type crm-fi-type--label">MCP</text>
        <rect x="126" y="172" width="68" height="18" rx="7" className="crm-fi-fill--canvas" />
        <path d="m136 178 6 3-6 3m13 0h29" className="crm-fi-stroke--ink" fill="none" strokeWidth="1.4" />
      </Part>
      <Part delay={0.16} from="fade">
        <path d="M111 151H82m7-7-7 7 7 7M209 151h29m-7-7 7 7-7 7M160 124V88m-7 7 7-7 7 7" className="crm-fi-guide crm-fi-guide--ink" />
      </Part>
      <Part delay={0.3} from="left"><PersonTile x={20} y={122} tone="sand" /></Part>
      <Part delay={0.4} from="pop"><PersonTile x={131} y={26} /></Part>
      <Part delay={0.5} from="right"><PersonTile x={242} y={122} tone="olive" /></Part>
    </Scene>
  )
}

const SCENES = {
  handshakePath: HandshakePath,
  telegramSave: TelegramSave,
  mcpNetwork: McpNetwork,
}

export function CrmFeatureVisual({ scene }) {
  const Visual = SCENES[scene]
  return Visual ? <Visual /> : null
}
