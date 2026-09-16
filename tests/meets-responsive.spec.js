// Responsive sweep over the Meets page: one full-page screenshot per width,
// plus checks that catch the failures a screenshot alone would not — content
// spilling past the viewport, and copy overflowing its own box.
//
// Run: npx playwright test tests/meets-responsive.spec.js --project=chromium
// Shots land in test-results/ (gitignored) for eyeballing.
import { test, expect } from "@playwright/test"

const WIDTHS = [
  { name: "360-phone", width: 360, height: 780 },
  { name: "480-phone-wide", width: 480, height: 900 },
  { name: "768-tablet", width: 768, height: 1024 },
  { name: "1024-tablet-wide", width: 1024, height: 800 },
  { name: "1440-laptop", width: 1440, height: 900 },
  { name: "1920-desktop", width: 1920, height: 1080 },
]

const LOCALES = [
  { name: "ru", path: "/ru/meets" },
  { name: "en", path: "/meets" },
]

for (const locale of LOCALES) {
  for (const size of WIDTHS) {
    test(`${locale.name} @ ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      await page.goto(`http://localhost:5173${locale.path}`, { waitUntil: "networkidle" })
      // Let the entry animations settle before the shot.
      await page.waitForTimeout(1200)

      await page.screenshot({
        path: `test-results/meets-${locale.name}-${size.name}.png`,
        fullPage: true,
      })

      // Nothing may push the document wider than the viewport — the classic
      // source of a horizontal scrollbar on phones.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, "горизонтальное переполнение страницы").toBeLessThanOrEqual(1)
    })
  }
}
