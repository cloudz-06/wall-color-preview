import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGES = [
  "Detecting walls...",
  "Mixing your color...",
  "Applying lighting...",
  "Almost there...",
  "Adding finishing touches..."
]

export default function ProcessingOverlay({ isVisible }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setMsgIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center glass-panel px-8 py-6 rounded-3xl shadow-xl border border-white/50">
            {/* Animated Spinner */}
            <div className="relative w-12 h-12 mb-4">
              <motion.div
                className="absolute inset-0 border-4 border-brand-100 rounded-full"
              />
              <motion.div
                className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              {/* Inner pulsing dot */}
              <motion.div
                className="absolute inset-0 m-auto w-2 h-2 bg-brand-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            {/* Rotating Text */}
            <div className="h-6 overflow-hidden flex items-center justify-center relative w-48">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  className="font-medium text-gray-700 text-sm absolute text-center w-full"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {MESSAGES[msgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
