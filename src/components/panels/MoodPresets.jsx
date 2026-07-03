import { motion } from 'framer-motion'
import { useEditorStore } from '../../store/editorStore'
import { useSoundEffects } from '../../hooks/useSoundEffects'

const MOODS = [
  {
    id: 'cozy',
    label: 'Cozy & Warm',
    desc: 'Soft neutrals and warm undertones',
    colors: ['#FAF8F3', '#E8C8A0', '#D4C4B0', '#C8A878', '#8B7355'],
    gradient: 'from-amber-100 to-[#D4C4B0]',
  },
  {
    id: 'modern',
    label: 'Modern Minimal',
    desc: 'Crisp whites and cool grays',
    colors: ['#FFFFFF', '#E8E8E8', '#D0D0D0', '#B0B0B0', '#505050'],
    gradient: 'from-gray-50 to-gray-200',
  },
  {
    id: 'coastal',
    label: 'Coastal Breezy',
    desc: 'Light teals and ocean blues',
    colors: ['#D0DCE8', '#A8C0D4', '#7098B8', '#C8D4D0', '#E5DDD0'],
    gradient: 'from-cyan-50 to-[#A8C0D4]',
  },
  {
    id: 'bold',
    label: 'Bold & Moody',
    desc: 'Deep jewels and dark accents',
    colors: ['#10204A', '#1a3a2a', '#2a1a3a', '#3a1a2a', '#384888'],
    gradient: 'from-purple-900 to-[#1a1a3a]',
    textDark: true,
  },
  {
    id: 'earthy',
    label: 'Earthy Green',
    desc: 'Natural sage and olive tones',
    colors: ['#D8E0D0', '#B8C8B0', '#98B090', '#789870', '#3A5A38'],
    gradient: 'from-green-100 to-[#789870]',
  },
  {
    id: 'terracotta',
    label: 'Desert Sunset',
    desc: 'Warm clays and baked earth',
    colors: ['#F0C8A8', '#E0A880', '#C88850', '#A86830', '#683010'],
    gradient: 'from-orange-100 to-[#C88850]',
  }
]

export default function MoodPresets() {
  const { walls, activeWallId, updateWall } = useEditorStore()
  const activeWall = walls.find(w => w.id === activeWallId)
  const { playPop } = useSoundEffects()

  const applyMood = (color) => {
    if (!activeWallId) return
    updateWall(activeWallId, { color, mode: 'color' })
    playPop()
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      <div className="panel-section bg-sand-50/50">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Curated Vibes</h3>
        <p className="text-xs text-gray-500">Not sure where to start? Try these instant atmosphere presets.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {MOODS.map((mood, i) => (
          <motion.div
            key={mood.id}
            className={`w-full text-left rounded-2xl p-4 shadow-sm border border-black/5 bg-gradient-to-br ${mood.gradient} relative overflow-hidden`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="relative z-10 mb-3">
              <h4 className={`font-display font-600 text-base ${mood.textDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                {mood.label}
              </h4>
              <p className={`text-xs ${mood.textDark ? 'text-white/80' : 'text-gray-600'}`}>
                {mood.desc}
              </p>
            </div>

            {/* Color Palette */}
            <div className="relative z-10 flex gap-2">
              {mood.colors.map(color => (
                <motion.button
                  key={color}
                  className="flex-1 aspect-square rounded-lg shadow-sm border border-black/10 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyMood(color)}
                  title={color}
                >
                  {activeWall?.mode === 'color' && activeWall?.color === color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {!activeWallId && (
        <div className="panel-section py-6 text-center border-t border-sand-100">
          <p className="text-sm text-gray-400">Select or add a wall first</p>
        </div>
      )}
    </div>
  )
}
