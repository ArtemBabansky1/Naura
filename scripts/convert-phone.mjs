// Convert the extracted black-iPhone OBJ into a small, web-ready GLB:
//   obj2gltf  →  weld  →  simplify (~0.3)  →  dedup/prune  →  quantize  →  meshopt
// Output: src/assets/3d/iphone-black.glb (loaded lazily, decoded with MeshoptDecoder).
//
// Run: node --max-old-space-size=4096 scripts/convert-phone.mjs
import { writeFile, mkdir } from 'node:fs/promises'
import obj2gltf from 'obj2gltf'
import { NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions'
import { weld, simplify, dedup, prune, quantize, reorder } from '@gltf-transform/functions'
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'

const IN = 'model-src/iphone-black.obj'
const OUT = 'src/assets/3d/iphone-black.glb'
const RATIO = 0.2      // target ~20% of triangles
const ERROR = 0.005    // simplification error tolerance (mild, keeps the silhouette)

// Parts not worth their triangle cost on a small, rotating phone. The speaker
// grille alone is 35% of the geometry yet invisible at this scale.
const DROP_PRIMITIVES = new Set(['specer net.002_1'])

const triCount = (doc) => doc.getRoot().listMeshes()
  .flatMap((m) => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)

await MeshoptSimplifier.ready
await MeshoptEncoder.ready
await MeshoptDecoder.ready

console.log('obj2gltf…')
const glb = await obj2gltf(IN, { binary: true })

const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

const doc = await io.readBinary(new Uint8Array(glb))
console.log('tris in   :', Math.round(triCount(doc)))

// Drop low-value heavy primitives before simplifying.
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    if (DROP_PRIMITIVES.has(prim.getMaterial()?.getName())) {
      mesh.removePrimitive(prim)
      prim.dispose()
    }
  }
}
console.log('tris after drop:', Math.round(triCount(doc)))

await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }),
  dedup(),
  prune(),
  reorder({ encoder: MeshoptEncoder, target: 'size' }),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
)
console.log('tris out  :', Math.round(triCount(doc)))

doc.createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

await mkdir('src/assets/3d', { recursive: true })
const bin = await io.writeBinary(doc)
await writeFile(OUT, bin)
console.log('materials :', doc.getRoot().listMaterials().map((m) => m.getName()).join(', '))
console.log('wrote', OUT, (bin.byteLength / 1024).toFixed(0), 'KB')
