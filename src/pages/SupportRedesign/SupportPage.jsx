import { useTranslation, Trans } from "react-i18next"
import { LocaleLink } from "../../components/LocaleLink/LocaleLink"
import { PageShell } from "../../components/CardDesign/CardDesign"
import { SupportForm } from "./SupportForm"
import { SUPPORT_EMAIL } from "../../lib/urls"
import { RevealCopy, RevealTitle } from "../../components/ScrollReveal/ScrollReveal"
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
          <RevealTitle as="h1" className="support-page__title text-h2" text={t("headline")} />
          <RevealCopy as="p" className="support-page__intro text-body" delay={0.12} blur>
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
          </RevealCopy>
        </header>

        <section className="support-page__form-section" aria-labelledby="support-form-heading">
          <RevealTitle as="h2" id="support-form-heading" className="support-page__form-title text-h3" text={t("formHeading")} />
          <SupportForm />
        </section>
      </div>
    </PageShell>
  )
}
