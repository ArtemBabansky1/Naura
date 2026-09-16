// Matching commands let the folder's tab flatten into the final book surface.
export const FOLDER_FRONT_PATH = 'M .10 0 L .36 0 C .43 0 .43 .15 .53 .15 L .88 .15 C .95 .15 1 .22 1 .32 L 1 .86 C 1 .95 .95 1 .88 1 L .12 1 C .05 1 0 .95 0 .86 L 0 .14 C 0 .05 .04 0 .10 0 Z'
export const FOLDER_BACK_PATH = 'M .48 .24 L .56 .10 C .58 .065 .61 .05 .66 .05 L .83 .05 C .90 .05 .94 .10 .94 .19 L .94 .86 C .94 .92 .90 .96 .84 .96 L .15 .96 C .09 .96 .06 .92 .06 .86 L .06 .30 C .06 .25 .10 .24 .15 .24 Z'

export function bookSurfacePath(width, height, radius) {
  const x = radius / width
  const y = radius / height
  return `M ${x} 0 L .36 0 C .43 0 .43 0 .53 0 L ${1-x} 0 C ${1-x/2} 0 1 ${y/2} 1 ${y} L 1 ${1-y} C 1 ${1-y/2} ${1-x/2} 1 ${1-x} 1 L ${x} 1 C ${x/2} 1 0 ${1-y/2} 0 ${1-y} L 0 ${y} C 0 ${y/2} ${x/2} 0 ${x} 0 Z`
}
