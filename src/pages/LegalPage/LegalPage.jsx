import { useEffect } from "react"
import { Link } from "react-router-dom"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { LegalDocument } from "../../components/LegalDocument/LegalDocument"
import Container from "../../components/Container/Container"
import { LEGAL_SEO } from "../../lib/seo"
import "./LegalPage.css"

export const LegalPage = ({ doc }) => {
  const meta = LEGAL_SEO[doc]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [doc])

  return (
    <div className="legal-page">
      <PageSeo title={meta.title} description={meta.description} path={`/${doc}`} />

      <header className="legal-page__header">
        <Container className="legal-page__header-inner">
          <Link to="/" className="legal-page__logo" aria-label="Back to Naura home">
            Naura
          </Link>
          <Link to="/" className="legal-page__back text-body-sm">
            ← Back to home
          </Link>
        </Container>
      </header>

      <main className="legal-page__main">
        <Container>
          <LegalDocument doc={doc} />
        </Container>
      </main>

      <footer className="legal-page__footer">
        <Container className="legal-page__footer-inner">
          <nav className="legal-page__nav" aria-label="Legal">
            <Link to="/privacy" className="legal-page__nav-link text-body-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="legal-page__nav-link text-body-sm">
              Terms of Use
            </Link>
          </nav>
          <p className="legal-page__copy text-body-sm">© 2026 Naura Cards. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
