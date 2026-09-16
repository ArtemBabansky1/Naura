import { useLayoutEffect, useRef } from "react"
import { useAnimationControls } from "motion/react"

const EASE = [0.16, 1, 0.3, 1]
const visible = { opacity: 1, transform: "translateY(0px)" }
const hidden = { opacity: 0, transform: "translateY(-96px)" }

// Both site headers retain their DOM (and keyboard focus) while docking.
// Compensate the fixed → document coordinate change, then ease it away.
export function useHeaderReveal(mode, reduced) {
  const controls = useAnimationControls()
  const previousMode = useRef(null)

  useLayoutEffect(() => {
    const previous = previousMode.current
    previousMode.current = mode
    if (reduced) {
      controls.set(mode === "hidden" ? hidden : visible)
      return
    }
    if (previous === "inline" && mode === "visible") controls.set(hidden)
    if (mode === "inline" && previous === "visible") {
      controls.set({ opacity: 1, transform: `translateY(${window.scrollY}px)` })
    }
    controls.start(mode === "hidden" ? hidden : visible, {
      duration: previous === null ? 1.2 : mode === "inline" ? 0.65 : 0.42,
      ease: EASE,
    })
  }, [controls, mode, reduced])

  return controls
}
