import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '../../store/editorStore'

const TOOLS = [
  {
    id: 'polygon',
    label: 'Draw Wall (P)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l8 14H4L12 4z" />
      </svg>
    ),
  },
  {
    id: 'cutout',
    label: 'Exclude Area (C) — mask out frames, furniture, etc.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {/* scissors icon */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M6 9a3 3 0 100-6 3 3 0 000 6zm0 0l7.5 7.5M6 9l2 11M18 15a3 3 0 100 6 3 3 0 000-6zm0 0L10.5 7.5M18 15l-2-11M5.5 5.5l13 13" />
      </svg>
    ),
    color: 'text-red-500',
    activeColor: 'bg-red-500 text-white shadow',
  },
  {
    id: 'pan',
    label: 'Pan / Zoom (H)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    ),
  },
]

export default function ToolPanel() {
  const {
    activeTool, setActiveTool,
    walls, activeWallId, activeCutoutId,
    addWall, deleteWall, setActiveWall,
    resetActiveWallPoints, undoLastPoint,
    addCutout, deleteLastCutout,
    updateWall,
  } = useEditorStore()

  const activeWall = walls.find(w => w.id === activeWallId)
  const wallIsClosed = activeWall?.closed ?? false

  const handleToolClick = useCallback((id) => {
    if (id === 'eraser') {
      if (activeWallId) resetActiveWallPoints()
    } else if (id === 'cutout') {
      setActiveTool('cutout')
      if (activeWallId && wallIsClosed) {
        addCutout() // immediately start a new cutout
      }
    } else {
      setActiveTool(id)
    }
  }, [setActiveTool, activeWallId, wallIsClosed, resetActiveWallPoints, addCutout])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="flex flex-col gap-1 p-2 panel-card rounded-2xl shadow-card-hover min-w-[3rem]"
    >
      {/* Main tools */}
      {TOOLS.map(tool => {
        const isActive = activeTool === tool.id
        const activeClass = tool.activeColor ?? 'bg-brand-500 text-white shadow-glow'
        return (
          <Tooltip key={tool.id} label={tool.label}>
            <button
              id={`tool-${tool.id}`}
              onClick={() => handleToolClick(tool.id)}
              className={`tool-btn ${isActive ? activeClass : (tool.color ?? '')}`}
            >
              {tool.icon}
            </button>
          </Tooltip>
        )
      })}

      <div className="my-1 border-t border-sand-100" />

      {/* Undo last point */}
      <Tooltip label="Undo Last Point (Backspace)">
        <button id="tool-undo" className="tool-btn" onClick={undoLastPoint}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      </Tooltip>

      {/* Delete last cutout */}
      {activeWall && (activeWall.cutouts?.length ?? 0) > 0 && (
        <Tooltip label="Remove Last Exclusion Zone">
          <button
            id="tool-delete-cutout"
            onClick={deleteLastCutout}
            className="tool-btn text-orange-400 hover:text-orange-600 hover:bg-orange-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </Tooltip>
      )}

      <div className="my-1 border-t border-sand-100" />

      {/* Add wall */}
      <Tooltip label="Add New Wall (+)">
        <button id="tool-add-wall" className="tool-btn" onClick={addWall}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </Tooltip>

      {/* Wall color swatches (select wall) */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto hide-scrollbar">
        {walls.map(wall => (
          <Tooltip key={wall.id} label={`${wall.label}${wall.closed ? ' ✓' : ' (drawing…)'}`}>
            <button
              id={`wall-select-${wall.id}`}
              onClick={() => { setActiveWall(wall.id); setActiveTool('polygon') }}
              className={`relative w-10 h-10 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                wall.id === activeWallId
                  ? 'border-brand-500 scale-105 shadow-glow'
                  : 'border-transparent hover:border-sand-300'
              }`}
              style={{ backgroundColor: wall.color }}
            >
              {wall.closed && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
              )}
              {/* Show cutout count badge */}
              {wall.closed && (wall.cutouts?.length ?? 0) > 0 && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-400 border-2 border-white text-white text-[8px] flex items-center justify-center font-bold">
                  {wall.cutouts.filter(c => c.closed).length}
                </span>
              )}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Delete active wall */}
      {activeWallId && (
        <Tooltip label="Delete Selected Wall">
          <button
            id="tool-delete-wall"
            className="tool-btn text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => deleteWall(activeWallId)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Tooltip>
      )}

      {/* Cutout hint when in cutout mode */}
      {activeTool === 'cutout' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-1 px-1 py-0.5 text-center"
        >
          <span className="text-[9px] text-red-400 font-medium leading-tight block">
            Tracing<br />exclusion
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

function Tooltip({ label, children }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 max-w-[200px]">
        {label}
      </div>
    </div>
  )
}
