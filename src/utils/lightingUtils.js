export const LIGHTING_PRESETS = {
  neutral: {
    id: 'neutral',
    label: 'Day',
    fullLabel: 'Neutral Daylight',
    icon: '🌤',
    tintR: 0, tintG: 0, tintB: 0, tintA: 0,
    screenA: 0,
    multiplyR: 255, multiplyG: 255, multiplyB: 255, multiplyA: 0,
    overlayR: 0, overlayG: 0, overlayB: 0, overlayA: 0
  },
  warmDaylight: {
    id: 'warmDaylight',
    label: 'Warm',
    fullLabel: 'Warm Daylight',
    icon: '☀',
    tintR: 255, tintG: 220, tintB: 150, tintA: 0.15,
    screenA: 0.08,
    multiplyR: 255, multiplyG: 255, multiplyB: 255, multiplyA: 0,
    overlayR: 255, overlayG: 220, overlayB: 150, overlayA: 0.05
  },
  goldenHour: {
    id: 'goldenHour',
    label: 'Sunset',
    fullLabel: 'Golden Hour',
    icon: '🌇',
    tintR: 255, tintG: 140, tintB: 0, tintA: 0.25,
    screenA: 0.05,
    multiplyR: 255, multiplyG: 240, multiplyB: 200, multiplyA: 0.05,
    overlayR: 255, overlayG: 130, overlayB: 0, overlayA: 0.2
  },
  warmIndoor: {
    id: 'warmIndoor',
    label: 'Indoor',
    fullLabel: 'Warm Indoor',
    icon: '💡',
    tintR: 255, tintG: 180, tintB: 50, tintA: 0.28,
    screenA: 0,
    multiplyR: 180, multiplyG: 160, multiplyB: 140, multiplyA: 0.15,
    overlayR: 255, overlayG: 180, overlayB: 50, overlayA: 0.1
  },
  coolWhiteLED: {
    id: 'coolWhiteLED',
    label: 'LED',
    fullLabel: 'Cool White LED',
    icon: '❄',
    tintR: 180, tintG: 210, tintB: 255, tintA: 0.18,
    screenA: 0.1,
    multiplyR: 255, multiplyG: 255, multiplyB: 255, multiplyA: 0,
    overlayR: 180, overlayG: 210, overlayB: 255, overlayA: 0.05
  },
  nightLamp: {
    id: 'nightLamp',
    label: 'Night',
    fullLabel: 'Night Lamp',
    icon: '🌙',
    tintR: 20, tintG: 40, tintB: 100, tintA: 0.2,
    screenA: 0,
    multiplyR: 40, multiplyG: 50, multiplyB: 80, multiplyA: 0.5,
    overlayR: 255, overlayG: 150, overlayB: 50, overlayA: 0.15
  }
};

export function hasLightingEffect(vals) {
  if (!vals) return false;
  return vals.tintA > 0 || vals.screenA > 0 || vals.multiplyA > 0 || vals.overlayA > 0;
}

export function drawLightingOverlays(ctx, minX, minY, w, h, vals) {
  if (!hasLightingEffect(vals)) return;

  // 1. Multiply (darken / tone)
  if (vals.multiplyA > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = vals.multiplyA;
    ctx.fillStyle = `rgb(${Math.round(vals.multiplyR)}, ${Math.round(vals.multiplyG)}, ${Math.round(vals.multiplyB)})`;
    ctx.fillRect(minX, minY, w, h);
    ctx.restore();
  }

  // 2. Screen (brighten / highlights)
  if (vals.screenA > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = vals.screenA;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(minX, minY, w, h);
    ctx.restore();
  }

  // 3. Color (hue / saturation tint)
  if (vals.tintA > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = vals.tintA;
    ctx.fillStyle = `rgb(${Math.round(vals.tintR)}, ${Math.round(vals.tintG)}, ${Math.round(vals.tintB)})`;
    ctx.fillRect(minX, minY, w, h);
    ctx.restore();
  }

  // 4. Overlay (contrast / highlights / shadows)
  if (vals.overlayA > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = vals.overlayA;
    ctx.fillStyle = `rgb(${Math.round(vals.overlayR)}, ${Math.round(vals.overlayG)}, ${Math.round(vals.overlayB)})`;
    ctx.fillRect(minX, minY, w, h);
    ctx.restore();
  }
}
