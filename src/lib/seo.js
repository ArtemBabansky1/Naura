export const SITE_URL = "https://naura.io"
export const SITE_NAME = "Naura"
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
export const TWITTER_HANDLE = "@nauraio"

export const HOME_SEO = {
  title: "Naura — Your network, actually working",
  description:
    "Naura is a personal CRM that remembers everyone you've met, organizes them with AI, and finds warm intros through your handshake network.",
}

export const LEGAL_SEO = {
  privacy: {
    title: "Privacy Policy — Naura",
    description:
      "Learn how Naura collects, uses, stores, and protects your personal information.",
  },
  terms: {
    title: "Terms of Use — Naura",
    description:
      "Read the Terms of Use governing your access to Naura products and services.",
  },
}

const upsertMeta = (attr, key, content) => {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

const upsertLink = (rel, href) => {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", rel)
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

const upsertJsonLd = (data) => {
  const id = "page-jsonld"
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("script")
    el.id = id
    el.type = "application/ld+json"
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export const applyPageSeo = ({
  title,
  description,
  path = "",
  image = DEFAULT_OG_IMAGE,
  locale = "en",
  noindex = false,
  jsonLd = null,
}) => {
  const url = `${SITE_URL}${path}`

  document.title = title

  upsertMeta("name", "description", description)
  upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow")

  upsertMeta("property", "og:title", title)
  upsertMeta("property", "og:description", description)
  upsertMeta("property", "og:url", url)
  upsertMeta("property", "og:type", "website")
  upsertMeta("property", "og:site_name", SITE_NAME)
  upsertMeta("property", "og:locale", locale === "ru" ? "ru_RU" : "en_US")
  upsertMeta("property", "og:image", image)
  upsertMeta("property", "og:image:alt", `${SITE_NAME} — ${description}`)

  upsertMeta("name", "twitter:card", "summary_large_image")
  upsertMeta("name", "twitter:site", TWITTER_HANDLE)
  upsertMeta("name", "twitter:title", title)
  upsertMeta("name", "twitter:description", description)
  upsertMeta("name", "twitter:image", image)

  upsertLink("canonical", url)
  upsertJsonLd(jsonLd)
}

export const buildWebsiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: HOME_SEO.description,
      inLanguage: ["en", "ru"],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon/apple-touch-icon.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "naura.io@naura.io",
        url: `${SITE_URL}/support`,
      },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: HOME_SEO.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
})

export const buildFaqJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
})
