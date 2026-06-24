import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { lockScroll, unlockScroll } from '../../lib/scrollLock'
import privacyMd from '../../content/legal/privacy.md?raw'
import termsMd from '../../content/legal/terms.md?raw'
import './LegalModal.css'

// Raw markdown for each legal document, keyed by the value the footer passes.
const DOCS = {
  privacy: privacyMd,
  terms: termsMd,
}

// Map markdown elements onto site-styled nodes (headings → subheadings → notes).
// External links open in a new tab; the date/disclaimer italics read as notes.
const COMPONENTS = {
  h1: (props) => <h1 className="legal-doc__title" {...props} />,
  h2: (props) => <h2 className="legal-doc__heading" {...props} />,
  h3: (props) => <h3 className="legal-doc__subheading" {...props} />,
  p: (props) => <p className="legal-doc__p" {...props} />,
  ul: (props) => <ul className="legal-doc__list" {...props} />,
  li: (props) => <li className="legal-doc__item" {...props} />,
  em: (props) => <em className="legal-doc__note" {...props} />,
  strong: (props) => <strong className="legal-doc__strong" {...props} />,
  a: ({ href = '', ...props }) => (
    <a
      className="legal-doc__link"
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
}

/**
 * Full-height legal sheet that slides up from the bottom — same border / width /
 * top-rounding as the footer, square at the bottom, with a 100px gap to the top
 * of the viewport. `doc` is 'privacy' | 'terms' | null; null closes it.
 */
export default function LegalModal({ doc, onClose }) {
  const prefersReduced = useReducedMotion()
  const open = Boolean(doc)
  // Retain the last document through the slide-down exit so it doesn't blank out.
  const [shownDoc, setShownDoc] = useState(doc)
  useEffect(() => {
    if (doc) setShownDoc(doc)
  }, [doc])

  // Freeze the page behind the sheet and close on Escape while open.
  useEffect(() => {
    if (!open) return
    lockScroll()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockScroll()
    }
  }, [open, onClose])

  const panelMotion = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="legal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="legal-panel"
            {...panelMotion}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={shownDoc === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          >
            <button
              type="button"
              className="legal-panel__close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="legal-panel__body" data-lenis-prevent>
              <div className="legal-doc">
                <ReactMarkdown components={COMPONENTS}>{DOCS[shownDoc] || ''}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
