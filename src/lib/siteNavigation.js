import { withLocalePath } from "./locale"
import { SITE_URL } from "./urls"

export const SITE_NAVIGATION = [
  { id: "crm", path: "/" },
  { id: "businessCards", path: "/digital-card" },
  { id: "communities", path: "/", hash: "#communities" },
  { id: "meets", path: "/meets" },
]

export const SITE_RESOURCES = [
  { id: "communityResources", path: "/community-resources" },
  { id: "faq", path: "/faq" },
  { id: "support", path: "/support" },
  { id: "privacy", path: "/privacy" },
  { id: "terms", path: "/terms" },
]

export const isMeetsHost = (hostname) => /^meets\./i.test(hostname)

export function siteHref(path, locale, hostname, hash = "") {
  // The legacy Meets domain still serves Meets at its root. CRM and its
  // community section belong to the main site; local previews stay local.
  const origin = isMeetsHost(hostname) && path === "/" ? SITE_URL : ""
  return `${origin}${withLocalePath(path, locale)}${hash}`
}
