import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { buildFaqJsonLd, MEETS_URL } from "../../lib/seo"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import MeetsHero from "./MeetsHero"
import MeetsMarquee from "./MeetsMarquee"
import MeetsHow from "./MeetsHow"
import MeetsWhy from "./MeetsWhy"
import MeetsNote from "./MeetsNote"
import MeetsMatching from "./MeetsMatching"
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

  // Route-scoped favicon — the SPA shares one document, so the icon links
  // are swapped for the Meets mark on mount and restored on leave.
  useEffect(() => {
    const head = document.head
    const originals = Array.from(head.querySelectorAll('link[rel="icon"]'))
    originals.forEach((link) => link.remove())
    const meetsIcon = document.createElement("link")
    meetsIcon.rel = "icon"
    meetsIcon.type = "image/png"
    meetsIcon.href = "/favicon/favicon-meets.png"
    head.appendChild(meetsIcon)
    return () => {
      meetsIcon.remove()
      originals.forEach((link) => head.appendChild(link))
    }
  }, [])

  const faqJsonLd = useMemo(() => {
    const groups = t("faq.groups", { returnObjects: true })
    return buildFaqJsonLd(groups.flatMap((group) => group.items))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() output changes with language
  }, [i18n.language])

  return (
    /* Keyed by locale: the in-view reveals run with `once`, so their observers
       detach after the first play. A language switch then swapped the copy
       under elements that had already fired, and everything mounted with the
       new text stayed parked at the hidden variant — headings blank, cards
       invisible. Remounting the page on switch lets every reveal play once
       more against the fresh copy. */
    <div className="meets-page" key={i18n.language}>
      {/* Canonical home is the subdomain root, whichever host served the page —
          so a stray naura.io/meets hit still points search here. */}
      <PageSeo
        title={t("pageTitle")}
        description={t("metaDescription")}
        path="/"
        baseUrl={MEETS_URL}
        jsonLd={faqJsonLd}
      />
      <main>
        <MeetsHero />
        <div className="meets-sheet meets-sheet--hero">
          <MeetsMarquee />
          <MeetsHow />
        </div>
        {/* Transparent wrapper — the week card expands to a fullscreen dark
            takeover while pinned, so the sheet has no bottom gap: the dark
            band below continues the black seamlessly. */}
        <div className="meets-sheet meets-sheet--clear">
          <MeetsWeek />
        </div>
        {/* Continuation band — same linen page background as everywhere.
            Wireframe order: зачем идти → подбор идёт под тебя → начать. */}
        <div className="meets-dark-band">
          <MeetsWhy />
          {/* Founder's note — the origin story bridges the reader's "why go"
              into how the matching is built. */}
          <MeetsNote />
          <MeetsMatching />
          <MeetsPhone />
        </div>
        {/* Back to the white page — the sheet rides over the dark band with
            60px top corners (same radius as the footer). */}
        <div className="meets-sheet meets-sheet--rounded">
          <MeetsCommunities />
          <MeetsForm />
          <MeetsFaq />
        </div>
      </main>
      <MeetsFooter />
    </div>
  )
}
