import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LocaleLink } from "../../components/LocaleLink/LocaleLink"
import { PageShell } from "../../components/CardDesign/CardDesign"
import { FaqAccordion } from "../../components/FaqAccordion/FaqAccordion"
import { buildFaqJsonLd } from "../../lib/seo"
import { SUPPORT_EMAIL } from "../../lib/urls"
import { RevealCopy, RevealTitle } from "../../components/ScrollReveal/ScrollReveal"
import "./FaqPage.css"

export const FaqPage = () => {
  const { t } = useTranslation("faq")
  const items = t("items", { returnObjects: true })
  const faqJsonLd = useMemo(() => buildFaqJsonLd(items), [items])

  return (
    <PageShell
      title={t("pageTitle")}
      description={t("metaDescription")}
      path="/faq"
      jsonLd={faqJsonLd}
    >
      <div className="faq-page">
        <header className="faq-page__header">
          <RevealTitle as="h1" className="faq-page__title text-h2" text={t("headline")} />
          <RevealCopy as="p" className="faq-page__contact text-body" delay={0.12} blur>
            {t("pageContact")}{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="faq-page__link">
              {SUPPORT_EMAIL}
            </a>
            {" — "}
            <LocaleLink to="/support" className="faq-page__link">
              {t("pageContactLink")}
            </LocaleLink>
          </RevealCopy>
        </header>

        <FaqAccordion />
      </div>
    </PageShell>
  )
}
