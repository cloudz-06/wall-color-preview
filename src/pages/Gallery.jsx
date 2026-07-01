import { useState, Component } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '../store/editorStore'
import { downloadDataURL } from '../utils/downloadUtils'
import CreditsModal from '../components/ui/CreditsModal'
import InlineEdit from '../components/ui/InlineEdit'

// ─── Per-card error boundary ───────────────────────────────────────────────
// Framer Motion's AnimatePresence can swallow errors thrown during animated
// renders, preventing them from reaching the top-level ErrorBoundary and
// leaving the page as a white screen. This boundary catches them locally.
class CardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="panel-card p-4 flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[160px]">
          <span className="text-2xl">⚠️</span>
          <p className="text-xs text-center">Could not display this variation.</p>
          <button
            onClick={() => this.props.onDelete?.()}
            className="text-xs text-red-400 hover:text-red-600 underline mt-1"
          >
            Remove
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Safe date formatter ───────────────────────────────────────────────────
// new Date(undefined) → "Invalid Date" → toLocaleTimeString() throws RangeError
function safeTimeString(isoString) {
  try {
    if (!isoString) return ''
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// ─── Gallery page ─────────────────────────────────────────────────────────
export default function Gallery() {
  const navigate = useNavigate()
  const location = useLocation()
  // Determine where the user came from via React Router navigation state.
  // The Editor passes { state: { from: 'editor' } } on every navigate('/gallery').
  // If state is absent (direct URL load, page refresh, or navigation from Landing)
  // we default to Home so users are never stranded on an invalid route.
  const fromEditor = location.state?.from === 'editor'

  // Defensive: ensure variations is always an array even if store misbehaves
  const { variations: rawVariations, deleteVariation, loadVariation, clearVariations, renameVariation, image } = useEditorStore()
  const variations = Array.isArray(rawVariations) ? rawVariations : []

  const [showCredits, setShowCredits] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleDownloadAll = async () => {
    if (variations.length === 0) return
    try {
      const { downloadZip } = await import('../utils/downloadUtils')
      const items = variations
        .filter(v => v?.snapshot)
        .map((v, i) => ({
          dataURL: v.snapshot,
          filename: `wall-variation-${i + 1}.png`,
        }))
      if (items.length > 0) await downloadZip(items, 'wall-variations')
    } catch (err) {
      console.error('Download all failed:', err)
    }
  }

  const handleEdit = (varId) => {
    try {
      loadVariation(varId)
    } catch (err) {
      console.error('Load variation failed:', err)
    }
    navigate('/editor')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-sand-50"
    >
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-sand-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            id="gallery-back"
            onClick={() => navigate(fromEditor ? '/editor' : '/')}
            className="btn-ghost py-1.5 px-3 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {fromEditor ? 'Back to Editor' : 'Back to Home'}
          </button>

          <div className="flex items-center gap-1.5 border-l border-sand-200 pl-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs">W</div>
            <span className="font-display font-600 text-gray-800">Gallery</span>
          </div>

          <div className="flex-1" />

          {variations.length > 0 && (
            <div className="flex items-center gap-2">
              <motion.button
                id="clear-all-designs"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowClearConfirm(true)}
                className="btn-ghost text-sm py-2 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </motion.button>

              <motion.button
                id="download-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownloadAll}
                className="btn-primary text-sm py-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All ({variations.length})
              </motion.button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {variations.length === 0 ? (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-sand-100 flex items-center justify-center text-4xl mb-6">
              🖼️
            </div>
            <h2 className="font-display font-600 text-2xl text-gray-700 mb-3">No saved designs yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              Head to the editor, select a wall, pick a color, then click <strong>Save</strong> to add it here.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(fromEditor ? '/editor' : '/')}
              className="btn-primary"
            >
              {fromEditor ? 'Back to Editor' : 'Upload a Photo'}
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="font-display font-700 text-3xl text-gray-900">Your Variations</h1>
                <p className="text-gray-500 mt-1">
                  {variations.length} {variations.length === 1 ? 'option' : 'options'} saved this session
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {variations.map((v, i) => {
                  // Skip entirely malformed entries (no id = unusable)
                  if (!v || !v.id) return null
                  return (
                    <CardErrorBoundary key={v.id} onDelete={() => deleteVariation(v.id)}>
                      <VariationCard
                        variation={v}
                        index={i}
                        onEdit={() => handleEdit(v.id)}
                        onDownload={() => v.snapshot && downloadDataURL(v.snapshot, `wall-variation-${i + 1}`)}
                        onDelete={() => deleteVariation(v.id)}
                        onRename={(newName) => renameVariation(v.id, newName)}
                      />
                    </CardErrorBoundary>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Footer Credits */}
      <footer className="py-6 text-center text-sm text-gray-400">
        <button
          onClick={() => setShowCredits(true)}
          className="hover:text-brand-500 transition-colors"
        >
          Made with ♥ by Nandhagopan Babu
        </button>
      </footer>

      <CreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} />

      {/* ── Clear-all confirmation dialog ────────────────────── */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
            />

            {/* Dialog */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full pointer-events-auto border border-sand-100 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-40" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-sand-100 rounded-full blur-3xl opacity-40" />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-5">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>

                  <h3 className="font-display font-700 text-xl text-gray-900 mb-2">Clear all designs?</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-7">
                    This will permanently delete all&nbsp;
                    <span className="font-semibold text-gray-700">{variations.length} saved {variations.length === 1 ? 'design' : 'designs'}</span>.
                    This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <button
                      id="cancel-clear-all"
                      onClick={() => setShowClearConfirm(false)}
                      className="btn-ghost flex-1 py-2.5 text-sm"
                    >
                      Cancel
                    </button>
                    <motion.button
                      id="confirm-clear-all"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        clearVariations()
                        setShowClearConfirm(false)
                      }}
                      className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      Yes, clear all
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Variation card ────────────────────────────────────────────────────────
function VariationCard({ variation: v, index: i, onEdit, onDownload, onDelete, onRename }) {
  // Defensive: wall list must be an array
  const walls = Array.isArray(v.walls) ? v.walls : []
  const closedWalls = walls.filter(w => w && w.closed)

  return (
    <motion.div
      id={`variation-card-${v.id}`}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ delay: i * 0.06, duration: 0.35, type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ y: -6 }}
      className="panel-card overflow-hidden group cursor-pointer"
      onClick={onEdit}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {v.snapshot ? (
          <img
            src={v.snapshot}
            alt={`Variation ${i + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🖼️</div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-800 shadow">
              Edit →
            </div>
          </div>
        </div>

        {/* Number badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
          #{i + 1}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        {/* Project Name */}
        <div className="mb-3 font-display font-600 text-gray-800 text-sm truncate">
          <InlineEdit 
            value={v.projectName || 'Untitled Project'} 
            onSave={onRename} 
          />
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {/* Wall color swatches */}
            <div className="flex gap-1">
            {closedWalls.slice(0, 4).map(w => (
              <div
                key={w.id ?? Math.random()}
                className="w-4 h-4 rounded-sm border border-black/10 shadow-sm flex-shrink-0"
                style={{ backgroundColor: w.color ?? '#F5E6D0' }}
                title={w.color ?? ''}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {closedWalls.length} wall{closedWalls.length !== 1 ? 's' : ''}
          </span>
        </div>
        </div>
        
        {/* Safe date: never throws even if createdAt is missing/malformed */}
        {safeTimeString(v.createdAt) && (
          <p className="text-xs text-gray-400">{safeTimeString(v.createdAt)}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <button
            id={`edit-variation-${v.id}`}
            onClick={onEdit}
            className="btn-secondary text-xs py-1.5 px-3 flex-1"
          >
            Edit
          </button>
          <button
            id={`download-variation-${v.id}`}
            onClick={onDownload}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Download PNG"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            id={`delete-variation-${v.id}`}
            onClick={onDelete}
            className="btn-ghost text-xs py-1.5 px-3 text-red-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
