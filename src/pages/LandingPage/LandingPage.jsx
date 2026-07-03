import { Suspense, lazy, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { buildWebsiteJsonLd, HOME_SEO } from "../../lib/seo"
import HeroSection from "../../sections/HeroSection"
import FloatingNav from "../../components/FloatingNav/FloatingNav"
import MobileNav from "../../components/MobileNav/MobileNav"
import UnicornScene from "../../components/UnicornScene/UnicornScene"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"

const FeaturesSection    = lazy(() => import("../../sections/FeaturesSection"))
const HowItWorksSection  = lazy(() => import("../../sections/HowItWorksSection"))
const CommunitiesSection = lazy(() => import("../../sections/CommunitiesSection"))
const TelegramSection    = lazy(() => import("../../sections/TelegramSection"))
const AiAgentsSection    = lazy(() => import("../../sections/AiAgentsSection"))
// const PricingSection     = lazy(() => import("../../sections/PricingSection"))
const FaqSection         = lazy(() => import("../../sections/FaqSection"))
const CtaSection         = lazy(() => import("../../sections/CtaSection"))
const FooterSection      = lazy(() => import("../../sections/FooterSection"))

// Static — hoisted so PageSeo's effect doesn't see a fresh object (and re-run
// the full head rewrite) every time this page re-renders, e.g. on menu toggle.
const WEBSITE_JSON_LD = buildWebsiteJsonLd()

function SectionFallback() {
  return <div aria-hidden="true" style={{ minHeight: "40rem" }} />
}

function RefreshOnMount({ children }) {
  useEffect(() => {
    // Coalesced: a burst of lazy sections mounting = one refresh, not one each.
    scheduleScrollRefresh()
  }, [])
  return children
}

export const LandingPage = () => {
  useSmoothScroll()
  const { t } = useTranslation("hero")

  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <PageSeo
        title={HOME_SEO.title}
        description={t("subtitle")}
        path="/"
        jsonLd={WEBSITE_JSON_LD}
      />
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
