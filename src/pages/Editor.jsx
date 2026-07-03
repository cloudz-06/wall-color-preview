import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '../store/editorStore'
import EditorCanvas from '../components/canvas/EditorCanvas'
import ToolPanel from '../components/canvas/ToolPanel'
import ColorPanel from '../components/panels/ColorPanel'
import WallpaperPanel from '../components/panels/WallpaperPanel'
import ProcessingOverlay from '../components/ui/ProcessingOverlay'
import BeforeAfterSlider from '../components/comparison/BeforeAfterSlider'
import InlineEdit from '../components/ui/InlineEdit'
import { generateCompositeDataURL } from '../hooks/useCanvasComposite'
import { downloadDataURL } from '../utils/downloadUtils'
import { useSoundEffects } from '../hooks/useSoundEffects'
import confetti from 'canvas-confetti'

const PANEL_TABS = [
  { id: 'color', label: '🎨 Colors' },
  { id: 'wallpaper', label: '🖼️ Wallpaper' },
]

export default function Editor() {
  const navigate = useNavigate()
  const canvasContainerRef = useRef(null)
  const {
    image, imageWidth, imageHeight,
    walls, activeWallId, activeCutoutId,
    windows, activeWindowId,
    activeTool, variations,
    activePanel, setActivePanel,
    projectName, setProjectName,
    saveVariation, updateVariation, editingVariationId,
    soundEnabled, toggleSound
  } = useEditorStore()

  const { playSuccess, playClick } = useSoundEffects()

  const [mode, setMode] = useState('editor') // 'editor' | 'compare'
  const [compositeUrl, setCompositeUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [errorToast, setErrorToast] = useState(null)
  const [downloadToast, setDownloadToast] = useState(false)
  const [showCredits, setShowCredits] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  const closedWallsCount = walls.filter(w => w.closed).length

  // Redirect if no image
  useEffect(() => {
    if (!image) navigate('/')
  }, [image, navigate])

  // Track container size for before/after slider
  useEffect(() => {
    if (!canvasContainerRef.current) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    obs.observe(canvasContainerRef.current)
    return () => obs.disconnect()
  }, [])

  const generatePreview = useCallback(async () => {
    if (!image) return null
    setIsGenerating(true)
    try {
      const url = await generateCompositeDataURL(image, imageWidth, imageHeight, walls, windows)
      setCompositeUrl(url)
      return url
    } catch (err) {
      console.error('Composite generation failed:', err)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [image, imageWidth, imageHeight, walls, windows])

  const handleCompare = useCallback(async () => {
    if (mode === 'compare') {
      setMode('editor')
      return
    }
    await generatePreview()
    setMode('compare')
  }, [mode, generatePreview])

  const handleSave = useCallback(async () => {
    if (closedWallsCount === 0 || isSaving) return
    setIsSaving(true)
    playClick()
    try {
      const url = await generateCompositeDataURL(image, imageWidth, imageHeight, walls, windows)
      if (url) {
        // If we loaded an existing variation for editing, update it in place.
        // Otherwise append a brand-new variation to the gallery.
        if (editingVariationId) {
          updateVariation(editingVariationId, url)
        } else {
          saveVariation(url)
        }
        setSavedToast(true)
        playSuccess()
        setTimeout(() => setSavedToast(false), 4000)
      } else {
        throw new Error('Preview generation failed')
      }
    } catch (err) {
      console.error('Save failed:', err)
      setErrorToast('Could not save — please try again.')
      setTimeout(() => setErrorToast(null), 4000)
    } finally {
      setIsSaving(false)
    }
  }, [closedWallsCount, isSaving, image, imageWidth, imageHeight, walls, windows, editingVariationId, saveVariation, updateVariation, playClick, playSuccess])

  const handleDownload = useCallback(async () => {
    const url = await generateCompositeDataURL(image, imageWidth, imageHeight, walls, windows)
    if (url) {
      downloadDataURL(url, 'wall-preview')
      
      // Fire celebration confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4813A', '#4F7C7B', '#FFFFFF'] // Brand colors
      })
      
      // Show credits toast on first download
      if (!sessionStorage.getItem('wp_downloaded')) {
        sessionStorage.setItem('wp_downloaded', 'true')
        setDownloadToast(true)
        setTimeout(() => setDownloadToast(false), 5000) // Show for 5s
      }
    }
  }, [image, imageWidth, imageHeight, walls, windows])

  if (!image) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="h-screen flex flex-col bg-sand-50 overflow-hidden"
    >
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-sand-100 shadow-sm flex-shrink-0">
        {/* Back */}
        <button
          id="back-to-home"
          onClick={() => navigate('/')}
          className="btn-ghost py-1.5 px-3 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>

        {/* Logo and Project Name */}
        <div className="flex items-center gap-2 border-l border-sand-200 pl-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs shrink-0">W</div>
          <span className="font-display font-600 text-gray-800 text-sm hidden sm:block truncate max-w-[200px]">
            <InlineEdit 
              value={projectName} 
              onSave={setProjectName} 
            />
          </span>
        </div>

        <div className="flex-1" />

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="text-gray-400 hover:text-brand-500 transition-colors px-2"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5 11h4l5-5v12l-5-5H5z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          )}
        </button>

        {/* Wall count badge */}
        {walls.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {closedWallsCount}/{walls.length} wall{walls.length !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Compare toggle */}
        <motion.button
          id="toggle-compare"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCompare}
          disabled={isGenerating}
          className={`btn-secondary text-sm py-2 ${mode === 'compare' ? 'border-brand-400 text-brand-600' : ''}`}
        >
          {isGenerating ? (
            <span className="animate-pulse-soft">Generating…</span>
          ) : mode === 'compare' ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Back to Editor
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Before / After
            </>
          )}
        </motion.button>

        {/* Save */}
        <motion.button
          id="save-variation"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={isSaving || closedWallsCount === 0}
          className="btn-secondary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? '…' : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </motion.button>

        {/* Session Indicator */}
        {variations.length > 0 && (
          <div 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-lg text-brand-700 text-sm font-medium cursor-default"
            title={`${variations.length} options saved this session`}
          >
            <span>🖼️</span>
            {variations.length} saved
          </div>
        )}

        {/* Download */}
        <motion.button
          id="download-preview"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          disabled={closedWallsCount === 0}
          className="btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="hidden sm:inline">Download</span>
        </motion.button>

        {/* Gallery */}
        <button
          id="go-to-gallery"
          onClick={() => navigate('/gallery', { state: { from: 'editor' } })}
          className="btn-ghost text-sm py-2"
          title="Gallery"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div ref={canvasContainerRef} className="flex-1 relative overflow-hidden bg-gray-100">
          <AnimatePresence mode="wait">
            {mode === 'compare' && compositeUrl ? (
              <motion.div
                key="compare"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <BeforeAfterSlider
                  beforeSrc={image}
                  afterSrc={compositeUrl}
                  width={containerSize.width - 32}
                  height={containerSize.height - 32}
                />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <EditorCanvas containerRef={canvasContainerRef} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating tool panel */}
          {mode === 'editor' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <ToolPanel />
            </div>
          )}

          {/* Contextual hints */}
          {mode === 'editor' && walls.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel rounded-2xl text-sm text-gray-600 pointer-events-none whitespace-nowrap"
            >
              👆 Click <strong>+</strong> in the toolbar to add a wall, then click to draw its outline
            </motion.div>
          )}

          {mode === 'editor' && walls.length > 0 && !walls.find(w => w.id === activeWallId)?.closed && activeTool === 'polygon' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel rounded-2xl text-sm text-gray-600 pointer-events-none"
            >
              Click to add points · Double-click or click the first point to close
            </motion.div>
          )}
          
          {mode === 'editor' && activeTool === 'window' && !windows?.find(w => w.id === activeWindowId)?.closed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel rounded-2xl text-sm text-blue-600 border border-blue-200 pointer-events-none"
            >
              Click to draw a window (for lighting) · Double-click to close
            </motion.div>
          )}

          {mode === 'editor' && activeTool === 'cutout' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl text-sm font-medium pointer-events-none flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}
            >
              <span>✂️</span>
              {activeCutoutId
                ? 'Trace the area to exclude (frame, furniture, window…) · Double-click to finish'
                : 'Select a closed wall first, then click ✂️ again to start tracing'}
            </motion.div>
          )}
        </div>

        {/* Right panel */}
        <motion.aside
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="w-72 lg:w-80 flex-shrink-0 bg-white border-l border-sand-100 flex flex-col overflow-hidden shadow-lg"
        >
          {/* Tabs */}
          <div className="flex border-b border-sand-100">
            {PANEL_TABS.map(tab => (
              <button
                key={tab.id}
                id={`panel-tab-${tab.id}`}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors duration-150 relative ${
                  activePanel === tab.id
                    ? 'text-brand-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activePanel === tab.id && (
                  <motion.div
                    layoutId="panel-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <AnimatePresence mode="wait">
              {activePanel === 'color' && (
                <motion.div
                  key="color"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ColorPanel />
                </motion.div>
              )}
              
              {activePanel === 'wallpaper' && (
                <motion.div
                  key="wallpaper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <WallpaperPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-sm font-medium shadow-xl flex items-center gap-2 z-[60] whitespace-nowrap"
          >
            <span className="text-green-400">✓</span>
            Variation saved to gallery
            <button
              onClick={() => navigate('/gallery', { state: { from: 'editor' } })}
              className="ml-2 text-brand-300 hover:text-brand-200 font-medium transition-colors"
            >
              View →
            </button>
          </motion.div>
        )}
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-600 text-white rounded-2xl text-sm font-medium shadow-xl flex items-center gap-2 z-[60]"
          >
            <span>⚠️</span>
            {errorToast}
          </motion.div>
        )}
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 px-5 py-4 glass-panel rounded-2xl text-sm font-medium shadow-xl flex items-center gap-4 z-[60] border-brand-200"
          >
            <div>
              <div className="font-display font-600 text-gray-900 text-base mb-0.5">Like your new walls? 🎨</div>
              <div className="text-gray-500 font-normal">This free tool was built by <span className="text-brand-600 font-medium">Nandhagopan Babu</span>.</div>
            </div>
            <a
              href="https://b06e88d7.cloudz06.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-2 px-4 text-xs whitespace-nowrap"
            >
              Visit Portfolio
            </a>
            <button onClick={() => setDownloadToast(false)} className="text-gray-400 hover:text-gray-600 ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <ProcessingOverlay isVisible={isGenerating || isSaving} />
    </motion.div>
  )
}
