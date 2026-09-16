import artwork from '../../assets/naura-wordmark.svg?raw'

// Geometry comes from the supplied local SVG for both sizes of the logo.
// Extract path data only, without injecting SVG markup or embedded styles.
const paths = Array.from(artwork.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g), ([tag, d]) => ({
  d,
  initial: tag.includes('id="naura-initial"'),
}))

export function NauraLogo({
  variant = 'wordmark',
  width = variant === 'mark' ? 42.4 : 223.31,
  height,
  decorative = false,
  className = '',
  ...props
}) {
  const compact = variant === 'mark'
  const viewWidth = compact ? 42.4 : 223.31
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`naura-logo ${className}`.trim()}
      viewBox={`0 0 ${viewWidth} 19`}
      width={width}
      height={height ?? width * 19 / viewWidth}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Naura'}
      aria-hidden={decorative || undefined}
      focusable="false"
      {...props}
    >
      {paths.filter((path) => !compact || path.initial).map(({ d }) => <path d={d} key={d} />)}
    </svg>
  )
}
