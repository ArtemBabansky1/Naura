import { useTranslation } from "react-i18next"
import { useLocale } from "../../hooks/useLocale"
import { MEETS_BOT_URL, BLOG_URL } from "../../lib/urls"
import "./MeetsNav.css"

/* Naura Meets wordmark — stacked lockup: the "N" mark above the MEETS
 * letterforms, one vector, fill follows text color. */
function MeetsWordmark() {
  return (
    <svg
      className="meets-nav__logo-mark"
      width="583"
      height="430"
      viewBox="0 0 583 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M3.83341e-05 7.8595L44.1056 7.8595C44.1056 7.8595 43.9485 125.844 43.9485 193.426C42.7821 194.365 45.0715 192.516 43.9485 193.426C69.7823 172.626 109.855 140.933 152.408 113.119C194.9 85.3439 243.86 57.2503 294.635 36.0366C345.206 14.9083 398.999 0.00018003 450.778 0C494.113 3.29932e-06 527.743 16.1203 550.143 40.6192C572.087 64.6176 582.575 95.7897 583 126.202V257H538.896V126.668L538.844 124.467C538.051 101.746 529.934 80.205 515.654 64.5877C501.371 48.9671 480.292 38.4517 450.778 38.4517C408.186 38.4519 361.205 50.8629 313.696 70.7119C266.39 90.4762 219.963 117.021 178.866 143.883C137.831 170.705 112.712 184.893 77.4612 217.751C61.7916 232.357 40.8335 257 40.8335 257H0L3.83341e-05 7.8595Z" fill="currentColor" />
      <path d="M0 426.217V290.767H19.7243L65.4959 386.429L111.079 290.767H130.897V426.123H111.079V330.932L74.084 408.91H56.9078L19.913 330.932V426.217H0Z" fill="currentColor" />
      <path d="M157.229 426.217V290.767H244.148V309.297H177.142V347.299H232.823V365.829H177.142V407.687H244.148V426.217H157.229Z" fill="currentColor" />
      <path d="M266.719 426.217V290.767H353.637V309.297H286.632V347.299H342.313V365.829H286.632V407.687H353.637V426.217H266.719Z" fill="currentColor" />
      <path d="M405.936 426.217V309.297H364.883V290.767H466.524V309.297H425.754V426.217H405.936Z" fill="currentColor" />
      <path d="M530.905 429.039C523.481 429.039 516.623 428.067 510.332 426.123C504.04 424.179 498.472 421.389 493.627 417.752C488.783 414.114 484.788 409.756 481.642 404.677C478.559 399.535 476.451 393.766 475.319 387.369L495.892 384.265C496.899 388.467 498.44 392.229 500.517 395.553C502.656 398.814 505.267 401.573 508.35 403.83C511.433 406.025 514.956 407.687 518.92 408.816C522.883 409.944 527.256 410.509 532.038 410.509C536.505 410.509 540.594 409.976 544.306 408.91C548.018 407.844 551.227 406.339 553.933 404.395C556.638 402.451 558.714 400.13 560.161 397.434C561.671 394.738 562.426 391.79 562.426 388.592C562.426 384.391 561.011 380.848 558.179 377.963C555.411 375.078 551.133 372.79 545.345 371.096L510.52 360.844C500.58 357.896 493.093 353.569 488.059 347.863C483.089 342.156 480.604 335.07 480.604 326.605C480.604 320.898 481.768 315.662 484.095 310.896C486.486 306.13 489.821 302.086 494.099 298.762C498.377 295.376 503.442 292.742 509.293 290.861C515.208 288.98 521.688 288.039 528.735 288.039C535.781 288.039 542.262 288.948 548.176 290.767C554.09 292.585 559.312 295.188 563.842 298.574C568.372 301.96 572.178 306.099 575.261 310.99C578.407 315.882 580.672 321.463 582.056 327.734L560.916 331.308C560.224 327.483 558.934 324.065 557.047 321.055C555.222 317.982 552.926 315.38 550.158 313.248C547.389 311.053 544.181 309.423 540.531 308.357C536.882 307.228 532.887 306.663 528.546 306.663C524.393 306.663 520.65 307.165 517.315 308.168C513.981 309.109 511.118 310.457 508.727 312.213C506.399 313.906 504.606 315.913 503.348 318.233C502.09 320.553 501.46 323.093 501.46 325.852C501.46 328.047 501.838 330.022 502.593 331.778C503.411 333.471 504.669 335.07 506.368 336.575C508.129 338.018 510.363 339.335 513.068 340.526C515.774 341.718 519.014 342.846 522.789 343.912L547.704 350.967C559.532 354.291 568.372 358.994 574.223 365.076C580.074 371.096 583 378.59 583 387.557C583 393.766 581.742 399.409 579.225 404.489C576.708 409.568 573.154 413.926 568.561 417.563C564.031 421.201 558.557 424.022 552.139 426.029C545.785 428.036 538.707 429.039 530.905 429.039Z" fill="currentColor" />
    </svg>
  )
}

/* Static nav inside the hero stage — same grid recipe as the landing's
 * hero-nav (logo | centered links | actions). */
export default function MeetsNav() {
  const { t, i18n } = useTranslation("meets")
  const { switchLocale, localePath } = useLocale()

  return (
    <div className="meets-nav">
      <a href={localePath("/meets")} className="meets-nav__logo" aria-label="Naura Meets">
        <MeetsWordmark />
      </a>

      <nav className="meets-nav__links" aria-label={t("nav.ariaLabel")}>
        <a href="#meets-how" className="meets-nav__link">{t("nav.how")}</a>
        <a href="#meets-communities" className="meets-nav__link">{t("nav.communities")}</a>
        <a href="#meets-faq" className="meets-nav__link">{t("nav.faq")}</a>
        <a
          href={BLOG_URL}
          className="meets-nav__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("nav.blog")}
        </a>
      </nav>

      <div className="meets-nav__actions">
        <button
          type="button"
          className="meets-nav__lang"
          onClick={switchLocale}
          aria-label="Switch language"
        >
          {i18n.language === "en" ? "RU" : "EN"}
        </button>
        <a
          href={MEETS_BOT_URL}
          className="meets-btn meets-btn--ghost meets-nav__signin"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("nav.signIn")}
        </a>
        <a
          href={MEETS_BOT_URL}
          className="meets-btn meets-btn--primary meets-nav__start"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("nav.start")}
        </a>
      </div>
    </div>
  )
}
