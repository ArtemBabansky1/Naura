import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocale } from "../../hooks/useLocale"
import { applyPageSeo } from "../../lib/seo"

export const PageSeo = ({
  title,
  description,
  path = "/",
  image,
  noindex = false,
  jsonLd = null,
  baseUrl,
}) => {
  const { i18n } = useTranslation()
  const { localePath } = useLocale()

  useEffect(() => {
    applyPageSeo({
      title,
      description,
      path: localePath(path),
      logicalPath: path,
      image,
      locale: i18n.language,
      noindex,
      jsonLd,
      ...(baseUrl ? { baseUrl } : {}),
    })
  }, [title, description, path, image, noindex, jsonLd, baseUrl, i18n.language, localePath])

  return null
}
