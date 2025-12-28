import { useEffect, useRef, useState } from 'react'

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function setupCanvasSize(canvas, width, height, dpr) {
  const w = Math.max(1, Math.floor(width * dpr))
  const h = Math.max(1, Math.floor(height * dpr))
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  return { w, h }
}

export default function Waveform({
  color = '#2d6da6',
  background = 'transparent',
  opacity = 0.95,
  live = true,
  forceAmbient = false,
}) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const ctxRef = useRef(null)
  const analyserRef = useRef(null)
  const dataRef = useRef(null)
  const audioCtxRef = useRef(null)
  const streamRef = useRef(null)
  const startedRef = useRef(false)
  const ambientRef = useRef(null)
  const [hasMic, setHasMic] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    ctxRef.current = ctx

    let ro = null
    let size = { width: 1, height: 1, dpr: window.devicePixelRatio || 1 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      size = { width: rect.width, height: rect.height, dpr: window.devicePixelRatio || 1 }
      setupCanvasSize(canvas, size.width, size.height, size.dpr)
    }

    ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    return () => {
      ro?.disconnect?.()
    }
  }, [])

  useEffect(() => {
    if (!live || forceAmbient) return

    const tryStart = async () => {
      if (startedRef.current) return
      startedRef.current = true
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        streamRef.current = stream

        const AudioContext = window.AudioContext || window.webkitAudioContext
        const audioCtx = new AudioContext()
        audioCtxRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.85
        source.connect(analyser)
        analyserRef.current = analyser
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
        setHasMic(true)
      } catch {
        setHasMic(false)
      }
    }

    const onFirstGesture = () => {
      window.removeEventListener('pointerdown', onFirstGesture, true)
      window.removeEventListener('keydown', onFirstGesture, true)
      void tryStart()
    }

    window.addEventListener('pointerdown', onFirstGesture, true)
    window.addEventListener('keydown', onFirstGesture, true)

    return () => {
      window.removeEventListener('pointerdown', onFirstGesture, true)
      window.removeEventListener('keydown', onFirstGesture, true)
    }
  }, [live])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const render = (t) => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const { w, h } = setupCanvasSize(canvas, rect.width, rect.height, dpr)

      ctx.clearRect(0, 0, w, h)
      if (background && background !== 'transparent') {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, w, h)
      }

      const midY = h * 0.5
      const amp = h * 0.48

      let strength = 0.28
      const usingMic = !forceAmbient && hasMic && analyserRef.current && dataRef.current
      if (usingMic) {
        analyserRef.current.getByteTimeDomainData(dataRef.current)
        let sum = 0
        for (let i = 0; i < dataRef.current.length; i++) {
          const v = (dataRef.current[i] - 128) / 128
          sum += v * v
        }
        strength = clamp(Math.sqrt(sum / dataRef.current.length) * 2.2, 0.08, 1.0)
      } else {
        strength = 0.60
        const N = 160
        if (!ambientRef.current) {
          ambientRef.current = {
            seed: (Math.random() * 2 ** 32) >>> 0,
            noise: new Float32Array(N + 1),
          }
        }
        const a = ambientRef.current
        a.seed = (a.seed + 997) >>> 0

        const keep = 0.86
        const push = 1 - keep
        for (let i = 0; i < a.noise.length; i++) {
          let x = (a.seed + i * 0x9e3779b9) >>> 0
          x ^= x << 13
          x ^= x >>> 17
          x ^= x << 5
          const u = (x >>> 0) / 4294967296
          a.noise[i] = a.noise[i] * keep + (u * 2 - 1) * push
        }
      }

      ctx.lineWidth = 2.5 * dpr
      ctx.strokeStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 14 * dpr
      ctx.globalAlpha = opacity
      ctx.beginPath()

      const N = 160
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w
        let y
        if (usingMic && dataRef.current) {
          const idx = Math.floor((i / N) * (dataRef.current.length - 1))
          const v = (dataRef.current[idx] - 128) / 128
          y = midY + v * amp
        } else {
          const p = i / N
          const a = ambientRef.current
          const prev = a.noise[Math.max(0, i - 1)]
          const curr = a.noise[i]
          const next = a.noise[Math.min(a.noise.length - 1, i + 1)]
          const smooth = prev * 0.22 + curr * 0.56 + next * 0.22

          const phase = t / 1000
          const hf =
            Math.sin(phase * 3.0 + p * 120.0) * 0.20 +
            Math.sin(phase * 5.2 + p * 180.0) * 0.12 +
            Math.sin(phase * 8.6 + p * 260.0) * 0.08

          y = midY + (smooth * 0.85 + hf) * strength * amp
        }
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      if (usingMic) {
        ctx.globalAlpha = 0.22
        ctx.lineWidth = 10 * dpr
        ctx.shadowColor = color
        ctx.shadowBlur = 20 * dpr
        ctx.beginPath()
        ctx.moveTo(0, midY)
        ctx.lineTo(w, midY)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [background, color, forceAmbient, hasMic, live, opacity])

  useEffect(() => {
    return () => {
      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop())
      } catch {}
      try {
        audioCtxRef.current?.close?.()
      } catch {}
    }
  }, [])

  return <canvas ref={canvasRef} className="waveCanvas" />
}
