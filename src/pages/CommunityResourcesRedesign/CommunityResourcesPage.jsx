import { PRODUCT_THEME_STYLES } from "../../lib/productColors"
import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ChevronRight } from "../../components/ChevronRight/ChevronRight"
import searchIcon from "../../assets/icons/lucide/search.svg"
import videoCover from "../../assets/community-resources/video-cover.webp"
import bookIcon from "../../assets/icons/lucide/book-open.svg"
import coffeeIcon from "../../assets/icons/lucide/coffee.svg"
import giftIcon from "../../assets/icons/lucide/gift.svg"
import communityIcon from "../../assets/icons/lucide/users-round.svg"
import { useLocale } from "../../hooks/useLocale"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { CardButton, CardHeader, ConnectionLines } from "../../components/CardDesign/CardDesign"
import { MEETS_URL } from "../../lib/seo"
import { MEETS_BOT_URL } from "../../lib/urls"
import MeetsFooter from "../MeetsRedesign/MeetsFooter"
import { RevealCopy, RevealTitle } from "../../components/ScrollReveal/ScrollReveal"
import ru from "../../i18n/locales/ru/communityResources.json"
import en from "../../i18n/locales/en/communityResources.json"
import "../MeetsRedesign/MeetsPage.css"
import "../MeetsRedesign/MeetsFaq.css"
import "./CommunityResourcesPage.css"
import "../MeetsRedesign/MeetsRedesign.css"
import MeetsBenefitNumber from "../MeetsRedesign/MeetsBenefitNumber"

const resourceIcons = [bookIcon, coffeeIcon, giftIcon, communityIcon]
const shots = ["01-template", "02-name", "03-language", "04-schedule", "05-ready"]
const shotUrl = (index) => `/community-resources/create-room/${shots[index]}.jpg`
const external = { target: "_blank", rel: "noopener noreferrer" }
const videoArrival = { hidden: { transform: "translateY(100%)" }, visible: { transform: "translateY(0%)" } }

function CopyButton({ text, copy, copied, failure }) {
  const [status, setStatus] = useState("")
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(""), 3500)
    return () => clearTimeout(timer)
  }, [status])
  return <div className="cr-copy">
    <button className="meets-btn meets-btn--ghost" type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setStatus(copied) }
      catch { setStatus(failure) }
    }}>{copy}</button>
    <span role="status">{status}</span>
  </div>
}

function Templates({ items, labels }) {
  return <div className="meets-faq__accordion cr-templates">
    {items.map((item) => <details className="meets-faq__item" key={item.label}>
      <summary className="meets-faq__trigger text-h4"><span>{item.label}</span><span className="meets-faq__icon" aria-hidden="true" /></summary>
      <div className="cr-template"><p>{item.text}</p><CopyButton text={item.text} {...labels} /></div>
    </details>)}
  </div>
}

export const CommunityResourcesPage = () => {
  const { isRu, localePath } = useLocale()
  const reducedMotion = useReducedMotion()
  const data = isRu ? ru : en
  const [activeStep, setActiveStep] = useState(0)
  const [zoom, setZoom] = useState(null)
  const dialog = useRef(null)
  const home = localePath(/^meets\./i.test(window.location.hostname) ? "/" : "/meets")
  const labels = { ...data.common, failure: isRu ? "Не удалось скопировать. Выделите текст и скопируйте вручную." : "Could not copy. Select and copy the text manually." }
  useEffect(() => {
    const previousOverflowX = document.body.style.overflowX
    document.body.style.overflowX = "clip"
    const original = Array.from(document.head.querySelectorAll('link[rel="icon"]'))
    original.forEach((link) => link.remove())
    const icon = document.createElement("link")
    icon.rel = "icon"; icon.href = "/favicon/favicon-meets.png"; document.head.appendChild(icon)
    return () => { document.body.style.overflowX = previousOverflowX; icon.remove(); original.forEach((link) => document.head.appendChild(link)) }
  }, [])
  useEffect(() => {
    if (zoom === null) return
    dialog.current.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previous }
  }, [zoom])
  const screenshot = (index, title) => <button type="button" className="cr-shot" onClick={() => setZoom({ index, title })} aria-label={`${data.common.openShot}: ${title}`}>
    <img src={shotUrl(index)} alt={title} width="560" height={[919, 912, 913, 909, 915][index]} loading="lazy" />
    <span className="cr-shot__zoom" aria-hidden="true"><img src={searchIcon} alt="" width="24" height="24" /></span>
  </button>

  return <div className="bc2-page card-site meets-page cr-page card-resources" data-product="meets" style={PRODUCT_THEME_STYLES.meets} key={isRu ? "ru" : "en"}>
    <PageSeo title={data.pageTitle} description={data.metaDescription} path="/community-resources-v1" baseUrl={MEETS_URL} />
    <a className="cr-skip" href="#steps">{isRu ? "К инструкции" : "Skip to the guide"}</a>
    <CardHeader />
    <main>
      <section className="cr-hero">
        <ConnectionLines />
        <div className="container">
          <div className="cr-hero__copy">
          <RevealCopy as="p" className="text-body cr-eyebrow">{data.hero.eyebrow}</RevealCopy>
          <RevealTitle as="h1" className="text-display" text={data.hero.title} accent="Naura Meets" delay={0.06} />
          <RevealCopy as="p" className="cr-hero__description" delay={0.12} blur>
            {isRu ? "Создайте комнату, пригласите участников и запустите знакомства внутри сообщества." : "Create a room, invite members and start meaningful connections within your community."}
          </RevealCopy>
          </div>
          <motion.nav className="cr-overview" aria-label={data.steps.title}
            initial={reducedMotion ? false : { transform: "translateY(110%)" }}
            animate={{ transform: "translateY(0%)" }}
            transition={{ duration: reducedMotion ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {[data.steps.s1, data.steps.s2, data.steps.s3].map((step, index) => <a href={`#launch-${index + 1}`} key={step.title}>
              <MeetsBenefitNumber index={index} />
              <span className="cr-overview__label">{step.title}</span><span className="cr-overview__arrow" aria-hidden="true"><ChevronRight /></span>
            </a>)}
          </motion.nav>
        </div>
      </section>
      <section id="steps" className="container cr-section">
        <RevealTitle as="h2" className="text-h2 cr-centered-title" text={data.steps.title} />
        <article id="launch-1" className="cr-launch">
          <div className="cr-section-head"><span className="cr-index"><MeetsBenefitNumber index={0} /></span><RevealTitle as="h3" className="text-h3" text={data.steps.s1.title} /><RevealCopy as="p" delay={0.12}>{data.steps.s1.body}</RevealCopy></div>
          <div className="cr-wizard">
            <div className="cr-wizard__steps" aria-label={data.steps.s1.title}>
              {data.steps.s1.substeps.map((step, index) => <button type="button" aria-pressed={index === activeStep} aria-controls="room-step" onClick={() => setActiveStep(index)} key={step.title}>
                <span>{index + 1}</span>{step.title}
              </button>)}
            </div>
            <div className="cr-wizard__panel" id="room-step">
              <div className="cr-wizard__copy" aria-live="polite">
                <span className="text-label">{isRu ? "Шаг" : "Step"} {activeStep + 1} / 4</span>
                <h4 className="text-h3">{data.steps.s1.substeps[activeStep].title}</h4>
                <p>{data.steps.s1.substeps[activeStep].body}</p>
                <div className="cr-wizard__arrows">
                  <button className="meets-btn meets-btn--ghost" type="button" disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)} aria-label={isRu ? "Предыдущий шаг" : "Previous step"}><ChevronRight className="naura-chevron--left" /></button>
                  <button className="meets-btn meets-btn--ghost" type="button" disabled={activeStep === 3} onClick={() => setActiveStep(activeStep + 1)} aria-label={isRu ? "Следующий шаг" : "Next step"}><ChevronRight /></button>
                </div>
              </div>
              {screenshot(activeStep, data.steps.s1.substeps[activeStep].title)}
              <div className="cr-mobile-next"><button className="meets-btn meets-btn--ghost" type="button" disabled={activeStep === 3} onClick={() => setActiveStep(activeStep + 1)}>{isRu ? "Следующий шаг" : "Next step"}<ChevronRight /></button></div>
            </div>
            <div className="cr-ready"><h4 className="text-h3">{data.steps.s1.afterTitle}</h4><p>{data.steps.s1.afterBody}</p></div>
          </div>
        </article>
        <article id="launch-2" className="cr-launch">
          <div className="cr-section-head"><span className="cr-index"><MeetsBenefitNumber index={1} /></span><RevealTitle as="h3" className="text-h3" text={data.steps.s2.title} /></div>
          <div className="cr-prose"><p>{data.steps.s2.body}</p><p>{data.steps.s2.extra}</p><p>{data.steps.s2.linkBefore}<a href="#announce">{data.steps.s2.link}</a>{data.steps.s2.linkAfter}</p></div>
        </article>
        <article id="launch-3" className="cr-launch">
          <div className="cr-section-head"><span className="cr-index"><MeetsBenefitNumber index={2} /></span><RevealTitle as="h3" className="text-h3" text={data.steps.s3.title} /><RevealCopy as="p" delay={0.12}>{data.steps.s3.body}</RevealCopy></div>
          <div className="cr-prose"><ul>{data.steps.s3.bullets.map((text) => <li key={text}>{text}</li>)}</ul>
            <div className="cr-useful">
              <div className="cr-useful__copy"><h4 className="text-h3">{data.steps.s3.exampleTitle}</h4><p>{data.steps.s3.exampleLead}</p><p>{data.steps.s3.exampleCopyHint}</p>
                <CopyButton text={data.steps.s3.exampleCopyText} {...labels} />
              </div>
              <div className="cr-useful__message"><strong>{data.steps.s3.exampleLabel}</strong><ul>{data.steps.s3.exampleItems.map((item, index) => <li key={item.name}><span className="cr-useful__icon" style={{ "--resource-icon": `url(${resourceIcons[index]})` }} aria-hidden="true"><img src={resourceIcons[index]} alt="" width="22" height="22" /></span><span><span className="cr-useful__name">{item.name}</span><span className="cr-useful__description"> — {item.desc}</span></span></li>)}</ul></div>
            </div>
          </div>
        </article>
      </section>
      <section id="announce" className="cr-section cr-announcements"><div className="container cr-split">
        <div className="cr-section-head"><RevealTitle as="h2" className="text-h2" text={data.announcements.title} /><RevealCopy as="p" delay={0.12}>{data.announcements.lead}</RevealCopy></div>
        <Templates items={data.announcements.items} labels={labels} />
      </div></section>
      <section id="bot" className="container cr-section">
        <div className="cr-section-head cr-section-head--center"><RevealTitle as="h2" className="text-h2" text={data.bot.title} /><RevealCopy as="p" delay={0.12}>{data.bot.leadBefore}<a href={MEETS_BOT_URL} {...external}>{data.bot.handle}</a>{data.bot.leadAfter}</RevealCopy></div>
        <div className="cr-bot-grid">
          <div className="cr-bot-card cr-bot-card--setup">
            <ol className="cr-bot-steps">{data.bot.steps.map((text) => <li key={text}>{text}</li>)}</ol>
            <div className="cr-bot-actions"><a className="meets-btn meets-btn--ghost" href="https://t.me/CoffeeMeetBot?startgroup=true" {...external}>{data.bot.addCta}<ChevronRight /></a><CopyButton text={data.bot.handle} {...labels} copy={data.bot.copyHandle} /></div>
            <details className="meets-faq__item cr-group-id"><summary className="meets-faq__trigger text-h4">{data.bot.userInfoNote}<span className="meets-faq__icon" aria-hidden="true" /></summary><p>{data.bot.userInfoHintBefore}<a href="https://t.me/userinfobot" {...external}>{data.bot.userInfoHandle}</a>{data.bot.userInfoHintAfter}</p></details>
          </div>
          <div className="cr-bot-card cr-bot-card--messages">
            <RevealTitle as="h3" className="text-h3 cr-message-title" text={data.bot.messagesTitle} /><Templates items={data.bot.messageExamples} labels={labels} />
          </div>
        </div>
      </section>
      <section id="video" className="container cr-section">
        <div className="cr-section-head cr-section-head--center"><RevealTitle as="h2" className="text-h2" text={data.video.title} /><RevealCopy as="p" delay={0.12}>{data.video.lead}</RevealCopy></div>
        <motion.div className="cr-video-stage"
          initial={reducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="cr-video-clip">
            <motion.div className="cr-video-arrival"
              variants={videoArrival}
              transition={{ duration: reducedMotion ? 0 : 2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="cr-video">
                <div className="cr-video-preview">
                  <img src={videoCover} alt="" width="1672" height="941" loading="lazy" />
                </div>
              </div>
            </motion.div>
            <motion.div className="cr-video-action"
              variants={videoArrival}
              transition={{ duration: reducedMotion ? 0 : 2, ease: [0.16, 1, 0.3, 1] }}
            >
              <CardButton href="https://www.youtube.com/watch?v=Z3vpdbj3GQY" {...external}>{isRu ? "Смотреть на YouTube" : "Watch on YouTube"}</CardButton>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </main>
    <MeetsFooter meetsPath={home} />
    {zoom !== null && <dialog className="cr-lightbox" ref={dialog} onClose={() => setZoom(null)} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }} aria-label={zoom.title}>
      <button autoFocus type="button" className="meets-btn meets-btn--ghost" onClick={() => dialog.current.close()}>{data.common.closeShot} ×</button><img src={shotUrl(zoom.index)} alt={zoom.title} />
    </dialog>}
  </div>
}
