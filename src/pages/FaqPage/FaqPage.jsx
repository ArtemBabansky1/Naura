import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LocaleLink } from "../../components/LocaleLink/LocaleLink"
import { PageShell } from "../../components/PageShell/PageShell"
import { FaqAccordion } from "../../components/FaqAccordion/FaqAccordion"
import { buildFaqJsonLd } from "../../lib/seo"
import { SUPPORT_EMAIL } from "../../lib/urls"
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
          <span className="faq-page__eyebrow text-label">{t("eyebrow")}</span>
          <h1 className="faq-page__title text-h2">{t("headline")}</h1>
          <p className="faq-page__contact text-body">
            {t("pageContact")}{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="faq-page__link">
              {SUPPORT_EMAIL}
            </a>
            {" — "}
            <LocaleLink to="/support" className="faq-page__link">
              {t("pageContactLink")}
            </LocaleLink>
          </p>
        </header>

        <FaqAccordion />
      </div>
    </PageShell>
  )
}
