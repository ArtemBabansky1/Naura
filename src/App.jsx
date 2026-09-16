import { Suspense, lazy, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LocaleSync } from "./components/LocaleSync/LocaleSync"
import { GeoLocaleRedirect } from "./components/GeoLocaleRedirect/GeoLocaleRedirect"
import { DemoModalProvider } from "./components/DemoModal/DemoModalContext"
import { LandingPage } from "./pages/CrmRedesign/CrmPage"
import { useLocale } from "./hooks/useLocale"
import { HashNavigation } from "./components/HashNavigation/HashNavigation"

// Secondary pages load on demand: LegalPage pulls in react-markdown (+remark),
// which otherwise lands in the eager entry chunk every visitor downloads.
const LegalPage = lazy(() => import("./pages/LegalRedesign/LegalPage").then((m) => ({ default: m.LegalPage })))
const SupportPage = lazy(() => import("./pages/SupportRedesign/SupportPage").then((m) => ({ default: m.SupportPage })))
const FaqPage = lazy(() => import("./pages/FaqRedesign/FaqPage").then((m) => ({ default: m.FaqPage })))
const MeetsPage = lazy(() => import("./pages/MeetsRedesign/MeetsPage").then((m) => ({ default: m.MeetsPage })))
const CommunityResourcesPage = lazy(() => import("./pages/CommunityResourcesRedesign/CommunityResourcesPage").then((m) => ({ default: m.CommunityResourcesPage })))
const BusinessCardsPage = lazy(() => import("./pages/BusinessCardsPage/BusinessCardsPage").then((m) => ({ default: m.BusinessCardsPage })))

/* meets.naura.io is the Meets site: its root IS the Meets page, so the address
 * stays clean instead of repeating itself as meets.naura.io/meets. Everything
 * else (legal, support, FAQ) resolves the same on both hosts. */
const IS_MEETS_HOST =
  typeof window !== "undefined" && /^meets\./i.test(window.location.hostname)

// Preserve shared links, query parameters and anchors after the page rename.
const BusinessCardsRedirect = () => {
  const { search, hash } = useLocation()
  const { localePath } = useLocale()
  return <Navigate to={{ pathname: localePath("/digital-card"), search, hash }} replace />
}

const ROUTES = [
  { path: "/", element: IS_MEETS_HOST ? <MeetsPage /> : <LandingPage /> },
  { path: "/meets", element: <MeetsPage /> },
  { path: "/community-resources-v1", element: <CommunityResourcesPage /> },
  { path: "/community-resources", element: <CommunityResourcesPage /> },
  { path: "/digital-card", element: <BusinessCardsPage /> },
  { path: "/business-cards", element: <BusinessCardsRedirect /> },
  { path: "/privacy", element: <LegalPage doc="privacy" /> },
  { path: "/terms", element: <LegalPage doc="terms" /> },
  { path: "/support", element: <SupportPage /> },
  { path: "/faq", element: <FaqPage /> },
]

const DocumentLang = () => {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language === "ru" ? "ru" : "en"
  }, [i18n.language])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <LocaleSync />
      <HashNavigation />
      <GeoLocaleRedirect />
      <DocumentLang />
      <DemoModalProvider>
        <Suspense fallback={null}>
          <Routes>
            {ROUTES.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            {ROUTES.map(({ path, element }) => {
              const ruPath = path === "/" ? "/ru" : `/ru${path}`
              return <Route key={ruPath} path={ruPath} element={element} />
            })}
            {/* Unknown URLs used to render a blank indexable page (soft 404) —
                send them home, keeping the locale prefix when present. */}
            <Route path="/ru/*" element={<Navigate to="/ru" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </DemoModalProvider>
    </BrowserRouter>
  )
}
