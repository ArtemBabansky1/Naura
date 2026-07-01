import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LocaleLink } from '../LocaleLink/LocaleLink'
import { FormSelect } from './FormSelect'
import { lockScroll, unlockScroll } from '../../lib/scrollLock'
import './DemoModal.css'

const INITIAL = { fullName: '', email: '', phone: '', howHeard: '' }
const HOW_HEARD = ['search', 'social', 'friend', 'telegram', 'article', 'other']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'

const CheckIcon = () => (
  <svg className="demo-modal__check" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * "Get a demo" pop-up. Form on the left, company pitch on the right, legal links
 * along the bottom. Opened from the "Get a demo" (header) and "See how it works"
 * (hero) triggers via the DemoModal context. Submission is mocked (no backend) —
 * it resolves to a thank-you state.
 */
export function DemoModal({ open, onClose }) {
  const { t } = useTranslation('demoForm')
  const panelRef = useRef(null)
  const prefersReduced = useReducedMotion()

  const [fields, setFields] = useState(INITIAL)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorKey, setErrorKey] = useState(null)
  const submitting = status === 'submitting'

  const update = (key) => (e) => {
    const { value } = e.target
    setFields((prev) => ({ ...prev, [key]: value }))
    if (status === 'error') {
      setStatus('idle')
      setErrorKey(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullName = fields.fullName.trim()
    const email = fields.email.trim()
    const phone = fields.phone.trim()

    if (!fullName || !email || !phone) {
      setStatus('error')
      setErrorKey('errorRequired')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setStatus('error')
      setErrorKey('errorEmail')
      return
    }

    setStatus('submitting')
    try {
      // No backend yet — mock the round-trip so the UX is complete.
      await new Promise((resolve) => setTimeout(resolve, 700))
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorKey('errorRequired')
    }
  }

  // Fresh form every time the modal opens.
  useEffect(() => {
    if (open) {
      setFields(INITIAL)
      setStatus('idle')
      setErrorKey(null)
    }
  }, [open])

  // Scroll lock + focus trap + Esc, focus returns to the trigger on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    lockScroll()

    const focusFirst = requestAnimationFrame(() => {
      const panel = panelRef.current
      const target = panel?.querySelector('input, select, button')
      target?.focus()
    })

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll(FOCUSABLE)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
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
      cancelAnimationFrame(focusFirst)
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [open, onClose])

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
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 24, scale: 0.98 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      }

  const bullets = t('bullets', { returnObjects: true })

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="demo-modal__overlay" onClick={onClose} data-lenis-prevent {...overlayMotion}>
          <motion.div
            ref={panelRef}
            className="demo-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('ariaLabel')}
            onClick={(e) => e.stopPropagation()}
            {...panelMotion}
          >
            <button type="button" className="demo-modal__close" onClick={onClose} aria-label={t('close')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="demo-modal__grid">
              {/* Left — form (or success state) */}
              <div className="demo-modal__form-col">
                {status === 'success' ? (
                  <div className="demo-modal__success" role="status">
                    <span className="demo-modal__success-badge" aria-hidden="true">
                      <CheckIcon />
                    </span>
                    <h3 className="demo-modal__success-title">{t('form.successTitle')}</h3>
                    <p className="demo-modal__success-body">{t('form.successBody')}</p>
                  </div>
                ) : (
                  <form className="demo-form" onSubmit={handleSubmit} noValidate>
                    {status === 'error' && (
                      <p className="demo-form__banner" role="alert">
                        {t(`form.${errorKey}`)}
                      </p>
                    )}

                    <div className="demo-form__field">
                      <label className="demo-form__label" htmlFor="demo-name">
                        {t('form.fullName')} <span className="demo-form__req" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="demo-name"
                        className="demo-form__input"
                        type="text"
                        value={fields.fullName}
                        onChange={update('fullName')}
                        autoComplete="name"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="demo-form__field">
                      <label className="demo-form__label" htmlFor="demo-email">
                        {t('form.email')} <span className="demo-form__req" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="demo-email"
                        className="demo-form__input"
                        type="email"
                        value={fields.email}
                        onChange={update('email')}
                        autoComplete="email"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="demo-form__field">
                      <label className="demo-form__label" htmlFor="demo-phone">
                        {t('form.phone')} <span className="demo-form__req" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="demo-phone"
                        className="demo-form__input"
                        type="tel"
                        value={fields.phone}
                        onChange={update('phone')}
                        autoComplete="tel"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="demo-form__field">
                      <label className="demo-form__label" htmlFor="demo-how">
                        {t('form.howHeard')}{' '}
                        <span className="demo-form__optional">({t('form.optional')})</span>
                      </label>
                      <FormSelect
                        id="demo-how"
                        ariaLabel={t('form.howHeard')}
                        placeholder={t('form.howHeardPlaceholder')}
                        value={fields.howHeard}
                        disabled={submitting}
                        options={[
                          { value: '', label: t('form.howHeardPlaceholder') },
                          ...HOW_HEARD.map((key) => ({ value: key, label: t(`form.options.${key}`) })),
                        ]}
                        onChange={(val) => {
                          setFields((prev) => ({ ...prev, howHeard: val }))
                          if (status === 'error') {
                            setStatus('idle')
                            setErrorKey(null)
                          }
                        }}
                      />
                    </div>

                    <button type="submit" className="demo-form__submit" disabled={submitting}>
                      {submitting ? t('form.submitting') : t('form.submit')}
                    </button>

                    <p className="demo-form__consent">{t('form.consent')}</p>
                  </form>
                )}
              </div>

              {/* Right — pitch */}
              <div className="demo-modal__info-col">
                <h2 className="demo-modal__title">{t('title')}</h2>
                <p className="demo-modal__subtitle">{t('subtitle')}</p>
                {Array.isArray(bullets) && (
                  <ul className="demo-modal__bullets">
                    {bullets.map((bullet, i) => (
                      <li key={i} className="demo-modal__bullet">
                        <CheckIcon />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Bottom — legal / help links */}
            <div className="demo-modal__links">
              <LocaleLink to="/terms" className="demo-modal__link" onClick={onClose}>
                {t('links.terms')}
              </LocaleLink>
              <LocaleLink to="/privacy" className="demo-modal__link" onClick={onClose}>
                {t('links.privacy')}
              </LocaleLink>
              <LocaleLink to="/faq" className="demo-modal__link" onClick={onClose}>
                {t('links.faq')}
              </LocaleLink>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
