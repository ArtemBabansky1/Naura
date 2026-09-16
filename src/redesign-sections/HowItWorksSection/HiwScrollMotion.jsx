import { useMemo, useRef, useState } from "react"
// Use the same Motion for React entry point as the rest of the app so the
// animation runtime is shared across route chunks.
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react"

const ENTER_DURATION = 0.32

// Preserve the established sequence: 01 is present initially; 02–04 fade in
// when their respective stages begin. No positional or scale values are used.
const getNumeralOpacityRanges = (index) => {
  if (index === 0) {
    return { input: [0, 3], opacity: [1, 1] }
  }

  return {
    input: [index - 0.5, index - 0.5 + ENTER_DURATION, 3],
    opacity: [0, 1, 1],
  }
}

const getCopyOpacityRanges = (index) => {
  if (index === 0) {
    return { input: [0, ENTER_DURATION, 3], opacity: [0.5, 1, 1] }
  }

  return {
    input: [index - 0.5, index - 0.5 + ENTER_DURATION, 3],
    opacity: [0.5, 1, 1],
  }
}

export const HiwScrollNumeral = ({ index, progress, children }) => {
  const ranges = useMemo(() => getNumeralOpacityRanges(index), [index])
  const activationStart = ranges.input[0]
  const activeRef = useRef(index === 0)
  const [isActive, setIsActive] = useState(index === 0)
  const opacity = useTransform(progress, ranges.input, ranges.opacity)

  useMotionValueEvent(progress, "change", (value) => {
    if (index === 0) return
    const next = value > activationStart
    if (next !== activeRef.current) {
      activeRef.current = next
      setIsActive(next)
    }
  })

  return (
    <motion.div
      className="hiw-num-reveal"
      data-active={isActive || undefined}
      style={{ opacity, willChange: "opacity" }}
    >
      {children}
    </motion.div>
  )
}

export const HiwScrollCopy = ({ index, progress, children }) => {
  const ranges = useMemo(() => getCopyOpacityRanges(index), [index])
  const opacity = useTransform(progress, ranges.input, ranges.opacity)

  return (
    <motion.div className="hiw-copy-reveal" style={{ opacity, willChange: "opacity" }}>
      {children}
    </motion.div>
  )
}

// Step 01's preview remains until the next step begins, then fades away so it
// does not compete with the surrounding graph as the sequence continues.
export const HiwScrollCard = ({ progress, children }) => {
  const opacity = useTransform(progress, [0, 0.5, 0.78], [1, 1, 0])

  return (
    <motion.div className="hiw-card-reveal" style={{ opacity, willChange: "opacity" }}>
      {children}
    </motion.div>
  )
}

export const useHiwScrollProgress = () => useMotionValue(0)
