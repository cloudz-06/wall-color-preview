import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Circle, Group, Shape } from 'react-konva'
import { useEditorStore } from '../../store/editorStore'
import { LIGHTING_PRESETS, drawLightingOverlays, hasLightingEffect } from '../../utils/lightingUtils'

const MIN_SCALE = 0.3
const MAX_SCALE = 5

/** Preloads wallpaper dataURL images into HTMLImageElements for Konva */
function useWallpaperImages(walls) {
  const [imageMap, setImageMap] = useState({})
  const loadingRef = useRef(new Set())

  useEffect(() => {
    walls.forEach(wall => {
      if (wall.mode !== 'wallpaper' || !wall.wallpaperUrl) return
      const url = wall.wallpaperUrl
      if (imageMap[url] || loadingRef.current.has(url)) return
      loadingRef.current.add(url)
      const img = new window.Image()
      img.onload = () => {
        setImageMap(prev => ({ ...prev, [url]: img }))
        loadingRef.current.delete(url)
      }
      img.src = url
    })
  }, [walls]) // eslint-disable-line

  return imageMap
}

/** Scale image-space points to stage-space */
function scalePoints(points, scale, pos) {
  const out = []
  for (let i = 0; i < points.length; i += 2) {
    out.push(points[i] * scale + pos.x, points[i + 1] * scale + pos.y)
  }
  return out
}

function useAnimatedLighting(lightingMode) {
  const [animatedValues, setAnimatedValues] = useState({
    tintR: 0, tintG: 0, tintB: 0, tintA: 0,
    screenA: 0,
    multiplyR: 255, multiplyG: 255, multiplyB: 255, multiplyA: 0,
    overlayR: 0, overlayG: 0, overlayB: 0, overlayA: 0
  })

  const currentRef = useRef({ ...animatedValues })
  const requestRef = useRef()
  const targetRef = useRef()

  const config = LIGHTING_PRESETS[lightingMode] || LIGHTING_PRESETS.neutral
  targetRef.current = config

  useEffect(() => {
    const start = performance.now()
    const duration = 400 // 400ms transition

    const startValues = { ...currentRef.current }

    const animate = (time) => {
      const elapsed = time - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out quad
      const ease = progress * (2 - progress)

      const next = {
        tintR: startValues.tintR + (config.tintR - startValues.tintR) * ease,
        tintG: startValues.tintG + (config.tintG - startValues.tintG) * ease,
        tintB: startValues.tintB + (config.tintB - startValues.tintB) * ease,
        tintA: startValues.tintA + (config.tintA - startValues.tintA) * ease,
        screenA: startValues.screenA + (config.screenA - startValues.screenA) * ease,
        multiplyR: startValues.multiplyR + (config.multiplyR - startValues.multiplyR) * ease,
        multiplyG: startValues.multiplyG + (config.multiplyG - startValues.multiplyG) * ease,
        multiplyB: startValues.multiplyB + (config.multiplyB - startValues.multiplyB) * ease,
        multiplyA: startValues.multiplyA + (config.multiplyA - startValues.multiplyA) * ease,
        overlayR: startValues.overlayR + (config.overlayR - startValues.overlayR) * ease,
        overlayG: startValues.overlayG + (config.overlayG - startValues.overlayG) * ease,
        overlayB: startValues.overlayB + (config.overlayB - startValues.overlayB) * ease,
        overlayA: startValues.overlayA + (config.overlayA - startValues.overlayA) * ease,
      }

      currentRef.current = next
      setAnimatedValues(next)

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate)
      }
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [lightingMode]) // eslint-disable-line

  return animatedValues
}

export default function EditorCanvas({ containerRef }) {
  const stageRef = useRef(null)
  const [konvaImage, setKonvaImage] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const {
    image, imageWidth, imageHeight,
    walls, activeWallId, activeCutoutId,
    activeTool,
    addPointToActiveWall, closeActiveWall,
    addPointToActiveCutout, closeActiveCutout,
    undoLastPoint,
    lightingMode,
  } = useEditorStore()

  const animatedLighting = useAnimatedLighting(lightingMode)
  const wallpaperImageMap = useWallpaperImages(walls)

  // Load base photo
  useEffect(() => {
    if (!image) return
    const img = new window.Image()
    img.src = image
    img.onload = () => setKonvaImage(img)
  }, [image])

  // Fit image to container
  useEffect(() => {
    if (!containerRef?.current || !imageWidth || !imageHeight) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setStageSize({ width, height })
      const fit = Math.min((width * 0.95) / imageWidth, (height * 0.95) / imageHeight, 1)
      setScale(fit)
      setPosition({
        x: (width - imageWidth * fit) / 2,
        y: (height - imageHeight * fit) / 2,
      })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [containerRef, imageWidth, imageHeight])

  // Backspace = undo last point
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Backspace') undoLastPoint() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undoLastPoint])

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const pointer = stage.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    }
    const direction = e.evt.deltaY < 0 ? 1 : -1
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + direction * 0.1))
    setScale(newScale)
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [scale, position])

  const toImageCoords = useCallback((sx, sy) => ({
    x: (sx - position.x) / scale,
    y: (sy - position.y) / scale,
  }), [position, scale])

  const handleStageClick = useCallback((e) => {
    const stage = stageRef.current
    const pos = stage.getPointerPosition()
    const imgCoords = toImageCoords(pos.x, pos.y)

    // ── CUTOUT mode ──────────────────────────────────────
    if (activeTool === 'cutout') {
      if (!activeWallId || !activeCutoutId) return
      const activeWall = walls.find(w => w.id === activeWallId)
      const cutout = activeWall?.cutouts.find(c => c.id === activeCutoutId)
      if (!cutout || cutout.closed) return

      // Close if clicking near first cutout point
      if (cutout.points.length >= 6) {
        const fx = cutout.points[0] * scale + position.x
        const fy = cutout.points[1] * scale + position.y
        if (Math.sqrt((pos.x - fx) ** 2 + (pos.y - fy) ** 2) < 12) {
          closeActiveCutout()
          return
        }
      }
      addPointToActiveCutout(imgCoords.x, imgCoords.y)
      return
    }

    // ── POLYGON mode ─────────────────────────────────────
    if (activeTool !== 'polygon') return
    if (!activeWallId) return
    const activeWall = walls.find(w => w.id === activeWallId)
    if (!activeWall || activeWall.closed) return

    // Close if clicking near first vertex
    if (activeWall.points.length >= 6) {
      const fx = activeWall.points[0] * scale + position.x
      const fy = activeWall.points[1] * scale + position.y
      if (Math.sqrt((pos.x - fx) ** 2 + (pos.y - fy) ** 2) < 12) {
        closeActiveWall()
        return
      }
    }
    addPointToActiveWall(imgCoords.x, imgCoords.y)
  }, [
    activeTool, activeWallId, activeCutoutId, walls, scale, position, toImageCoords,
    addPointToActiveWall, closeActiveWall,
    addPointToActiveCutout, closeActiveCutout,
  ])

  const handleDblClick = useCallback(() => {
    if (activeTool === 'polygon' && activeWallId) {
      const w = walls.find(x => x.id === activeWallId)
      if (w && !w.closed && w.points.length >= 6) closeActiveWall()
    }
    if (activeTool === 'cutout' && activeCutoutId) {
      const w = walls.find(x => x.id === activeWallId)
      const c = w?.cutouts.find(x => x.id === activeCutoutId)
      if (c && !c.closed && c.points.length >= 6) closeActiveCutout()
    }
  }, [activeTool, activeWallId, activeCutoutId, walls, closeActiveWall, closeActiveCutout])

  const handleMouseMove = useCallback((e) => {
    const pos = stageRef.current.getPointerPosition()
    setMousePos(pos ?? { x: 0, y: 0 })
  }, [])

  const isDraggable = activeTool === 'pan'
  const handleDragEnd = (e) => setPosition({ x: e.target.x(), y: e.target.y() })

  return (
    <div className="w-full h-full" style={{ cursor: getCursor(activeTool) }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onDblClick={handleDblClick}
        onMouseMove={handleMouseMove}
        draggable={isDraggable}
        onDragEnd={handleDragEnd}
        x={isDraggable ? undefined : 0}
        y={isDraggable ? undefined : 0}
      >
        {/* Layer 1: Base photo */}
        <Layer>
          {konvaImage && (
            <KonvaImage
              image={konvaImage}
              x={position.x}
              y={position.y}
              width={imageWidth * scale}
              height={imageHeight * scale}
            />
          )}
        </Layer>

        {/* Layer 2: Wall overlays with even-odd cutouts */}
        <Layer>
          {walls.map(wall => {
            if (!wall.points || wall.points.length < 6 || !wall.closed) return null
            const sp = scalePoints(wall.points, scale, position)
            const isWallpaper = wall.mode === 'wallpaper' && wall.wallpaperUrl
            const patternImg = isWallpaper ? wallpaperImageMap[wall.wallpaperUrl] : null

            // Collect closed cutout scaled points
            const closedCutouts = (wall.cutouts ?? [])
              .filter(c => c.closed && c.points.length >= 6)
              .map(c => scalePoints(c.points, scale, position))

            if (isWallpaper && patternImg) {
              return (
                <WallpaperShape
                  key={`wp-${wall.id}`}
                  scaledPoints={sp}
                  cutouts={closedCutouts}
                  patternImg={patternImg}
                  tileSize={120 * (wall.wallpaperScale ?? 1) * scale}
                  opacity={wall.wallpaperOpacity ?? 0.85}
                  animatedLighting={animatedLighting}
                />
              )
            }

            if (isWallpaper && !patternImg) {
              // Still loading
              return (
                <ColorShape
                  key={`wp-loading-${wall.id}`}
                  scaledPoints={sp}
                  cutouts={closedCutouts}
                  color="#e0c8a0"
                  opacity={0.3}
                  multiply={false}
                  animatedLighting={animatedLighting}
                />
              )
            }

            return (
              <ColorShape
                key={`col-${wall.id}`}
                scaledPoints={sp}
                cutouts={closedCutouts}
                color={wall.color ?? '#F5E6D0'}
                opacity={wall.opacity ?? 0.6}
                multiply
                animatedLighting={animatedLighting}
              />
            )
          })}
        </Layer>

        {/* Layer 3: Outlines, vertices, ghost lines, cutout outlines */}
        <Layer>
          {walls.map(wall => {
            if (!wall.points || wall.points.length < 2) return null
            const sp = scalePoints(wall.points, scale, position)
            const isActive = wall.id === activeWallId

            return (
              <Group key={`draw-${wall.id}`}>
                {/* Wall outline */}
                <Line
                  points={sp}
                  closed={wall.closed}
                  stroke={isActive ? '#d4813a' : '#94a3b8'}
                  strokeWidth={isActive ? 2 : 1.5}
                  dash={wall.closed ? [] : [6, 4]}
                  fill="transparent"
                  perfectDrawEnabled={false}
                />

                {/* Vertex dots (active open wall only) */}
                {isActive && !wall.closed && wall.points.map((_, idx) => {
                  if (idx % 2 !== 0) return null
                  const vx = wall.points[idx] * scale + position.x
                  const vy = wall.points[idx + 1] * scale + position.y
                  return (
                    <Circle key={idx} x={vx} y={vy}
                      radius={idx === 0 ? 7 : 4}
                      fill={idx === 0 ? '#d4813a' : 'white'}
                      stroke={idx === 0 ? 'white' : '#d4813a'}
                      strokeWidth={2}
                    />
                  )
                })}

                {/* Ghost line to cursor (polygon tool) */}
                {isActive && !wall.closed && activeTool === 'polygon' && wall.points.length >= 2 && (
                  <Line
                    points={[
                      wall.points[wall.points.length - 2] * scale + position.x,
                      wall.points[wall.points.length - 1] * scale + position.y,
                      mousePos.x, mousePos.y,
                    ]}
                    stroke="#d4813a" strokeWidth={1.5} dash={[4, 4]} opacity={0.6}
                    perfectDrawEnabled={false}
                  />
                )}

                {/* Cutout outlines */}
                {isActive && (wall.cutouts ?? []).map(cutout => {
                  if (!cutout.points || cutout.points.length < 2) return null
                  const cp = scalePoints(cutout.points, scale, position)
                  const isCutoutActive = cutout.id === activeCutoutId
                  return (
                    <Group key={`cutout-${cutout.id}`}>
                      <Line
                        points={cp}
                        closed={cutout.closed}
                        stroke={isCutoutActive ? '#ef4444' : '#f97316'}
                        strokeWidth={isCutoutActive ? 2 : 1.5}
                        dash={cutout.closed ? [] : [5, 3]}
                        fill={cutout.closed ? 'rgba(239,68,68,0.08)' : 'transparent'}
                        perfectDrawEnabled={false}
                      />
                      {/* Cutout vertex dots */}
                      {isCutoutActive && !cutout.closed && cutout.points.map((_, cidx) => {
                        if (cidx % 2 !== 0) return null
                        const cvx = cutout.points[cidx] * scale + position.x
                        const cvy = cutout.points[cidx + 1] * scale + position.y
                        return (
                          <Circle key={cidx} x={cvx} y={cvy}
                            radius={cidx === 0 ? 6 : 3}
                            fill={cidx === 0 ? '#ef4444' : 'white'}
                            stroke="#ef4444" strokeWidth={2}
                          />
                        )
                      })}
                      {/* Ghost line to cursor (cutout tool) */}
                      {isCutoutActive && !cutout.closed && activeTool === 'cutout' && cutout.points.length >= 2 && (
                        <Line
                          points={[
                            cutout.points[cutout.points.length - 2] * scale + position.x,
                            cutout.points[cutout.points.length - 1] * scale + position.y,
                            mousePos.x, mousePos.y,
                          ]}
                          stroke="#ef4444" strokeWidth={1.5} dash={[4, 4]} opacity={0.6}
                          perfectDrawEnabled={false}
                        />
                      )}
                    </Group>
                  )
                })}
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}

/**
 * Renders a solid color overlay with even-odd cutout holes.
 * Uses a custom Konva Shape sceneFunc so we can call ctx.fill('evenodd').
 */
function ColorShape({ scaledPoints, cutouts, color, opacity, multiply, animatedLighting }) {
  const sceneFunc = useCallback((ctx, shape) => {
    ctx.save()
    if (multiply) {
      ctx.globalCompositeOperation = 'multiply'
    }
    ctx.globalAlpha = opacity

    // Begin compound path: outer wall polygon + cutout sub-paths
    ctx.beginPath()
    tracePath(ctx, scaledPoints)
    for (const cp of cutouts) tracePath(ctx, cp)

    ctx.fillStyle = color
    ctx.fill('evenodd')  // even-odd rule punches holes where cutouts overlap

    // Apply animated lighting overlays clipped to wall shape only
    if (animatedLighting && hasLightingEffect(animatedLighting)) {
      ctx.beginPath()
      tracePath(ctx, scaledPoints)
      for (const cp of cutouts) tracePath(ctx, cp)
      ctx.clip('evenodd')

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < scaledPoints.length; i += 2) {
        minX = Math.min(minX, scaledPoints[i])
        minY = Math.min(minY, scaledPoints[i + 1])
        maxX = Math.max(maxX, scaledPoints[i])
        maxY = Math.max(maxY, scaledPoints[i + 1])
      }
      if (minX !== Infinity) {
        drawLightingOverlays(ctx, minX, minY, maxX - minX, maxY - minY, animatedLighting)
      }
    }

    ctx.restore()
  }, [scaledPoints, cutouts, color, opacity, multiply, animatedLighting])

  return (
    <Shape
      sceneFunc={sceneFunc}
      perfectDrawEnabled={false}
      listening={false}
    />
  )
}

/**
 * Renders a tiled wallpaper pattern with even-odd cutout holes.
 */
function WallpaperShape({ scaledPoints, cutouts, patternImg, tileSize, opacity, animatedLighting }) {
  const sceneFunc = useCallback((ctx, shape) => {
    ctx.save()

    // Build clipping path with even-odd cutouts
    ctx.beginPath()
    tracePath(ctx, scaledPoints)
    for (const cp of cutouts) tracePath(ctx, cp)
    ctx.clip('evenodd')

    // Draw tiled pattern
    const scaleX = tileSize / patternImg.naturalWidth
    const scaleY = tileSize / patternImg.naturalHeight
    const pattern = ctx.createPattern(patternImg, 'repeat')
    if (pattern) {
      const m = new DOMMatrix()
      m.scaleSelf(scaleX, scaleY)
      pattern.setTransform(m)
      ctx.globalAlpha = opacity
      ctx.fillStyle = pattern
      // Fill bounding box (clip handles the shape)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < scaledPoints.length; i += 2) {
        minX = Math.min(minX, scaledPoints[i])
        minY = Math.min(minY, scaledPoints[i + 1])
        maxX = Math.max(maxX, scaledPoints[i])
        maxY = Math.max(maxY, scaledPoints[i + 1])
      }
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
    }

    // Shadow preservation multiply pass
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#888888'
    ctx.fillRect(0, 0, 99999, 99999)

    // Apply animated lighting overlays inside the clipped wall region
    if (animatedLighting && hasLightingEffect(animatedLighting)) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < scaledPoints.length; i += 2) {
        minX = Math.min(minX, scaledPoints[i])
        minY = Math.min(minY, scaledPoints[i + 1])
        maxX = Math.max(maxX, scaledPoints[i])
        maxY = Math.max(maxY, scaledPoints[i + 1])
      }
      if (minX !== Infinity) {
        drawLightingOverlays(ctx, minX, minY, maxX - minX, maxY - minY, animatedLighting)
      }
    }

    ctx.restore()
  }, [scaledPoints, cutouts, patternImg, tileSize, opacity, animatedLighting])

  return (
    <Shape
      sceneFunc={sceneFunc}
      perfectDrawEnabled={false}
      listening={false}
    />
  )
}

function tracePath(ctx, points) {
  if (!points || points.length < 4) return
  ctx.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) {
    ctx.lineTo(points[i], points[i + 1])
  }
  ctx.closePath()
}

function getCursor(tool) {
  switch (tool) {
    case 'polygon': return 'crosshair'
    case 'cutout':  return 'cell'
    case 'eraser':  return 'not-allowed'
    case 'pan':     return 'grab'
    default:        return 'default'
  }
}
