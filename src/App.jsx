import { Suspense, lazy, useEffect, useState } from 'react'
import HeroSection from './sections/HeroSection'
import FloatingNav from './components/FloatingNav/FloatingNav'
import MobileNav from './components/MobileNav/MobileNav'
import UnicornScene from './components/UnicornScene/UnicornScene'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { ScrollTrigger } from './lib/gsap'

// Lazy-load below-the-fold sections to reduce initial bundle
const FeaturesSection    = lazy(() => import('./sections/FeaturesSection'))
const HowItWorksSection  = lazy(() => import('./sections/HowItWorksSection'))
const CommunitiesSection = lazy(() => import('./sections/CommunitiesSection'))
const TelegramSection    = lazy(() => import('./sections/TelegramSection'))
const AiAgentsSection    = lazy(() => import('./sections/AiAgentsSection'))
const PricingSection     = lazy(() => import('./sections/PricingSection'))
const FaqSection         = lazy(() => import('./sections/FaqSection'))
const CtaSection         = lazy(() => import('./sections/CtaSection'))
const FooterSection      = lazy(() => import('./sections/FooterSection'))
const LegalModal         = lazy(() => import('./components/LegalModal/LegalModal'))

// Minimal fallback — transparent spacer to avoid CLS
function SectionFallback() {
  return <div aria-hidden="true" style={{ minHeight: '40rem' }} />
}

// Fires one ScrollTrigger.refresh() after a lazy section's real content mounts,
// so every trigger's start/end is remeasured against the grown (no longer
// 40rem) layout. Without this, pins measured before sibling growth fire early.
function RefreshOnMount({ children }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [])
  return children
}

export default function App() {
  useSmoothScroll()

  // Shared ≤1199 drawer state — opened by either the static hero-nav burger or
  // the floating scroll-up burger (MobileNav), both of which open one drawer.
  const [navOpen, setNavOpen] = useState(false)

  // Legal sheet: 'privacy' | 'terms' | null. `everOpened` defers loading the
  // modal chunk (+ react-markdown + the docs) until first opened, then keeps it
  // mounted so the slide-down exit animation can play on close.
  const [legalDoc, setLegalDoc] = useState(null)
  const [everOpened, setEverOpened] = useState(false)
  useEffect(() => {
    if (legalDoc) setEverOpened(true)
  }, [legalDoc])

  return (
    <>
      <FloatingNav />
      <MobileNav open={navOpen} setOpen={setNavOpen} />

      <main>
        {/* Above the fold — eager */}
        <HeroSection menuOpen={navOpen} onMenuToggle={() => setNavOpen((v) => !v)} />

        {/* Below the fold — lazy loaded. RefreshOnMount remeasures ScrollTrigger
            once each section's real content replaces the 40rem fallback, so the
            HowItWorks pin can't activate early off a stale (shorter) layout. */}
        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><FeaturesSection /></RefreshOnMount>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><HowItWorksSection /></RefreshOnMount>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><CommunitiesSection /></RefreshOnMount>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><TelegramSection /></RefreshOnMount>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><AiAgentsSection /></RefreshOnMount>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><PricingSection /></RefreshOnMount>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><FaqSection /></RefreshOnMount>
        </Suspense>

      </main>

      {/* CTA + footer share one clipping context so the CTA glow can bleed
          around the footer but is cut off at the footer's bottom edge. */}
      <div className="page-closing">
        {/* Interactive background shared by the CTA and footer; the footer panel
            paints on top (z-index), so the animation glows under/around it. */}
        <UnicornScene className="closing-unicorn" />

        <Suspense fallback={<SectionFallback />}>
          <CtaSection />
        </Suspense>

        <Suspense fallback={null}>
          <FooterSection onOpenLegal={setLegalDoc} />
        </Suspense>
      </div>

      {everOpened && (
        <Suspense fallback={null}>
          <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
        </Suspense>
      )}
    </>
  )
}
