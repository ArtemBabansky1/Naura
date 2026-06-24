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

const COMPONENTS = {
  h1: (props) => <h1 className="legal-doc__title" {...props} />,
  h2: (props) => <h2 className="legal-doc__heading" {...props} />,
  h3: (props) => <h3 className="legal-doc__subheading" {...props} />,
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
