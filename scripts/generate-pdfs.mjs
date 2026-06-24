// Render the whole landing page to PDF in each language for proofreading.
//
//   node scripts/generate-pdfs.mjs            (uses the running dev server)
//   BASE_URL=https://naura.io node scripts/generate-pdfs.mjs
//
// Animations are stripped: the purple UnicornStudio backgrounds and the
// How-it-works contact "web" are hidden, reduced-motion is emulated (so the
// scrollytelling renders as the static stacked layout and every reveal sits in
// its final state), and the FAQ accordion is fully expanded so every answer is
// captured. Output: pdf/Naura-EN.pdf and pdf/Naura-RU.pdf.

import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const WIDTH = Number(process.env.PDF_WIDTH || 1440)
const OUT_DIR = 'pdf'
mkdirSync(OUT_DIR, { recursive: true })

// Hide the animated purple backgrounds and the contact-graph web; neutralise any
// residual motion so the capture is a clean static page.
const HIDE_CSS = `
  .unicorn-scene,
  .communities-unicorn,
  .pricing-unicorn,
  .closing-unicorn { display: none !important; }
  .hero-graph { display: none !important; }
  .how-it-works-section .hiw-graph-col { display: none !important; }
  .how-it-works-section .hiw-static-step { grid-template-columns: 1fr !important; }
  /* The PDF is one tall page, so 100dvh resolves to the WHOLE page height and
   * balloons the hero. Drop the viewport-height sizing so the hero is just its
   * content. */
  .hero-section { min-height: 0 !important; }
  .hero-stage { height: auto !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`

const LANGS = [
  { code: 'en', file: 'Naura-EN.pdf' },
  { code: 'ru', file: 'Naura-RU.pdf' },
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
    const items = [...document.querySelectorAll('.faq-item')]
    const answers = []
    for (const item of items) {
      const trigger = item.querySelector('.faq-item__trigger')
      if (!trigger) {
        answers.push('')
        continue
      }
      trigger.click()
      await sleep(80)
      const ans = item.querySelector('.faq-item__answer')
      answers.push(ans ? ans.textContent : '')
    }
    items.forEach((item, i) => {
      item.classList.add('is-open')
      if (!item.querySelector('.faq-item__answer') && answers[i]) {
        const panel = document.createElement('div')
        panel.className = 'faq-item__panel'
        panel.style.height = 'auto'
        panel.style.opacity = '1'
        const p = document.createElement('p')
        p.className = 'faq-item__answer text-body'
        p.textContent = answers[i]
        panel.appendChild(p)
        item.appendChild(panel)
      }
    })
  })
}

const browser = await chromium.launch()
try {
  for (const { code, file } of LANGS) {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: 1800 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    // Force the language before the app boots (detector reads localStorage first).
    await page.addInitScript((lng) => {
      try {
        localStorage.setItem('i18nextLng', lng)
      } catch {
        /* storage blocked — fall back to detector default */
      }
    }, code)

    await page.goto(BASE, { waitUntil: 'load' })
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
