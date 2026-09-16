import './ChevronRight.css'

// Matches the original “Create for free” icon in chevron-right-2.svg.
export function ChevronRight({ className = '' }) {
  return (
    <svg
      className={`naura-chevron ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
