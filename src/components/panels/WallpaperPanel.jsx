import { useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '../../store/editorStore'
import { generatePattern } from '../../utils/patternUtils'

const BUILT_IN_PATTERNS = [
  { id: 'linen',      label: 'Linen',       emoji: '🪡' },
  { id: 'brick',      label: 'Brick',       emoji: '🧱' },
  { id: 'herringbone',label: 'Herringbone', emoji: '🔷' },
  { id: 'marble',     label: 'Marble',      emoji: '⬜' },
  { id: 'concrete',   label: 'Concrete',    emoji: '🏗️' },
  { id: 'geometric',  label: 'Geometric',   emoji: '🔶' },
  { id: 'wood',       label: 'Wood',        emoji: '🪵' },
  { id: 'floral',     label: 'Floral',      emoji: '🌸' },
]

export default function WallpaperPanel() {
  const { walls, activeWallId, updateWall } = useEditorStore()
  const activeWall = walls.find(w => w.id === activeWallId)
  const fileInputRef = useRef(null)

  // Generate pattern previews (memoized)
  const patternPreviews = useMemo(() => {
    const previews = {}
    BUILT_IN_PATTERNS.forEach(p => {
      previews[p.id] = generatePattern(p.id, 64)
    })
    return previews
  }, [])

  const applyWallpaper = useCallback((url) => {
    if (!activeWallId) return
    updateWall(activeWallId, { wallpaperUrl: url, mode: 'wallpaper' })
  }, [activeWallId, updateWall])

  const applyBuiltIn = useCallback((patternId) => {
    const url = generatePattern(patternId, 120)
    applyWallpaper(url)
  }, [applyWallpaper])

  const handleCustomUpload = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => applyWallpaper(e.target.result)
    reader.readAsDataURL(file)
  }, [applyWallpaper])

  const clearWallpaper = useCallback(() => {
    if (!activeWallId) return
    updateWall(activeWallId, { wallpaperUrl: null, mode: 'color' })
  }, [activeWallId, updateWall])

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="panel-section">
        <p className="text-xs text-gray-400">Apply wallpaper to the selected wall area</p>
      </div>

      {/* Built-in patterns */}
      <div className="panel-section">
        <p className="text-xs font-medium text-gray-400 mb-2">Built-in Textures</p>
        <div className="grid grid-cols-4 gap-2">
          {BUILT_IN_PATTERNS.map((p) => {
            const isActive = activeWall?.wallpaperUrl === generatePattern(p.id, 120)
            return (
              <motion.button
                key={p.id}
                id={`pattern-${p.id}`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => applyBuiltIn(p.id)}
                className={`
                  flex flex-col items-center gap-1 rounded-xl overflow-hidden border-2 cursor-pointer
                  transition-all duration-150
                  ${isActive ? 'border-brand-500 shadow-glow' : 'border-transparent hover:border-sand-300'}
                `}
                title={p.label}
              >
                <img
                  src={patternPreviews[p.id]}
                  alt={p.label}
                  className="w-full aspect-square object-cover"
                />
                <span className="text-xs text-gray-500 pb-1 font-medium truncate w-full text-center px-1">{p.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Custom upload */}
      <div className="panel-section">
        <p className="text-xs font-medium text-gray-400 mb-2">Custom Pattern</p>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-sand-300 rounded-xl p-4 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all duration-200"
        >
          <div className="text-2xl mb-1">🖼️</div>
          <p className="text-xs font-medium text-gray-600">Upload your pattern</p>
          <p className="text-xs text-gray-400">JPG, PNG · any size</p>
        </motion.div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleCustomUpload(e.target.files[0])}
        />
      </div>

      {/* Scale / Opacity controls */}
      {activeWall?.wallpaperUrl && (
        <div className="panel-section">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Scale</span>
            <span className="text-xs font-mono text-gray-500">{activeWall.wallpaperScale?.toFixed(1) ?? 1}×</span>
          </div>
          <input
            id="wallpaper-scale-slider"
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={activeWall.wallpaperScale ?? 1}
            onChange={e => updateWall(activeWallId, { wallpaperScale: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer mb-3"
          />

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Opacity</span>
            <span className="text-xs font-mono text-gray-500">{Math.round((activeWall.wallpaperOpacity ?? 0.85) * 100)}%</span>
          </div>
          <input
            id="wallpaper-opacity-slider"
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={activeWall.wallpaperOpacity ?? 0.85}
            onChange={e => updateWall(activeWallId, { wallpaperOpacity: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer mb-3"
          />

          <button
            id="clear-wallpaper"
            onClick={clearWallpaper}
            className="btn-ghost text-xs w-full justify-center text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Remove Wallpaper
          </button>
        </div>
      )}

      {!activeWallId && (
        <div className="panel-section py-6 text-center">
          <p className="text-sm text-gray-400">Select or add a wall first</p>
        </div>
      )}
    </div>
  )
}
