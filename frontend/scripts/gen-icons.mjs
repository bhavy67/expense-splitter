import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const out = join(__dir, '../public/icons')

// Dark-background icon SVG (icon-192, icon-512, apple-touch-icon)
// Colors: black bg, electric lime ₹, cream slash — matches dark mode look
function makeSvg(size) {
  const slash = size * 0.094       // stroke-width proportional to size
  const x1 = size * 0.906
  const y1 = size * 0.094
  const x2 = size * 0.094
  const y2 = size * 0.906
  const fontSize = size * 0.688
  const textY = size * 0.75

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <text
    x="${size / 2}"
    y="${textY}"
    text-anchor="middle"
    font-family="Arial, Helvetica Neue, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="#b9f542"
  >₹</text>
  <line
    x1="${x1}" y1="${y1}"
    x2="${x2}" y2="${y2}"
    stroke="#f0ede5"
    stroke-width="${slash}"
    stroke-linecap="round"
  />
</svg>`
}

async function render(svgStr, outputPath, size) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath)
  console.log(`✓ ${outputPath} (${size}×${size})`)
}

await render(makeSvg(512), join(out, 'icon-512.png'), 512)
await render(makeSvg(192), join(out, 'icon-192.png'), 192)
await render(makeSvg(180), join(out, 'apple-touch-icon.png'), 180)

console.log('All icons generated.')
