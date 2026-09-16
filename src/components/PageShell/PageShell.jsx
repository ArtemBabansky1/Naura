import { useEffect } from "react"
import { PageSeo } from "../PageSeo/PageSeo"
import Container from "../Container/Container"
import "./PageShell.css"
import { SiteHeader } from "../SiteNavigation/SiteHeader"
import { SiteNavigation } from "../SiteNavigation/SiteNavigation"

export const PageShell = ({ title, description, path, jsonLd, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div className="page-shell">
      <PageSeo title={title} description={description} path={path} jsonLd={jsonLd} />

      <SiteHeader />

      <main className="page-shell__main">
        <Container>{children}</Container>
      </main>

      <footer className="page-shell__footer">
        <Container className="page-shell__footer-inner">
          <SiteNavigation resources className="site-resource-links" />
          <p className="page-shell__copy text-body-sm">© 2026 Naura. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
