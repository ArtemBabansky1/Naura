import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { useLocale } from "../../hooks/useLocale"
import privacyMd from "../../content/legal/privacy.md?raw"
import termsMd from "../../content/legal/terms.md?raw"
import "./LegalDocument.css"

const DOCS = {
  privacy: privacyMd,
  terms: termsMd,
}

const LocalizedMarkdownLink = ({ href = "", children, ...props }) => {
  const { localePath } = useLocale()

  if (href.startsWith("/")) {
    return (
      <Link className="legal-doc__link" to={localePath(href)} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <a
      className="legal-doc__link"
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

const heading = (Heading, className) => ({ children, node: _node, ...props }) => (
  <Heading className={className} {...props}>{children}</Heading>
)

const COMPONENTS = {
  h1: heading("h1", "legal-doc__title"),
  h2: heading("h2", "legal-doc__heading"),
  h3: heading("h3", "legal-doc__subheading"),
  p: (props) => <p className="legal-doc__p" {...props} />,
  ul: (props) => <ul className="legal-doc__list" {...props} />,
  li: (props) => <li className="legal-doc__item" {...props} />,
  em: (props) => <em className="legal-doc__note" {...props} />,
  strong: (props) => <strong className="legal-doc__strong" {...props} />,
  a: LocalizedMarkdownLink,
}

export const LegalDocument = ({ doc }) => {
  return (
    <div className="legal-doc">
      <ReactMarkdown components={COMPONENTS}>{DOCS[doc] || ""}</ReactMarkdown>
    </div>
  )
}
