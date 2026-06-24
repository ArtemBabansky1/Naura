import { Suspense, lazy, useEffect, useState } from "react"
import HeroSection from "../../sections/HeroSection"
import FloatingNav from "../../components/FloatingNav/FloatingNav"
import MobileNav from "../../components/MobileNav/MobileNav"
import UnicornScene from "../../components/UnicornScene/UnicornScene"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import { ScrollTrigger } from "../../lib/gsap"

const FeaturesSection    = lazy(() => import("../../sections/FeaturesSection"))
const HowItWorksSection  = lazy(() => import("../../sections/HowItWorksSection"))
const CommunitiesSection = lazy(() => import("../../sections/CommunitiesSection"))
const TelegramSection    = lazy(() => import("../../sections/TelegramSection"))
const AiAgentsSection    = lazy(() => import("../../sections/AiAgentsSection"))
// const PricingSection     = lazy(() => import("../../sections/PricingSection"))
const FaqSection         = lazy(() => import("../../sections/FaqSection"))
const CtaSection         = lazy(() => import("../../sections/CtaSection"))
const FooterSection      = lazy(() => import("../../sections/FooterSection"))

function SectionFallback() {
  return <div aria-hidden="true" style={{ minHeight: "40rem" }} />
}

function RefreshOnMount({ children }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [])
  return children
}

export const LandingPage = () => {
  useSmoothScroll()

  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    document.title = "Naura — Your network, actually working"
  }, [])

  return (
    <>
      <FloatingNav />
      <MobileNav open={navOpen} setOpen={setNavOpen} />

      <main>
        <HeroSection menuOpen={navOpen} onMenuToggle={() => setNavOpen((v) => !v)} />

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

        {/* <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><PricingSection /></RefreshOnMount>
        </Suspense> */}

        <Suspense fallback={<SectionFallback />}>
          <RefreshOnMount><FaqSection /></RefreshOnMount>
        </Suspense>
      </main>

      <div className="page-closing">
        <UnicornScene className="closing-unicorn" />

        <Suspense fallback={<SectionFallback />}>
          <CtaSection />
        </Suspense>

        <Suspense fallback={null}>
          <FooterSection />
        </Suspense>
      </div>
    </>
  )
}
