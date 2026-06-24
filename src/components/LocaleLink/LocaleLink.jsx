import { Link } from "react-router-dom"
import { useLocale } from "../../hooks/useLocale"

export const LocaleLink = ({ to, ...props }) => {
  const { localePath } = useLocale()
  return <Link to={localePath(to)} {...props} />
}
