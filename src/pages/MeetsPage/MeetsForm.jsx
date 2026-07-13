import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import { fadeUp, staggerContainer, viewportConfig } from "../../lib/framer"
import { LocaleLink } from "../../components/LocaleLink/LocaleLink"
import { RevealText } from "./motion"
import formBgAvif from "../../assets/meets/form-bg.avif"
import formBgWebp from "../../assets/meets/form-bg.webp"
import "./MeetsForm.css"

const INITIAL = { name: "", contact: "", comment: "" }

/* "Оставить заявку" — a rounded panel with the hero hills photo as its
 * background (its own shot — the empty chair on the meadow). White headline
 * + note on the left, the white form card on the right. Submission is
 * mocked (no backend yet). */
export default function MeetsForm() {
  const { t } = useTranslation("meets")
  const prefersReduced = useReducedMotion()

  const [fields, setFields] = useState(INITIAL)
  const [consentPersonal, setConsentPersonal] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [status, setStatus] = useState("idle") // idle | submitting | success | error
  const submitting = status === "submitting"

  const update = (key) => (e) => {
    const { value } = e.target
    setFields((prev) => ({ ...prev, [key]: value }))
    if (status === "error") setStatus("idle")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fields.name.trim() || !fields.contact.trim()) {
      setStatus("error")
      return
    }

    setStatus("submitting")
    // No backend yet — mock the round-trip so the UX is complete.
    await new Promise((resolve) => setTimeout(resolve, 700))
    setStatus("success")
  }

  return (
    <section id="meets-form" data-section="meets-form" className="meets-form section">
      <div className="container">
        <div className="meets-form__panel">
          {/* Static fill — no parallax/zoom, the photo shows at its natural crop. */}
          <picture>
            <source srcSet={formBgAvif} type="image/avif" />
            <source srcSet={formBgWebp} type="image/webp" />
            <img
              className="meets-form__bg"
              src={formBgWebp}
              alt=""
              aria-hidden="true"
              width="1672"
              height="941"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <div className="meets-form__left">
            <h2 className="meets-form__title text-h2">
              <RevealText text={t("form.headline")} />
            </h2>
            <p className="meets-form__desc text-body">{t("form.description")}</p>
          </div>

          {status === "success" ? (
            <div className="meets-form__card meets-form__success" role="status">
              <h3 className="text-h3">{t("form.successTitle")}</h3>
              <p className="text-body meets-form__success-body">{t("form.successBody")}</p>
            </div>
          ) : (
            <motion.form
              className="meets-form__card"
              onSubmit={handleSubmit}
              noValidate
              initial={prefersReduced ? undefined : "hidden"}
              whileInView={prefersReduced ? undefined : "visible"}
              viewport={viewportConfig}
              variants={staggerContainer(0.08)}
            >
              {status === "error" && (
                <p className="meets-form__banner text-body" role="alert">
                  {t("form.errorRequired")}
                </p>
              )}

              <motion.div className="meets-form__field" variants={fadeUp}>
                <label className="meets-form__label text-body" htmlFor="meets-name">
                  {t("form.name.label")}
                </label>
                <input
                  id="meets-name"
                  className="meets-form__input"
                  type="text"
                  value={fields.name}
                  onChange={update("name")}
                  placeholder={t("form.name.placeholder")}
                  autoComplete="name"
                  required
                  disabled={submitting}
                />
              </motion.div>

              <motion.div className="meets-form__field" variants={fadeUp}>
                <label className="meets-form__label text-body" htmlFor="meets-contact">
                  {t("form.contact.label")}
                </label>
                <input
                  id="meets-contact"
                  className="meets-form__input"
                  type="text"
                  value={fields.contact}
                  onChange={update("contact")}
                  placeholder={t("form.contact.placeholder")}
                  required
                  disabled={submitting}
                />
              </motion.div>

              <motion.div className="meets-form__field" variants={fadeUp}>
                <label className="meets-form__label text-body" htmlFor="meets-comment">
                  {t("form.comment.label")}
                </label>
                <textarea
                  id="meets-comment"
                  className="meets-form__input meets-form__textarea"
                  rows="3"
                  value={fields.comment}
                  onChange={update("comment")}
                  placeholder={t("form.comment.placeholder")}
                  disabled={submitting}
                />
              </motion.div>

              <motion.div className="meets-form__consents" variants={fadeUp}>
                <label className="meets-form__consent">
                  <input
                    type="checkbox"
                    className="meets-form__checkbox"
                    checked={consentPersonal}
                    onChange={(e) => setConsentPersonal(e.target.checked)}
                    disabled={submitting}
                    required
                  />
                  <span className="text-body-sm">
                    <Trans
                      t={t}
                      i18nKey="form.consentPersonal"
                      components={{
                        privacy: <LocaleLink to="/privacy" className="meets-form__consent-link" />,
                        terms: <LocaleLink to="/terms" className="meets-form__consent-link" />,
                      }}
                    />
                  </span>
                </label>

                <label className="meets-form__consent">
                  <input
                    type="checkbox"
                    className="meets-form__checkbox"
                    checked={consentMarketing}
                    onChange={(e) => setConsentMarketing(e.target.checked)}
                    disabled={submitting}
                  />
                  <span className="text-body-sm">{t("form.consentMarketing")}</span>
                </label>
              </motion.div>

              <motion.button
                type="submit"
                className="meets-btn meets-btn--primary meets-form__submit"
                disabled={submitting || !consentPersonal}
                variants={fadeUp}
              >
                {submitting ? t("form.submitting") : t("form.submit")}
              </motion.button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  )
}
