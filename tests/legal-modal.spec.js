import { test, expect } from '@playwright/test'

const IGNORED = [/unicorn/i, /jsdelivr\.net/i, /webgl/i, /\[vite\]/i, /react devtools/i, /net::ERR_ABORTED/i]
const ignored = (s) => IGNORED.some((re) => re.test(s || ''))

for (const { label, doc } of [
  { label: 'Privacy Policy', doc: 'privacy' },
  { label: 'Terms of Use', doc: 'terms' },
]) {
  test(`legal sheet opens, renders and closes: ${label}`, async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => { if (!ignored(e.message)) errors.push(e.message) })
    page.on('console', (m) => { if (m.type() === 'error' && !ignored(m.text())) errors.push(m.text()) })

    await page.goto('/', { waitUntil: 'load' })

    // Open from the footer button.
    await page.getByRole('button', { name: label, exact: true }).click()

    const panel = page.locator('.legal-panel')
    // Generous timeout: first open compiles the lazy chunk (react-markdown + docs)
    // in dev. In a production build this is a fast chunk fetch.
    await expect(panel).toBeVisible({ timeout: 30000 })
    // Title rendered from the markdown's H1.
    await expect(panel.locator('.legal-doc__title')).toBeVisible()
    // Headings actually rendered (markdown → site styles).
    expect(await panel.locator('.legal-doc__heading').count()).toBeGreaterThan(3)

    // No horizontal overflow while the sheet is open.
    const horiz = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(horiz, 'horizontal overflow with sheet open').toBeLessThanOrEqual(1)

    // Close via the × button.
    await page.locator('.legal-panel__close').click()
    await expect(panel).toBeHidden()

    expect(errors, `console/JS errors:\n${errors.join('\n')}`).toEqual([])
  })
}

test('legal sheet closes on Escape and backdrop click', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })

  // Escape closes.
  await page.getByRole('button', { name: 'Privacy Policy', exact: true }).click()
  await expect(page.locator('.legal-panel')).toBeVisible({ timeout: 30000 })
  await page.keyboard.press('Escape')
  await expect(page.locator('.legal-panel')).toBeHidden()

  // Backdrop (overlay outside the panel) closes — click the top gutter area.
  await page.getByRole('button', { name: 'Terms of Use', exact: true }).click()
  await expect(page.locator('.legal-panel')).toBeVisible()
  await page.locator('.legal-overlay').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.legal-panel')).toBeHidden()
})
