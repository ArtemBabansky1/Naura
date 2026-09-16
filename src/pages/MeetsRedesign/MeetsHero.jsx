import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "motion/react"
import { MEETS_BOT_URL } from "../../lib/urls"
import { CardButton, ConnectionLines } from "../../components/CardDesign/CardDesign"
import { RevealCopy, RevealTitle } from "../../components/ScrollReveal/ScrollReveal"
import photo1 from "../../assets/meets-redesign/conversation-1.webp"
import photo2 from "../../assets/meets-redesign/conversation-2.webp"
import photo3 from "../../assets/meets-redesign/conversation-3.webp"
import photo4 from "../../assets/meets-redesign/conversation-4.webp"
const PHOTOS = [photo1, photo2, photo3, photo4]
export default function MeetsHero() {
  const { t } = useTranslation("meets")
  const reduced = useReducedMotion()
  const titleLines = t("hero.titleLines", { returnObjects: true })
  return <section id="meets-hero" data-section="meets-hero" className="meets-card-hero">
    <ConnectionLines />
    <div className="meets-card-hero__photos" aria-hidden="true">
      {PHOTOS.map((src,i) => <motion.figure key={src} className={`meets-card-hero__photo meets-card-hero__photo--${i+1}`} initial={reduced ? false : {opacity:0,x:i%2 ? 80:-80,y:30}} animate={{opacity:1,x:0,y:0}} transition={{duration:reduced?0:1.5,delay:i*.08,ease:[.22,1,.36,1]}}>
        <img src={src} alt="" width={i===1?1536:i===3?1254:1122} height={i===1?1024:i===3?1254:1402} fetchpriority={i===0?"high":"auto"} decoding="async" />
      </motion.figure>)}
    </div>
    <motion.div className="meets-card-hero__content" initial={reduced?false:{opacity:0,y:35}} animate={{opacity:1,y:0}} transition={{duration:.8,ease:[.16,1,.3,1]}}>
      <RevealTitle as="h1" text={titleLines.join(" ")} lines={titleLines} accent={titleLines.at(-1)} />
      <RevealCopy as="p" delay={0.12}>{t("hero.subtitle")}{" "}<strong>{t("hero.subtitleAccent")}</strong></RevealCopy>
      <div className="meets-card-hero__actions">
        <CardButton href={MEETS_BOT_URL} target="_blank" rel="noopener noreferrer">{t("hero.ctaStart")}</CardButton>
        <CardButton href="#meets-communities" className="card-button--secondary">{t("hero.ctaCommunity")}</CardButton>
      </div>
    </motion.div>
  </section>
}
