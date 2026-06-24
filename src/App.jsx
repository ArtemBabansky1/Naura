import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LandingPage } from "./pages/LandingPage/LandingPage"
import { LegalPage } from "./pages/LegalPage/LegalPage"
import { SupportPage } from "./pages/SupportPage/SupportPage"
import { FaqPage } from "./pages/FaqPage/FaqPage"

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
      <DocumentLang />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/terms" element={<LegalPage doc="terms" />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Routes>
    </BrowserRouter>
  )
}
