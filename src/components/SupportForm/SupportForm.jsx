import { useState } from "react"
import { useTranslation } from "react-i18next"
import "./SupportForm.css"

const INITIAL = { name: "", email: "", message: "" }

export const SupportForm = () => {
  const { t } = useTranslation("support")
  const [fields, setFields] = useState(INITIAL)
  const [status, setStatus] = useState("idle")

  const update = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }))
    if (status !== "idle" && status !== "submitting") setStatus("idle")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const name = fields.name.trim()
    const email = fields.email.trim()
    const message = fields.message.trim()

    if (!name || !email || !message) {
      setStatus("error")
      return
    }

    setStatus("submitting")

    try {
      await new Promise((resolve) => setTimeout(resolve, 700))
      setFields(INITIAL)
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <form className="support-form" onSubmit={handleSubmit} noValidate>
      {status === "success" && (
        <p className="support-form__banner support-form__banner--success" role="status">
          {t("form.success")}
        </p>
      )}
      {status === "error" && (
        <p className="support-form__banner support-form__banner--error" role="alert">
          {t("form.error")}
        </p>
      )}

      <div className="support-form__field">
        <label className="support-form__label text-body-sm" htmlFor="support-name">
          {t("form.nameLabel")}
        </label>
        <input
          id="support-name"
          className="support-form__input"
          type="text"
          name="name"
          value={fields.name}
          onChange={update("name")}
          autoComplete="name"
          disabled={status === "submitting"}
        />
      </div>

      <div className="support-form__field">
        <label className="support-form__label text-body-sm" htmlFor="support-email">
          {t("form.emailLabel")}
        </label>
        <input
          id="support-email"
          className="support-form__input"
          type="email"
          name="email"
          value={fields.email}
          onChange={update("email")}
          autoComplete="email"
          disabled={status === "submitting"}
        />
      </div>

      <div className="support-form__field">
        <label className="support-form__label text-body-sm" htmlFor="support-message">
          {t("form.messageLabel")}
        </label>
        <textarea
          id="support-message"
          className="support-form__textarea"
          name="message"
          rows={6}
          value={fields.message}
          onChange={update("message")}
          disabled={status === "submitting"}
        />
      </div>

      <button
        type="submit"
        className="support-form__submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? t("form.submitting") : t("form.submit")}
      </button>
    </form>
  )
}
