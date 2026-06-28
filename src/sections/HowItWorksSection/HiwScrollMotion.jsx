import { useMemo, useRef } from "react"
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react"

const SLIDE = 24
const SCALE_REST = 0.96

// Non-overlapping cross-fade: each step holds full opacity over [i±PLATEAU],
// then fades to 0 by [i±EDGE]. EDGE = 0.5 is the midpoint between steps, so the
// outgoing step reaches 0 exactly where the incoming one starts rising from 0 —
// the two never show together, so steps fade out/in instead of crossing.
const PLATEAU = 0.35
const EDGE = 0.5

const getStepTransformRanges = (index, lastIndex) => {
  if (index === 0) {
    return {
      input: [0, PLATEAU, EDGE],
      opacity: [1, 1, 0],
      y: [0, 0, -SLIDE],
      scale: [1, 1, SCALE_REST],
    }
  }

  if (index === lastIndex) {
    return {
      input: [index - EDGE, index - PLATEAU, index],
      opacity: [0, 1, 1],
      y: [SLIDE, 0, 0],
      scale: [SCALE_REST, 1, 1],
    }
  }

  return {
    input: [index - EDGE, index - PLATEAU, index + PLATEAU, index + EDGE],
    opacity: [0, 1, 1, 0],
    y: [SLIDE, 0, 0, -SLIDE],
    scale: [SCALE_REST, 1, 1, SCALE_REST],
  }
}

export const HiwScrollStepLayer = ({ index, progress, lastIndex, children }) => {
  const layerRef = useRef(null)
  const ranges = useMemo(() => getStepTransformRanges(index, lastIndex), [index, lastIndex])

  const opacity = useTransform(progress, ranges.input, ranges.opacity)
  const y = useTransform(progress, ranges.input, ranges.y)
  const scale = useTransform(progress, ranges.input, ranges.scale)

  useMotionValueEvent(opacity, "change", (value) => {
    if (!layerRef.current) return
    layerRef.current.style.pointerEvents = value > 0.45 ? "auto" : "none"
  })

  return (
    <motion.div
      ref={layerRef}
      className="hiw-text"
      style={{
        opacity,
        y,
        scale,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </motion.div>
  )
}

export const useHiwScrollProgress = () => useMotionValue(0)
