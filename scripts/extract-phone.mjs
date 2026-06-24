// One-time extraction: the raw Cinema4D OBJ is a render scene of FIVE iPhones in
// a flat horizontal row (X span -246..246) plus floor/background/light clutter.
// We keep only the BLACK phone (X 152.9..246.2) and drop everything else, then
// re-index into a small standalone OBJ + trimmed MTL for obj2gltf.
//
// Run: node --max-old-space-size=4096 scripts/extract-phone.mjs
import { createReadStream } from 'node:fs'
import { writeFile, readFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const SRC = 'dist/assets/3D/iphone/I Phone 16 obj.obj'
const SRC_MTL = 'dist/assets/3D/iphone/I_Phone_16.mtl'
const OUT_OBJ = 'model-src/iphone-black.obj'
const OUT_MTL = 'model-src/iphone-black.mtl'

// Black phone band (+/- small margin); gaps to neighbours are ~6 units so this
// is unambiguous. Faces are kept only if ALL their vertices fall inside.
const X_MIN = 150
const X_MAX = 248

// Render-scene materials that are not part of the phone.
const DROP_MTL = new Set([
  'Background', 'BackGroundImage', 'Reflection Floor', 'Reflect Material',
  'Light Material', 'Preview Material', 'Visible', 'GIBounce',
])

// ── Pass 1: load v / vt / vn (raw lines + parsed X for the crop test) ─────────
const vLines = ['']   // 1-indexed
const vX = [0]
const vtLines = ['']
const vnLines = ['']
{
  const rl = createInterface({ input: createReadStream(SRC), crlfDelay: Infinity })
  for await (const line of rl) {
    const c0 = line.charCodeAt(0)
    if (c0 !== 118) continue // 'v'
    const c1 = line.charCodeAt(1)
    if (c1 === 32) {                       // 'v '
      const sp = line.indexOf(' ', 2)
      vX.push(+line.slice(2, sp))
      vLines.push(line)
    } else if (c1 === 116 && line.charCodeAt(2) === 32) { // 'vt '
      vtLines.push(line)
    } else if (c1 === 110 && line.charCodeAt(2) === 32) { // 'vn '
      vnLines.push(line)
    }
  }
}

// ── Pass 2: walk faces, keep those inside the band with a wanted material ─────
const usedV = new Set(), usedVT = new Set(), usedVN = new Set(), usedMtl = new Set()
// Kept faces stored as { mtl, tokens:[[v,vt,vn],...] }
const kept = []
{
  let cur = null
  const rl = createInterface({ input: createReadStream(SRC), crlfDelay: Infinity })
  for await (const line of rl) {
    if (line.startsWith('usemtl ')) { cur = line.slice(7).trim(); continue }
    if (line.charCodeAt(0) !== 102 || line.charCodeAt(1) !== 32) continue // 'f '
    if (cur && DROP_MTL.has(cur)) continue
    const toks = line.slice(2).split(' ').filter(Boolean)
    const parsed = []
    let inBand = true
    for (const tk of toks) {
      const [vs, vts, vns] = tk.split('/')
      const v = parseInt(vs, 10)
      if (!v) { inBand = false; break }
      const x = vX[v]
      if (x < X_MIN || x > X_MAX) { inBand = false; break }
      parsed.push([v, vts ? parseInt(vts, 10) : 0, vns ? parseInt(vns, 10) : 0])
    }
    if (!inBand || parsed.length < 3) continue
    for (const [v, vt, vn] of parsed) {
      usedV.add(v); if (vt) usedVT.add(vt); if (vn) usedVN.add(vn)
    }
    usedMtl.add(cur)
    kept.push({ mtl: cur, toks: parsed })
  }
}

// ── Re-index used attributes into compact 1..N ranges ────────────────────────
const remap = (set) => {
  const sorted = [...set].sort((a, b) => a - b)
  const map = new Map()
  sorted.forEach((old, i) => map.set(old, i + 1))
  return { sorted, map }
}
const V = remap(usedV), VT = remap(usedVT), VN = remap(usedVN)

// ── Emit OBJ ─────────────────────────────────────────────────────────────────
const out = []
out.push('# Black iPhone extracted from the C4D 5-phone scene (X 150..248)')
out.push('mtllib iphone-black.mtl')
for (const i of V.sorted) out.push(vLines[i])
for (const i of VT.sorted) out.push(vtLines[i])
for (const i of VN.sorted) out.push(vnLines[i])
let curMtl = null
for (const f of kept) {
  if (f.mtl !== curMtl) { out.push(`usemtl ${f.mtl}`); curMtl = f.mtl }
  const parts = f.toks.map(([v, vt, vn]) => {
    const nv = V.map.get(v)
    if (vn) return `${nv}/${vt ? VT.map.get(vt) : ''}/${VN.map.get(vn)}`
    if (vt) return `${nv}/${VT.map.get(vt)}`
    return `${nv}`
  })
  out.push(`f ${parts.join(' ')}`)
}
await writeFile(OUT_OBJ, out.join('\n'))

// ── Emit trimmed MTL (only used materials, strip missing texture maps) ───────
const mtlSrc = await readFile(SRC_MTL, 'utf8')
const blocks = mtlSrc.split(/^newmtl /m).slice(1)
const outMtl = ['# Trimmed materials for the extracted black iPhone']
for (const block of blocks) {
  const name = block.slice(0, block.indexOf('\n')).trim()
  if (!usedMtl.has(name)) continue
  const lines = ('newmtl ' + block).split('\n')
    .filter((l) => !/^\s*map_/.test(l)) // drop references to absent wallpaper jpgs
  outMtl.push(lines.join('\n').trimEnd())
}
await writeFile(OUT_MTL, outMtl.join('\n\n'))

console.log('kept faces :', kept.length)
console.log('verts      :', V.sorted.length, '| uv:', VT.sorted.length, '| nrm:', VN.sorted.length)
console.log('materials  :', [...usedMtl].join(', '))
console.log('wrote', OUT_OBJ, 'and', OUT_MTL)
