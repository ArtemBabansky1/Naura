import { NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(process.argv[2] || 'src/assets/3d/iphone-black.glb')
const root = doc.getRoot()
console.log('extensionsUsed    :', root.listExtensionsUsed().map((e) => e.extensionName).join(', '))
console.log('extensionsRequired:', root.listExtensionsRequired().map((e) => e.extensionName).join(', '))
let totalV = 0, totalT = 0
for (const m of root.listMeshes()) {
  for (const p of m.listPrimitives()) {
    const v = p.getAttribute('POSITION').getCount()
    const t = (p.getIndices()?.getCount() ?? v) / 3
    totalV += v; totalT += t
    console.log((p.getMaterial()?.getName() || '?').padEnd(28), 'verts', String(v).padStart(7), 'tris', String(Math.round(t)).padStart(7))
  }
}
console.log('TOTAL verts', totalV, 'tris', Math.round(totalT))
