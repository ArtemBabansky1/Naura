import './CardVisual.css'
import { NauraLogo } from '../../components/NauraLogo/NauraLogo'

const QR_MODULES = [
  [40, 5, 10, 5], [55, 5, 5, 10], [65, 5, 15, 5], [85, 5, 10, 10],
  [35, 15, 10, 10], [50, 15, 5, 5], [65, 15, 5, 10], [75, 15, 15, 5],
  [40, 30, 5, 10], [50, 25, 15, 5], [70, 25, 5, 15], [80, 25, 15, 10],
  [5, 40, 10, 5], [20, 35, 15, 10], [40, 45, 10, 10], [55, 35, 10, 15],
  [70, 45, 10, 5], [85, 40, 10, 15], [5, 55, 5, 15], [15, 50, 15, 10],
  [35, 60, 15, 5], [55, 55, 5, 15], [65, 55, 15, 10], [85, 60, 10, 5],
  [35, 75, 10, 10], [50, 70, 15, 5], [70, 70, 5, 15], [80, 70, 15, 10],
  [40, 90, 15, 5], [60, 85, 10, 10], [75, 90, 5, 5], [85, 85, 10, 10],
]

function QrPattern({ className = '' }) {
  return (
    <svg
      className={`card-visual__qr-pattern ${className}`.trim()}
      viewBox="0 0 100 100"
      focusable="false"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5 5h25v25H5V5Zm5 5v15h15V10H10Zm60-5h25v25H70V5Zm5 5v15h15V10H75ZM5 70h25v25H5V70Zm5 5v15h15V75H10Z"
      />
      <path d="M15 15h5v5h-5zM80 15h5v5h-5zM15 80h5v5h-5z" />
      {QR_MODULES.map(([x, y, width, height]) => (
        <rect key={`${x}-${y}-${width}-${height}`} x={x} y={y} width={width} height={height} />
      ))}
    </svg>
  )
}

function Portrait({ portrait, initials, context }) {
  if (typeof portrait === 'function') {
    return portrait({ context })
  }

  if (typeof portrait === 'string') {
    return <img src={portrait} alt="" loading="lazy" decoding="async" />
  }

  if (portrait) return portrait

  return <span className="card-visual__portrait-fallback">{initials}</span>
}

export default function CardVisual({
  portrait,
  initials = 'AK',
  name = 'Alex Kim',
  role = 'Product designer',
  company = 'Independent studio',
  email = 'hello@alexkim.design',
  phone = '+44 20 7946 0958',
  website = 'alexkim.design',
  eyebrow = 'Digital identity',
  actionLabel = 'Save contact',
  emailLabel = 'Email',
  phoneLabel = 'Phone',
  websiteLabel = 'Web',
  statusLabel = 'Live profile',
  variant = 'hero',
  compact = false,
  cardOnly = false,
  decorative = true,
  ariaLabel = 'Digital business card preview',
  className = '',
}) {
  const mode = variant === 'journey' ? 'journey' : 'hero'
  const rootClassName = [
    'card-visual',
    `card-visual--${mode}`,
    compact && 'card-visual--compact',
    cardOnly && 'card-visual--card-only',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={rootClassName}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : 'img'}
    >
      <span className="card-visual__glow" />

      <div className="card-visual__phone-shell">
        <span className="card-visual__phone-button card-visual__phone-button--top" />
        <span className="card-visual__phone-button card-visual__phone-button--bottom" />
        <div className="card-visual__phone">
          <span className="card-visual__island" />

          <div className="card-visual__phone-screen">
            <div className="card-visual__phone-brand">
              <NauraLogo variant="mark" width={32} decorative={decorative} />
              <i />
            </div>

            <div className="card-visual__phone-portrait">
              <Portrait portrait={portrait} initials={initials} context="phone" />
            </div>

            <div className="card-visual__phone-identity">
              <strong>{name}</strong>
              <span>{role}</span>
            </div>

            <span className="card-visual__phone-action">{actionLabel}</span>

            <div className="card-visual__phone-links">
              <span />
              <span />
              <span />
            </div>

            <div className="card-visual__phone-qr">
              <QrPattern />
            </div>
          </div>
        </div>
      </div>

      <div className="card-visual__card-shell">
        <article className="card-visual__card">
          <header className="card-visual__card-header">
            <NauraLogo className="card-visual__wordmark" width={112} decorative={decorative} />
            <span className="card-visual__eyebrow">
              <i />
              {eyebrow}
            </span>
          </header>

          <div className="card-visual__card-main">
            <div className="card-visual__identity">
              <div className="card-visual__portrait">
                <Portrait portrait={portrait} initials={initials} context="card" />
              </div>
              <div className="card-visual__identity-copy">
                <strong>{name}</strong>
                <span>{role}</span>
                <small>{company}</small>
              </div>
            </div>

            <div className="card-visual__qr">
              <QrPattern />
            </div>
          </div>

          <footer className="card-visual__details">
            <span>
              <small>{emailLabel}</small>
              <b>{email}</b>
            </span>
            <span>
              <small>{phoneLabel}</small>
              <b>{phone}</b>
            </span>
            <span>
              <small>{websiteLabel}</small>
              <b>{website}</b>
            </span>
          </footer>
        </article>
      </div>

      <span className="card-visual__status">
        <i />
        {statusLabel}
      </span>
    </div>
  )
}
