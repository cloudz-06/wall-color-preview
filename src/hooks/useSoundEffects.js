import { useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'

// Simple Web Audio API synthesizer for UI sounds
const playTone = (frequency, type, duration, vol = 0.1) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    
    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    // Ignore audio errors (e.g., if user hasn't interacted yet)
  }
}

export function useSoundEffects() {
  const soundEnabled = useEditorStore(s => s.soundEnabled)

  const playPop = useCallback(() => {
    if (!soundEnabled) return
    playTone(600, 'sine', 0.1, 0.1)
    setTimeout(() => playTone(800, 'sine', 0.15, 0.05), 50)
  }, [soundEnabled])

  const playSuccess = useCallback(() => {
    if (!soundEnabled) return
    playTone(440, 'sine', 0.1, 0.1) // A4
    setTimeout(() => playTone(554.37, 'sine', 0.1, 0.1), 100) // C#5
    setTimeout(() => playTone(659.25, 'sine', 0.3, 0.1), 200) // E5
  }, [soundEnabled])

  const playClick = useCallback(() => {
    if (!soundEnabled) return
    playTone(300, 'triangle', 0.05, 0.05)
  }, [soundEnabled])

  return { playPop, playSuccess, playClick }
}
