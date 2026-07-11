import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import { fadeUp, scaleIn, staggerContainer, viewportConfig } from "../../lib/framer"
import { LocaleLink } from "../../components/LocaleLink/LocaleLink"
import { useLocale } from "../../hooks/useLocale"
import {
  BLOG_URL,
  PODCAST_URL,
  SUPPORT_EMAIL,
  TELEGRAM_BLOG_URL,
  TELEGRAM_CONTACT_URL,
} from "../../lib/urls"
import "./MeetsFooter.css"

const external = { target: "_blank", rel: "noopener noreferrer" }

/* Big "N" — same mark as the landing footer, solid accent purple (the
 * fill follows the element's CSS color). */
function BigMark() {
  return (
    <svg
      className="meets-footer__mark"
      width="364"
      height="162"
      viewBox="0 0 364 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Naura Meets"
    >
      <path
        d="M2.39341e-05 4.95424L27.5377 4.95424C27.5377 4.95424 27.4395 79.3259 27.4395 121.926C26.7113 122.518 28.1407 121.352 27.4395 121.926C43.569 108.815 68.5885 88.8373 95.1568 71.3043C121.687 53.7965 152.256 36.0878 183.958 22.7157C215.532 9.39743 249.118 0.000113482 281.447 0C308.503 2.07973e-06 329.5 10.1614 343.486 25.6043C357.186 40.7317 363.735 60.381 364 79.5512V162H336.464V79.8454L336.431 78.4579C335.936 64.1353 330.868 50.5573 321.952 40.7128C313.035 30.8664 299.873 24.238 281.447 24.238C254.854 24.2381 225.521 32.0614 195.858 44.5733C166.322 57.0317 137.335 73.7639 111.676 90.6968C86.0559 107.604 70.3727 116.547 48.3634 137.259C38.58 146.466 25.4947 162 25.4947 162H0L2.39341e-05 4.95424Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function MeetsFooter() {
  const { t } = useTranslation("meets")
  const { localePath } = useLocale()
  const prefersReduced = useReducedMotion()

  const contentMotion = prefersReduced
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportConfig,
        variants: staggerContainer(0.1),
      }

  return (
    <footer className="meets-footer" data-section="meets-footer">
      <div className="meets-footer__panel meets-dark">
        <motion.div className="meets-footer__content" {...contentMotion}>
          <motion.div className="meets-footer__brand" variants={scaleIn}>
            <BigMark />
            <span className="meets-footer__wordmark">
              Naura <span className="meets-footer__wordmark-accent">Meets</span>
            </span>
            <p className="meets-footer__subtitle text-body-sm">{t("footer.subtitle")}</p>
            <p className="meets-footer__copy text-body-sm">{t("footer.copyright")}</p>
          </motion.div>

          <motion.nav
            className="meets-footer__col"
            aria-label={t("footer.navigation.heading")}
            variants={fadeUp}
          >
            <h3 className="meets-footer__heading">{t("footer.navigation.heading")}</h3>
            <ul className="meets-footer__list">
              <li><a href={localePath("/")} className="meets-footer__link">{t("footer.navigation.home")}</a></li>
              <li><a href="#meets-how" className="meets-footer__link">{t("footer.navigation.how")}</a></li>
              <li><a href="#meets-communities" className="meets-footer__link">{t("footer.navigation.communities")}</a></li>
              <li><a href="#meets-faq" className="meets-footer__link">{t("footer.navigation.faq")}</a></li>
              <li><a href={BLOG_URL} className="meets-footer__link" {...external}>{t("footer.navigation.blog")}</a></li>
            </ul>
          </motion.nav>

          <motion.div className="meets-footer__col" variants={fadeUp}>
            <h3 className="meets-footer__heading">{t("footer.contacts.heading")}</h3>
            <ul className="meets-footer__list">
              <li><a href={`mailto:${SUPPORT_EMAIL}`} className="meets-footer__link">{t("footer.contacts.email")}</a></li>
              <li><a href={TELEGRAM_CONTACT_URL} className="meets-footer__link" {...external}>{t("footer.contacts.telegram")}</a></li>
              <li><a href={TELEGRAM_BLOG_URL} className="meets-footer__link" {...external}>{t("footer.socials.blog")}</a></li>
              <li><a href={PODCAST_URL} className="meets-footer__link" {...external}>{t("footer.socials.podcast")}</a></li>
            </ul>
          </motion.div>

          <motion.div className="meets-footer__col" variants={fadeUp}>
            <h3 className="meets-footer__heading">{t("footer.docs.heading")}</h3>
            <ul className="meets-footer__list">
              <li><LocaleLink to="/privacy" className="meets-footer__link">{t("footer.docs.privacy")}</LocaleLink></li>
              <li><LocaleLink to="/terms" className="meets-footer__link">{t("footer.docs.terms")}</LocaleLink></li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
