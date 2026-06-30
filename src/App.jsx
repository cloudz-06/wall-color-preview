import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Landing from './pages/Landing'
import Editor from './pages/Editor'
import Gallery from './pages/Gallery'
import { ErrorBoundary } from './components/ErrorBoundary'
import InitialLoader from './components/ui/InitialLoader'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const [showLoader, setShowLoader] = useState(() => {
    // Show loader on first visit per session only
    const alreadyShown = sessionStorage.getItem('wp_loader_shown')
    return !alreadyShown
  })

  const handleLoaderComplete = () => {
    sessionStorage.setItem('wp_loader_shown', 'true')
    setShowLoader(false)
  }

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {showLoader && <InitialLoader key="loader" onComplete={handleLoaderComplete} />}
      </AnimatePresence>
      <AnimatedRoutes />
    </ErrorBoundary>
  )
}

export default App
