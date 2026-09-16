import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react"
import { CardButton } from "../../components/CardDesign/CardDesign"
import { UserRound } from "../../components/UserRound/UserRound"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import { MEETS_BOT_URL } from "../../lib/urls"
import { RevealText } from "./motion"
import "./MeetsWeek.css"

const STEPS = 5
const PROFILE_FIELDS = ["role", "about", "looking", "skills"]

const PROFILE_ICONS = {
  role: "M4 8h16v11H4zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  about: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20a7 7 0 0 1 14 0",
  looking: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z",
  skills: "M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9zM18.5 3.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z",
}

function ProfileCard({ profile, caption = true }) {
  return (
    <figure className="mweek-profile">
      <div className="mweek-profile__card">
        <div className="mweek-profile__head">
          <span className="mweek-profile__avatar">{profile.initials}</span>
          <div className="mweek-profile__id">
            <p className="mweek-profile__name">{profile.name}</p>
            <p className="mweek-profile__place">{profile.location}</p>
          </div>
        </div>

        <ul className="mweek-profile__rows">
          {PROFILE_FIELDS.map((field) => (
            <li className="mweek-profile__row" key={field}>
              <svg
                className="mweek-profile__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={PROFILE_ICONS[field]} />
              </svg>
              <span>{profile[field]}</span>
            </li>
          ))}
        </ul>
      </div>
      {caption && <figcaption className="mweek-profile__caption">{profile.caption}</figcaption>}
    </figure>
  )
}

function InvitationVisual({ step, day }) {
  return (
    <div className="mweek-invite">
      <span className="mweek-visual-day">{day}</span>
      <h4>{step.title}</h4>
      <p>{step.description}</p>
      <div className="mweek-invite__choices">
        <span>×</span>
        <span>✓</span>
      </div>
    </div>
  )
}

function IntroductionVisual({ profile }) {
  const interests = profile.skills.split(",").slice(0, 2)

  return (
    <div className="mweek-introduction">
      <span className="mweek-introduction__person">
        <UserRound />
      </span>

      <span className="mweek-introduction__thread" aria-hidden="true">
        <span className="mweek-introduction__connection" />
        <span className="mweek-introduction__message">
          <span />
          <span />
          <span />
        </span>
      </span>

      <div className="mweek-introduction__match">
        <div className="mweek-introduction__match-head">
          <span>{profile.initials}</span>
          <div>
            <p>{profile.name}</p>
            <small>{profile.location}</small>
          </div>
        </div>
        <div className="mweek-introduction__interests">
          {interests.map((interest) => <span key={interest}>{interest.trim()}</span>)}
        </div>
      </div>
    </div>
  )
}

function MeetingVisual({ step, day }) {
  return (
    <div className="mweek-meeting">
      <span className="mweek-visual-day">{day}</span>
      <div className="mweek-meeting__people">
        <span><UserRound /></span>
        <div className="mweek-meeting__connection" />
        <span><UserRound /></span>
      </div>
      <h4>{step.title}</h4>
      <div className="mweek-meeting__modes">
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="6" width="13" height="12" rx="3" />
            <path d="m16 10 5-3v10l-5-3" />
          </svg>
        </span>
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
            <circle cx="12" cy="9" r="2.4" />
          </svg>
        </span>
      </div>
    </div>
  )
}

function FeedbackVisual({ step, day }) {
  return (
    <div className="mweek-feedback">
      <span className="mweek-visual-day">{day}</span>
      <span className="mweek-feedback__check">✓</span>
      <h4>{step.title}</h4>
      <div className="mweek-feedback__rating">
        {[0, 1, 2, 3, 4].map((item) => <span key={item} />)}
      </div>
    </div>
  )
}

function StageVisual({ index, step, day, profile, reduced }) {
  return (
    <div className={`mweek-demo mweek-demo--${index}`} aria-hidden="true">
      <div className="mweek-demo__top">
        <span>{day}</span>
        <span>{String(index).padStart(2, "0")} / 04</span>
      </div>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={index}
          className={`mweek-demo__scene mweek-demo__scene--${index}`}
          initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: -12, scale: 0.99 }}
          transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {index === 0 && <ProfileCard profile={profile} />}
          {index === 1 && <InvitationVisual step={step} day={day} />}
          {index === 2 && <IntroductionVisual profile={profile} />}
          {index === 3 && <MeetingVisual step={step} day={day} />}
          {index === 4 && <FeedbackVisual step={step} day={day} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function MeetsWeek() {
  const { t } = useTranslation("meets")
  const reduced = useReducedMotion()
  const compactTabs = useMediaQuery("(max-width: 899.98px)")
  const steps = t("week.steps", { returnObjects: true })
  const stepDays = t("week.stepDays", { returnObjects: true })
  const profile = t("week.profile", { returnObjects: true })
  const rootRef = useRef(null)
  const tabsRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (reduced) return
    const next = Math.min(STEPS - 1, Math.floor(latest * STEPS))
    setActiveIndex((current) => (current === next ? current : next))
  })

  useEffect(() => {
    if (!compactTabs || !tabsRef.current) return
    const activeTab = tabsRef.current.querySelector(`#mweek-step-${activeIndex}`)
    if (!activeTab) return
    tabsRef.current.scrollTo({
      left: activeTab.offsetLeft - (tabsRef.current.clientWidth - activeTab.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    })
  }, [activeIndex, compactTabs, reduced])

  const selectStep = (index) => {
    setActiveIndex(index)
    if (reduced || !rootRef.current) return
    const root = rootRef.current
    const top = root.getBoundingClientRect().top + window.scrollY
    const distance = Math.max(0, root.offsetHeight - window.innerHeight)
    window.scrollTo({
      top: top + distance * (index / (STEPS - 1)),
      behavior: "smooth",
    })
  }

  const handleKeys = (event, index) => {
    let next = index
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % STEPS
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + STEPS - 1) % STEPS
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = STEPS - 1
    else return

    event.preventDefault()
    selectStep(next)
    rootRef.current?.querySelector(`#mweek-step-${next}`)?.focus({ preventScroll: true })
  }

  const activeStep = steps[activeIndex]
  const activeDay = stepDays[activeIndex]
  const eyebrowWords = t("week.eyebrow").trim().split(/\s+/)
  const eyebrowLastWord = eyebrowWords.pop()
  const eyebrowFirstLine = eyebrowWords.join("\u00A0")

  return (
    <section
      id="meets-week"
      data-section="meets-week"
      ref={rootRef}
      className={`meets-week${reduced ? " is-reduced" : ""}`}
      aria-labelledby="mweek-title"
    >
      <div className="mweek-sticky">
        <header className="mweek-head">
          <h2 id="mweek-title" className="mweek-headline text-h2">
            <RevealText text={t("week.headline")} />
          </h2>
        </header>

        <div className="mweek-layout">
          <div className="mweek-editorial">
            <h3>
              <span>{eyebrowFirstLine}</span>
              <span>{eyebrowLastWord}</span>
            </h3>
            <div
              ref={tabsRef}
              className="mweek-tabs"
              role="tablist"
              aria-orientation={compactTabs ? "horizontal" : "vertical"}
              aria-label={t("week.headline")}
            >
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  id={`mweek-step-${index}`}
                  type="button"
                  role="tab"
                  aria-controls="mweek-panel"
                  aria-selected={activeIndex === index}
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => selectStep(index)}
                  onKeyDown={(event) => handleKeys(event, index)}
                >
                  <span>{String(index).padStart(2, "0")}</span>
                  <span>{step.title}</span>
                  <span>{stepDays[index]}</span>
                  <i />
                </button>
              ))}
            </div>

            <div
              id="mweek-panel"
              className="mweek-copy"
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={`mweek-step-${activeIndex}`}
            >
              {steps.map((step, index) => (
                <motion.p
                  key={step.title}
                  aria-hidden={activeIndex !== index}
                  initial={false}
                  animate={{ opacity: activeIndex === index ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
                >
                  {step.description}
                </motion.p>
              ))}
            </div>

            <div className="mweek-actions">
              <CardButton href={MEETS_BOT_URL} target="_blank" rel="noopener noreferrer">
                {t("week.cta")}
              </CardButton>
              <CardButton href="#meets-form" className="card-button--secondary">
                {t("week.ctaSecondary")}
              </CardButton>
            </div>
          </div>

          <StageVisual
            index={activeIndex}
            step={activeStep}
            day={activeDay}
            profile={profile}
            reduced={reduced}
          />
        </div>
      </div>
    </section>
  )
}
