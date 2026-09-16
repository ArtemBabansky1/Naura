import { useEffect, useRef, useState } from "react"
import { useLocale } from "../../hooks/useLocale"
import { PageSeo } from "../../components/PageSeo/PageSeo"
import { SiteHeader } from "../../components/SiteNavigation/SiteHeader"
import { MEETS_URL } from "../../lib/seo"
import { MEETS_BOT_URL } from "../../lib/urls"
import { MeetsWordmark } from "../MeetsPage/MeetsNav"
import MeetsFooter from "../MeetsPage/MeetsFooter"
import ru from "../../i18n/locales/ru/communityResources.json"
import en from "../../i18n/locales/en/communityResources.json"
import "../MeetsPage/MeetsPage.css"
import "../MeetsPage/MeetsFaq.css"
import "./CommunityResourcesPage.css"

const shots = ["01-template", "02-name", "03-language", "04-schedule", "05-ready"]
const shotUrl = (index) => `/community-resources/create-room/${shots[index]}.jpg`
const external = { target: "_blank", rel: "noopener noreferrer" }

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
  const data = isRu ? ru : en
  const [activeStep, setActiveStep] = useState(0)
  const [zoom, setZoom] = useState(null)
  const dialog = useRef(null)
  const home = localePath(/^meets\./i.test(window.location.hostname) ? "/" : "/meets")
  const labels = { ...data.common, failure: isRu ? "Не удалось скопировать. Выделите текст и скопируйте вручную." : "Could not copy. Select and copy the text manually." }
  const sections = [
    ["steps", data.steps.title], ["announce", data.announcements.title],
    ["bot", isRu ? "Приглашения бота" : "Bot invites"], ["video", data.video.title],
  ]
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
    <span>{data.common.openShot} <span aria-hidden="true">↗</span></span>
  </button>

  return <div className="meets-page cr-page" key={isRu ? "ru" : "en"}>
    <PageSeo title={data.pageTitle} description={data.metaDescription} path="/community-resources-v1" baseUrl={MEETS_URL} />
    <a className="cr-skip" href="#steps">{isRu ? "К инструкции" : "Skip to the guide"}</a>
    <SiteHeader className="cr-site-header" brand={<MeetsWordmark />} action={<a className="meets-btn meets-btn--primary" href={MEETS_BOT_URL} {...external}>{data.nav.openBot}</a>} />
    <main>
      <section className="cr-hero">
        <div className="container">
          <p className="text-body cr-eyebrow">{data.hero.eyebrow}</p>
          <h1 className="text-display">{data.hero.title}</h1>
          <nav className="cr-overview" aria-label={data.steps.title}>
            {[data.steps.s1, data.steps.s2, data.steps.s3].map((step, index) => <a href={`#launch-${index + 1}`} key={step.title}>
              <span className="cr-step-number">0{index + 1}</span><span>{step.title}</span><span aria-hidden="true">↘</span>
            </a>)}
          </nav>
        </div>
      </section>
      <nav className="cr-toc" aria-label={data.nav.ariaLabel}><div className="container">{sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</div></nav>
      <section id="steps" className="container cr-section">
        <h2 className="text-h2">{data.steps.title}</h2>
        <article id="launch-1" className="cr-launch">
          <div className="cr-section-head"><span className="cr-index">01</span><h3 className="text-h3">{data.steps.s1.title}</h3><p>{data.steps.s1.body}</p></div>
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
                  <button className="meets-btn meets-btn--ghost" type="button" disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)} aria-label={isRu ? "Предыдущий шаг" : "Previous step"}>←</button>
                  <button className="meets-btn meets-btn--ghost" type="button" disabled={activeStep === 3} onClick={() => setActiveStep(activeStep + 1)} aria-label={isRu ? "Следующий шаг" : "Next step"}>→</button>
                </div>
              </div>
              {screenshot(activeStep, data.steps.s1.substeps[activeStep].title)}
              <div className="cr-mobile-next"><button className="meets-btn meets-btn--ghost" type="button" disabled={activeStep === 3} onClick={() => setActiveStep(activeStep + 1)}>{isRu ? "Следующий шаг" : "Next step"} →</button></div>
            </div>
            <div className="cr-ready"><div><h4 className="text-h3">{data.steps.s1.afterTitle}</h4><p>{data.steps.s1.afterBody}</p></div>{screenshot(4, data.steps.s1.afterTitle)}</div>
          </div>
        </article>
        <article id="launch-2" className="cr-launch">
          <div className="cr-section-head"><span className="cr-index">02</span><h3 className="text-h3">{data.steps.s2.title}</h3></div>
          <div className="cr-prose"><p>{data.steps.s2.body}</p><p>{data.steps.s2.extra}</p><p>{data.steps.s2.linkBefore}<a href="#announce">{data.steps.s2.link}</a>{data.steps.s2.linkAfter}</p></div>
        </article>
        <article id="launch-3" className="cr-launch">
          <div className="cr-section-head"><span className="cr-index">03</span><h3 className="text-h3">{data.steps.s3.title}</h3><p>{data.steps.s3.body}</p></div>
          <div className="cr-prose"><ul>{data.steps.s3.bullets.map((text) => <li key={text}>{text}</li>)}</ul>
            <div className="cr-useful"><h4 className="text-h3">{data.steps.s3.exampleTitle}</h4><p>{data.steps.s3.exampleLead}</p><p>{data.steps.s3.exampleCopyHint}</p>
              <div className="cr-useful__message"><strong>{data.steps.s3.exampleLabel}</strong><ul>{data.steps.s3.exampleItems.map((item) => <li key={item.name}><span aria-hidden="true">{item.emoji}</span><span>{item.name} — {item.desc}</span></li>)}</ul></div>
              <CopyButton text={data.steps.s3.exampleCopyText} {...labels} />
            </div>
          </div>
        </article>
      </section>
      <section id="announce" className="cr-section cr-announcements"><div className="container cr-split">
        <div className="cr-section-head"><h2 className="text-h2">{data.announcements.title}</h2><p>{data.announcements.lead}</p></div>
        <Templates items={data.announcements.items} labels={labels} />
      </div></section>
      <section id="bot" className="container cr-section cr-split">
        <div className="cr-section-head"><h2 className="text-h2">{data.bot.title}</h2><p>{data.bot.leadBefore}<a href={MEETS_BOT_URL} {...external}>{data.bot.handle}</a>{data.bot.leadAfter}</p></div>
        <div className="cr-prose"><ol className="cr-bot-steps">{data.bot.steps.map((text) => <li key={text}>{text}</li>)}</ol>
          <div className="cr-bot-actions"><a className="meets-btn meets-btn--ghost" href="https://t.me/CoffeeMeetBot?startgroup=true" {...external}>{data.bot.addCta} ↗</a><CopyButton text={data.bot.handle} {...labels} copy={data.bot.copyHandle} /></div>
          <details className="meets-faq__item cr-group-id"><summary className="meets-faq__trigger text-h4">{data.bot.userInfoNote}<span className="meets-faq__icon" aria-hidden="true" /></summary><p>{data.bot.userInfoHintBefore}<a href="https://t.me/userinfobot" {...external}>{data.bot.userInfoHandle}</a>{data.bot.userInfoHintAfter}</p></details>
          <h3 className="text-h3 cr-message-title">{data.bot.messagesTitle}</h3><Templates items={data.bot.messageExamples} labels={labels} />
        </div>
      </section>
      <section id="video" className="container cr-section">
        <div className="cr-video meets-dark"><div className="cr-section-head"><h2 className="text-h2">{isRu ? <>Видео<wbr />инструкция</> : data.video.title}</h2><p>{data.video.lead}</p></div>
          <a className="cr-video-preview" href="https://www.youtube.com/watch?v=Z3vpdbj3GQY" {...external}>
            <img src={shotUrl(0)} alt="" width="560" height="919" loading="lazy" />
            <span className="cr-video-preview__action"><span className="cr-play" aria-hidden="true">▶</span><span>{isRu ? "Смотреть на YouTube" : "Watch on YouTube"} ↗</span></span>
          </a>
        </div>
      </section>
    </main>
    <MeetsFooter meetsPath={home} />
    {zoom !== null && <dialog className="cr-lightbox" ref={dialog} onClose={() => setZoom(null)} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }} aria-label={zoom.title}>
      <button autoFocus type="button" className="meets-btn meets-btn--ghost" onClick={() => dialog.current.close()}>{data.common.closeShot} ×</button><img src={shotUrl(zoom.index)} alt={zoom.title} />
    </dialog>}
  </div>
}
