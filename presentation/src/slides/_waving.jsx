import { useEffect, useRef } from 'react'

function setupCanvasSize(canvas, width, height, dpr) {
  const w = Math.max(1, Math.floor(width * dpr))
  const h = Math.max(1, Math.floor(height * dpr))
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  return { w, h }
}

// Single-row "final look" extracted from `presentation/src/slides/1.html`, without auto-growth UI.
export default function WavingRow({ color = '#2d6da6', backgroundFade = 0.18, bpm = 195, unitScale = 0.16 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })

    let ro = null
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      setupCanvasSize(canvas, rect.width, rect.height, window.devicePixelRatio || 1)
    }
    ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const beatInterval = 60000 / bpm

    function calculateRow(width, height) {
      const baseUnit = Math.min(width, height) * unitScale
      const hSpacing = baseUnit * 1.55
      const maxCols = Math.max(3, Math.floor((width - baseUnit) / hSpacing))
      return { baseUnit, hSpacing, maxCols }
    }

    function drawRowWave(startX, endX, centerY, t, shakeEnergy, dpr) {
      const dist = endX - startX
      if (dist <= 0) return
      const segments = Math.max(1, Math.floor(dist / (5 * dpr)))
      for (let i = 0; i <= segments; i++) {
        const x = startX + (dist * (i / segments))
        const baseWave = Math.sin(x * 0.05 + t * 0.01) * 1.8
        const noise = Math.sin(x * 0.2 - t * 0.02) * (0.9 + shakeEnergy * 3.6)
        if (i === 0) ctx.moveTo(x, centerY + baseWave + noise)
        else ctx.lineTo(x, centerY + baseWave + noise)
      }
    }

    function drawSingleWaving(x, y, unit, angleOffset, shakeEnergy) {
      const sLX = x - unit * 0.15
      const sLY = y - unit * 0.1
      const sRX = x + unit * 0.15
      const sRY = y - unit * 0.1
      const aLen = unit * 0.85

      const lA = Math.PI * 1.25 + angleOffset
      const tLX = sLX + Math.cos(lA) * aLen
      const tLY = sLY + Math.sin(lA) * aLen
      ctx.lineTo(sLX, sLY)
      ctx.lineTo(tLX, tLY)
      ctx.lineTo(sLX, sLY)

      const hW = unit * 0.12
      const hH = unit * 0.22
      const hCY = y - unit * 0.35 + shakeEnergy * 6
      for (let a = Math.PI / 2; a <= Math.PI * 2.51; a += 0.4) {
        ctx.lineTo(x + Math.cos(a) * hW, hCY + Math.sin(a) * hH)
      }

      const rA = -Math.PI * 0.25 - angleOffset
      const tRX = sRX + Math.cos(rA) * aLen
      const tRY = sRY + Math.sin(rA) * aLen
      ctx.lineTo(sRX, sRY)
      ctx.lineTo(tRX, tRY)
      ctx.lineTo(sRX, sRY)
    }

    function draw(t) {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const { w, h } = setupCanvasSize(canvas, rect.width, rect.height, dpr)

      ctx.fillStyle = `rgba(245,245,240,${backgroundFade})`
      ctx.fillRect(0, 0, w, h)

      const { baseUnit, hSpacing, maxCols } = calculateRow(w, h)
      const rowY = h * 0.52
      const activeWidth = (maxCols - 1) * hSpacing
      const startX = (w - activeWidth) / 2

      const phase = (t % beatInterval) / beatInterval
      const shakeEnergy = Math.pow(1 - phase, 3)
      const swingRange = 0.55
      const angleOffset = Math.sin(t * 0.018) * swingRange + (Math.random() - 0.5) * 0.18 * shakeEnergy

      ctx.lineWidth = 2.5 * dpr
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 14 * dpr

      ctx.beginPath()
      drawRowWave(0, startX - baseUnit * 0.5, rowY, t, shakeEnergy, dpr)

      for (let c = 0; c < maxCols; c++) {
        const x = startX + c * hSpacing
        drawSingleWaving(x, rowY, baseUnit, angleOffset, shakeEnergy)
        const nextTargetX = c === maxCols - 1 ? w : startX + (c + 1) * hSpacing - baseUnit * 0.5
        drawRowWave(x + baseUnit * 0.5, nextTargetX, rowY, t, shakeEnergy, dpr)
      }

      ctx.stroke()
      ctx.shadowBlur = 0
    }

    const animate = (t) => {
      draw(t)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro?.disconnect?.()
    }
  }, [backgroundFade, bpm, color, unitScale])

  return <canvas ref={canvasRef} className="waveCanvas" />
}

