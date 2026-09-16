import { PRODUCT_THEME_STYLES } from "../../lib/productColors"
import { Suspense, lazy, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { buildWebsiteJsonLd, HOME_SEO } from "../../lib/seo"
import HeroSection from "../../redesign-sections/HeroSection"
import { CardHeader, CardFooter } from "../../components/CardDesign/CardDesign"
import "./CrmPage.css"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"

const FeaturesSection    = lazy(() => import("../../redesign-sections/FeaturesSection"))
const HowItWorksSection  = lazy(() => import("../../redesign-sections/HowItWorksSection"))
const CommunitiesSection = lazy(() => import("../../redesign-sections/CommunitiesSection"))
const TelegramSection    = lazy(() => import("../../redesign-sections/TelegramSection"))
const AiAgentsSection    = lazy(() => import("../../redesign-sections/AiAgentsSection"))
// const PricingSection     = lazy(() => import("../../redesign-sections/PricingSection"))
const FaqSection         = lazy(() => import("../../redesign-sections/FaqSection"))
const CtaSection         = lazy(() => import("../../redesign-sections/CtaSection"))

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



  return (
    <div className="bc2-page card-site crm-redesign" data-product="crm" style={PRODUCT_THEME_STYLES.crm}>
      <PageSeo
        title={HOME_SEO.title}
        description={t("subtitle")}
        path="/"
        jsonLd={WEBSITE_JSON_LD}
      />
      <CardHeader />

      <main>
        <HeroSection />

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


        <Suspense fallback={<SectionFallback />}>
          <CtaSection />
        </Suspense>

        <Suspense fallback={null}>
          <CardFooter />
        </Suspense>
      </div>
    </div>
  )
}
