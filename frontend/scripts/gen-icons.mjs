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
const RUPEE = ['M6 7 H21', 'M6 12.5 H21', 'M6 7 H11.5 A5.5 5.5 0 0 1 11.5 18 H6 L15.6 25.5']
const SLASH = 'M25 4 L15.5 28'

// The mark on a 32-unit grid, white on the dark tile.
const mark = `
  <mask id="cut"><rect width="32" height="32" fill="#fff"/><path d="${SLASH}" stroke="#000" stroke-width="5" stroke-linecap="round"/></mask>
  <g mask="url(#cut)" fill="none" stroke="${FG}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${RUPEE.map((d) => `<path d="${d}"/>`).join('')}</g>
  <path d="${SLASH}" stroke="${FG}" stroke-width="2.4" stroke-linecap="round"/>`

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
// The mark's furthest point (slash tip) is 0.50 of its box from the centre, so at 70%
// it reaches 180px: inside the safe zone with margin.
await png(svg({ size: 512, scale: 0.7 }), 'icon-maskable-512.png', 512)

console.log('All icons generated.')
