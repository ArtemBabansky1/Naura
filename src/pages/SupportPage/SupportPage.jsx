import { useTranslation, Trans } from "react-i18next"
import { LocaleLink } from "../../components/LocaleLink/LocaleLink"
import { PageShell } from "../../components/PageShell/PageShell"
import { SupportForm } from "../../components/SupportForm/SupportForm"
import { SUPPORT_EMAIL } from "../../lib/urls"
import "./SupportPage.css"

export const SupportPage = () => {
  const { t } = useTranslation("support")

  return (
    <PageShell
      title={t("pageTitle")}
      description={t("metaDescription")}
      path="/support"
    >
      <div className="support-page">
        <header className="support-page__header">
          <span className="support-page__eyebrow text-label">{t("eyebrow")}</span>
          <h1 className="support-page__title text-h2">{t("headline")}</h1>
          <p className="support-page__intro text-body">
            <Trans
              i18nKey="intro"
              ns="support"
              values={{ email: SUPPORT_EMAIL }}
              components={{
                email: (
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="support-page__link"
                  />
                ),
                faq: <LocaleLink to="/faq" className="support-page__link" />,
              }}
            />
          </p>
        </header>

        <section className="support-page__form-section" aria-labelledby="support-form-heading">
          <h2 id="support-form-heading" className="support-page__form-title text-h3">
            {t("formHeading")}
          </h2>
          <SupportForm />
        </section>
      </div>
    </PageShell>
  )
}
