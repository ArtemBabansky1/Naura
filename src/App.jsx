import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LocaleSync } from "./components/LocaleSync/LocaleSync"
import { LandingPage } from "./pages/LandingPage/LandingPage"
import { LegalPage } from "./pages/LegalPage/LegalPage"
import { SupportPage } from "./pages/SupportPage/SupportPage"
import { FaqPage } from "./pages/FaqPage/FaqPage"

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
      <Routes>
        {ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
        {ROUTES.map(({ path, element }) => {
          const ruPath = path === "/" ? "/ru" : `/ru${path}`
          return <Route key={ruPath} path={ruPath} element={element} />
        })}
      </Routes>
    </BrowserRouter>
  )
}
