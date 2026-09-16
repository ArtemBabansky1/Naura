// Delivery-only encoding of the generated originals; no crop or content edits.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

for (let index = 1; index <= 4; index += 1) {
  const input = fileURLToPath(new URL(`../src/assets/meets-redesign/conversation-${index}.png`, import.meta.url))
  const output = input.replace(/\.png$/, '.webp')
  await sharp(input).resize({ width:800, withoutEnlargement:true }).webp({ quality:82 }).toFile(output)
  console.log(output)
}
