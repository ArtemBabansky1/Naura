// Batch image optimizer: people photos + telegram phone → AVIF + WebP.
// Avatars render at 30–40 CSS px, so 80px source covers @2x with headroom and
// collapses ~120KB JPGs to a few KB. Run: node scripts/optimize-images.mjs
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')

// One entry per asset class. width = @2x of the largest CSS render box.
const JOBS = [
  {
    dir: path.join(ROOT, 'src/assets/people'),
    match: /\.jpe?g$/i,
    width: 80, // render box 30px (Mary 40px) → 80px covers @2x + DPR headroom
    avif: { quality: 50 },
    webp: { quality: 62 },
  },
  {
    dir: path.join(ROOT, 'src/assets/telegram'),
    match: /^iphone\.png$/i,
    width: 600, // render max 300px → 600 @2x
    avif: { quality: 55 },
    webp: { quality: 72 },
  },
]

async function run() {
  for (const job of JOBS) {
    const files = (await readdir(job.dir)).filter((f) => job.match.test(f))
    for (const file of files) {
      const input = path.join(job.dir, file)
      const base = path.join(job.dir, file.replace(/\.[^.]+$/, ''))
      const pipeline = sharp(input).resize({
        width: job.width,
        withoutEnlargement: true,
        fit: 'cover',
      })
      await pipeline.clone().avif(job.avif).toFile(`${base}.avif`)
      await pipeline.clone().webp(job.webp).toFile(`${base}.webp`)
      console.log(`OK ${file} -> .avif + .webp @${job.width}px`)
    }
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
