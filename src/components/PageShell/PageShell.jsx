import { useEffect } from "react"
import { Link } from "react-router-dom"
import Container from "../Container/Container"
import "./PageShell.css"

export const PageShell = ({ title, children }) => {
  useEffect(() => {
    document.title = title
    window.scrollTo(0, 0)
  }, [title])

  return (
    <div className="page-shell">
      <header className="page-shell__header">
        <Container className="page-shell__header-inner">
          <Link to="/" className="page-shell__logo" aria-label="Back to Naura home">
            Naura
          </Link>
          <Link to="/" className="page-shell__back text-body-sm">
            ← Back to home
          </Link>
        </Container>
      </header>

      <main className="page-shell__main">
        <Container>{children}</Container>
      </main>

      <footer className="page-shell__footer">
        <Container className="page-shell__footer-inner">
          <nav className="page-shell__nav" aria-label="Site">
            <Link to="/faq" className="page-shell__nav-link text-body-sm">FAQ</Link>
            <Link to="/support" className="page-shell__nav-link text-body-sm">Support</Link>
            <Link to="/privacy" className="page-shell__nav-link text-body-sm">Privacy Policy</Link>
            <Link to="/terms" className="page-shell__nav-link text-body-sm">Terms of Use</Link>
          </nav>
          <p className="page-shell__copy text-body-sm">© 2026 Naura Cards. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
