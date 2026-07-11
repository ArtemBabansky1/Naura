import { useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig, easing } from "../../lib/framer"
import { RevealText } from "./motion"
import "./MeetsCommunities.css"

/* Problem and solution slide in from opposite sides — the editorial
 * "versus" pairing from the reference boards. */
const slideFrom = (x) => ({
  hidden: { opacity: 0, x },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easing } },
})

/* Giant bottom word scaled to exactly fill the card's content width (the
 * card side paddings are the only air) — measured, not guessed, so both
 * locales fit regardless of word length. The word's INK bottom (canvas
 * TextMetrics — RU words have descenders, EN words don't) is then pinned
 * to 0px from the card's bottom edge. Refits on resize and font load. */
const FIT_BASE_PX = 100
const measureCtx = document.createElement("canvas").getContext("2d")

function GiantWord({ className, text }) {
  const ref = useRef(null)
  const wordRef = useRef(null)
  const probeRef = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    const word = wordRef.current
    const probe = probeRef.current
    const card = el?.parentElement
    if (!el || !word || !probe || !card) return undefined

    const fit = () => {
      // 1. Width: measure the inline word (not the block — a block always
      //    reports the container width once the text fits), then scale.
      el.style.fontSize = `${FIT_BASE_PX}px`
      el.style.marginBottom = "0px"
      const textWidth = word.getBoundingClientRect().width
      if (textWidth <= 0) return
      const fontSize = (FIT_BASE_PX * el.clientWidth) / textWidth
      el.style.fontSize = `${fontSize}px`

      // 2. Bottom: the zero-size inline-block probe sits on the baseline;
      //    canvas metrics give the ink extent below it. Shift the word so
      //    the ink bottom lands exactly on the card's bottom edge.
      const style = getComputedStyle(el)
      measureCtx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`
      const descent = measureCtx.measureText(text).actualBoundingBoxDescent
      const inkBottom = probe.getBoundingClientRect().top + descent
      const cardBottom = card.getBoundingClientRect().bottom
      // Negative margin pulls the word DOWN by the remaining distance so the
      // ink bottom lands exactly on the card's bottom edge.
      el.style.marginBottom = `${inkBottom - cardBottom}px`
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    document.fonts?.ready.then(fit).catch(() => {})
    return () => observer.disconnect()
  }, [text])

  return (
    <h3 ref={ref} className={className}>
      <span ref={wordRef} className="meets-communities__giant-word">
        {text}
        <span ref={probeRef} className="meets-communities__giant-probe" aria-hidden="true" />
      </span>
    </h3>
  )
}

export default function MeetsCommunities() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()
  const benefits = t("communities.solution.benefits", { returnObjects: true })

  // Benefit chips act as tabs inside the dark card — the active chip's
  // description is the card's body copy.
  const [activeIndex, setActiveIndex] = useState(0)
  const activeBenefit = benefits[activeIndex] ?? benefits[0]

  const blockMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <section
      id="meets-communities"
      data-section="meets-communities"
      className="meets-communities section"
    >
      <motion.div className="container" {...blockMotion}>
        {/* Head — headline left, small right-aligned note on the right. */}
        <motion.header className="meets-communities__head" variants={fadeUp}>
          <h2 className="meets-communities__title text-h2">
            <RevealText
              as="span"
              className="meets-communities__title-accent"
              text={t("communities.headlineAccent")}
            />{" "}
            <RevealText as="span" text={t("communities.headlineRest")} delay={0.12} />
          </h2>
          <p className="meets-communities__note text-body-sm">{t("communities.note")}</p>
        </motion.header>

        <div className="meets-communities__grid">
          {/* Problem — muted light card, giant word pinned to the bottom. */}
          <motion.article
            className="meets-communities__card meets-communities__card--problem"
            variants={prefersReduced ? fadeUp : slideFrom(-60)}
          >
            <p className="meets-communities__card-desc text-body">
              {t("communities.problem.description")}
            </p>
            <GiantWord
              className="meets-communities__giant"
              text={t("communities.problem.title")}
            />
          </motion.article>

          {/* Solution — dark card: benefit chips on top, the active chip's
              description as body copy, giant accent word at the bottom. */}
          <motion.article
            className="meets-communities__card meets-communities__card--solution meets-dark"
            variants={prefersReduced ? fadeUp : slideFrom(60)}
          >
            <div className="meets-communities__chips">
              {benefits.map((benefit, i) => (
                <button
                  key={benefit.title}
                  type="button"
                  aria-pressed={i === activeIndex}
                  className={
                    i === activeIndex
                      ? "meets-communities__chip is-active"
                      : "meets-communities__chip"
                  }
                  onClick={() => setActiveIndex(i)}
                >
                  {benefit.title}
                </button>
              ))}
            </div>
            <motion.p
              key={activeBenefit.title}
              className="meets-communities__card-desc text-body"
              initial={prefersReduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easing }}
            >
              {activeBenefit.description}
            </motion.p>
            <GiantWord
              className="meets-communities__giant meets-communities__giant--accent"
              text={t("communities.solution.title")}
            />
          </motion.article>
        </div>
      </motion.div>
    </section>
  )
}
