import { test, expect } from "@playwright/test"

const IGNORED = [/unicorn/i, /jsdelivr\.net/i, /webgl/i, /\[vite\]/i, /react devtools/i, /net::ERR_ABORTED/i]
const ignored = (s) => IGNORED.some((re) => re.test(s || ""))

for (const { label, path, titleSnippet } of [
  { label: "Privacy Policy", path: "/privacy", titleSnippet: "Privacy Policy" },
  { label: "Terms of Use", path: "/terms", titleSnippet: "Terms of Use" },
]) {
  test(`legal page renders: ${label}`, async ({ page }) => {
    const errors = []
    page.on("pageerror", (e) => { if (!ignored(e.message)) errors.push(e.message) })
    page.on("console", (m) => { if (m.type() === "error" && !ignored(m.text())) errors.push(m.text()) })

    await page.goto(path, { waitUntil: "load" })

    await expect(page.locator(".legal-doc__title")).toContainText(titleSnippet)
    expect(await page.locator(".legal-doc__heading").count()).toBeGreaterThan(3)

    const horiz = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(horiz, "horizontal overflow on legal page").toBeLessThanOrEqual(1)

    expect(errors, `console/JS errors:\n${errors.join("\n")}`).toEqual([])
  })
}

test("footer links navigate to legal pages", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" })

  await page.getByRole("link", { name: "Privacy Policy", exact: true }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.locator(".legal-doc__title")).toContainText("Privacy Policy")

  await page.goto("/", { waitUntil: "load" })
  await page.getByRole("link", { name: "Terms of Use", exact: true }).click()
  await expect(page).toHaveURL(/\/terms$/)
  await expect(page.locator(".legal-doc__title")).toContainText("Terms of Use")
})

test("legal page back link returns home", async ({ page }) => {
  await page.goto("/privacy", { waitUntil: "load" })
  await page.getByRole("link", { name: "Back to home" }).click()
  await expect(page).toHaveURL(/\/$/)
})
