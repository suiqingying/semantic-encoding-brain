import { useEffect, useMemo, useState } from 'react'

export default function App() {
  const slides = useMemo(() => {
    const modules = import.meta.glob('./slides/Slide[0-9][0-9]*.jsx', { eager: true })
    return Object.keys(modules)
      .sort()
      .map((k) => modules[k].default)
  }, [])
  const [index, setIndex] = useState(0)
  const Slide = slides[index] || (() => null)

  useEffect(() => {
    let win = null
    let canceled = false
    const ensureFocus = () => {
      if (!document?.body) return
      document.body.tabIndex = -1
      document.body.focus({ preventScroll: true })
    }

    const getWin = async () => {
      if (win) return win
      try {
        const mod = await import('@tauri-apps/api/webviewWindow')
        win = mod.getCurrentWebviewWindow()
        return win
      } catch {
        try {
          const mod = await import('@tauri-apps/api/window')
          win = mod.getCurrentWindow()
          return win
        } catch {
          return null
        }
      }
    }

    const onKeyDown = async (e) => {
      if (canceled) return
      const key = e.key
      if (key !== 'Escape' && key !== 'F11' && !(key.toLowerCase() === 'q' && (e.ctrlKey || e.metaKey))) return
      const w = await getWin()
      if (!w) return

      try {
        const isFs = (await w.isFullscreen?.()) ?? false
        if (key === 'Escape') {
          if (!isFs) return
          e.preventDefault()
          e.stopPropagation()
          await w.setFullscreen(false)
          return
        }

        if (key === 'F11') {
          e.preventDefault()
          e.stopPropagation()
          await w.setFullscreen(!isFs)
          return
        }

        if (key.toLowerCase() === 'q' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          e.stopPropagation()
          await w.close?.()
        }
      } catch {
        // ignore
      }
    }

    ensureFocus()
    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('focus', ensureFocus, true)
    window.addEventListener('pointerdown', ensureFocus, true)
    return () => {
      canceled = true
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('focus', ensureFocus, true)
      window.removeEventListener('pointerdown', ensureFocus, true)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!slides.length) return
      if (e.key === 'ArrowLeft') setIndex((v) => Math.max(0, v - 1))
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') setIndex((v) => Math.min(slides.length - 1, v + 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [slides.length])

  return (
    <div className="stage">
      <div className="stageInner">
        <Slide page={index + 1} total={slides.length} />
        <div className="microProgress" aria-hidden="true">
          <div
            className="microProgressFill"
            style={{
              width: slides.length <= 1 ? '0%' : `${(index / (slides.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
