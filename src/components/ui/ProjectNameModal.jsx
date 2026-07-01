import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProjectNameModal({ isOpen, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(name)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog Wrapper */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full pointer-events-auto border border-sand-100 relative overflow-hidden">
              {/* Decorative glows */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

              <div className="relative">
                <h3 className="font-display font-700 text-2xl text-gray-900 mb-2">Project Name</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Give your room a memorable name.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-8">
                    <input
                      ref={inputRef}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Living Room"
                      maxLength={50}
                      className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-ghost flex-1 py-2.5 text-sm"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                    >
                      Continue
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
