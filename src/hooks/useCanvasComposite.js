import { hexToRgb } from '../utils/colorUtils'
import { LIGHTING_PRESETS, drawLightingOverlays } from '../utils/lightingUtils'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Build a compound canvas path: outer wall polygon + cutout subpaths (even-odd holes) */
function buildCompoundPath(ctx, wall) {
  ctx.beginPath()
  tracePath(ctx, wall.points)
  for (const cutout of (wall.cutouts ?? [])) {
    if (!cutout.closed || cutout.points.length < 6) continue
    tracePath(ctx, cutout.points)
  }
}

function tracePath(ctx, points) {
  if (!points || points.length < 4) return
  ctx.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1])
  ctx.closePath()
}

/** Apply color overlay (multiply) with even-odd cutout holes */
function applyColor(ctx, wall, w, h, lightingMode) {
  if (!wall.points || wall.points.length < 6) return
  const { r, g, b } = hexToRgb(wall.color ?? '#F5E6D0')

  ctx.save()
  buildCompoundPath(ctx, wall)
  ctx.clip('evenodd')

  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = wall.opacity ?? 0.6
  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, w, h)

  if (lightingMode && lightingMode !== 'neutral') {
    const vals = LIGHTING_PRESETS[lightingMode]
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < wall.points.length; i += 2) {
      minX = Math.min(minX, wall.points[i])
      minY = Math.min(minY, wall.points[i + 1])
      maxX = Math.max(maxX, wall.points[i])
      maxY = Math.max(maxY, wall.points[i + 1])
    }
    if (minX === Infinity) { minX = 0; minY = 0; maxX = w; maxY = h; }
    drawLightingOverlays(ctx, minX, minY, maxX - minX, maxY - minY, vals)
  }

  ctx.restore()
}

/** Apply wallpaper pattern with even-odd cutout holes */
function applyWallpaper(ctx, wall, w, h, patternImg, lightingMode) {
  if (!wall.points || wall.points.length < 6 || !patternImg) return

  const wallpaperScale = wall.wallpaperScale ?? 1
  const opacity = wall.wallpaperOpacity ?? 0.85
  const tileW = (patternImg.naturalWidth || 120) * wallpaperScale
  const tileH = (patternImg.naturalHeight || 120) * wallpaperScale

  ctx.save()
  buildCompoundPath(ctx, wall)
  ctx.clip('evenodd')

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = opacity

  const pattern = ctx.createPattern(patternImg, 'repeat')
  if (pattern) {
    const matrix = new DOMMatrix()
    matrix.scaleSelf(tileW / patternImg.naturalWidth, tileH / patternImg.naturalHeight)
    pattern.setTransform(matrix)
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, w, h)
  }

  // Shadow preservation multiply pass
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.4
  ctx.fillStyle = '#888888'
  ctx.fillRect(0, 0, w, h)

  if (lightingMode && lightingMode !== 'neutral') {
    const vals = LIGHTING_PRESETS[lightingMode]
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < wall.points.length; i += 2) {
      minX = Math.min(minX, wall.points[i])
      minY = Math.min(minY, wall.points[i + 1])
      maxX = Math.max(maxX, wall.points[i])
      maxY = Math.max(maxY, wall.points[i + 1])
    }
    if (minX === Infinity) { minX = 0; minY = 0; maxX = w; maxY = h; }
    drawLightingOverlays(ctx, minX, minY, maxX - minX, maxY - minY, vals)
  }

  ctx.restore()
}

/**
 * Generate a full-resolution composite PNG dataURL.
 * Correctly handles cutouts via even-odd clipping.
 */
export async function generateCompositeDataURL(image, imageWidth, imageHeight, walls, lightingMode = 'neutral') {
  const baseImg = await loadImage(image)

  // Pre-load all wallpaper images in parallel
  const wallpaperImgMap = {}
  await Promise.all(
    walls
      .filter(w => w.closed && w.mode === 'wallpaper' && w.wallpaperUrl)
      .map(async w => {
        try { wallpaperImgMap[w.wallpaperUrl] = await loadImage(w.wallpaperUrl) }
        catch { /* skip */ }
      })
  )

  const canvas = document.createElement('canvas')
  canvas.width = imageWidth
  canvas.height = imageHeight
  const ctx = canvas.getContext('2d')

  ctx.drawImage(baseImg, 0, 0, imageWidth, imageHeight)

  for (const wall of walls) {
    if (!wall.closed || !wall.points || wall.points.length < 6) continue
    if (wall.mode === 'wallpaper' && wall.wallpaperUrl) {
      applyWallpaper(ctx, wall, imageWidth, imageHeight, wallpaperImgMap[wall.wallpaperUrl], lightingMode)
    } else {
      applyColor(ctx, wall, imageWidth, imageHeight, lightingMode)
    }
  }

  return canvas.toDataURL('image/png')
}
