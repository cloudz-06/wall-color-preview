import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useEditorStore } from '../store/editorStore'
import CreditsModal from '../components/ui/CreditsModal'
import ProjectNameModal from '../components/ui/ProjectNameModal'

const PAINT_SWATCHES = [
  '#FFFFFF', '#F5E6D0', '#EDD9B8', '#E8C8A0',
  '#D4B896', '#C8A878', '#8B7355', '#6B5040',
  '#E8E0D0', '#D0C8B8', '#B8B0A0', '#908880',
  '#C8D4D0', '#A0B4B0', '#6A9090', '#3D6060',
  '#D0D4C8', '#B0B8A8', '#7A8870', '#4A5848',
  '#D4C8D0', '#B4A8B8', '#8A7898', '#5A4870',
  '#D0C8C4', '#C0A8A0', '#A07868', '#7A4838',
  '#C8D0C8', '#A0B0A0', '#608060', '#386038',
]

const FEATURES = [
  { icon: '🎨', title: 'Real-time Color Preview',   desc: 'See paint colors on your walls instantly, with shadows and lighting preserved.' },
  { icon: '🖼️', title: 'Wallpaper Patterns',        desc: 'Try 8 built-in textures or upload your own pattern image.' },
  { icon: '✏️', title: 'Precise Wall Selection',    desc: 'Polygon and brush tools let you select exactly which walls to recolor.' },
  { icon: '🔀', title: 'Before / After Slider',     desc: 'Swipe to compare the original photo against your preview.' },
  { icon: '💾', title: 'Save Variations',           desc: 'Build a gallery of color options, then download them all at once.' },
  { icon: '📱', title: 'Works on Mobile',           desc: 'Stand in the room and try colors on your phone.' },
]

// Cascading interactive swatch strip
function SwatchStrip({ swatches }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [selectedIdx, setSelectedIdx] = useState(null)

  const getScale = (i) => {
    if (hoveredIdx === null) return 1
    const dist = Math.abs(i - hoveredIdx)
    if (dist === 0) return 1.32
    if (dist === 1) return 1.13
    if (dist === 2) return 1.05
    return 1
  }

  const getY = (i) => {
    if (hoveredIdx === null) return 0
    const dist = Math.abs(i - hoveredIdx)
    if (dist === 0) return -5
    if (dist === 1) return -2
    return 0
  }

  return (
    <div className="flex items-end gap-1.5 mb-8 flex-wrap" style={{ minHeight: 44 }}>
      {swatches.map((c, i) => {
        const isSelected = selectedIdx === i
        return (
          <motion.div
            key={c}
            className="relative rounded-md cursor-pointer flex-shrink-0"
            style={{
              backgroundColor: c,
              width: 24,
              height: 24,
              border: isSelected ? `2px solid ${c === '#FFFFFF' ? '#D4813A' : c}` : '1.5px solid rgba(0,0,0,0.07)',
              boxSizing: 'border-box',
            }}
            animate={{
              scale: getScale(i),
              y: getY(i),
              boxShadow: hoveredIdx === i
                ? `0 8px 24px ${c}80, 0 2px 8px rgba(0,0,0,0.12)`
                : isSelected
                  ? `0 0 0 3px ${c === '#FFFFFF' ? '#D4813A40' : c + '40'}, 0 2px 8px rgba(0,0,0,0.1)`
                  : '0 1px 3px rgba(0,0,0,0.08)',
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, mass: 0.7 }}
            onHoverStart={() => setHoveredIdx(i)}
            onHoverEnd={() => setHoveredIdx(null)}
            onTap={() => setSelectedIdx(i)}
            whileTap={{ scale: 0.88 }}
          >
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-md flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c === '#FFFFFF' ? '#D4813A' : 'rgba(255,255,255,0.9)' }}
                />
              </motion.div>
            )}
          </motion.div>
        )
      })}
      <motion.span
        className="text-sm text-gray-400 ml-1 self-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        +100s more
      </motion.span>
    </div>
  )
}

// Decorative floating swatch for the upload card
function FloatSwatch({ color, top, right, left, bottom, size, delay, mouseX, mouseY, speedX, speedY }) {
  const x = useTransform(mouseX, [-1, 1], [-speedX, speedX])
  const y = useTransform(mouseY, [-1, 1], [-speedY, speedY])
  const springX = useSpring(x, { stiffness: 60, damping: 20 })
  const springY = useSpring(y, { stiffness: 60, damping: 20 })

  return (
    <motion.div
      className="absolute rounded-xl shadow-md pointer-events-none"
      style={{
        backgroundColor: color,
        width: size, height: size,
        top, right, left, bottom,
        x: springX, y: springY,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        opacity: { duration: 0.4, delay },
        scale:   { duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] },
        y: { duration: 3 + delay, delay: delay + 0.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const setImage = useEditorStore(s => s.setImage)
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [showCredits, setShowCredits] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [pendingImageInfo, setPendingImageInfo] = useState(null)

  // Smooth spring mouse parallax
  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)

  const handleMouseMove = (e) => {
    rawMouseX.set((e.clientX / window.innerWidth) * 2 - 1)
    rawMouseY.set((e.clientY / window.innerHeight) * 2 - 1)
  }

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG or PNG).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataURL = e.target.result
      const img = new Image()
      img.onload = () => {
        setPendingImageInfo({ dataURL, w: img.naturalWidth, h: img.naturalHeight })
        setShowProjectModal(true)
      }
      img.src = dataURL
    }
    reader.readAsDataURL(file)
  }, [])

  // Load the bundled demo room image without requiring a file upload.
  // This is also used by automated browser tests to bypass the OS file dialog.
  const handleDemoRoom = useCallback(async () => {
    try {
      const res = await fetch('/demo-room.png')
      const blob = await res.blob()
      const dataURL = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(blob)
      })
      const img = new Image()
      img.onload = () => {
        setPendingImageInfo({ dataURL, w: img.naturalWidth, h: img.naturalHeight })
        setShowProjectModal(true)
      }
      img.src = dataURL
    } catch (err) {
      console.error('Demo room load failed:', err)
    }
  }, [])

  const handleProjectNameConfirm = (name) => {
    if (pendingImageInfo) {
      setImage(pendingImageInfo.dataURL, pendingImageInfo.w, pendingImageInfo.h, name)
      setShowProjectModal(false)
      setPendingImageInfo(null)
      navigate('/editor')
    }
  }

  const handleProjectNameCancel = () => {
    setShowProjectModal(false)
    setPendingImageInfo(null)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const onDragLeave = useCallback(() => setIsDragging(false), [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf8f0 0%, #f9edd9 40%, #fdf0e8 100%)' }}
      onMouseMove={handleMouseMove}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4813A, transparent)', top: '-10%', right: '-10%' }}
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4F7C7B, transparent)', bottom: '0%', left: '-10%' }}
          animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8A7898, transparent)', top: '40%', left: '30%' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="h-20 px-6 sm:px-12 flex items-center justify-between z-10 relative"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">W</div>
          <span className="font-display font-700 text-gray-900 text-lg tracking-tight">Wall Paint Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/gallery')}
            className="btn-ghost text-sm"
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Gallery
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left copy */}
        <div>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Free · Browser-based · No account needed
          </motion.div>

          <div className="overflow-hidden mb-6">
            <motion.h1
              className="font-display font-800 text-5xl lg:text-6xl leading-tight text-gray-900"
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.75, ease: [0.4, 0, 0.15, 1] }}
            >
              See your walls{' '}
              <span className="text-gradient">come to life</span>
            </motion.h1>
          </div>

          <motion.p
            className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.6, ease: 'easeOut' }}
          >
            Upload a photo of your room, trace the walls, and instantly preview any paint color or wallpaper pattern — with your room's actual lighting and shadows preserved.
          </motion.p>

          {/* Interactive cascading swatch strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <SwatchStrip swatches={PAINT_SWATCHES.slice(0, 16)} />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.04, y: -2, boxShadow: '0 0 40px rgba(212,129,58,0.45), 0 12px 40px rgba(0,0,0,0.14)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary text-base px-8 py-4 rounded-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
          >
            <span>Upload a Room Photo</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </motion.button>

          <motion.p
            className="text-sm text-gray-400 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            JPG or PNG · up to 10 MB
          </motion.p>

          {/* Demo shortcut */}
          <motion.button
            id="try-demo-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDemoRoom}
            className="mt-4 text-sm text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors"
          >
            or try with a demo room →
          </motion.button>
        </div>

        {/* Right — upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.4, 0, 0.15, 1] }}
        >
          <motion.div
            animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
            whileHover={!isDragging ? { y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' } : {}}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative rounded-3xl border-2 border-dashed cursor-pointer
              transition-colors duration-300 overflow-hidden
              ${isDragging
                ? 'border-brand-400 bg-brand-50 shadow-glow-lg'
                : 'border-sand-300 bg-white/70 hover:border-brand-300 hover:bg-brand-50/30'}
            `}
            style={{ minHeight: '420px' }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
              <motion.div
                animate={isDragging ? { y: -10, scale: 1.12 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-6 shadow-md"
              >
                <svg className="w-10 h-10 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>

              <h2 className="font-display font-600 text-xl text-gray-800 mb-2">
                {isDragging ? 'Release to upload' : 'Drag & drop your room photo'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">or click anywhere to browse</p>

              <div className="flex gap-2">
                <span className="tag">JPG</span>
                <span className="tag">PNG</span>
                <span className="tag">Up to 10 MB</span>
              </div>

              {/* Floating parallax swatches */}
              <AnimatePresence>
                {!isDragging && (
                  <>
                    <FloatSwatch color="#7A9090" top={32}  right={32}  size={40} delay={0.1} mouseX={rawMouseX} mouseY={rawMouseY} speedX={10} speedY={8} />
                    <FloatSwatch color="#C87941" top={64}  right={80}  size={28} delay={0.2} mouseX={rawMouseX} mouseY={rawMouseY} speedX={16} speedY={12} />
                    <FloatSwatch color="#4A5848" bottom={48} left={32} size={36} delay={0.15} mouseX={rawMouseX} mouseY={rawMouseY} speedX={12} speedY={10} />
                    <FloatSwatch color="#8A7898" bottom={80} left={80} size={24} delay={0.25} mouseX={rawMouseX} mouseY={rawMouseY} speedX={20} speedY={16} />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Drag overlay glow */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-brand-400/10 rounded-3xl"
                />
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-red-500 text-center font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-700 text-3xl text-gray-900 mb-3">
            Everything you need to pick the perfect color
          </h2>
          <p className="text-gray-500 text-lg">No paint chips. No guessing. Just your room.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ y: -5, boxShadow: '0 12px 48px rgba(0,0,0,0.11)' }}
              className="panel-card p-6 cursor-default"
              style={{ transition: 'box-shadow 0.25s ease' }}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-600 text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-amber-500 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display font-700 text-3xl text-white mb-4">
            Ready to find your perfect shade?
          </h2>
          <p className="text-white/80 mb-8">Upload a photo of your room and start exploring in seconds.</p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2, boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-brand-600 font-semibold text-base shadow-lg transition-colors duration-200"
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            Get Started Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </motion.button>
        </div>
      </section>

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

      <ProjectNameModal 
        isOpen={showProjectModal}
        onClose={handleProjectNameCancel}
        onConfirm={handleProjectNameConfirm}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </motion.div>
  )
}
