import { useEffect, useRef, useState } from 'react'
import { COLORS, NordSlide, hash01 } from './_nord'

const TARGET_COUNT = 5000

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function ParticleBrainCanvas() {
  const canvasRef = useRef(null)
  const [targets, setTargets] = useState([])
  // Track mouse position
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const onMove = (e) => {
      // Get canvas bounds to calculate relative mouse position correctly
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        mouseRef.current = {
          x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
          y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height)
        }
      }
    }
    const onLeave = () => {
       mouseRef.current = { x: -9999, y: -9999 }
    }
    
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = '/assets/brain-outline.png'
    img.onload = () => {
      const maxDim = 320
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.max(1, Math.floor(img.width * scale))
      const h = Math.max(1, Math.floor(img.height * scale))

      const tmp = document.createElement('canvas')
      tmp.width = w
      tmp.height = h
      const ctx = tmp.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0, w, h)
      const data = ctx.getImageData(0, 0, w, h).data
      const bg = { r: data[0], g: data[1], b: data[2] }
      const mask = new Uint8Array(w * h)
      let minX = w
      let maxX = 0
      let minY = h
      let maxY = 0

      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const idx = (y * w + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const dr = r - bg.r
          const dg = g - bg.g
          const db = b - bg.b
          const dist = Math.sqrt(dr * dr + dg * dg + db * db)
          if (dist > 28) {
            mask[y * w + x] = 1
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      const filled = []
      const outline = []
      const internal = []
      for (let y = 1; y < h - 1; y += 1) {
        for (let x = 1; x < w - 1; x += 1) {
          const idx = y * w + x
          if (!mask[idx]) continue
          filled.push({ x, y })
          const left = mask[idx - 1]
          const right = mask[idx + 1]
          const up = mask[idx - w]
          const down = mask[idx + w]
          if (!left || !right || !up || !down) {
            outline.push({ x, y })
          } else {
            const base = idx * 4
            const r = data[base]
            const g = data[base + 1]
            const b = data[base + 2]
            const r1 = data[(idx + 1) * 4]
            const g1 = data[(idx + 1) * 4 + 1]
            const b1 = data[(idx + 1) * 4 + 2]
            const r2 = data[(idx + w) * 4]
            const g2 = data[(idx + w) * 4 + 1]
            const b2 = data[(idx + w) * 4 + 2]
            const diff1 = Math.abs(r - r1) + Math.abs(g - g1) + Math.abs(b - b1)
            const diff2 = Math.abs(r - r2) + Math.abs(g - g2) + Math.abs(b - b2)
            if (diff1 > 60 || diff2 > 60) {
              internal.push({ x, y })
            }
          }
        }
      }

      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const span = Math.max(maxX - minX, maxY - minY)
      const normalizedFill = filled.map((p, idx) => {
        const nx = (p.x - cx) / (span / 2)
        const ny = (p.y - cy) / (span / 2)
        return { x: nx, y: ny, seed: hash01(idx, 311) }
      })
      const normalizedOutline = outline.map((p, idx) => {
        const nx = (p.x - cx) / (span / 2)
        const ny = (p.y - cy) / (span / 2)
        return { x: nx, y: ny, seed: hash01(idx, 911) }
      })
      const normalizedInternal = internal.map((p, idx) => {
        const nx = (p.x - cx) / (span / 2)
        const ny = (p.y - cy) / (span / 2)
        return { x: nx, y: ny, seed: hash01(idx, 997) }
      })

      const internalCount = Math.min(normalizedInternal.length, Math.floor(TARGET_COUNT * 0.7))
      const outlineCount = Math.min(normalizedOutline.length, Math.floor(TARGET_COUNT * 0.2))
      const fillCount = Math.min(normalizedFill.length, TARGET_COUNT - internalCount - outlineCount)
      const internalPick = normalizedInternal
        .map((p, idx) => ({ p: { ...p, isOutline: false }, k: hash01(idx, 211) }))
        .sort((a, b) => a.k - b.k)
        .slice(0, internalCount)
        .map((item) => item.p)
      const outlinePick = normalizedOutline
        .map((p, idx) => ({ p: { ...p, isOutline: true }, k: hash01(idx, 613) }))
        .sort((a, b) => a.k - b.k)
        .slice(0, outlineCount)
        .map((item) => item.p)
      const fillPick = normalizedFill
        .map((p, idx) => ({ p: { ...p, isOutline: false }, k: hash01(idx, 431) }))
        .sort((a, b) => a.k - b.k)
        .slice(0, fillCount)
        .map((item) => item.p)
      const shuffled = [...internalPick, ...outlinePick, ...fillPick]
        .map((p, idx) => ({ p, k: hash01(idx, 997) }))
        .sort((a, b) => a.k - b.k)
        .map((item) => item.p)

      setTargets(shuffled)
    }
  }, [])

  useEffect(() => {
    if (!targets.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId = 0
    let width = 0
    let height = 0
    let scale = 1
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const particles = targets.map((t, idx) => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rx: 0,
      ry: 0,
      seed: t.seed,
      isOutline: t.isOutline,
      // Larger particles globally
      size: t.isOutline ? 3.0 : (1.8 + (idx % 5 === 0 ? 1.2 : 0)),
      alpha: t.isOutline ? 0.95 : (0.65 + t.seed * 0.3),
      hue: idx % 4,
    }))

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scale = Math.min(width, height) * 0.42
      
      // Update relative positions based on new scale
      particles.forEach((p, idx) => {
        const t = targets[idx % targets.length]
        p.rx = t.x * scale
        p.ry = t.y * scale
        
        // Initialize position if needed (first run)
        if (p.x === 0 && p.y === 0) {
          p.x = hash01(idx, 51) * width
          p.y = hash01(idx, 73) * height
        }
      })
    }

    resize()
    window.addEventListener('resize', resize)

    // Current brain center position (smooth follow)
    // Initialize to default position
    let curCx = canvas.clientWidth * 0.62
    let curCy = canvas.clientHeight * 0.5

    const draw = (time) => {
      const t = time * 0.001
      ctx.clearRect(0, 0, width, height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      
      // Determine target center for the brain
      // If mouse is active, follow mouse. Else, go to default rest position.
      const defaultCx = width * 0.62
      const defaultCy = height * 0.5
      
      const targetCx = (mx > -1000) ? mx : defaultCx
      const targetCy = (my > -1000) ? my : defaultCy

      // Smoothly interpolate current center towards target center
      // Adjust factor (0.05) for speed/lag.
      curCx += (targetCx - curCx) * 0.05
      curCy += (targetCy - curCy) * 0.05

      const interactionRadius = 120

      particles.forEach((p, idx) => {
        const jitter = Math.sin(t * 0.7 + p.seed * 6.2) * 0.4
        const driftX = Math.cos(t * 0.4 + p.seed * 4.1) * 0.18
        const driftY = Math.sin(t * 0.5 + p.seed * 5.3) * 0.18
        
        // Calculate absolute target position: Center + Relative + Drift
        let tx = curCx + p.rx + driftX * 8 + jitter * 4
        let ty = curCy + p.ry + driftY * 8

        // Mouse interaction: Repulsion
        // We calculate vector from mouse to particle target
        const dx = tx - mx
        const dy = ty - my
        const distSq = dx * dx + dy * dy

        if (distSq < interactionRadius * interactionRadius) {
          const dist = Math.sqrt(distSq)
          if (dist > 0.1) {
             const force = (1 - dist / interactionRadius) * 40
             tx += (dx / dist) * force
             ty += (dy / dist) * force
          }
        }

        p.vx += (tx - p.x) * 0.0024
        p.vy += (ty - p.y) * 0.0024
        p.vx *= 0.9
        p.vy *= 0.9
        p.x += p.vx
        p.y += p.vy

        // Deeper, more saturated colors for light background
        let color = '30, 80, 140' // Stronger Base Blue
        if (p.hue === 1) color = '20, 50, 90' // Very Deep Blue
        if (p.hue === 2) color = '60, 110, 170' // Vivid Mid Blue
        if (p.hue === 3) color = '210, 100, 30' // Burnt Orange (High visibility)

        if (p.isOutline) {
          // Almost black for maximum definition
          color = '10, 25, 50'
        }

        ctx.fillStyle = `rgba(${color}, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.isOutline || idx % 14 === 0) {
          // Much more subtle lines
          const lineAlpha = p.isOutline ? 0.15 : 0.08
          ctx.strokeStyle = `rgba(${color}, ${p.alpha * lineAlpha})`
          ctx.lineWidth = p.isOutline ? 1.2 : 0.8
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          // Shortened velocity trail (from 15 to 6)
          ctx.lineTo(p.x + p.vx * 6, p.y + p.vy * 6)
          ctx.stroke()
        }
      })

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [targets])

  return <canvas ref={canvasRef} className="coverParticles" aria-hidden="true" />
}

export default function Slide01Cover() {
  return (
    <NordSlide>
      <div className="coverStage">
        <ParticleBrainCanvas />
        <div className="coverTitleBlock">
          <div className="coverKicker">Neural Decoding</div>
          <h1 className="coverTitle">解码思维</h1>
          <div className="coverSub">
            基于多模态预训练模型的
            <br />
            <span>全脑语义映射</span>
          </div>
        </div>
      </div>
      <style>
        {`
          .coverStage {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .coverParticles {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
            filter: drop-shadow(0 4px 16px rgba(30, 80, 140, 0.35));
          }

          .coverTitleBlock {
            position: absolute;
            left: 8%;
            bottom: 16%;
            z-index: 2;
            max-width: 720px;
            color: ${COLORS.text};
            opacity: 0;
            transform: translateY(12px);
            animation: coverFade 1.6s ease 2.2s forwards;
          }

          .coverKicker {
            font-size: 20px;
            letter-spacing: 0.26em;
            text-transform: uppercase;
            color: ${COLORS.textDim};
            margin-bottom: 18px;
          }

          .coverTitle {
            margin: 0;
            font-size: 92px;
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.03em;
          }

          .coverSub {
            margin-top: 24px;
            font-size: 30px;
            color: ${COLORS.textDim};
            line-height: 1.25;
          }

          .coverSub span {
            color: ${COLORS.accent1};
            font-weight: 600;
          }

          @keyframes coverFade {
            0% { opacity: 0; transform: translateY(14px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </NordSlide>
  )
}


