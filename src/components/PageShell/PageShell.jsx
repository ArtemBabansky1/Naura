import { useEffect } from "react"
import { PageSeo } from "../PageSeo/PageSeo"
import { LocaleLink } from "../LocaleLink/LocaleLink"
import Container from "../Container/Container"
import "./PageShell.css"

export const PageShell = ({ title, description, path, jsonLd, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div className="page-shell">
      <PageSeo title={title} description={description} path={path} jsonLd={jsonLd} />

      <header className="page-shell__header">
        <Container className="page-shell__header-inner">
          <LocaleLink to="/" className="page-shell__logo" aria-label="Back to Naura home">
            Naura
          </LocaleLink>
          <LocaleLink to="/" className="page-shell__back text-body-sm">
            ← Back to home
          </LocaleLink>
        </Container>
      </header>

      <main className="page-shell__main">
        <Container>{children}</Container>
      </main>

      <footer className="page-shell__footer">
        <Container className="page-shell__footer-inner">
          <nav className="page-shell__nav" aria-label="Site">
            <LocaleLink to="/faq" className="page-shell__nav-link text-body-sm">FAQ</LocaleLink>
            <LocaleLink to="/support" className="page-shell__nav-link text-body-sm">Support</LocaleLink>
            <LocaleLink to="/privacy" className="page-shell__nav-link text-body-sm">Privacy Policy</LocaleLink>
            <LocaleLink to="/terms" className="page-shell__nav-link text-body-sm">Terms of Use</LocaleLink>
          </nav>
          <p className="page-shell__copy text-body-sm">© 2026 Naura Cards. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
