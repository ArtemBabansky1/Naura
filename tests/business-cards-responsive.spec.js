import { devices, expect, test } from '@playwright/test'

const PAGES = [
  { locale: 'en', path: '/business-cards' },
  { locale: 'ru', path: '/ru/business-cards' },
]

const IGNORED_CONSOLE_ERRORS = [
  /\[vite\]/i,
  /react devtools/i,
  /net::ERR_ABORTED/i,
]

const isIgnoredConsoleError = (message) =>
  IGNORED_CONSOLE_ERRORS.some((pattern) => pattern.test(message || ''))

async function preparePage(page) {
  // Keep locale tests deterministic: first-visit geo detection may otherwise
  // redirect an English URL when the suite runs from a RU/BY/KZ IP address.
  await page.addInitScript(() => {
    window.localStorage.setItem('naura-geo-country', 'US')
  })
}

function watchRuntimeErrors(page) {
  const errors = []

  page.on('pageerror', (error) => {
    if (!isIgnoredConsoleError(error.message)) errors.push(`pageerror: ${error.message}`)
  })
  page.on('console', (message) => {
    if (message.type() !== 'error' || isIgnoredConsoleError(message.text())) return
    errors.push(`console.error: ${message.text()}`)
  })

  return errors
}

async function openBusinessCardsPage(page, path) {
  await preparePage(page)
  const response = await page.goto(path, { waitUntil: 'load' })

  expect(response?.status(), `${path} HTTP status`).toBeLessThan(400)
  await expect(page.locator('.nc-hero h1')).toBeVisible()
  await expect(page.locator('.bc2-journey__steps')).toBeAttached()
}

async function loadAndInspectImages(page) {
  const images = page.locator('img')
  const count = await images.count()
  expect(count, 'the production page should render image assets').toBeGreaterThanOrEqual(5)

  await images.evaluateAll((elements) => {
    for (const image of elements) image.loading = 'eager'
  })

  await expect
    .poll(
      () =>
        images.evaluateAll((elements) =>
          elements
            .filter(
              (image) =>
                !image.currentSrc ||
                !image.complete ||
                image.naturalWidth === 0 ||
                image.naturalHeight === 0,
            )
            .map((image) => image.currentSrc || image.getAttribute('src') || '<missing src>'),
        ),
      { timeout: 20_000, message: 'all production images should finish loading' },
    )
    .toEqual([])

  const uniqueSources = await images.evaluateAll((elements) => [
    ...new Set(elements.map((image) => image.currentSrc).filter(Boolean)),
  ])
  expect(uniqueSources.length, 'expected the complete editorial photo series').toBeGreaterThanOrEqual(5)
  expect(
    uniqueSources.filter((source) => !/\.(?:avif|webp|svg)(?:\?|$)/i.test(source)),
    'photography uses AVIF/WebP; vector marks use SVG',
  ).toEqual([])

  const missingPhotos = ['hero-', 'contact-', 'scale-', 'access-'].filter(
    (name) => !uniqueSources.some((source) => source.includes(name)),
  )
  expect(missingPhotos, 'the cinematic photo series should be present').toEqual([])
}

async function horizontalOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

for (const { locale, path } of PAGES) {
  test(`${locale} page renders without console errors and loads every production image`, async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await openBusinessCardsPage(page, path)
    await loadAndInspectImages(page)
    await page.waitForTimeout(300)

    expect(runtimeErrors, `runtime errors on ${path}:\n${runtimeErrors.join('\n')}`).toEqual([])
  })

  test(`${locale} page has no horizontal overflow on desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openBusinessCardsPage(page, path)

    expect(await horizontalOverflow(page), `horizontal overflow on ${path} at 1440px`).toBeLessThanOrEqual(1)
  })

  test(`${locale} page has no horizontal overflow on mobile`, async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      locale: locale === 'ru' ? 'ru-RU' : 'en-US',
    })
    const page = await context.newPage()

    try {
      await openBusinessCardsPage(page, path)
      expect(await horizontalOverflow(page), `horizontal overflow on ${path} at 390px`).toBeLessThanOrEqual(1)
    } finally {
      await context.close()
    }
  })
}

test('Russian locale renders the Russian hero headline', async ({ page }) => {
  await openBusinessCardsPage(page, '/ru/business-cards')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Цифровая визитка, которая не\s+теряется/,
    }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
})

test('journey tabs expose a clear selected state with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openBusinessCardsPage(page, '/business-cards')

  const tabs = page.locator('.bc2-journey__steps [role="tab"]')
  await expect(tabs).toHaveCount(3)
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
})

test('mobile navigation and journey controls stay usable without overflow', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] })
  const page = await context.newPage()

  try {
    await openBusinessCardsPage(page, '/business-cards')

    const menu = page.locator('.bc2-menu-toggle')
    await expect(menu).toBeVisible()
    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#bc2-mobile-menu')).toBeVisible()
    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')

    const journeyTabs = page.locator('.bc2-journey__steps [role="tab"]')
    await journeyTabs.nth(2).click()
    await expect(journeyTabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  } finally {
    await context.close()
  }
})

test('yearly pricing, FAQ disclosure, and required form validation work', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openBusinessCardsPage(page, '/business-cards')

  const billingButtons = page.locator('.bc2-billing button')
  await billingButtons.nth(1).click()
  await expect(billingButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.bc2-plan--featured .bc2-plan__price strong')).toHaveText('249 ₽')

  const faqButton = page.locator('.bc2-faq__items h3 button').nth(1)
  await faqButton.click()
  await expect(faqButton).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.bc2-faq__items [role="region"]')).toBeVisible()

  const form = page.locator('.bc2-beta form')
  await form.locator('button[type="submit"]').click()
  await expect(form.getByRole('alert')).toBeVisible()
  await expect(form.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true')
  await expect(form.locator('input[name="telegram"]')).toHaveAttribute('aria-invalid', 'true')
  await expect(form.locator('input[name="consent"]')).toHaveAttribute('aria-invalid', 'true')
})
