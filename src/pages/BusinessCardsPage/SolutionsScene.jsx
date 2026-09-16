import { useLayoutEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { gsap } from "../../lib/gsap"
import { scheduleScrollRefresh } from "../../lib/scrollRefresh"
import { SUPPORT_EMAIL } from "../../lib/urls"
import conferenceNetworking from "../../assets/business-cards-redesign/conference-networking-crowd-v2.jpg"
import { EditorialTitle } from "./EditorialTitle"
import "./SolutionsScene.css"

export function SolutionsScene({ Action, children }) {
  const { t } = useTranslation("businessCards")
  const root = useRef(null)
  const title = t("solutions.title")
  const titleLines = title.split(/(?<=\.)\s+/)
  const solutions = [
    t("solutions.business", { returnObjects: true }),
    t("solutions.events", { returnObjects: true }),
  ]

  useLayoutEffect(() => {
    const sequence = root.current
    const section = sequence.querySelector(".bc2-solutions")
    const stage = sequence.querySelector(".bc2-solutions__stage")
    const frame = sequence.querySelector(".bc2-solutions__mosaic")
    const grid = sequence.querySelector(".bc2-solutions__copy")
    const photo = sequence.querySelector(".bc2-solutions__panorama")
    const softPhoto = sequence.querySelector(".bc2-solutions__photo--soft")
    const heading = sequence.querySelector(".bc2-solutions__title h2")
    const words = heading.querySelectorAll(".bc2-title-word")
    const cards = Array.from(sequence.querySelectorAll(".bc2-solution-copy"))
    const media = gsap.matchMedia()

    media.add({
      animate: "(prefers-reduced-motion: no-preference) and (min-height: 620px)",
      narrow: "(max-width: 767px)",
    }, ({ conditions }) => {
      if (!conditions.animate) return
      sequence.dataset.sceneMotion = "animated"

      // Keep all content in normal flow if zoomed text cannot fit the stage.
      if (cards.some((card) => card.offsetHeight > stage.clientHeight - 96)) {
        sequence.dataset.sceneMotion = "static"
        return
      }

      gsap.set(cards, { opacity: 1, visibility: "visible", y: () => stage.clientHeight })
      const interactive = [false, false]
      cards.forEach((card) => { card.inert = true })
      const windows = conditions.narrow ? [[0.45, 0.54], [0.65, 0.74]] : [[0.53, 0.60], [0.53, 0.60]]
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: ({ isActive }) => {
            sequence.dataset.sceneActive = String(isActive)
          },
          onUpdate: ({ progress }) => {
            // Only the readable, fully revealed cards enter the keyboard order.
            for (let index = 0; index < cards.length; index += 1) {
              const visible = progress >= windows[index][0] && progress < windows[index][1]
              if (visible !== interactive[index]) {
                interactive[index] = visible
                cards[index].inert = !visible
              }
            }
          },
        },
      })

      // Native sticky positioning and a direct scrub share the same scroll clock.
      // There is no pin spacer or delayed scrub to flash at the section handoff.
      timeline
        .fromTo(frame, {
          clipPath: () => {
            // Read the resolved grid padding instead of parsing the custom
            // property directly: wide screens use a max()/calc() expression.
            const gutter = parseFloat(getComputedStyle(grid).paddingLeft)
            const radius = parseFloat(getComputedStyle(sequence).getPropertyValue("--nc-radius"))
            const inset = stage.clientHeight * 0.05
            return `inset(${inset}px ${gutter}px ${inset}px ${gutter}px round ${radius}px)`
          },
        }, {
          clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.20,
        }, 0)
        .fromTo(photo, { scale: 1 }, { scale: 1.04, duration: 0.20 }, 0)
        .fromTo(heading, { scale: 0.86 }, { scale: 1, duration: 0.20 }, 0)
        .to(heading, { scale: 1.7, duration: 0.13, ease: "power1.in" }, 0.22)
        // Animate the outer word spans: EditorialTitle owns the inner reveal.
        .to(words, {
          opacity: 0, filter: "blur(6px)", duration: 0.10,
          stagger: { amount: 0.03 }, ease: "power1.in",
        }, 0.22)

      if (conditions.narrow) {
        timeline
          .to(cards[0], { y: 0, duration: 0.10, ease: "power2.out" }, 0.35)
          .to(cards[0], {
            y: (_, card) => -((stage.clientHeight + card.offsetHeight) / 2 + 32),
            duration: 0.14,
          }, 0.54)
          .to(cards[1], { y: 0, duration: 0.09, ease: "power2.out" }, 0.61)
          .to(cards[1], {
            y: (_, card) => -((stage.clientHeight + card.offsetHeight) / 2 + 32),
            duration: 0.23,
          }, 0.74)
      } else {
        timeline
          .to(cards, {
            y: 0, duration: 0.14,
            stagger: 0.008, ease: "power2.out",
          }, 0.375)
          .to(cards, {
            y: (_, card) => -((stage.clientHeight + card.offsetHeight) / 2 + 32),
            duration: 0.36,
            stagger: 0.008,
            ease: "power1.inOut",
          }, 0.58)
      }

      timeline
        .to(photo, { scale: 1.24, duration: conditions.narrow ? 0.28 : 0.42, ease: "power1.inOut" }, conditions.narrow ? 0.72 : 0.58)
        // Crossfade a pre-blurred layer instead of repainting a viewport blur.
        .to(softPhoto, { opacity: 1, duration: 0.22 }, conditions.narrow ? 0.76 : 0.64)
        // Reserve the final beat for the incoming section, on both breakpoints.
        .set({}, {}, 1)

      return () => {
        sequence.dataset.sceneMotion = "static"
        delete sequence.dataset.sceneActive
        cards.forEach((card) => { card.inert = false })
      }
    }, sequence)

    scheduleScrollRefresh()
    return () => media.revert()
  }, [])

  return (
    <div className="bc2-section bc2-solutions-sequence" ref={root} data-scene-motion="static">
      <section className="bc2-solutions" id="business-solutions" aria-labelledby="bc2-solutions-title">
        <div className="bc2-solutions__stage">
          <div className="bc2-solutions__mosaic">
            <div className="bc2-solutions__panorama">
              <img src={conferenceNetworking} alt={t("solutions.conferenceAlt")} loading="lazy" decoding="async" />
              <img className="bc2-solutions__photo--soft" src={conferenceNetworking} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            </div>
            <div className="bc2-solutions__title">
              <EditorialTitle text={title} lines={titleLines} id="bc2-solutions-title" />
            </div>
          </div>
          <div className="bc2-grid bc2-solutions__copy">
            {solutions.map((solution, index) => (
              <article className={`bc2-solution-copy bc2-solution-copy--${index === 0 ? "business" : "events"}`} key={solution.title}>
                <h3>{solution.title}</h3>
                <ul>{solution.items.map((item) => <li key={item}>{item}</li>)}</ul>
                <Action href={`mailto:${SUPPORT_EMAIL}`} className="bc2-solution-copy__cta">
                  {solution.cta}
                </Action>
              </article>
            ))}
          </div>
        </div>
      </section>
      {children}
    </div>
  )
}
