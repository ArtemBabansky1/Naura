// Text-only adaptive audit: the browser walks the page and reports what breaks
// on narrow screens, so no screenshot has to be read to find it.
//
// Checks per width:
//   1. elements sticking out past the viewport (the overflow culprits)
//   2. copy clipped by its own box (overflow hidden/clip + content taller)
//   3. tap targets under 44px on touch-sized widths
//   4. text rendered below 12px
//
// Run: npx playwright test tests/meets-adaptive-audit.spec.js --project=chromium
import { test } from "@playwright/test"

const WIDTHS = [
  { name: "360", width: 360, height: 780, touch: true },
  { name: "480", width: 480, height: 900, touch: true },
  { name: "740-альбом", width: 740, height: 360, touch: true },
  { name: "768", width: 768, height: 1024, touch: true },
  { name: "1024", width: 1024, height: 800, touch: false },
  { name: "1440", width: 1440, height: 900, touch: false },
  { name: "2560", width: 2560, height: 1440, touch: false },
]

const LOCALES = [
  { name: "ru", path: "/ru/meets" },
  { name: "en", path: "/meets" },
]

const audit = (touch) =>
  // Runs in the page.
  new Function(
    "touch",
    `
    const out = { overflow: [], clipped: [], small: [], tiny: [], squashed: [] }
    // Carousels and the marquee are wider than the screen on purpose — their
    // subtree is excluded from the overflow check.
    const BY_DESIGN = ".meets-marquee, .meets-how__track, .m-reveal__mask"
    const vw = document.documentElement.clientWidth
    const label = (el) => {
      const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || ""
      const first = String(cls).trim().split(/\\s+/)[0]
      return el.tagName.toLowerCase() + (first ? "." + first : "")
    }
    const text = (el) => (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40)

    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el)
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue

      // 5. images squashed out of their natural proportions
      if (el.tagName === "IMG" && el.naturalWidth && out.squashed.length < 8) {
        const natural = el.naturalWidth / el.naturalHeight
        const shown = r.width / r.height
        const off = Math.abs(shown - natural) / natural
        const cs2 = getComputedStyle(el)
        if (off > 0.02 && cs2.objectFit !== "cover" && cs2.objectFit !== "contain") {
          out.squashed.push(label(el) + " → пропорция " + shown.toFixed(2) + " вместо " + natural.toFixed(2))
        }
      }

      if (el.closest(BY_DESIGN)) continue

      // 1. past the right edge (2px slack for rounding)
      if (r.right > vw + 2 && out.overflow.length < 12) {
        out.overflow.push(label(el) + " → " + Math.round(r.right - vw) + "px за краем | " + text(el))
      }

      // 2. clipped copy — the box hides content taller than itself
      const hides = /hidden|clip/.test(cs.overflowY)
      if (hides && el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 0 && out.clipped.length < 12) {
        const t = text(el)
        if (t) out.clipped.push(label(el) + " → срезано " + (el.scrollHeight - el.clientHeight) + "px | " + t)
      }

      // 3. tap targets
      if (touch && /^(a|button)$/.test(el.tagName.toLowerCase())) {
        if ((r.width < 44 || r.height < 44) && out.small.length < 12) {
          out.small.push(label(el) + " → " + Math.round(r.width) + "x" + Math.round(r.height) + " | " + text(el))
        }
      }

      // 4. text under 12px
      const fs = parseFloat(cs.fontSize)
      if (fs && fs < 12 && el.children.length === 0 && text(el) && out.tiny.length < 8) {
        out.tiny.push(label(el) + " → " + fs.toFixed(1) + "px | " + text(el))
      }
    }
    return out
  `,
  )(touch)

for (const locale of LOCALES) {
  for (const size of WIDTHS) {
    test(`аудит ${locale.name} @ ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      await page.goto(`http://localhost:5173${locale.path}`, { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)

      const res = await page.evaluate(audit, size.touch)
      const lines = []
      const push = (title, items) => {
        if (items.length) lines.push(`  ${title}:`, ...items.map((i) => "    " + i))
      }
      push("ЗА КРАЕМ ЭКРАНА", res.overflow)
      push("ТЕКСТ СРЕЗАН", res.clipped)
      push("МЕЛКАЯ КНОПКА", res.small)
      push("МЕЛКИЙ ШРИФТ", res.tiny)
      push("КАРТИНКА СЖАТА", res.squashed)

      console.log(`\n=== ${locale.name} @ ${size.name}px ===`)
      console.log(lines.length ? lines.join("\n") : "  чисто")
    })
  }
}
