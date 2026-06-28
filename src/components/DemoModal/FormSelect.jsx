import { useEffect, useId, useRef, useState } from 'react'

/**
 * Accessible custom <select> replacement so the dropdown can be styled to match
 * the form fields (rounded corners, dark surface) — native option lists can't be.
 *
 * options: [{ value, label }]. The first option may carry value "" as a reset.
 * Keyboard: Enter/Space/Arrows open; Arrows/Home/End move; Enter/Space pick;
 * Esc closes; outside click / Tab close. Highlight follows aria-activedescendant.
 */
export function FormSelect({ id, value, onChange, options, placeholder, disabled, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)
  const hasValue = Boolean(selected && selected.value !== '')

  const openList = () => {
    const idx = Math.max(0, options.findIndex((o) => o.value === value))
    setActiveIndex(idx)
    setOpen(true)
  }

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  const choose = (val) => {
    onChange(val)
    close()
  }

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const onKeyDown = (e) => {
    if (disabled) return
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const opt = options[activeIndex]
        if (opt) choose(opt.value)
        break
      }
      case 'Tab':
        close(false)
        break
      default:
        break
    }
  }

  return (
    <div className="form-select" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        className={`demo-form__input form-select__button${open ? ' is-open' : ''}${hasValue ? '' : ' is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="form-select__value">{selected ? selected.label : placeholder}</span>
        <svg className="form-select__chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="form-select__list" id={listId} role="listbox" ref={listRef} tabIndex={-1}>
          {options.map((o, i) => (
            <li
              key={o.value || '__placeholder'}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`form-select__option${i === activeIndex ? ' is-active' : ''}${o.value === value && o.value !== '' ? ' is-selected' : ''}${o.value === '' ? ' is-muted' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => choose(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
