import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { buildFaqJsonLd } from "../../lib/seo"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import MeetsBackdrop from "./MeetsBackdrop"
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
      {/* Generative fixed backdrop behind the page — drifting palette blobs
          that lean toward the cursor; visible in the gutters and gaps. */}
      <MeetsBackdrop />
      <PageSeo
        title={t("pageTitle")}
        description={t("metaDescription")}
        path="/meets"
        jsonLd={faqJsonLd}
      />
      <main>
        <MeetsHero />
        {/* The white surface is split into stand-alone containers with 30px
            backdrop gaps between them; the week block gets its own panel. */}
        <div className="meets-sheet meets-sheet--hero">
          <MeetsMarquee />
          <MeetsHow />
        </div>
        {/* Transparent wrapper — the week block paints its own content-sized
            white card, so the backdrop stays visible while it is pinned. */}
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
