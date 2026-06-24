import { useMemo, useRef } from "react"
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react"

const SLIDE = 48
const SCALE_REST = 0.96

const getStepTransformRanges = (index, lastIndex) => {
  if (index === 0) {
    return {
      input: [0, 1],
      opacity: [1, 0],
      y: [0, -SLIDE],
      scale: [1, SCALE_REST],
    }
  }

  if (index === lastIndex) {
    return {
      input: [lastIndex - 1, lastIndex],
      opacity: [0, 1],
      y: [SLIDE, 0],
      scale: [SCALE_REST, 1],
    }
  }

  return {
    input: [index - 1, index, index + 1],
    opacity: [0, 1, 0],
    y: [SLIDE, 0, -SLIDE],
    scale: [SCALE_REST, 1, SCALE_REST],
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
