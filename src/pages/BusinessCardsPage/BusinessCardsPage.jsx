import { PRODUCT_THEME_STYLES } from "../../lib/productColors"
import { useHeaderReveal } from "../../hooks/useHeaderReveal"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { useTranslation } from "react-i18next"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { SiteNavigation } from "../../components/SiteNavigation/SiteNavigation"
import { useSiteNavigation } from "../../hooks/useSiteNavigation"
import { useLocale } from "../../hooks/useLocale"
import { useSmoothScroll } from "../../hooks/useSmoothScroll"
import { buildFaqJsonLd } from "../../lib/seo"
import {
  APP_URL,
  BLOG_URL,
  SUPPORT_EMAIL,
  TELEGRAM_BOT_URL,
  TELEGRAM_CONTACT_URL,
} from "../../lib/urls"

import hero1200Avif from "../../assets/business-cards-redesign/hero-1200.avif"
import hero1800Avif from "../../assets/business-cards-redesign/hero-1800.avif"
import hero720Avif from "../../assets/business-cards-redesign/hero-720.avif"
import hero1200Webp from "../../assets/business-cards-redesign/hero-1200.webp"
import hero1800Webp from "../../assets/business-cards-redesign/hero-1800.webp"
import hero720Webp from "../../assets/business-cards-redesign/hero-720.webp"
import instantNetworking from "../../assets/business-cards-redesign/instant-networking.webp"

import contact1Avif from "../../assets/business-cards-redesign/contact-1.avif"
import contact1Webp from "../../assets/business-cards-redesign/contact-1.webp"
import contact2Avif from "../../assets/business-cards-redesign/contact-2.avif"
import contact2Webp from "../../assets/business-cards-redesign/contact-2.webp"
import contact3Avif from "../../assets/business-cards-redesign/contact-3.avif"
import contact3Webp from "../../assets/business-cards-redesign/contact-3.webp"
import contact4Avif from "../../assets/business-cards-redesign/contact-4.avif"
import contact4Webp from "../../assets/business-cards-redesign/contact-4.webp"
import contact5Avif from "../../assets/business-cards-redesign/contact-5.avif"
import contact5Webp from "../../assets/business-cards-redesign/contact-5.webp"
import contact6Avif from "../../assets/business-cards-redesign/contact-6.avif"
import contact6Webp from "../../assets/business-cards-redesign/contact-6.webp"
import contactTalk1Avif from "../../assets/business-cards-redesign/contact-talk-1.avif"
import contactTalk1Webp from "../../assets/business-cards-redesign/contact-talk-1.webp"
import contactTalk2Avif from "../../assets/business-cards-redesign/contact-talk-2.avif"
import contactTalk2Webp from "../../assets/business-cards-redesign/contact-talk-2.webp"
import contactTalk3Avif from "../../assets/business-cards-redesign/contact-talk-3.avif"
import contactTalk3Webp from "../../assets/business-cards-redesign/contact-talk-3.webp"
import contactTalk4Avif from "../../assets/business-cards-redesign/contact-talk-4.avif"
import contactTalk4Webp from "../../assets/business-cards-redesign/contact-talk-4.webp"
import { ChevronRight } from "../../components/ChevronRight/ChevronRight"
import nauraWordmark from "../../assets/naura-wordmark.svg"
import { NauraLogo } from "../../components/NauraLogo/NauraLogo"

import { EditorialTitle } from "./EditorialTitle"
import "./BusinessCardsPage.css"
import { CinematicHero, CinematicComparison, CinematicJourney, ConnectionRibbon, useCinematicTransitions } from "./CinematicScenes"
import { FeatureVisual } from "./FeatureIllustrations"
import "./BusinessCardsHeader.css"
import "./BusinessCardsButtons.css"
import "./JourneyPanels.css"
import "./BusinessCardsHeadings.css"
import "./BusinessCardsSurfaces.css"
import { SolutionsScene } from "./SolutionsScene"

const EASE = [0.16, 1, 0.3, 1]
const SPRING = { type: "spring", stiffness: 320, damping: 34, mass: 0.7 }
const PLATFORM_ORBIT_VARIANTS = {
  hidden: {},
  visible: { transition: { delayChildren: 0.05, staggerChildren: 0.09 } },
}
const PLATFORM_CARD_VARIANTS = {
  hidden: ({ side, tilt }) => ({
    opacity: 0,
    x: side === "left" ? "-24vw" : "24vw",
    scale: 0.76,
    rotate: tilt * 0.35,
  }),
  visible: ({ tilt }) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    rotate: tilt,
    transition: { type: "spring", bounce: 0.06, visualDuration: 0.62 },
  }),
}
const HEADER_REVEAL = {
  visible: { opacity: 1, transform: "translateY(0px)" },
  hidden: { opacity: 0, transform: "translateY(-96px)" },
  arrival: { opacity: 1, transform: "translateY(-120px)" },
}

const IMAGES = {
  hero: {
    avif: [hero720Avif, hero1200Avif, hero1800Avif],
    webp: [hero720Webp, hero1200Webp, hero1800Webp],
  },
}

const CONTACT_IMAGES = [
  null,
  { avif: contact1Avif, webp: contact1Webp },
  { avif: contact2Avif, webp: contact2Webp },
  { avif: contact3Avif, webp: contact3Webp },
  { avif: contact4Avif, webp: contact4Webp },
  { avif: contact5Avif, webp: contact5Webp },
  { avif: contact6Avif, webp: contact6Webp },
  { avif: contactTalk1Avif, webp: contactTalk1Webp },
  { avif: contactTalk2Avif, webp: contactTalk2Webp },
  { avif: contactTalk3Avif, webp: contactTalk3Webp },
  { avif: contactTalk4Avif, webp: contactTalk4Webp },
]

const ORBITS = {
  hero: [
    { position: "a", legacy: "hero" },
    { position: "b", contact: 2 },
    { position: "c", contact: 3 },
    { position: "f", chip: "@aya" },
  ],
  platform: [
    { position: "a", contact: 1, side: "left", tilt: -7 },
    { position: "c", contact: 7, side: "left", tilt: 5 },
    { position: "e", contact: 8, side: "left", tilt: -4 },
    { position: "b", contact: 9, side: "right", tilt: 6 },
    { position: "d", contact: 10, side: "right", tilt: -7 },
    { position: "h", contact: 5, side: "right", tilt: 4 },
  ],
}

const Reveal = ({ children, className = "", delay = 0, amount = 0.2, as = "div" }) => {
  const reduced = useReducedMotion()
  const Component = motion[as] || motion.div

  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -10% 0px" }}
      transition={reduced
        ? { duration: 0.12, delay }
        : { visualDuration: 0.6, type: "spring", bounce: 0.2, delay, restDelta: 0.001 }}
    >
      {children}
    </Component>
  )
}

const SectionIntro = ({ title, id, className = "", lines }) => (
  <header className={`bc2-section-intro bc2-grid ${className}`}>
    <div className="bc2-section-intro__title">
      <EditorialTitle text={title} id={id} lines={lines} />
    </div>
  </header>
)

const ResponsivePicture = ({
  image,
  alt,
  className = "",
  eager = false,
  sizes = "(min-width: 1200px) calc(100vw - 200px), 100vw",
}) => {
  const src = IMAGES[image]
  const avifSet = `${src.avif[0]} 720w, ${src.avif[1]} 1200w, ${src.avif[2]} 1800w`
  const webpSet = `${src.webp[0]} 720w, ${src.webp[1]} 1200w, ${src.webp[2]} 1800w`

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avifSet} sizes={sizes} />
      <source type="image/webp" srcSet={webpSet} sizes={sizes} />
      <img
        src={src.webp[1]}
        srcSet={webpSet}
        sizes={sizes}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchpriority={eager ? "high" : "auto"}
      />
    </picture>
  )
}

const ContactPicture = ({ index, alt = "", className = "", eager = false }) => {
  const src = CONTACT_IMAGES[index]
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={src.avif} />
      <source type="image/webp" srcSet={src.webp} />
      <img
        src={src.webp}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
      />
    </picture>
  )
}

const ParallaxPicture = ({ image, alt, className = "", eager = false, strength = 4, sizes }) => {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const rawY = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`])
  const y = useSpring(rawY, { stiffness: 100, damping: 28, mass: 0.5 })

  return (
    <motion.div ref={ref} className={className} style={reduced ? undefined : { y }}>
      <ResponsivePicture image={image} alt={alt} eager={eager} sizes={sizes} />
    </motion.div>
  )
}

const MagneticLink = ({ href, children, className = "", target, rel }) => {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 360, damping: 28, mass: 0.45 })
  const smoothY = useSpring(y, { stiffness: 360, damping: 28, mass: 0.45 })

  const move = (event) => {
    if (reduced || event.pointerType !== "mouse" || !ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 8)
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 8)
  }

  const reset = () => {
    animate(x, 0, { duration: reduced ? 0 : 0.24, ease: EASE })
    animate(y, 0, { duration: reduced ? 0 : 0.24, ease: EASE })
  }

  return (
    <motion.a
      ref={ref}
      className={`bc2-button ${className}`}
      href={href}
      target={target}
      rel={rel}
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
      style={{ x: smoothX, y: smoothY }}
      whileHover={reduced ? undefined : { scale: 1.015 }}
      whileTap={reduced ? undefined : { scale: 0.99 }}
      transition={SPRING}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="bc2-button__arrow">
        <ChevronRight />
      </span>
    </motion.a>
  )
}

const OrbitField = ({ variant, eager = false }) => {
  const reduced = useReducedMotion()
  const isPlatform = variant === "platform"

  return (
  <motion.div
    className={`bc2-orbit bc2-orbit--${variant}`}
    aria-hidden="true"
    variants={isPlatform ? PLATFORM_ORBIT_VARIANTS : undefined}
    initial={isPlatform && !reduced ? "hidden" : false}
    whileInView={isPlatform && !reduced ? "visible" : undefined}
    viewport={isPlatform ? { once: true, amount: 0.1, margin: "0px 0px 30% 0px" } : undefined}
  >
    {ORBITS[variant].map((item, index) => (
      <motion.figure
        className={`bc2-orbit__item bc2-orbit__item--${item.position}${item.chip ? " is-chip" : ""}`}
        custom={{ side: item.side, tilt: item.tilt }}
        variants={isPlatform ? PLATFORM_CARD_VARIANTS : undefined}
        style={{
          "--orbit-delay": `${index * -1.15}s`,
          "--orbit-duration": `${8.5 + index * 0.55}s`,
          willChange: isPlatform ? "transform, opacity" : undefined,
        }}
        initial={isPlatform ? undefined : reduced ? false : { opacity: 0, scale: 0.72 }}
        whileInView={isPlatform ? undefined : { opacity: 1, scale: 1 }}
        viewport={isPlatform ? undefined : { once: true, amount: 0.1, margin: "0px 0px 30% 0px" }}
        transition={isPlatform ? undefined : { duration: reduced ? 0 : 0.7, delay: reduced ? 0 : index * 0.045, ease: EASE }}
        key={`${variant}-${item.position}`}
      >
        {item.legacy && (
          <ResponsivePicture image={item.legacy} alt="" eager={eager && index === 0} sizes="220px" />
        )}
        {item.contact && (
          <ContactPicture index={item.contact} eager={eager && index < 3} />
        )}
        {item.chip && <span>{item.chip}</span>}
      </motion.figure>
    ))}
  </motion.div>
  )
}

function SiteHeader() {
  const { t } = useTranslation("businessCards")
  const { isRu, switchLocale } = useLocale()
  const { homeHref } = useSiteNavigation()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [headerMode, setHeaderMode] = useState("inline")
  const headerReveal = useHeaderReveal(headerMode, reduced)
  const isFloating = headerMode !== "inline"
  const isHidden = headerMode === "hidden"
  const lastScrollY = useRef(0)
  const scrollFrame = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [open])

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const updateHeader = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current

      // Keep the header in the document flow at the top of the page. Once it
      // has scrolled away, keep the same floating element for both directions
      // so an interrupted exit can reverse from its current position.
      if (currentScrollY < 24) {
        setHeaderMode("inline")
      } else if (delta < -8) {
        setHeaderMode("visible")
      } else if (delta > 8) {
        setHeaderMode((mode) => mode === "inline" ? "inline" : "hidden")
        setOpen(false)
      }

      // Accumulate small movements so gentle upward scrolling also reveals it.
      if (currentScrollY < 24 || Math.abs(delta) > 8) lastScrollY.current = currentScrollY
      scrollFrame.current = null
    }

    const onScroll = () => {
      if (scrollFrame.current === null) {
        scrollFrame.current = window.requestAnimationFrame(updateHeader)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current)
    }
  }, [])

  return (
    <div className="bc2-header-shell">
      <motion.header
        className={`bc2-header bc2-grid${isFloating ? " bc2-header--floating" : ""}${isHidden ? " bc2-header--hidden" : ""}`}
        inert={isHidden ? "" : undefined}
        aria-hidden={isHidden || undefined}
        variants={HEADER_REVEAL}
        initial={reduced ? false : "arrival"}
        animate={headerReveal}
      >
      <a className="bc2-brand" href={homeHref} aria-label="Naura home">
        <span aria-hidden="true"><img src={nauraWordmark} alt="" /></span>
      </a>
      <SiteNavigation className="bc2-header__links" />
      <div className="bc2-header__actions">
        <button type="button" onClick={switchLocale} aria-label={t("nav.language")}>
          {isRu ? "EN" : "RU"}
        </button>
        <a href={APP_URL}>{t("nav.signIn")}</a>
        <MagneticLink href={APP_URL} className="bc2-header__cta">{t("nav.start")}</MagneticLink>
      </div>
      <button
        type="button"
        className={`bc2-menu-toggle${open ? " is-open" : ""}`}
        aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
        aria-expanded={open}
        aria-controls="bc2-mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span /><span />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="bc2-mobile-menu"
            id="bc2-mobile-menu"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, clipPath: "inset(0 0 100% 0 round 24px)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 24px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, clipPath: "inset(0 0 100% 0 round 24px)" }}
            transition={reduced ? { duration: 0.12 } : { duration: 0.36, ease: EASE }}
          >
            <SiteNavigation onNavigate={() => setOpen(false)} trailing={<ChevronRight />} />
            <div>
              <button type="button" onClick={switchLocale}>{isRu ? "EN" : "RU"}</button>
              <a href={APP_URL}>{t("nav.start")}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.header>
    </div>
  )
}

const FeatureComposition = ({ items }) => (
  <div className="bc2-features__composition">
    <Reveal as="article" className="bc2-proof bc2-proof--qr">
      <FeatureVisual index={0} />
      <div><h3>{items[0].title}</h3><p>{items[0].description}</p></div>
    </Reveal>
    <Reveal as="article" className="bc2-proof bc2-proof--multiple" delay={0.04}>
      <FeatureVisual index={1} />
      <div><h3>{items[1].title}</h3><p>{items[1].description}</p></div>
    </Reveal>
    <Reveal as="article" className="bc2-proof bc2-proof--links" delay={0.08}>
      <FeatureVisual index={2} />
      <div><h3>{items[2].title}</h3><p>{items[2].description}</p></div>
    </Reveal>
    <Reveal as="article" className="bc2-proof bc2-proof--capture" delay={0.12}>
      <FeatureVisual index={3} />
      <div><h3>{items[3].title}</h3><p>{items[3].description}</p></div>
    </Reveal>
    <Reveal as="article" className="bc2-proof bc2-proof--live" delay={0.16}>
      <FeatureVisual index={4} />
      <div><h3>{items[4].title}</h3><p>{items[4].description}</p></div>
    </Reveal>
    <Reveal as="article" className="bc2-proof bc2-proof--custom" delay={0.2}>
      <FeatureVisual index={5} />
      <div><h3>{items[5].title}</h3><p>{items[5].description}</p></div>
    </Reveal>
  </div>
)

function FeaturesSection() {
  const { t } = useTranslation("businessCards")
  const items = t("features.items", { returnObjects: true })
  const title = t("features.title")

  return (
    <section className="bc2-section bc2-features" aria-labelledby="bc2-features-title">
      <SectionIntro
        title={title}
        id="bc2-features-title"
        lines={title.includes("Tools for") ? ["Tools for networking", "that actually works"] : [title]}
      />
      <FeatureComposition items={items} />
    </section>
  )
}

function InstantSection() {
  const { t } = useTranslation("businessCards")
  const stats = t("instant.stats", { returnObjects: true })
  const title = t("instant.title")

  return (
    <section className="bc2-section bc2-instant" aria-labelledby="bc2-instant-title">
      <div className="bc2-grid bc2-instant__layout">
        <Reveal className="bc2-instant__visual">
          <img
            className="bc2-instant__photo"
            src={instantNetworking}
            alt={t("instant.imageAlt")}
            loading="lazy"
            decoding="async"
          />
          <div className="bc2-home-icon" aria-hidden="true">
            <span className="bc2-home-icon__tile"><NauraLogo variant="mark" width={108} decorative /></span>
            <span className="bc2-home-icon__name">Naura</span>
          </div>
        </Reveal>
        <Reveal className="bc2-instant__panel" delay={0.08}>
          <EditorialTitle text={title} id="bc2-instant-title" lines={[title]} />
          <span className="bc2-instant__label">{t("instant.label")}</span>
          <p className="bc2-instant__description">{t("instant.description")}</p>
          <div className="bc2-instant__stats">
            {stats.map((stat) => (
              <div key={stat.value}><strong>{stat.value}</strong><span>{stat.label}</span></div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function PlatformSection() {
  const { t } = useTranslation("businessCards")
  const title = t("platform.title")

  return (
    <section className="bc2-section bc2-platform" aria-labelledby="bc2-platform-title">
      <div className="bc2-platform__panel">
        <OrbitField variant="platform" />
        <Reveal className="bc2-platform__copy">
          <EditorialTitle
            text={title}
            id="bc2-platform-title"
            lines={title.includes("business card") ? ["Your business card", "is just the beginning"] : [title]}
          />
          <p>{t("platform.description")}</p>
          <MagneticLink href={APP_URL} className="bc2-platform__cta bc2-button--light">
            {t("platform.cta")}
          </MagneticLink>
          <small>{t("platform.note")}</small>
        </Reveal>
      </div>
    </section>
  )
}

function FaqSection() {
  const { t } = useTranslation("businessCards")
  const reduced = useReducedMotion()
  const items = t("faq.items", { returnObjects: true })
  // Keep the FAQ compact when it first enters the viewport; visitors can open
  // the answer they need without the first item pushing the rest down.
  const [openId, setOpenId] = useState(null)
  const title = t("faq.title")

  return (
    <section className="bc2-section bc2-faq" id="faq" aria-labelledby="bc2-faq-title">
      <div className="bc2-grid bc2-faq__layout">
        <Reveal as="header" className="bc2-faq__intro">
          <EditorialTitle
            text={title}
            id="bc2-faq-title"
            lines={title.includes("Frequently") ? ["Frequently asked", "questions"] : [title]}
          />
          <p>{t("faq.subtitle")}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{t("faq.contact")}<span className="bc2-button__arrow" aria-hidden="true"><ChevronRight /></span></a>
        </Reveal>
        <div className="bc2-faq__items">
          {items.map((item) => {
            const open = openId === item.id
            return (
              <article className={open ? "is-open" : ""} key={item.id}>
                <h3>
                  <button
                    id={`bc2-faq-question-${item.id}`}
                    type="button"
                    aria-expanded={open}
                    aria-controls={`bc2-faq-answer-${item.id}`}
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span>{item.question}</span><i aria-hidden="true" />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`bc2-faq-answer-${item.id}`}
                      role="region"
                      aria-labelledby={`bc2-faq-question-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduced ? { duration: 0.12 } : { duration: 0.36, ease: EASE }}
                    >
                      <p>{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  const { t } = useTranslation("businessCards")
  return (
    <section className="bc2-final" aria-labelledby="bc2-final-title">
      <div className="bc2-final__lines" aria-hidden="true">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="none" fill="none">
          <ellipse cx="800" cy="470" rx="790" ry="335" transform="rotate(-15 800 470)" pathLength="1" />
          <ellipse cx="800" cy="490" rx="860" ry="280" transform="rotate(14 800 490)" pathLength="1" />
          <ellipse cx="800" cy="525" rx="930" ry="220" transform="rotate(-5 800 525)" pathLength="1" />
        </svg>
      </div>
      <Reveal className="bc2-final__copy">
        <span>{t("cinematic.finalLabel")}</span>
        <EditorialTitle text={t("finalCta.title")} accent={t("finalCta.title").split(/ +/).slice(-2).join(" ")} id="bc2-final-title" />
        <p>{t("finalCta.subtitle")}</p>
        <MagneticLink href={APP_URL} className="bc2-final__button">{t("finalCta.cta")}</MagneticLink>
      </Reveal>
    </section>
  )
}

function Footer() {
  const { t } = useTranslation("businessCards")
  const { isRu, switchLocale } = useLocale()
  const { homeHref } = useSiteNavigation()
  const product = t("footer.product", { returnObjects: true })
  const contacts = t("footer.contacts", { returnObjects: true })

  return (
    <footer className="bc2-footer">
      <div className="bc2-footer__grid bc2-grid">
        <SiteNavigation aria-label={product.heading} after={<a href={BLOG_URL}>{product.links.blog}</a>}>
          <h3>{product.heading}</h3>
        </SiteNavigation>
        <div className="bc2-footer__contacts">
          <h3>{contacts.heading}</h3>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{contacts.email}</a>
          <a href={TELEGRAM_CONTACT_URL}>{contacts.telegram}</a>
          <a href={TELEGRAM_BOT_URL}>{contacts.bot}</a>
        </div>
        <div className="bc2-footer__legal">
          <SiteNavigation resources />
          <button type="button" onClick={switchLocale}>{isRu ? "EN" : "RU"}</button>
          <span>{t("footer.legal.copyright")}</span>
        </div>
      </div>
      <a className="bc2-footer__wordmark" href={homeHref} aria-label="Naura home"><img src={nauraWordmark} alt="" /></a>
    </footer>
  )
}

export const BusinessCardsPage = () => {
  useSmoothScroll()
  const { t, i18n } = useTranslation("businessCards")
  const pageRef = useRef(null)
  useCinematicTransitions(pageRef, i18n.language)
  const faqItems = t("faq.items", { returnObjects: true })
  const faqJsonLd = useMemo(() => buildFaqJsonLd(faqItems), [faqItems])

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }) }, [])

  return (
    <div ref={pageRef} className="bc2-page" data-product="cards" style={PRODUCT_THEME_STYLES.cards} key={i18n.language}>
      <PageSeo
        title={t("seo.title")}
        description={t("seo.description")}
        path="/digital-card"
        image="https://naura.io/business-cards-og.jpg"
        jsonLd={faqJsonLd}
      />
      <SiteHeader />
      <main>
        <CinematicHero Action={MagneticLink} />
        <CinematicComparison Action={MagneticLink} />
        <CinematicJourney Action={MagneticLink} />
        <ConnectionRibbon />
        <FeaturesSection />
        <SolutionsScene Action={MagneticLink}>
          <InstantSection />
        </SolutionsScene>
        <PlatformSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
