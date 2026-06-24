import { test, expect } from '@playwright/test'

// The site is a single-page landing — its "pages" are the one document rendered
// across many viewport widths. The previous bug was content being CUT / SHIFTED
// at narrow widths, so the core check is geometric (content stays in the
// viewport), alongside the requested console / JS / broken-link checks.
const PATH = '/'

// Widths chosen around every breakpoint that exists in the CSS/JS:
// 480 / 550 / 689 / 768 / 900 / 1024 / 1199 / 1200 boundaries.
const VIEWPORTS = [
  320, 340, 375, 414, 480, 524, 550, 608, 689, 768, 900, 1024, 1199, 1200, 1440, 1920,
]

// Third-party / headless-environment noise that is NOT the app's own defect:
// the UnicornStudio WebGL engine loaded from a CDN, WebGL warnings under
// SwiftShader, Vite's dev client, and aborted (cancelled) requests.
const IGNORED = [
  /unicorn/i,
  /jsdelivr\.net/i,
  /webgl/i,
  /\[vite\]/i,
  /react devtools/i,
  /net::ERR_ABORTED/i,
]
const ignored = (s) => IGNORED.some((re) => re.test(s || ''))

// Attach listeners that accumulate problems for the lifetime of the page.
function watch(page) {
  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !ignored(m.text())) consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => {
    if (!ignored(e.message)) pageErrors.push(e.message)
  })
  page.on('requestfailed', (r) => {
    const f = r.failure()
    const line = `${r.url()} — ${f ? f.errorText : 'failed'}`
    if (!ignored(line)) failedRequests.push(line)
  })
  return { consoleErrors, pageErrors, failedRequests }
}

// Drive the page through its full scroll length so lazy sections, reveal
// animations and the pinned ScrollTrigger morph all run (where bugs hide),
// then settle back at the top for a stable geometry read.
async function scrollThrough(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let y = 0
        const step = Math.max(250, Math.floor(window.innerHeight * 0.75))
        const id = setInterval(() => {
          window.scrollBy(0, step)
          y += step
          if (y >= document.documentElement.scrollHeight) {
            clearInterval(id)
            resolve()
          }
        }, 110)
      })
  )
  await page.waitForTimeout(300)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
}

// Headings + section containers must stay inside the viewport box. Decorative
// bleed elements (glows, orbs, card art) are intentionally excluded — this
// checks readable CONTENT, not atmosphere.
async function findCutContent(page) {
  return page.evaluate(() => {
    const clientW = document.documentElement.clientWidth
    const els = document.querySelectorAll('h1, h2, h3, h4, .container')
    const out = []
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.left < -1 || r.right > clientW + 1) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').trim().slice(0, 50),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 45),
          left: Math.round(r.left),
          right: Math.round(r.right),
          vw: clientW,
        })
      }
      if (out.length >= 12) break
    }
    return out
  })
}

test.describe('site health', () => {
  // ── The actual regression: content cut/shifted at narrow widths ──────────
  for (const w of VIEWPORTS) {
    test(`content fits the viewport @ ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 })
      await page.goto(PATH, { waitUntil: 'load' })
      await page.waitForTimeout(1200)
      await scrollThrough(page)

      const cut = await findCutContent(page)
      const msg =
        `Content overflowing/cut at ${w}px (left<0 = shifted off-screen, right>vw = cut):\n` +
        cut
          .map(
            (o) =>
              `  <${o.tag} class="${o.cls}"> "${o.text}"  left=${o.left} right=${o.right} (vw=${o.vw})`
          )
          .join('\n')
      expect(cut, msg).toEqual([])

      const horiz = await page.evaluate(() => {
        const d = document.documentElement
        return d.scrollWidth - d.clientWidth
      })
      expect(
        horiz,
        `Horizontal overflow at ${w}px: scrollWidth - clientWidth = ${horiz}px`
      ).toBeLessThanOrEqual(1)
    })
  }

  // ── Requested: no console errors / JS exceptions / broken resources ──────
  // Checked in both render modes: static (375) and pinned scroll (1280).
  for (const w of [375, 1280]) {
    test(`no console / JS / resource errors @ ${w}px`, async ({ page }) => {
      const seen = watch(page)
      await page.setViewportSize({ width: w, height: 900 })
      const resp = await page.goto(PATH, { waitUntil: 'load' })
      expect(resp?.status(), 'HTTP status').toBeLessThan(400)
      await page.waitForTimeout(1500)
      await scrollThrough(page)
      await page.waitForTimeout(500)

      expect(seen.pageErrors, `Uncaught JS errors:\n${seen.pageErrors.join('\n')}`).toEqual([])
      expect(
        seen.consoleErrors,
        `console.error output:\n${seen.consoleErrors.join('\n')}`
      ).toEqual([])
      expect(
        seen.failedRequests,
        `Failed requests (broken resources):\n${seen.failedRequests.join('\n')}`
      ).toEqual([])
    })
  }

  // ── Requested: no broken links (in-page anchors + external) ──────────────
  test('no broken links', async ({ page, request }) => {
    await page.goto(PATH, { waitUntil: 'load' })
    await page.waitForTimeout(800)

    const links = await page.$$eval('a[href]', (as) =>
      as.map((a) => ({
        href: a.getAttribute('href') || '',
        text: (a.textContent || '').trim().slice(0, 40),
      }))
    )

    const anchorIssues = []
    const externalIssues = []
    const checked = new Set()

    for (const { href, text } of links) {
      if (
        !href ||
        href === '#' ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        continue
      }

      // In-page anchor → its target must exist.
      if (href.startsWith('#')) {
        const id = href.slice(1)
        const exists = await page.evaluate(
          (id) =>
            !!document.getElementById(id) ||
            !!document.querySelector(`[name="${CSS.escape(id)}"]`),
          id
        )
        if (!exists) anchorIssues.push(`${href} (“${text}”) → no matching element`)
        continue
      }

      // Absolute http(s) → must not 4xx/5xx.
      if (/^https?:\/\//i.test(href)) {
        if (checked.has(href)) continue
        checked.add(href)
        try {
          const res = await request.get(href, { timeout: 15000, maxRedirects: 5 })
          if (res.status() >= 400) {
            externalIssues.push(`${href} (“${text}”) → HTTP ${res.status()}`)
          }
        } catch (e) {
          externalIssues.push(`${href} (“${text}”) → ${e.message}`)
        }
      }
    }

    expect(anchorIssues, `Broken in-page anchors:\n${anchorIssues.join('\n')}`).toEqual([])
    expect(externalIssues, `Broken external links:\n${externalIssues.join('\n')}`).toEqual([])
  })
})
