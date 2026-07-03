import { Suspense, lazy, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LocaleSync } from "./components/LocaleSync/LocaleSync"
import { DemoModalProvider } from "./components/DemoModal/DemoModalContext"
import { LandingPage } from "./pages/LandingPage/LandingPage"

// Secondary pages load on demand: LegalPage pulls in react-markdown (+remark),
// which otherwise lands in the eager entry chunk every visitor downloads.
const LegalPage = lazy(() => import("./pages/LegalPage/LegalPage").then((m) => ({ default: m.LegalPage })))
const SupportPage = lazy(() => import("./pages/SupportPage/SupportPage").then((m) => ({ default: m.SupportPage })))
const FaqPage = lazy(() => import("./pages/FaqPage/FaqPage").then((m) => ({ default: m.FaqPage })))

const ROUTES = [
  { path: "/", element: <LandingPage /> },
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
