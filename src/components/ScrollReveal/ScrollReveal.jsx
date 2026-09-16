import { motion, useReducedMotion } from "motion/react"
import "./ScrollReveal.css"

const viewport = { once: true, amount: 0.2, margin: "0px 0px -10% 0px" }

const wordTransition = (reduced, delay) => reduced
  ? { duration: 0.12 }
  : { visualDuration: 0.72, type: "spring", bounce: 0.04, delay, restDelta: 0.001 }

const normalizeAccentWord = (word) => word.replace(/[.,!?…:;]+$/u, '').toLocaleLowerCase()
const accentWordSet = (accent) => new Set(String(accent).split(/ +/).filter(Boolean).map(normalizeAccentWord))

function RevealedWord({ children, delay, reduced, scrollDriven = false, trailingSpace = true, accented = false }) {
  return (
    <span className={`scroll-reveal__word bc2-title-word${accented ? " product-accent-word" : ""}`} aria-hidden="true">
      <motion.span
        initial={reduced || scrollDriven ? false : { opacity: 0, filter: "blur(6px)" }}
        whileInView={reduced || scrollDriven ? undefined : { opacity: 1, filter: "blur(0px)" }}
        viewport={viewport}
        transition={wordTransition(reduced, delay)}
      >
        {children}{trailingSpace ? "\u00a0" : ""}
      </motion.span>
    </span>
  )
}

// The word-by-word blur reveal used by the digital-card page, available to
// headings that already own their semantic h1/h2 wrapper.
export function RevealWords({ text, as = "span", className = "", delay = 0, stagger = 0.065, ariaHidden = false, accent = "" }) {
  const reduced = useReducedMotion()
  const Component = motion[as] || motion.span
  const accentedWords = accentWordSet(accent)
  const words = String(text).split(/ +/).filter(Boolean)

  return (
    <Component className={className} aria-label={ariaHidden ? undefined : text} aria-hidden={ariaHidden || undefined}>
      {words.map((word, index) => (
        <RevealedWord
          key={`${word}-${index}`}
          delay={delay + index * stagger}
          reduced={reduced}
          trailingSpace={index < words.length - 1}
          accented={accentedWords.has(normalizeAccentWord(word))}
        >
          {word}
        </RevealedWord>
      ))}
    </Component>
  )
}

// Semantic title variant. Explicit lines preserve intentional hero and
// editorial line breaks without changing the accessible heading text.
export function RevealTitle({ as = "h2", id, text, lines, className = "", delay = 0, stagger = 0.065, reveal = "viewport", accent = "" }) {
  const reduced = useReducedMotion()
  const Heading = motion[as] || motion.h2
  const accentedWords = accentWordSet(accent)
  const content = lines || [text]
  let wordIndex = 0

  return (
    <Heading id={id} className={className} aria-label={text} viewport={viewport}>
      {content.map((line, lineIndex) => {
        const words = String(line).split(/ +/).filter(Boolean)
        return (
          <span className="scroll-reveal__line bc2-title-line" aria-hidden="true" key={`${line}-${lineIndex}`}>
            {words.map((word, index) => {
              const wordDelay = delay + wordIndex * stagger
              wordIndex += 1
              return (
                <RevealedWord
                  key={`${word}-${index}`}
                  delay={wordDelay}
                  reduced={reduced}
                  scrollDriven={reveal === "scroll"}
                  trailingSpace={index < words.length - 1}
                  accented={accentedWords.has(normalizeAccentWord(word))}
                >
                  {word}
                </RevealedWord>
              )
            })}
          </span>
        )
      })}
    </Heading>
  )
}

// Supporting copy follows the same single-block fade-up used throughout the
// digital-card page, while remaining static for reduced-motion users.
export function RevealCopy({ as = "p", children, className = "", delay = 0, amount = 0.2, blur = false, ...props }) {
  const reduced = useReducedMotion()
  const Component = motion[as] || motion.p

  return (
    <Component
      {...props}
      className={className}
      initial={reduced ? false : blur ? { opacity: 0, filter: "blur(6px)" } : { opacity: 0, y: 35 }}
      whileInView={reduced ? undefined : blur ? { opacity: 1, filter: "blur(0px)" } : { opacity: 1, y: 0 }}
      viewport={{ ...viewport, amount }}
      transition={reduced
        ? { duration: 0.12 }
        : { visualDuration: 0.6, type: "spring", bounce: 0.2, delay, restDelta: 0.001 }}
    >
      {children}
    </Component>
  )
}
