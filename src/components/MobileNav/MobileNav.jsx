import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMediaQuery, BELOW_DESKTOP_QUERY } from '../../hooks/useMediaQuery'
import { useRevealOnScrollUp } from '../../hooks/useRevealOnScrollUp'
import { lockScroll, unlockScroll } from '../../lib/scrollLock'
import { APP_URL } from '../../lib/urls'
import BurgerButton from './BurgerButton'
import './MobileNav.css'

// Single source of the nav links — mirrors the desktop hero-nav / FloatingNav.
const LINKS = [
  { href: '#features', key: 'nav.businessCards' },
  { href: '#communities', key: 'nav.communities' },
  { href: '#', key: 'nav.blog' },
  { href: '#', key: 'nav.about' },
]

/**
 * The drawer half of the ≤1199 navigation, plus the FLOATING burger that flies
 * in from below on scroll-up — mirroring the desktop FloatingNav. The STATIC
 * burger lives in the hero nav (HeroSection) and scrolls away with it; both
 * triggers share this drawer via the lifted `open` / `setOpen` state in App.
 *
 * Hardening: scroll lock via lenis.stop() (not just overflow), focus trap + Esc,
 * focus returns to whichever burger opened it, and auto-close when the viewport
 * grows back past the breakpoint so no locked-but-invisible state can persist.
 *
 * @param {boolean}  open    - shared drawer open state
 * @param {Function} setOpen - shared setter
 */
export default function MobileNav({ open, setOpen }) {
  const { t, i18n } = useTranslation('hero')
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_QUERY)
  const isRevealed = useRevealOnScrollUp('hero')
  const prefersReduced = useReducedMotion()
  const panelRef = useRef(null)

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en')
  }

  function close() {
    setOpen(false)
  }

  // If the viewport grows back to desktop while the drawer is open, close it so
  // the scroll lock is released and no invisible-but-locked state lingers.
  useEffect(() => {
    if (!isBelowDesktop && open) setOpen(false)
  }, [isBelowDesktop, open, setOpen])

  // While open: lock scroll, trap focus, Esc to close, restore focus on close.
  useEffect(() => {
    if (!open) return
    // Whichever burger (static hero or floating) had focus when the drawer
    // opened is where focus returns on close.
    const opener = document.activeElement
    lockScroll()

    const panel = panelRef.current
    const focusables = panel
      ? panel.querySelectorAll('a[href], button:not([disabled])')
      : []
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    first?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab' || focusables.length === 0) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [open, setOpen])

  const overlayMotion = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      }

  const panelMotion = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <div className="mobile-nav">
      {/* Full-width fixed dock right-padded by the hero gutter, so the floating
          burger lands on the exact X of the static hero-nav burger. */}
      <div className={`mobile-nav__dock${isRevealed ? ' is-revealed' : ''}`}>
        <BurgerButton
          open={open}
          onClick={() => setOpen((v) => !v)}
          className="mobile-nav__burger"
          label={open ? t('nav.menuClose') : t('nav.menuOpen')}
          controls="mobile-nav-panel"
        />
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="mobile-nav__overlay"
              onClick={close}
              {...overlayMotion}
            >
              <motion.div
                id="mobile-nav-panel"
                ref={panelRef}
                className="mobile-nav__panel"
                role="dialog"
                aria-modal="true"
                aria-label={t('nav.menuTitle')}
                onClick={(e) => e.stopPropagation()}
                {...panelMotion}
              >
                <nav className="mobile-nav__links" aria-label={t('nav.ariaLabel')}>
                  {LINKS.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      className="mobile-nav__link"
                      onClick={close}
                    >
                      {t(link.key)}
                    </a>
                  ))}
                </nav>

                <div className="mobile-nav__actions">
                  <button
                    type="button"
                    className="mobile-nav__lang"
                    onClick={toggleLang}
                  >
                    {i18n.language === 'en' ? 'RU' : 'EN'}
                  </button>
                  <a href={APP_URL} className="mobile-nav__btn mobile-nav__btn--ghost" onClick={close}>
                    {t('nav.signIn')}
                  </a>
                  <a href={APP_URL} className="mobile-nav__btn mobile-nav__btn--primary" onClick={close}>
                    {t('nav.getStarted')}
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
