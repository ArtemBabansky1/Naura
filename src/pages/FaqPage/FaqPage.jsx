import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageShell } from "../../components/PageShell/PageShell"
import { FaqAccordion } from "../../components/FaqAccordion/FaqAccordion"
import { SUPPORT_EMAIL } from "../../lib/urls"
import "./FaqPage.css"

export const FaqPage = () => {
  const { t } = useTranslation("faq")

  return (
    <PageShell title={t("pageTitle")}>
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
            <Link to="/support" className="faq-page__link">
              {t("pageContactLink")}
            </Link>
          </p>
        </header>

        <FaqAccordion />
      </div>
    </PageShell>
  )
}
