import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Before/After slider component.
 * Expects `beforeSrc` (original image dataURL) and `afterCanvas` ref
 * or `afterSrc` for the composite preview.
 */
export default function BeforeAfterSlider({ beforeSrc, afterSrc, width, height }) {
  const containerRef = useRef(null)
  const [sliderPos, setSliderPos] = useState(50) // percent 0-100
  const [isDragging, setIsDragging] = useState(false)

  const updateSlider = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    updateSlider(e.clientX)
  }, [updateSlider])

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return
    updateSlider(e.clientX)
  }, [isDragging, updateSlider])

  const onMouseUp = useCallback(() => setIsDragging(false), [])

  const onTouchStart = useCallback((e) => {
    setIsDragging(true)
    updateSlider(e.touches[0].clientX)
  }, [updateSlider])

  const onTouchMove = useCallback((e) => {
    if (!isDragging) return
    updateSlider(e.touches[0].clientX)
  }, [isDragging, updateSlider])

  const onTouchEnd = useCallback(() => setIsDragging(false), [])

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') setSliderPos(p => Math.max(0, p - 2))
      if (e.key === 'ArrowRight') setSliderPos(p => Math.min(100, p + 2))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', onTouchEnd)
      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', onTouchEnd)
      }
    }
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd])

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl shadow-card"
      style={{ width, height, cursor: isDragging ? 'ew-resize' : 'col-resize' }}
    >
      {/* After (right / bottom layer, full width) */}
      <img
        src={afterSrc || beforeSrc}
        alt="After preview"
        className="absolute inset-0 w-full h-full object-contain bg-gray-100"
        draggable={false}
      />

      {/* Before (left / clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt="Before original"
          className="absolute inset-0 w-full h-full object-contain bg-gray-100"
          draggable={false}
        />
        {/* Before label */}
        <div className="absolute top-4 left-4 px-2 py-1 rounded-lg bg-black/50 text-white text-xs font-semibold backdrop-blur-sm">
          Original
        </div>
      </div>

      {/* After label */}
      <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-brand-500/80 text-white text-xs font-semibold backdrop-blur-sm">
        Preview
      </div>

      {/* Divider line + handle */}
      <motion.div
        className="absolute inset-y-0 flex flex-col items-center"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-0.5 h-full bg-white shadow-lg" />
        {/* Handle circle */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize"
          whileHover={{ scale: 1.15 }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3m0 0l3 3m-3-3h12m0 0l-3-3m3 3l-3 3" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Invisible drag overlay for smoother interaction */}
      <div
        className="absolute inset-0"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      />
    </div>
  )
}
