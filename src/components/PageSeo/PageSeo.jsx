import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { applyPageSeo } from "../../lib/seo"

export const PageSeo = ({
  title,
  description,
  path = "",
  image,
  noindex = false,
  jsonLd = null,
}) => {
  const { i18n } = useTranslation()

  useEffect(() => {
    applyPageSeo({
      title,
      description,
      path,
      image,
      locale: i18n.language,
      noindex,
      jsonLd,
    })
  }, [title, description, path, image, noindex, jsonLd, i18n.language])

  return null
}
