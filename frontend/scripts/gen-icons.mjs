// Generates public/icon.svg, public/favicon.svg and public/icons/*.png from one mark.
// Geometry matches src/components/common/Logo.tsx. Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const pub = join(__dir, '../public')
const out = join(pub, 'icons')

const BG = '#0A0A0A'
const FG = '#FFFFFF'
// A banknote snapped in two (see src/components/common/Logo.tsx), on a 32-unit grid.
const note = `<rect x="3" y="8.5" width="26" height="15" rx="3" fill="${FG}" mask="url(#m)"/>`
const mark = `
  <defs>
    <mask id="m"><rect width="32" height="32" fill="#fff"/><circle cx="16" cy="16" r="3.8" fill="#000"/><circle cx="7.4" cy="12.2" r="1.1" fill="#000"/><circle cx="24.6" cy="19.8" r="1.1" fill="#000"/></mask>
    <clipPath id="l"><path d="M0 0 H15.3 V32 H0 Z"/></clipPath>
    <clipPath id="r"><path d="M16.7 0 H32 V32 H16.7 Z"/></clipPath>
  </defs>
  <g clip-path="url(#l)" transform="translate(-1.6 0) rotate(-8 9 16)">${note}</g>
  <g clip-path="url(#r)" transform="translate(1.6 0) rotate(8 23 16)">${note}</g>`

// scale: how much of the canvas the 32-unit mark occupies (1 = edge to edge)
function svg({ size, scale, radius = 0 }) {
  const s = (size / 32) * scale
  const o = (size - 32 * s) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${o} ${o}) scale(${s})">${mark}</g>
</svg>
`
}

async function png(svgStr, file, size) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(join(out, file))
  console.log(`✓ icons/${file} (${size}×${size})`)
}

// App icon: full-bleed dark square (the OS applies its own corner mask).
writeFileSync(join(pub, 'icon.svg'), svg({ size: 512, scale: 0.78 }))
// Favicon: dark rounded square, so it reads on both light and dark browser tabs.
writeFileSync(join(pub, 'favicon.svg'), svg({ size: 32, scale: 0.86, radius: 7 }))
console.log('✓ icon.svg, favicon.svg')

await png(svg({ size: 512, scale: 0.78 }), 'icon-512.png', 512)
await png(svg({ size: 192, scale: 0.78 }), 'icon-192.png', 192)
await png(svg({ size: 180, scale: 0.78 }), 'apple-touch-icon.png', 180)
// Maskable: the safe zone is the centre circle of 80% diameter (radius 205px at 512).
// The note's furthest corner is ~0.50 of its box from the centre, so at 70% it reaches
// ~180px: inside the safe zone with margin.
await png(svg({ size: 512, scale: 0.7 }), 'icon-maskable-512.png', 512)

console.log('All icons generated.')
