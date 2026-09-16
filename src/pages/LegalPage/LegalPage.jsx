import { useEffect } from "react"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { LegalDocument } from "../../components/LegalDocument/LegalDocument"
import Container from "../../components/Container/Container"
import { LEGAL_SEO } from "../../lib/seo"
import "./LegalPage.css"
import { SiteHeader } from "../../components/SiteNavigation/SiteHeader"
import { SiteNavigation } from "../../components/SiteNavigation/SiteNavigation"

export const LegalPage = ({ doc }) => {
  const meta = LEGAL_SEO[doc]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [doc])

  return (
    <div className="legal-page">
      <PageSeo title={meta.title} description={meta.description} path={`/${doc}`} />

      <SiteHeader />

      <main className="legal-page__main">
        <Container>
          <LegalDocument doc={doc} />
        </Container>
      </main>

      <footer className="legal-page__footer">
        <Container className="legal-page__footer-inner">
          <SiteNavigation resources className="site-resource-links" />
          <p className="legal-page__copy text-body-sm">© 2026 Naura. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
