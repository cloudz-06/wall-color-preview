import { motion } from 'framer-motion'

const SWATCHES = ['#D4813A', '#4F7C7B', '#8A7898', '#4A5848', '#7098B8', '#C88850', '#C89898', '#789870']

const SWATCH_POSITIONS = [
  { x: '8%',  y: '12%', size: 60,  rotateStart: -12, rotateEnd: -6,  delay: 0 },
  { x: '78%', y: '8%',  size: 48,  rotateStart: 8,   rotateEnd: 14,  delay: 0.08 },
  { x: '84%', y: '68%', size: 68,  rotateStart: 15,  rotateEnd: 8,   delay: 0.16 },
  { x: '4%',  y: '60%', size: 50,  rotateStart: -8,  rotateEnd: -15, delay: 0.24 },
  { x: '70%', y: '35%', size: 38,  rotateStart: 20,  rotateEnd: 12,  delay: 0.12 },
  { x: '18%', y: '75%', size: 44,  rotateStart: -5,  rotateEnd: -12, delay: 0.04 },
  { x: '88%', y: '30%', size: 32,  rotateStart: 10,  rotateEnd: 18,  delay: 0.2  },
  { x: '30%', y: '85%', size: 36,  rotateStart: -18, rotateEnd: -8,  delay: 0.28 },
]

export default function InitialLoader({ onComplete }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf8f0 0%, #f9edd9 40%, #fdf0e8 100%)' }}
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.03,
        filter: 'blur(8px)',
        transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
      }}
    >
      {/* Floating color swatches */}
      {SWATCH_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-2xl shadow-xl"
          style={{
            backgroundColor: SWATCHES[i % SWATCHES.length],
            width: pos.size,
            height: pos.size,
            left: pos.x,
            top: pos.y,
            rotate: pos.rotateStart,
          }}
          initial={{ opacity: 0, scale: 0, rotate: pos.rotateStart }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: pos.rotateEnd,
            y: [0, -8, 0],
          }}
          transition={{
            opacity:  { duration: 0.5, delay: 0.2 + pos.delay, ease: 'easeOut' },
            scale:    { duration: 0.7, delay: 0.2 + pos.delay, ease: [0.34, 1.56, 0.64, 1] },
            rotate:   { duration: 0.7, delay: 0.2 + pos.delay, ease: 'easeOut' },
            y:        { duration: 3 + i * 0.4, delay: 0.9, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center select-none">
        {/* Paint can with fill */}
        <motion.div
          className="relative w-24 h-24 mb-8"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="w-full h-full rounded-[22px] bg-white shadow-2xl overflow-hidden relative border border-black/5">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{ background: 'linear-gradient(160deg, #D4813A 0%, #b85c20 100%)' }}
              initial={{ height: '0%' }}
              animate={{ height: '100%' }}
              transition={{ duration: 1.8, delay: 0.4, ease: [0.45, 0, 0.15, 1] }}
            />
            <motion.span
              className="absolute inset-0 flex items-center justify-center text-4xl"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              🎨
            </motion.span>
          </div>
          {/* Paint drip */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 rounded-b-full"
            style={{ background: '#D4813A' }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 16, opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.1, ease: 'easeIn' }}
          />
        </motion.div>

        {/* Title slide-up */}
        <div className="overflow-hidden mb-2">
          <motion.h1
            className="font-display font-bold text-[2rem] text-gray-900 tracking-tight text-center"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.4, 0, 0.15, 1] }}
            onAnimationComplete={() => {
              // Total intended duration ~3s before calling onComplete
              setTimeout(() => { if (onComplete) onComplete() }, 1200)
            }}
          >
            Wall Paint Preview
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-10 letter-spacing-[0.15em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          Visualize · Before you paint
        </motion.p>

        {/* Progress track */}
        <div className="w-52 h-[3px] bg-black/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4813A, #C86030, #a84a18)' }}
            initial={{ width: '0%', x: '-100%' }}
            animate={{ width: '100%', x: '0%' }}
            transition={{ duration: 2.2, delay: 0.4, ease: [0.45, 0, 0.15, 1] }}
          />
        </div>

        {/* Dot palette */}
        <div className="flex gap-2.5 mt-6">
          {SWATCHES.slice(0, 6).map((c, i) => (
            <motion.div
              key={c}
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: c }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.8 + i * 0.07,
                type: 'spring',
                stiffness: 400,
                damping: 15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
