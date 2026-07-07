import { motion, AnimatePresence } from 'framer-motion'

export default function CreditsModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full pointer-events-auto border border-sand-100 relative overflow-hidden">
              {/* Decorative bg */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-100 rounded-full blur-3xl opacity-50" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-sand-50 hover:bg-sand-100 text-gray-500 transition-colors"
              >
                ✕
              </button>

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg shadow-brand-500/20">
                  NB
                </div>
                
                <h3 className="font-display font-700 text-2xl text-gray-900 mb-2">
                  Built by Nandhagopan Babu
                </h3>
                <p className="text-gray-500 leading-relaxed mb-8">
                  A passionate developer exploring the intersection of design, interaction, and the web.
                </p>

                <a
                  href="https://cloudz06.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary py-3 flex justify-center gap-2"
                >
                  Visit Portfolio
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
