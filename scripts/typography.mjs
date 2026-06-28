/**
 * Типографика локалей: приклеивает «висячие» предлоги и союзы к следующему
 * слову неразрывным пробелом (U+00A0), чтобы они не оставались в конце строки.
 *
 * Обрабатывает src/i18n/locales/{en,ru}/*.json как сырой текст — форматирование
 * (отступы, компактные объекты) сохраняется один-в-один, меняются только пробелы
 * внутри строковых значений. Технические строки (почты, ссылки, @-хендлы,
 * плейсхолдеры {{...}}, теги <...>) не ломаются: склейка идёт только после слова
 * из белого списка, за которым стоит обычный пробел, а ключи JSON (camelCase) и
 * структура пробел-после-слова не содержат.
 *
 * NBSP пишется в JSON как видимый escape   (JSON.parse превращает его в U+00A0).
 *
 * Запуск:  node scripts/typography.mjs          (правит файлы на месте)
 *          node scripts/typography.mjs --check   (только посчитать, без записи)
 *
 * Идемпотентен: после первого прогона за словом стоит уже не пробел, а escape,
 * поэтому повторный запуск ничего не добавляет.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const NBSP = String.fromCharCode(0xa0) // U+00A0, неразрывный пробел (символ)
const NBSP_ESCAPE = '\\u00A0' // тот же символ в виде JSON-escape (текст из 6 знаков)

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = join(__dirname, '..', 'src', 'i18n', 'locales')

const FILES = [
  'aiAgents', 'common', 'communities', 'cta', 'demoForm', 'faq', 'features',
  'footer', 'hero', 'howItWorks', 'pricing', 'support', 'telegram',
]

// Русские предлоги и союзы (1–3 буквы). Однобуквенные склеиваются все —
// в русском это почти всегда предлог или союз.
const RU_WORDS = [
  'в', 'с', 'к', 'о', 'у', 'а', 'и', 'я',
  'во', 'со', 'ко', 'об', 'от', 'до', 'по', 'за', 'на', 'из', 'не', 'ни', 'но', 'да',
  'для', 'без', 'под', 'над', 'при', 'про', 'изо', 'что', 'как', 'или', 'чем',
]

// Английские артикли, короткие предлоги и союзы.
const EN_WORDS = [
  'a', 'an', 'the',
  'and', 'or', 'but', 'nor', 'so', 'yet', 'for',
  'to', 'of', 'in', 'on', 'at', 'by', 'as', 'up', 'via', 'off', 'out', 'per',
]

// Левая граница слова: начало, пробел, кавычка/скобка/«, тире, NBSP.
const LEFT = '(?<=^|[\\s"«\'(\\u00AB\\u2014\\u2013\\u00A0])'

function buildRegex(words) {
  // Длинные раньше коротких — чтобы «во» не проигрывало «в» при бэктрекинге.
  const sorted = [...words].sort((a, b) => b.length - a.length)
  // Слово + один обычный пробел/таб после него (этот пробел и заменяем на NBSP).
  return new RegExp(`${LEFT}(${sorted.join('|')})[ \\t]`, 'giu')
}

const RU_RE = buildRegex(RU_WORDS)
const EN_RE = buildRegex(EN_WORDS)

const check = process.argv.includes('--check')
const locales = [
  { dir: 'en', re: EN_RE },
  { dir: 'ru', re: RU_RE },
]

let totalGlued = 0
let totalFiles = 0

for (const { dir, re } of locales) {
  for (const name of FILES) {
    const path = join(LOCALES_DIR, dir, `${name}.json`)
    let raw
    try {
      raw = readFileSync(path, 'utf8')
    } catch {
      continue // файла может не быть в каком-то языке
    }

    let count = 0
    // 1) Склейка: вставляем символ NBSP (сцепление соседних предлогов работает
    //    за один проход — lookbehind смотрит на исходные пробелы).
    const glued = raw.replace(re, (_m, word) => {
      count += 1
      return word + NBSP
    })
    if (count === 0) continue

    // 2) Символ NBSP -> видимый JSON-escape, чтобы он читался в исходнике.
    const out = glued.split(NBSP).join(NBSP_ESCAPE)
    if (!check) writeFileSync(path, out, 'utf8')

    totalGlued += count
    totalFiles += 1
    console.log(`${check ? '[check] ' : ''}${dir}/${name}.json — склеек: ${count}`)
  }
}

console.log(`\nИтого: ${totalGlued} склеек в ${totalFiles} файлах${check ? ' (проверка, без записи)' : ''}.`)
