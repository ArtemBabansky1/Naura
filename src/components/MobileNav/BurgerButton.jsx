/**
 * Shared burger trigger — a circular glass button whose three lines morph to an
 * X when `open`. Used twice at ≤1199: as the STATIC button in the hero nav and
 * as the FLOATING button that flies in on scroll-up (MobileNav). Both open the
 * same drawer, so the look must be identical — hence one component.
 *
 * @param {boolean}  open      - drawer open state (drives the ☰ ↔ ✕ morph)
 * @param {Function} onClick   - toggle handler
 * @param {string}   className - positioning class (.hero-nav__burger / .mobile-nav__burger)
 * @param {string}   label     - accessible label (open vs close)
 * @param {string}   controls  - id of the controlled drawer panel
 * @param {object}   innerRef  - optional ref forwarded to the <button>
 */
export default function BurgerButton({ open, onClick, className = '', label, controls, innerRef }) {
  return (
    <button
      ref={innerRef}
      type="button"
      className={`burger-button ${className}`.trim()}
      aria-label={label}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
    >
      <span className={`burger-icon${open ? ' is-open' : ''}`} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  )
}
