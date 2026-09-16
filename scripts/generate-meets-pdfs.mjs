// Render the Meets page to PDF in each language for proofreading.
//
//   node scripts/generate-meets-pdfs.mjs            (uses the running dev server)
//   BASE_URL=https://naura.io node scripts/generate-meets-pdfs.mjs
//
// Locale is path-based (/meets vs /ru/meets), so each language is just its own
// URL. Reduced-motion is emulated: the whole Meets page collapses to static
// content (the 3D phone renders as the image fallback, the marquee stops, the
// scrollytelling stacks). The geo-IP redirect is disabled via its localStorage
// flag so the EN capture is not bounced to /ru. The FAQ accordion is fully
// expanded so every answer is captured.
// Output: pdf/Naura-Meets-EN.pdf and pdf/Naura-Meets-RU.pdf.

import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const WIDTH = Number(process.env.PDF_WIDTH || 1440)
const OUT_DIR = 'pdf'
mkdirSync(OUT_DIR, { recursive: true })

// Neutralise any residual motion so the capture is a clean static page.
// The PDF is one tall page, so dvh units resolve against the WHOLE page height
// (~8000px+) during print layout and balloon the hero backdrop over everything.
// Pin every dvh-based size to the px it has at the 1800px capture viewport:
// 110dvh → 1980px hero stage, -10dvh → -180px sheet overlap.
const HIDE_CSS = `
  .meets-hero__stage { min-height: 1980px !important; }
  .meets-sheet--hero { margin-top: -180px !important; }
  .meets-page { min-height: 0 !important; }
  /* Print layout runs a touch shorter than the measured screen height — paint
   * the leftover strip below the footer white instead of the landing's dark
   * body background. */
  body { background: var(--color-base-white, #fff) !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`

const LANGS = [
  { path: '/meets', file: 'Naura-Meets-EN.pdf' },
  { path: '/ru/meets', file: 'Naura-Meets-RU.pdf' },
]

async function walkPage(page) {
  // Scroll the full length so lazy sections mount and reveal states finalise.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let y = 0
        const id = setInterval(() => {
          window.scrollBy(0, 1200)
          y += 1200
          if (y >= document.documentElement.scrollHeight) {
            clearInterval(id)
            resolve()
          }
        }, 40)
      })
  )
  await page.evaluate(() => window.scrollTo(0, 0))
}

async function expandFaq(page) {
  // FAQ answers are only in the DOM for the single open item. Click through each
  // to harvest the answer text, then re-inject answers for the closed ones so the
  // PDF shows every Q&A. (Static export — no further React renders to undo this.)
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const items = [...document.querySelectorAll('.meets-faq__item')]
    const answers = []
    for (const item of items) {
      const trigger = item.querySelector('.meets-faq__trigger')
      if (!trigger) {
        answers.push('')
        continue
      }
      trigger.click()
      await sleep(80)
      const ans = item.querySelector('.meets-faq__answer')
      answers.push(ans ? ans.textContent : '')
    }
    items.forEach((item, i) => {
      item.classList.add('is-open')
      if (!item.querySelector('.meets-faq__answer') && answers[i]) {
        const panel = document.createElement('div')
        panel.className = 'meets-faq__panel'
        panel.style.height = 'auto'
        panel.style.opacity = '1'
        const p = document.createElement('p')
        p.className = 'meets-faq__answer text-body'
        p.textContent = answers[i]
        panel.appendChild(p)
        item.appendChild(panel)
      }
    })
  })
}

const browser = await chromium.launch()
try {
  for (const { path, file } of LANGS) {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: 1800 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    // Pretend the geo check already ran so GeoLocaleRedirect never rewrites the URL.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('naura-geo-country', 'PDF')
      } catch {
        /* storage blocked — geo fetch will just fail silently in headless */
      }
    })

    await page.goto(`${BASE}${path}`, { waitUntil: 'load' })
    await page.addStyleTag({ content: HIDE_CSS })
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null))
    await walkPage(page)
    await page.waitForTimeout(1200)
    await expandFaq(page)
    await page.waitForTimeout(300)

    await page.emulateMedia({ media: 'screen' })
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.pdf({
      path: `${OUT_DIR}/${file}`,
      width: `${WIDTH}px`,
      height: `${height}px`,
      printBackground: true,
      pageRanges: '1',
    })
    console.log(`✓ ${file}  (${WIDTH}×${height}px)`)
    await context.close()
  }
} finally {
  await browser.close()
}
