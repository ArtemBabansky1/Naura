// Minimal three.js engine for the scroll-driven 3D iPhone in the Telegram block.
// Owns the renderer/scene/camera/env, loads the meshopt-compressed GLB, swaps the
// screen mesh for a canvas-texture plane, and exposes setProgress/setTilt so the
// React layer can drive it from ScrollTrigger + the cursor. Framework-agnostic.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const FOV = 28
// Phone height as a fraction of the canvas height. The canvas is rendered ~1.62×
// larger than the phone's layout footprint (overscan for rotation/tilt room), so
// 0.56 here makes the facing phone fill ~0.9× the footprint — matching the old
// flat image's width, which the callouts anchor to.
const FIT_FRAC = 0.56
// The source model is ~189 units tall; normalise it so the camera sits a few units
// away with a tight near/far, giving the depth precision a coplanar screen needs.
const NORM_HEIGHT = 2.4

const v3 = new THREE.Vector3()

// Model facts (verified from the source geometry): +Y is the phone's top, and the
// screen is the −Z face (the camera bump protrudes on +Z). So the screen plane
// lives just outside −Z, and "facing the viewer" is a 180° rotation about Y.
function findScreenMesh(root) {
  let found = null
  root.traverse((o) => {
    if (!found && o.isMesh && /display/i.test(o.material?.name || '')) found = o
  })
  return found
}

// Traces a centred rounded rectangle onto a Shape/Path (used for the screen
// plane and for the bezel mask ring's contours).
function traceRoundedRect(path, w, h, r) {
  const x = -w / 2, y = -h / 2
  const rr = Math.min(r, w / 2, h / 2)
  path.moveTo(x + rr, y)
  path.lineTo(x + w - rr, y)
  path.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false)
  path.lineTo(x + w, y + h - rr)
  path.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false)
  path.lineTo(x + rr, y + h)
  path.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false)
  path.lineTo(x, y + rr)
  path.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false)
  return path
}

// A rounded-rectangle plane (facing +Z) with UVs remapped to 0..1, so the screen
// carries the phone's rounded corners instead of a hard rectangle.
function roundedScreenGeometry(w, h, r) {
  const shape = traceRoundedRect(new THREE.Shape(), w, h, r)
  const x = -w / 2, y = -h / 2
  const geom = new THREE.ShapeGeometry(shape, 16)
  const pos = geom.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x) / w
    uv[i * 2 + 1] = (pos.getY(i) - y) / h
  }
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return geom
}

// Near-black graphite finish to match the dark site. The body stays very dark; the
// frame and glass are a touch lighter / glossier so the rim lights catch the edges
// and the silhouette reads against the black background.
function tuneMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return
    const mat = o.material
    if (!mat || Array.isArray(mat)) return
    const name = (mat.name || '').toLowerCase()
    if (/glass|multicoat/.test(name)) {
      mat.color?.setHex(0x17171c)
      if (mat.metalness !== undefined) mat.metalness = 0.5
      if (mat.roughness !== undefined) mat.roughness = 0.3
      mat.envMapIntensity = 1.0
    } else if (/frame|matt|cam body|cam black/.test(name)) {
      // Frame catches the env sheen + rim to define the silhouette against black.
      mat.color?.setHex(0x303038)
      if (mat.metalness !== undefined) mat.metalness = 0.8
      if (mat.roughness !== undefined) mat.roughness = 0.5 // broad highlight, no line
      mat.envMapIntensity = 0.95
    } else {
      mat.color?.setHex(0x282830)
      if (mat.metalness !== undefined) mat.metalness = 0.55
      if (mat.roughness !== undefined) mat.roughness = 0.5
      mat.envMapIntensity = 0.85
    }
  })
}

// A soft top-down gradient used as the reflection environment. Unlike a studio
// env (RoomEnvironment), it has NO hard light sources, so glossy edges reflect a
// smooth falloff instead of blowing out into bright vertical lines.
function gradientEnvTexture() {
  const W = 128, H = 64 // equirect is 2:1; vertical gradient = top sky / bottom floor
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0.0, '#7a7a86') // soft sky/top — bright enough to sheen the body
  g.addColorStop(0.5, '#2a2a30')
  g.addColorStop(1.0, '#070709') // dark floor
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createPhoneScene(canvas, { faceAngleDeg = 180, turnAwayDeg = 135, maxPixelRatio = 2, fitFrac = FIT_FRAC } = {}) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
  // MSAA stays on at every DPR: the white screen against the near-black frame
  // is the highest-contrast edge on the page, and without MSAA it staircases
  // even on 2x backing stores.
  // stencil: false — nothing uses the stencil buffer; skipping it trims the
  // framebuffer memory/bandwidth that MSAA multiplies.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: false, powerPreference: 'high-performance' })
  renderer.setClearAlpha(0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setPixelRatio(pixelRatio)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000)
  camera.position.set(0, 0, 10)

  // Soft, source-free gradient reflections (no hard env lights → no edge lines).
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envSrc = gradientEnvTexture()
  const envRT = pmrem.fromEquirectangular(envSrc)
  scene.environment = envRT.texture
  envSrc.dispose()

  // Neutral lighting that defines a near-black phone against the black page:
  // a soft hemisphere fill shapes the form, a key adds a broad highlight, and a
  // white rim rakes the edges for silhouette. All white (no purple) and — with the
  // source-free env + rough metal — broad, so the rails never become hard lines.
  const hemi = new THREE.HemisphereLight(0xb0b0bc, 0x0c0c0e, 0.95)
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(1.5, 2.5, 3.5)
  const rim = new THREE.DirectionalLight(0xffffff, 1.1)
  rim.position.set(-2.5, 1.5, -2)
  scene.add(hemi, key, rim)

  // tiltGroup (cursor parallax) → pivot (scroll rotation + idle) → model
  const tiltGroup = new THREE.Group()
  const pivot = new THREE.Group()
  tiltGroup.add(pivot)
  scene.add(tiltGroup)

  const clock = new THREE.Clock()
  const faceAngle = THREE.MathUtils.degToRad(faceAngleDeg)
  const turnAway = THREE.MathUtils.degToRad(turnAwayDeg)
  let phoneHeight = 1
  let baseAngle = faceAngle - turnAway // start: turned ~75% away from the viewer
  const tiltTarget = { x: 0, y: 0 }
  let running = false
  let raf = 0
  let screenTexture = null
  let disposed = false

  function fitCamera(height) {
    const dist = height / (2 * fitFrac * Math.tan(THREE.MathUtils.degToRad(FOV) / 2))
    camera.position.set(0, 0, dist)
    camera.near = Math.max(0.01, dist - height)
    camera.far = dist + height * 2
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }

  function attachScreen(model, modelBox, screenCanvas, aspect) {
    const mesh = findScreenMesh(model)
    const tex = new THREE.CanvasTexture(screenCanvas)
    tex.colorSpace = THREE.SRGBColorSpace
    // 4× aniso is enough for the shallow angles the phone ever reaches; 16×
    // noticeably raises the per-sample cost on the near-fullscreen quad.
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    screenTexture = tex

    // Screen bounds in model-local space, read from the real display quad so the
    // UI sits exactly where the model's screen is.
    const size = modelBox.getSize(v3)
    let cx = 0, cy = 0, cz = modelBox.min.z, w = size.x * 0.86, h = w / aspect
    if (mesh) {
      mesh.geometry.computeBoundingBox()
      const b = mesh.geometry.boundingBox.clone()
      const toRoot = new THREE.Matrix4().copy(model.matrixWorld).invert().multiply(mesh.matrixWorld)
      b.applyMatrix4(toRoot)
      const c = b.getCenter(new THREE.Vector3())
      const s = b.getSize(new THREE.Vector3())
      cx = c.x; cy = c.y; cz = c.z; w = s.x; h = s.y // exact display rect — no frame overlap
      // Keep the display quad as a pure-black backing so the rounded UI's corners
      // read as screen, not see-through. Unlit so it stays true black.
      // polygonOffset pushes its depth back proportionally to the surface's
      // screen-space slope: at grazing view angles (phone turned away) the
      // per-pixel depth step otherwise exceeds the tiny gap to the UI plane
      // and the backing wins the depth test in stripes — black bands on the
      // screen. Slope-scaled offset keeps the backing behind at every angle.
      mesh.material?.dispose?.()
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        polygonOffset: true,
        polygonOffsetFactor: 4,
        polygonOffsetUnits: 4,
      })
    }
    // The model's display rim is messy: the black backing quad and the coarse
    // bezel-ring polygons sit coplanar at the front face, so wherever that rim
    // peeks past the UI plane it renders as ragged dark teeth — and a plane
    // sized to hide it starts painting white over the frame instead. Stop
    // fitting the plane to the junk: draw the screen boundary ourselves.
    //
    // Two of our own layers, both in front of the model:
    //  1. the chat plane — FULL display rect, corners tucked under the mask;
    //  2. a black mask ring whose smooth inner arc IS the visible screen
    //     corner, and whose outer edge lands black-on-black on the bezel.
    // Every visible boundary is ours (high-tess arcs + MSAA); the model's rim
    // junk is buried underneath and can't leak at any rotation or tilt.
    const screenR = Math.min(0.145 * size.x, w * 0.5, h * 0.5)
    const zBase = cz - size.z * 0.003
    const plane = new THREE.Mesh(
      roundedScreenGeometry(w, h, screenR),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    )
    plane.position.set(cx, cy, zBase)
    plane.rotation.y = Math.PI
    plane.renderOrder = 10
    model.add(plane)

    // Mask ring: hole overlaps the plane by `lip` (no gap can open under
    // tilt); the outer contour reaches `spread` past the display rect — well
    // over the rim junk, yet still ~3% of body width inside the outer frame
    // silhouette, so it never pokes out at grazing angles.
    const lip = size.x * 0.005
    const spread = size.x * 0.022
    const maskShape = traceRoundedRect(new THREE.Shape(), w + spread * 2, h + spread * 2, screenR + spread)
    maskShape.holes.push(traceRoundedRect(new THREE.Path(), w - lip * 2, h - lip * 2, screenR - lip))
    const mask = new THREE.Mesh(
      new THREE.ShapeGeometry(maskShape, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
    )
    mask.position.set(cx, cy, zBase - size.z * 0.001)
    mask.rotation.y = Math.PI
    mask.renderOrder = 11
    model.add(mask)
  }

  async function load(glbUrl, screenCanvas, aspect) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync(glbUrl)
    if (disposed) return
    const model = gltf.scene
    model.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    tuneMaterials(model)
    attachScreen(model, box, screenCanvas, aspect)

    // Centre at the origin, then normalise the scale so the camera/near-far stay
    // small (depth precision) regardless of the source model's huge units.
    model.position.sub(center)
    const norm = new THREE.Group()
    norm.scale.setScalar(NORM_HEIGHT / size.y)
    norm.add(model)
    pivot.add(norm)
    phoneHeight = NORM_HEIGHT

    fitCamera(NORM_HEIGHT)
    renderer.render(scene, camera)
  }

  // Adaptive frame rate: full 60fps only while the phone is actively driven
  // (scroll rotation / cursor tilt). The idle bob peaks at ~8px/s, so at 20fps
  // it moves ≤0.4px between frames — sub-pixel, indistinguishable — and idle
  // is where the phone spends most of its time, so this caps the block's
  // steady-state GPU load at a third of the driven rate.
  const FAST_WINDOW_MS = 250
  const IDLE_FRAME_MS = 50
  let fastUntil = 0
  let lastRender = 0

  function frame(now = performance.now()) {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const tiltSettled =
      Math.abs(tiltTarget.x - tiltGroup.rotation.x) < 0.001 &&
      Math.abs(tiltTarget.y - tiltGroup.rotation.y) < 0.001
    if (now >= fastUntil && tiltSettled && now - lastRender < IDLE_FRAME_MS) return
    lastRender = now
    const t = clock.getElapsedTime()
    pivot.rotation.y = baseAngle + Math.sin(t * 0.6) * 0.05
    pivot.position.y = Math.sin(t * 0.9) * phoneHeight * 0.012
    tiltGroup.rotation.x += (tiltTarget.x - tiltGroup.rotation.x) * 0.08
    tiltGroup.rotation.y += (tiltTarget.y - tiltGroup.rotation.y) * 0.08
    renderer.render(scene, camera)
  }

  return {
    load,
    // p: 0 = turned ~75% away … 1 = screen facing the viewer (180°).
    setProgress(p) {
      baseAngle = faceAngle - turnAway * (1 - Math.min(1, Math.max(0, p)))
      fastUntil = performance.now() + FAST_WINDOW_MS
    },
    setTilt(rx, ry) { tiltTarget.x = rx; tiltTarget.y = ry },
    setSize(w, h) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (!running) renderer.render(scene, camera)
    },
    start() { if (running) return; running = true; clock.getDelta(); frame() },
    stop() { running = false; cancelAnimationFrame(raf) },
    redrawScreen() { if (screenTexture) screenTexture.needsUpdate = true },
    dispose() {
      disposed = true
      running = false
      cancelAnimationFrame(raf)
      scene.environment = null // drop the ref before disposing the env target
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose()
          const m = o.material
          ;(Array.isArray(m) ? m : [m]).forEach((mm) => {
            mm?.map?.dispose?.()
            mm?.dispose?.()
          })
        }
      })
      screenTexture?.dispose()
      screenTexture = null
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
