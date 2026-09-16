import { useTranslation } from "react-i18next"
import { CardButton, ConnectionLines } from "../../components/CardDesign/CardDesign"
import { RevealCopy, RevealTitle } from "../../components/ScrollReveal/ScrollReveal"
import { MEETS_BOT_URL } from "../../lib/urls"

export default function MeetsCta() {
  const { t } = useTranslation("meets")
  return (
    <section className="meets-cta" data-section="meets-cta" aria-labelledby="meets-cta-title">
      <ConnectionLines />
      <div className="container meets-cta__content">
        <RevealTitle id="meets-cta-title" text={t("finalCta.headline")} accent={t("finalCta.headline").split(/ +/).slice(-2).join(" ")} />
        <RevealCopy className="meets-cta__description" delay={0.12}>{t("finalCta.description")}</RevealCopy>
        <CardButton href={MEETS_BOT_URL} target="_blank" rel="noopener noreferrer">{t("finalCta.button")}</CardButton>
      </div>
    </section>
  )
}
