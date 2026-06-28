import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DemoModal } from './DemoModal'

const DemoModalContext = createContext(null)

/** Open the "Get a demo" pop-up from anywhere: const { openDemo } = useDemoModal(). */
export const useDemoModal = () => {
  const ctx = useContext(DemoModalContext)
  if (!ctx) throw new Error('useDemoModal must be used within <DemoModalProvider>')
  return ctx
}

export function DemoModalProvider({ children }) {
  const [open, setOpen] = useState(false)
  const openDemo = useCallback(() => setOpen(true), [])
  const closeDemo = useCallback(() => setOpen(false), [])
  const value = useMemo(() => ({ open, openDemo, closeDemo }), [open, openDemo, closeDemo])

  return (
    <DemoModalContext.Provider value={value}>
      {children}
      <DemoModal open={open} onClose={closeDemo} />
    </DemoModalContext.Provider>
  )
}
