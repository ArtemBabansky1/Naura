import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

/* Generative page backdrop — a WebGL "layered distortion" shader in the
 * site's palette: fbm noise pushed through two liquify (domain-warp)
 * passes, so the color field flows like liquid. The warp origin tracks
 * the cursor with momentum. No dependencies — one fullscreen triangle,
 * ~1 lightweight fragment program. Renders a single static frame under
 * prefers-reduced-motion; falls back to the CSS background if WebGL is
 * unavailable. */

const MAX_BUFFER_WIDTH = 960 // fragment work cap; CSS upscale soft-blurs
const MOUSE_EASE = 4 // per-second lerp toward the cursor (momentum feel)
const TIME_SCALE = 0.055 // global animation speed

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

/* Palette (the hills artwork): deep green shadows → mid green → light
 * green glow → lavender wisps. */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse; // eased, -0.5..0.5

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 1.0;
  vec2 m = u_mouse * 0.7;

  // Liquify pass 1 — the warp field itself drifts and follows the cursor.
  // Lower frequencies + gentler warp gains = bigger, calmer shapes.
  vec2 q = vec2(
    fbm(p * 1.1 + t + m),
    fbm(p * 1.1 - t * 0.8 + m * 1.5 + vec2(5.2, 1.3))
  );

  // Liquify pass 2 — warp the warp: the layered distortion.
  vec2 r = vec2(
    fbm(p * 1.7 + 0.75 * q + vec2(1.7, 9.2) + t * 0.9),
    fbm(p * 1.7 + 0.75 * q + vec2(8.3, 2.8) - t * 0.7)
  );

  float f = fbm(p * 1.4 + 0.9 * r - m);

  // Greens with violet: deep -> mid -> light green, plus brand-purple
  // currents riding the second warp layer.
  vec3 deep = vec3(0.055, 0.14, 0.05);
  vec3 mid = vec3(0.243, 0.478, 0.173);   // #3e7a2c
  vec3 light = vec3(0.475, 0.710, 0.267); // #79b544
  vec3 violet = vec3(0.545, 0.318, 0.937); // near the accent #8642FF

  vec3 col = mix(deep, mid, smoothstep(0.15, 0.5, f));
  col = mix(col, light, smoothstep(0.5, 0.8, f));
  // Violet flows through the field — wide, clearly visible bands.
  float current = smoothstep(0.38, 0.72, r.y * f + 0.2 * q.x);
  col = mix(col, violet, 0.8 * current);

  // Soft glow that trails the cursor.
  float glow = smoothstep(0.55, 0.0, distance(uv, u_mouse + 0.5));
  col += glow * 0.10 * vec3(0.6, 0.75, 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`

const compile = (gl, type, src) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("MeetsBackdrop: shader compile failed", gl.getShaderInfoLog(shader))
  }
  return shader
}

/* Renders the fixed page backdrop by default; pass a className to reuse the
 * same animation as a block-local background (e.g. the form panel window). */
export default function MeetsBackdrop({ className = "meets-backdrop" }) {
  const canvasRef = useRef(null)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext("webgl", { antialias: false, depth: false, stencil: false })
    if (!canvas || !gl) return // CSS background stays as the fallback

    const program = gl.createProgram()
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // Surface the shader log — a silent blank backdrop is undebuggable.
      console.error("MeetsBackdrop: shader link failed", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    // One oversized triangle covers the viewport — no index buffer needed.
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, "a_pos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, "u_res")
    const uTime = gl.getUniformLocation(program, "u_time")
    const uMouse = gl.getUniformLocation(program, "u_mouse")

    const sizeToBox = () => {
      const box = canvas.getBoundingClientRect()
      const w = Math.max(1, box.width || window.innerWidth)
      const h = Math.max(1, box.height || window.innerHeight)
      const scale = Math.min(1, MAX_BUFFER_WIDTH / w)
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    sizeToBox()
    window.addEventListener("resize", sizeToBox)

    const render = (t, mx, my) => {
      gl.uniform1f(uTime, t)
      gl.uniform2f(uMouse, mx, my)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    if (prefersReduced) {
      render(0, 0, 0)
      return () => window.removeEventListener("resize", sizeToBox)
    }

    const mouse = { x: 0, y: 0 } // eased, -0.5..0.5 (y flipped for GL)
    const target = { x: 0, y: 0 }
    const onMove = (e) => {
      target.x = e.clientX / window.innerWidth - 0.5
      target.y = 0.5 - e.clientY / window.innerHeight
    }
    window.addEventListener("mousemove", onMove, { passive: true })

    let frame = 0
    let t = 0
    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      t += dt * TIME_SCALE
      const ease = Math.min(1, dt * MOUSE_EASE)
      mouse.x += (target.x - mouse.x) * ease
      mouse.y += (target.y - mouse.y) * ease
      render(t, mouse.x, mouse.y)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    // NOTE: no loseContext() here — under StrictMode's double-mount the
    // remount reuses the same <canvas>, and a deliberately lost context
    // stays lost (blank canvas + broken-image placeholder). The context is
    // reclaimed with the canvas element itself.
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("resize", sizeToBox)
    }
  }, [prefersReduced])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
