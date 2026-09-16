import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const archive = resolve(root, 'archive/site-before-card-design-2026-09-14/src')
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = resolve(directory, entry.name)
  return entry.isDirectory() ? walk(path) : [path]
})

test('approved translations and legal documents remain byte-for-byte unchanged', () => {
  for (const folder of ['i18n', 'content/legal']) {
    for (const original of walk(resolve(archive, folder))) {
      const path = relative(archive, original)
      assert.deepEqual(readFileSync(resolve(root, 'src', path)), readFileSync(original), path)
    }
  }
})

test('the approved digital-card design is unchanged', () => {
  for (const original of walk(resolve(archive, 'pages/BusinessCardsPage'))) {
    const path = relative(archive, original)
    assert.deepEqual(readFileSync(resolve(root, 'src', path)), readFileSync(original), path)
  }
})

test('old page implementations are retained; normal routes use redesigned copies', () => {
  const pages = ['LandingPage', 'MeetsPage', 'CommunityResourcesPage', 'LegalPage', 'FaqPage', 'SupportPage']
  for (const name of pages) {
    const original = resolve(archive, 'pages', name, `${name}.jsx`)
    assert.deepEqual(readFileSync(resolve(root, 'src/pages', name, `${name}.jsx`)), readFileSync(original), name)
  }
  const app = readFileSync(resolve(root, 'src/App.jsx'), 'utf8')
  for (const name of ['Crm', 'Meets', 'CommunityResources', 'Legal', 'Faq', 'Support']) {
    assert.ok(app.includes(`/pages/${name}Redesign/`), `${name} active route`)
  }
  assert.ok(!app.includes('/archive/'))
})
