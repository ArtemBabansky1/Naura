// Contact graph data — extracted from Figma node 6671:839
// Stage reference: 1720 × 980 px (Figma exact)
// cx/cy = center of each card in % of stage dimensions
// depth: 0=center, 1-4=rings outward (parallax, blur, scale)
// filterBlur: CSS filter:blur on the whole card (mult of 5px rule)

// Local people photos as optimized AVIF + WebP (originals are JPG, ~50× larger).
// import.meta.glob eagerly resolves every converted file to its hashed URL.
const AVIF = import.meta.glob('../../assets/people/*.avif', { eager: true, import: 'default' })
const WEBP = import.meta.glob('../../assets/people/*.webp', { eager: true, import: 'default' })
const pic = (n) => ({
  avif: AVIF[`../../assets/people/photo_${n}.avif`],
  webp: WEBP[`../../assets/people/photo_${n}.webp`],
})

// Mapped to keep each contact's gendered name believable. Each value is an
// { avif, webp } pair consumed by a <picture> in HeroGraph.
const A = {
  maryJ: pic(1), alexK: pic(14), davidL: pic(13), jamesW: pic(15),
  isabellaM: pic(5), noahG: pic(4), lilyF: pic(6), lucasV: pic(18),
  avaH: pic(10), sophiaR: pic(23), ethanC: pic(24), oliviaT: pic(11),
  miaN: pic(16), michaelB: pic(8), danielP: pic(9),
}

// ── NODES ────────────────────────────────────────────────────────────────────
// cx/cy: center of card as % of 1720×980 stage. Edit here to reposition nodes.
// avatar: replace A.* with a local path when switching to project assets.
export const NODES = [
  { id: 'mary',       name: 'Mary.J',     roleKey: 'you',            avatar: A.maryJ,     cx: 49.9, cy: 73.6, depth: 0, filterBlur: '0px', isCenter: true },
  { id: 'alex',       name: 'Alex.K',     roleKey: 'frontendDev',    avatar: A.alexK,     cx: 62.3, cy: 63.3, depth: 1, filterBlur: '0px' },
  { id: 'david',      name: 'David.L',    roleKey: 'backendDev',     avatar: A.davidL,    cx: 36.5, cy: 63.9, depth: 1, filterBlur: '0px' },
  { id: 'james',      name: 'James.W',    roleKey: 'qaEngineer',     avatar: A.jamesW,    cx: 62.3, cy: 81.8, depth: 1, filterBlur: '0px' },
  { id: 'isabella',   name: 'Isabella.M', roleKey: 'uiDesigner',     avatar: A.isabellaM, cx: 37.6, cy: 86.1, depth: 1, filterBlur: '0px' },
  { id: 'noah',       name: 'Noah.G',     roleKey: 'cloudArchitect', avatar: A.noahG,     cx: 75.1, cy: 53.4, depth: 2, filterBlur: '0px' },
  { id: 'lily',       name: 'Lily.F',     roleKey: 'cybersecurity',  avatar: A.lilyF,     cx: 76.8, cy: 73.0, depth: 2, filterBlur: '0px' },
  { id: 'lucas',      name: 'Lucas.V',    roleKey: 'fullStackDev',   avatar: A.lucasV,    cx: 26.5, cy: 56.2, depth: 2, filterBlur: '0px' },
  { id: 'ava',        name: 'Ava.H',      roleKey: 'scrumMaster',    avatar: A.avaH,      cx: 24.5, cy: 75.4, depth: 2, filterBlur: '0px' },
  { id: 'sophia',     name: 'Sophia.R',   roleKey: 'productManager', avatar: A.sophiaR,   cx: 73.4, cy: 89.7, depth: 2, filterBlur: '0px' },
  { id: 'ethan',      name: 'Ethan.C',    roleKey: 'mlEngineer',     avatar: A.ethanC,    cx: 83.3, cy: 60.1, depth: 3, filterBlur: '5px' },
  { id: 'olivia',     name: 'Olivia.T',   roleKey: 'dataScientist',  avatar: A.oliviaT,   cx: 17.9, cy: 49.8, depth: 3, filterBlur: '0px' },
  { id: 'mia',        name: 'Mia.N',      roleKey: 'techLead',       avatar: A.miaN,      cx: 14.9, cy: 86.7, depth: 3, filterBlur: '0px' },
  { id: 'michael',    name: 'Michael.B',  roleKey: 'devOpsEngineer', avatar: A.michaelB,  cx:  8.5, cy: 68.8, depth: 3, filterBlur: '5px' },
  { id: 'danielP_r',  name: 'Daniel.P',   roleKey: 'mobileDev',      avatar: A.danielP,   cx: 90.8, cy: 88.1, depth: 4, filterBlur: '5px' },
  { id: 'danielP_l',  name: 'Daniel.P',   roleKey: 'mobileDev',      avatar: A.danielP,   cx:  4.5, cy: 89.0, depth: 4, filterBlur: '5px' },
  { id: 'michaelB_r', name: 'Michael.B',  roleKey: 'devOpsEngineer', avatar: A.michaelB,  cx: 92.6, cy: 69.6, depth: 4, filterBlur: '5px' },
  { id: 'ethanC_l',   name: 'Ethan.C',    roleKey: 'mlEngineer',     avatar: A.ethanC,    cx:  5.8, cy: 52.4, depth: 4, filterBlur: '5px' },
  { id: 'miaN_r',     name: 'Mia.N',      roleKey: 'techLead',       avatar: A.miaN,      cx: 86.4, cy: 44.7, depth: 4, filterBlur: '5px' },
]

// ── EDGES ────────────────────────────────────────────────────────────────────
// [fromId, toId] — ordered center-outward for animation sequencing.
export const EDGES = [
  ['mary',    'alex'],
  ['mary',    'david'],
  ['mary',    'james'],
  ['mary',    'isabella'],
  ['alex',    'noah'],
  ['alex',    'lily'],
  ['david',   'lucas'],
  ['david',   'ava'],
  ['james',   'sophia'],
  ['noah',    'ethan'],
  ['lily',    'ethan'],
  ['lucas',   'olivia'],
  ['lucas',   'michael'],
  ['ava',     'mia'],
  ['ethan',   'miaN_r'],
  ['lily',    'michaelB_r'],
  ['lily',    'danielP_r'],
  ['sophia',  'danielP_r'],
  ['michael', 'danielP_l'],
  ['mia',     'danielP_l'],
  ['michael', 'ethanC_l'],
  ['olivia',  'ethanC_l'],
]

// Grouped for sequential reveal animation (one group per ring)
export const EDGE_GROUPS = [
  EDGES.slice(0, 4),
  EDGES.slice(4, 9),
  EDGES.slice(9, 14),
  EDGES.slice(14),
]

// Node IDs that appear after each edge group finishes drawing
export const TIER_NODES = {
  1: ['alex', 'david', 'james', 'isabella'],
  2: ['noah', 'lily', 'lucas', 'ava', 'sophia'],
  3: ['ethan', 'olivia', 'mia', 'michael'],
  4: ['danielP_r', 'danielP_l', 'michaelB_r', 'ethanC_l', 'miaN_r'],
}

// Mouse parallax multiplier per depth level.
// Raise values for stronger parallax effect.
export const PARALLAX = [0, 0.008, 0.018, 0.032, 0.055]

// SVG viewport matches Figma stage dimensions
export const SVG_W = 1720
export const SVG_H = 980
