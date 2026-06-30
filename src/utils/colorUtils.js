/** Convert hex string (#rrggbb) to {r, g, b} */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

/** Convert {r,g,b} to hex string */
export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

/** Convert {r,g,b} (0-255) to {h,s,l} where h=0-360, s=0-1, l=0-1 */
export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s, l }
}

/** Convert {h,s,l} to {r,g,b} */
export function hslToRgb({ h, s, l }) {
  h /= 360
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

/** Hex to hsl */
export function hexToHsl(hex) {
  return rgbToHsl(hexToRgb(hex))
}

/** Clamp value between min and max */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

/** Parse hex input string (with or without #) */
export function parseHexInput(str) {
  const clean = str.replace(/[^0-9a-fA-F]/g, '')
  if (clean.length === 3) {
    return '#' + clean.split('').map(c => c + c).join('')
  }
  if (clean.length === 6) return '#' + clean
  return null
}

/** Generate complementary and analogous colors for 'Pairs well with' feature */
export function getComplementaryColors(hex) {
  const hsl = hexToHsl(hex)
  
  // Create 4 related colors:
  // 1. Complementary (opposite on wheel)
  // 2. Analogous left (-30 deg)
  // 3. Analogous right (+30 deg)
  // 4. Triadic / Split complementary (+150 deg)
  
  const toHex = (h, s, l) => rgbToHex(hslToRgb({ h: (h + 360) % 360, s, l }))
  
  return [
    toHex(hsl.h + 180, hsl.s, hsl.l),                     // Complementary
    toHex(hsl.h - 30, hsl.s, Math.max(0.2, hsl.l - 0.1)), // Analogous darker
    toHex(hsl.h + 30, hsl.s, Math.min(0.8, hsl.l + 0.1)), // Analogous lighter
    toHex(hsl.h + 150, hsl.s, hsl.l),                     // Split comp
  ]
}
