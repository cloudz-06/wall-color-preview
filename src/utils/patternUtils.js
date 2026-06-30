/**
 * Generate a repeating pattern canvas for wallpaper overlays.
 * Returns a dataURL.
 * @param {'linen'|'brick'|'herringbone'|'marble'|'concrete'|'geometric'|'wood'|'floral'} type
 * @param {number} size  tile size in px
 */
export function generatePattern(type, size = 80) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  switch (type) {
    case 'linen':
      drawLinen(ctx, size)
      break
    case 'brick':
      drawBrick(ctx, size)
      break
    case 'herringbone':
      drawHerringbone(ctx, size)
      break
    case 'marble':
      drawMarble(ctx, size)
      break
    case 'concrete':
      drawConcrete(ctx, size)
      break
    case 'geometric':
      drawGeometric(ctx, size)
      break
    case 'wood':
      drawWood(ctx, size)
      break
    case 'floral':
      drawFloral(ctx, size)
      break
    default:
      drawLinen(ctx, size)
  }

  return canvas.toDataURL()
}

function drawLinen(ctx, s) {
  ctx.fillStyle = '#f5ede0'
  ctx.fillRect(0, 0, s, s)
  ctx.globalAlpha = 0.18
  for (let i = 0; i < s; i += 3) {
    ctx.strokeStyle = i % 6 === 0 ? '#8b6f50' : '#a07850'
    ctx.lineWidth = 0.7
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawBrick(ctx, s) {
  const bw = s, bh = s / 2
  // Row 1
  ctx.fillStyle = '#c87941'
  ctx.fillRect(0, 0, bw, bh)
  ctx.fillStyle = '#b86e38'
  ctx.fillRect(2, 2, bw - 4, bh - 4)
  // Row 2 (offset)
  ctx.fillStyle = '#d08548'
  ctx.fillRect(-bw / 2, bh, bw, bh)
  ctx.fillStyle = '#c07840'
  ctx.fillRect(-bw / 2 + 2, bh + 2, bw - 4, bh - 4)
  ctx.fillRect(bw / 2 + 2, bh + 2, bw / 2 - 4, bh - 4)
  // Mortar lines
  ctx.strokeStyle = '#e8d5c0'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, bw - 2, bh - 2)
  ctx.strokeRect(-bw / 2 + 1, bh + 1, bw - 2, bh - 2)
  ctx.strokeRect(bw / 2 + 1, bh + 1, bw / 2 - 2, bh - 2)
}

function drawHerringbone(ctx, s) {
  ctx.fillStyle = '#d4b896'
  ctx.fillRect(0, 0, s, s)
  ctx.strokeStyle = '#b89070'
  ctx.lineWidth = 1.5
  const step = s / 4
  for (let i = -s; i < s * 2; i += step * 2) {
    // NE diagonal
    ctx.beginPath()
    ctx.moveTo(i, 0); ctx.lineTo(i + step, step)
    ctx.moveTo(i + step, 0); ctx.lineTo(i + step * 2, step)
    ctx.moveTo(i + step * 2, 0); ctx.lineTo(i + step * 2 + step, step)
    ctx.stroke()
    // NW diagonal
    ctx.beginPath()
    ctx.moveTo(i + step, step); ctx.lineTo(i, step * 2)
    ctx.moveTo(i + step * 2, step); ctx.lineTo(i + step, step * 2)
    ctx.stroke()
  }
}

function drawMarble(ctx, s) {
  // Base
  const grad = ctx.createLinearGradient(0, 0, s, s)
  grad.addColorStop(0, '#f0ece8')
  grad.addColorStop(0.4, '#e8e0d8')
  grad.addColorStop(0.7, '#f4f0ec')
  grad.addColorStop(1, '#ebe4de')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, s, s)

  // Veins
  ctx.globalAlpha = 0.25
  for (let v = 0; v < 4; v++) {
    ctx.strokeStyle = v % 2 === 0 ? '#9e8878' : '#b8a898'
    ctx.lineWidth = v % 2 === 0 ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(Math.random() * s, 0)
    ctx.bezierCurveTo(
      Math.random() * s, Math.random() * s,
      Math.random() * s, Math.random() * s,
      Math.random() * s, s
    )
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawConcrete(ctx, s) {
  ctx.fillStyle = '#9ca3a8'
  ctx.fillRect(0, 0, s, s)
  // Noise effect
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    const gray = Math.floor(140 + Math.random() * 40)
    ctx.fillStyle = `rgba(${gray},${gray},${gray},0.15)`
    ctx.fillRect(x, y, 1, 1)
  }
  // Subtle lines
  ctx.strokeStyle = 'rgba(0,0,0,0.05)'
  ctx.lineWidth = 0.5
  for (let i = 0; i < s; i += 20) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke()
  }
}

function drawGeometric(ctx, s) {
  ctx.fillStyle = '#f8f4f0'
  ctx.fillRect(0, 0, s, s)
  const half = s / 2
  // Diamond grid
  ctx.strokeStyle = '#d4c4b0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(half, 0); ctx.lineTo(s, half); ctx.lineTo(half, s); ctx.lineTo(0, half); ctx.closePath()
  ctx.stroke()
  // Inner diamond
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#c8b89a'
  ctx.beginPath()
  ctx.moveTo(half, half / 2); ctx.lineTo(half + half / 2, half); ctx.lineTo(half, half + half / 2); ctx.lineTo(half - half / 2, half); ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawWood(ctx, s) {
  const grad = ctx.createLinearGradient(0, 0, s, 0)
  grad.addColorStop(0, '#8b5e3c')
  grad.addColorStop(0.3, '#a06838')
  grad.addColorStop(0.6, '#8b5e3c')
  grad.addColorStop(1, '#9e6840')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, s, s)
  // Wood grain
  ctx.globalAlpha = 0.12
  for (let i = 0; i < s; i += 4) {
    ctx.strokeStyle = i % 8 === 0 ? '#4a2e18' : '#6b3f20'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(0, i + Math.sin(i * 0.3) * 2)
    ctx.lineTo(s, i + Math.sin(i * 0.3) * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawFloral(ctx, s) {
  ctx.fillStyle = '#faf0e8'
  ctx.fillRect(0, 0, s, s)
  const cx = s / 2, cy = s / 2
  // Petals
  const petalColors = ['#d4748a', '#c8a0b8', '#e8b090', '#a8b8c8']
  for (let p = 0; p < 6; p++) {
    const angle = (p * Math.PI * 2) / 6
    const px = cx + Math.cos(angle) * (s / 4)
    const py = cy + Math.sin(angle) * (s / 4)
    ctx.beginPath()
    ctx.arc(px, py, s / 8, 0, Math.PI * 2)
    ctx.fillStyle = petalColors[p % petalColors.length] + '80'
    ctx.fill()
  }
  // Center
  ctx.beginPath()
  ctx.arc(cx, cy, s / 8, 0, Math.PI * 2)
  ctx.fillStyle = '#f0c860'
  ctx.fill()
}
