import { useHeaderReveal } from "../../hooks/useHeaderReveal"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useScroll, useTransform } from "motion/react"
import { useTranslation } from "react-i18next"
import { useLocale } from "../../hooks/useLocale"
import { useSiteNavigation } from "../../hooks/useSiteNavigation"
import { SiteNavigation } from "../SiteNavigation/SiteNavigation"
import { ChevronRight } from "../ChevronRight/ChevronRight"
import { PageSeo } from "../PageSeo/PageSeo"
import { APP_URL, BLOG_URL, SUPPORT_EMAIL, TELEGRAM_CONTACT_URL, TELEGRAM_BOT_URL } from "../../lib/urls"
import nauraWordmark from "../../assets/naura-wordmark.svg"
import "../../pages/BusinessCardsPage/BusinessCardsPage.css"
import "../../pages/BusinessCardsPage/CinematicScenes.css"
import "../../pages/BusinessCardsPage/BusinessCardsHeader.css"
import "../../pages/BusinessCardsPage/BusinessCardsButtons.css"
import "./CardDesign.css"
const EASE = [0.16,1,0.3,1]
const SPRING = { type: "spring", stiffness:320, damping:34, mass:0.7 }
const HEADER_REVEAL = { visible:{opacity:1,transform:"translateY(0px)"}, hidden:{opacity:0,transform:"translateY(-96px)"}, arrival:{opacity:1,transform:"translateY(-120px)"} }
const FOOTER_REVEAL = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
}
const FOOTER_REVEAL_ITEM = {
  hidden: { opacity: 0, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1.44, ease: EASE },
  },
}
export const CardButton = ({ href, children, className = "", target, rel, onClick, type = "button", disabled, ...props }) => {
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

  const Element = href ? motion.a : motion.button
  return (
    <Element
      {...props}
      ref={ref}
      className={`bc2-button ${className}`}
      href={href}
      onClick={onClick}
      type={href ? undefined : type}
      disabled={disabled}
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
    </Element>
  )
}

export function CardHeader() {
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
        <CardButton href={APP_URL} className="bc2-header__cta">{t("nav.start")}</CardButton>
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

export function CardFooter() {
  const { t } = useTranslation("businessCards")
  const { isRu, switchLocale } = useLocale()
  const { homeHref } = useSiteNavigation()
  const reduced = useReducedMotion()
  const product = t("footer.product", { returnObjects: true })
  const contacts = t("footer.contacts", { returnObjects: true })
  const reveal = reduced
    ? { initial: false }
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.08, margin: "0px 0px -5% 0px" },
      }

  return (
    <motion.footer className="bc2-footer" variants={FOOTER_REVEAL} {...reveal}>
      <motion.div className="bc2-footer__grid bc2-grid" variants={FOOTER_REVEAL}>
        <SiteNavigation as={motion.nav} variants={FOOTER_REVEAL_ITEM} aria-label={product.heading} after={<a href={BLOG_URL}>{product.links.blog}</a>}>
          <h3>{product.heading}</h3>
        </SiteNavigation>
        <motion.div className="bc2-footer__contacts" variants={FOOTER_REVEAL_ITEM}>
          <h3>{contacts.heading}</h3>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{contacts.email}</a>
          <a href={TELEGRAM_CONTACT_URL}>{contacts.telegram}</a>
          <a href={TELEGRAM_BOT_URL}>{contacts.bot}</a>
        </motion.div>
        <motion.div className="bc2-footer__legal" variants={FOOTER_REVEAL_ITEM}>
          <SiteNavigation as={motion.nav} resources />
          <button type="button" onClick={switchLocale}>{isRu ? "EN" : "RU"}</button>
          <span>{t("footer.legal.copyright")}</span>
        </motion.div>
      </motion.div>
      <a className="bc2-footer__wordmark" href={homeHref} aria-label="Naura home"><img src={nauraWordmark} alt="" /></a>
    </motion.footer>
  )
}


export function ConnectionLines({ className = "" }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const visible = useInView(ref, { once:true, amount:0.1 })
  return <div ref={ref} className={`card-lines ${className}${visible || reduced ? " is-visible" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 1600 900" preserveAspectRatio="none" fill="none">
      <ellipse cx="800" cy="470" rx="790" ry="335" transform="rotate(-15 800 470)" pathLength="1" />
      <ellipse cx="800" cy="490" rx="860" ry="280" transform="rotate(14 800 490)" pathLength="1" />
      <ellipse cx="800" cy="525" rx="930" ry="220" transform="rotate(-5 800 525)" pathLength="1" />
    </svg>
  </div>
}

export function CardDarkBand({ children, className = "" }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end", "start center"] })
  const scaleX = useTransform(scrollYProgress,[0,1],[0.88,1])
  const borderRadius = useTransform(scrollYProgress,[0,1],[60,0])
  return <div ref={ref} className={`card-dark ${className}`}>
    <motion.div aria-hidden="true" className="card-dark__backdrop" style={reduced ? undefined : { scaleX, borderRadius }} />
    <div className="card-dark__content">{children}</div>
  </div>
}

export function PageShell({ title, description, path, jsonLd, children }) {
  useEffect(() => { window.scrollTo(0,0) }, [path])
  return <div className="bc2-page card-site card-service">
    <PageSeo title={title} description={description} path={path} jsonLd={jsonLd} />
    <CardHeader />
    <main className="card-service__main"><ConnectionLines /><div className="container">{children}</div></main>
    <CardFooter />
  </div>
}
