/**
 * Utility functions for computing Natural Window Light Simulation.
 */

// Compute centroid of a polygon (points is a flat array [x,y,x,y...])
export function computeCentroid(points) {
  if (!points || points.length < 6) return { x: 0, y: 0 };
  let cx = 0, cy = 0;
  const numPoints = points.length / 2;
  for (let i = 0; i < points.length; i += 2) {
    cx += points[i];
    cy += points[i + 1];
  }
  return { x: cx / numPoints, y: cy / numPoints };
}

// Find the nearest window to a wall
export function findNearestWindow(wallPoints, windows) {
  if (!windows || windows.length === 0) return null;
  const closedWindows = windows.filter(w => w.closed && w.points && w.points.length >= 6);
  if (closedWindows.length === 0) return null;

  const wallCentroid = computeCentroid(wallPoints);
  let minWindow = null;
  let minDistance = Infinity;

  for (const win of closedWindows) {
    const winCentroid = computeCentroid(win.points);
    const dx = winCentroid.x - wallCentroid.x;
    const dy = winCentroid.y - wallCentroid.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistance) {
      minDistance = distSq;
      minWindow = {
        centroid: winCentroid,
        window: win,
      };
    }
  }

  return minWindow ? { window: minWindow.window, centroid: minWindow.centroid, wallCentroid } : null;
}

// Applies the window lighting overlay gradient to a given context.
// `scaledWallPoints` should be in the coordinate space of the canvas being drawn (e.g. stage-space or raw image space).
// `windows` must be in the original image coordinate space.
export function applyWindowLighting(ctx, scaledWallPoints, windows, scale = 1, position = { x: 0, y: 0 }) {
  // Compute wall points in original image space to match window coordinates
  const originalWallPoints = [];
  for (let i = 0; i < scaledWallPoints.length; i += 2) {
    originalWallPoints.push((scaledWallPoints[i] - position.x) / scale);
    originalWallPoints.push((scaledWallPoints[i+1] - position.y) / scale);
  }

  const nearestData = findNearestWindow(originalWallPoints, windows);
  if (!nearestData) return;

  const { centroid: winCentroid, wallCentroid } = nearestData;

  // Direction vector in image space
  let dirX = winCentroid.x - wallCentroid.x;
  let dirY = winCentroid.y - wallCentroid.y;
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  
  if (len < 0.001) {
    // Window is exactly on top of wall centroid, default to top-down
    dirX = 0;
    dirY = -1;
  } else {
    dirX /= len;
    dirY /= len;
  }

  // The direction vector in scaled/screen space is identical since scale is uniform.
  
  // Find bounding box extents along the direction vector in scaled space
  let minDot = Infinity;
  let maxDot = -Infinity;
  let pMin = { x: 0, y: 0 };
  let pMax = { x: 0, y: 0 };

  for (let i = 0; i < scaledWallPoints.length; i += 2) {
    const px = scaledWallPoints[i];
    const py = scaledWallPoints[i + 1];
    const dot = px * dirX + py * dirY;
    if (dot < minDot) {
      minDot = dot;
      pMin = { x: px, y: py };
    }
    if (dot > maxDot) {
      maxDot = dot;
      pMax = { x: px, y: py };
    }
  }

  // The direction vector points FROM Wall TO Window.
  // So the point with the MAXIMUM dot product is closest to the window.
  // p0 (bright end) = pMax
  // p1 (dark end) = pMin
  const p0 = pMax;
  const p1 = pMin;

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.7;

  const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  grad.addColorStop(0.00, 'rgba(255,255,255, 0.18)');
  grad.addColorStop(0.25, 'rgba(0,0,0, 0.04)');
  grad.addColorStop(0.50, 'rgba(0,0,0, 0.12)');
  grad.addColorStop(0.75, 'rgba(0,0,0, 0.22)');
  grad.addColorStop(1.00, 'rgba(0,0,0, 0.30)');

  ctx.fillStyle = grad;

  // We assume the context path is already clipped to the wall + cutouts (even-odd rule)
  // Bounding box of the wall:
  let boxMinX = Infinity, boxMinY = Infinity, boxMaxX = -Infinity, boxMaxY = -Infinity;
  for (let i = 0; i < scaledWallPoints.length; i += 2) {
    boxMinX = Math.min(boxMinX, scaledWallPoints[i]);
    boxMinY = Math.min(boxMinY, scaledWallPoints[i + 1]);
    boxMaxX = Math.max(boxMaxX, scaledWallPoints[i]);
    boxMaxY = Math.max(boxMaxY, scaledWallPoints[i + 1]);
  }

  // Fill the bounding box with the gradient
  ctx.fillRect(boxMinX, boxMinY, boxMaxX - boxMinX, boxMaxY - boxMinY);
  ctx.restore();
}
