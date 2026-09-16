import { useSiteNavigation } from "../../hooks/useSiteNavigation"
import "./SiteNavigation.css"

export function SiteNavigation({ as: Component = "nav", className = "", linkClassName = "", onNavigate, trailing, tabIndex, resources = false, children, after, ...props }) {
  const { links, resources: resourceLinks, t } = useSiteNavigation()
  return (
    <Component className={className} aria-label={t(resources ? "nav.resources" : "nav.ariaLabel")} data-site-nav={resources ? "resources" : "products"} {...props}>
      {children}
      {(resources ? resourceLinks : links).map(({ id, label, href, current }) => (
        <a key={id} href={href} className={linkClassName} aria-current={current} onClick={onNavigate} tabIndex={tabIndex}>
          {label}{trailing}
        </a>
      ))}
      {after}
    </Component>
  )
}
