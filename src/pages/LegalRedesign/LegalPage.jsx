import { LegalDocument } from "../../components/LegalDocument/LegalDocument"
import { PageShell } from "../../components/CardDesign/CardDesign"
import { LEGAL_SEO } from "../../lib/seo"
import "./LegalPage.css"
export const LegalPage = ({ doc }) => {
  const meta = LEGAL_SEO[doc]
  return <PageShell title={meta.title} description={meta.description} path={`/${doc}`}>
    <LegalDocument doc={doc} />
  </PageShell>
}
