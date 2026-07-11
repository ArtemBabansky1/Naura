import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { buildFaqJsonLd } from "../../lib/seo"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import MeetsHero from "./MeetsHero"
import MeetsMarquee from "./MeetsMarquee"
import MeetsHow from "./MeetsHow"
import MeetsWhy from "./MeetsWhy"
import MeetsWeek from "./MeetsWeek"
import MeetsPhone from "./MeetsPhone"
import MeetsCommunities from "./MeetsCommunities"
import MeetsForm from "./MeetsForm"
import MeetsFaq from "./MeetsFaq"
import MeetsFooter from "./MeetsFooter"
import "./MeetsPage.css"

export const MeetsPage = () => {
  useSmoothScroll()
  const { t, i18n } = useTranslation("meets")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const faqJsonLd = useMemo(() => {
    const groups = t("faq.groups", { returnObjects: true })
    return buildFaqJsonLd(groups.flatMap((group) => group.items))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() output changes with language
  }, [i18n.language])

  return (
    <div className="meets-page">
      <PageSeo
        title={t("pageTitle")}
        description={t("metaDescription")}
        path="/meets"
        jsonLd={faqJsonLd}
      />
      <main>
        <MeetsHero />
        <div className="meets-sheet meets-sheet--hero">
          <MeetsMarquee />
          <MeetsHow />
        </div>
        {/* Transparent wrapper — the week block paints its own content-sized
            white card. */}
        <div className="meets-sheet meets-sheet--clear">
          <MeetsWeek />
        </div>
        <div className="meets-sheet">
          <MeetsWhy />
          <MeetsPhone />
          <MeetsCommunities />
          <MeetsForm />
          <MeetsFaq />
        </div>
      </main>
      <MeetsFooter />
    </div>
  )
}
