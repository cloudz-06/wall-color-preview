import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HexColorPicker } from 'react-colorful'
import { useEditorStore } from '../../store/editorStore'
import { parseHexInput, getComplementaryColors } from '../../utils/colorUtils'
import { useSoundEffects } from '../../hooks/useSoundEffects'

// Curated paint color palette organized by family
const SWATCH_GROUPS = [
  {
    label: 'Whites & Creams',
    swatches: ['#FFFFFF', '#FAF8F3', '#F5F0E8', '#EDE8DC', '#E5DDD0', '#DDD3C0'],
  },
  {
    label: 'Warm Neutrals',
    swatches: ['#D4C4B0', '#C8B49A', '#B8A080', '#A08060', '#886040', '#705030'],
  },
  {
    label: 'Cool Grays',
    swatches: ['#E8E8E8', '#D0D0D0', '#B0B0B0', '#909090', '#707070', '#505050'],
  },
  {
    label: 'Sage & Olive',
    swatches: ['#D8E0D0', '#B8C8B0', '#98B090', '#789870', '#587850', '#3A5A38'],
  },
  {
    label: 'Blues & Teals',
    swatches: ['#D0DCE8', '#A8C0D4', '#7098B8', '#3870A0', '#1A5080', '#0A3060'],
  },
  {
    label: 'Dusty Rose',
    swatches: ['#F0D8D8', '#DEB8B8', '#C89898', '#B07878', '#905858', '#703838'],
  },
  {
    label: 'Terracotta',
    swatches: ['#F0C8A8', '#E0A880', '#C88850', '#A86830', '#884820', '#683010'],
  },
  {
    label: 'Lavender',
    swatches: ['#E8E0F0', '#D0C0E0', '#B0A0D0', '#9080B8', '#7060A0', '#504080'],
  },
  {
    label: 'Navy & Indigo',
    swatches: ['#C8D0E0', '#9098C0', '#6070A8', '#384888', '#203068', '#10204A'],
  },
  {
    label: 'Deep Jewels',
    swatches: ['#1a3a2a', '#1a2a3a', '#2a1a3a', '#3a1a2a', '#2a2a1a', '#1a1a3a'],
  },
]

export default function ColorPanel() {
  const { walls, activeWallId, updateWall } = useEditorStore()
  const activeWall = walls.find(w => w.id === activeWallId)
  const currentColor = activeWall?.color ?? '#F5E6D0'

  const [hexInput, setHexInput] = useState(currentColor)
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredColor, setHoveredColor] = useState(null)
  const { playPop } = useSoundEffects()

  const applyColor = useCallback((color) => {
    if (!activeWallId) return
    updateWall(activeWallId, { color, mode: 'color' })
    setHexInput(color)
    playPop()
  }, [activeWallId, updateWall, playPop])

  const handleHexSubmit = useCallback((e) => {
    e.preventDefault()
    const parsed = parseHexInput(hexInput)
    if (parsed) applyColor(parsed)
  }, [hexInput, applyColor])

  const handleSurpriseMe = useCallback(() => {
    // Pick a random swatch group and random swatch
    const group = SWATCH_GROUPS[Math.floor(Math.random() * SWATCH_GROUPS.length)]
    const color = group.swatches[Math.floor(Math.random() * group.swatches.length)]
    applyColor(color)
  }, [applyColor])

  const displayColor = hoveredColor ?? currentColor
  const suggestedColors = useMemo(() => getComplementaryColors(currentColor), [currentColor])

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      {/* Current color preview */}
      <div className="panel-section">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl shadow-md border border-black/10 flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: displayColor }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setShowPicker(s => !s)}
            animate={{ backgroundColor: displayColor }}
            transition={{ duration: 0.2 }}
          />
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Current Color</p>
            <p className="font-mono text-sm font-medium text-gray-800 uppercase">{displayColor}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleSurpriseMe}
              className="text-xs flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium hover:bg-amber-200 transition-colors"
              title="Surprise Me"
            >
              🎲 Random
            </button>
            <button
              id="toggle-color-picker"
              onClick={() => setShowPicker(s => !s)}
              className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              {showPicker ? 'Close' : 'Custom'}
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Colors (Pairs well with) */}
      <div className="panel-section bg-sand-100/50 border-y border-sand-200/50">
        <p className="text-xs font-medium text-gray-500 mb-2">Pairs well with</p>
        <div className="flex gap-2">
          {suggestedColors.map((color, i) => (
            <motion.button
              key={i}
              className="w-8 h-8 rounded-lg shadow-sm border border-black/5 cursor-pointer relative"
              style={{ backgroundColor: color }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => applyColor(color)}
              onMouseEnter={() => setHoveredColor(color)}
              onMouseLeave={() => setHoveredColor(null)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom color picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="panel-section">
              <HexColorPicker
                color={currentColor}
                onChange={applyColor}
              />
              <form onSubmit={handleHexSubmit} className="flex gap-2 mt-3">
                <input
                  id="hex-color-input"
                  className="input-field flex-1"
                  value={hexInput}
                  onChange={e => setHexInput(e.target.value)}
                  placeholder="#F5E6D0"
                  maxLength={7}
                />
                <button type="submit" className="btn-primary py-2 px-3 text-sm rounded-lg">Apply</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opacity control */}
      {activeWall && (
        <div className="panel-section">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Opacity</span>
            <span className="text-xs font-mono text-gray-500">{Math.round((activeWall.opacity ?? 0.6) * 100)}%</span>
          </div>
          <input
            id="wall-opacity-slider"
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={activeWall.opacity ?? 0.6}
            onChange={e => updateWall(activeWallId, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>
      )}

      {/* Swatch groups */}
      <div className="overflow-y-auto flex-1 hide-scrollbar">
        {SWATCH_GROUPS.map((group, gi) => (
          <div key={group.label} className="panel-section">
            <p className="text-xs font-medium text-gray-400 mb-2">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.swatches.map((color) => (
                <motion.button
                  key={color}
                  id={`swatch-${color.replace('#', '')}`}
                  className={`swatch-btn ${currentColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color, borderColor: currentColor === color ? '#374151' : 'transparent' }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => applyColor(color)}
                  onMouseEnter={() => setHoveredColor(color)}
                  onMouseLeave={() => setHoveredColor(null)}
                  title={color}
                >
                  {currentColor === color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full rounded-md flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!activeWallId && (
        <div className="panel-section py-6 text-center">
          <p className="text-sm text-gray-400">Select or add a wall to apply colors</p>
        </div>
      )}
    </div>
  )
}
