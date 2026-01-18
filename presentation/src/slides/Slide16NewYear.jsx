import React, { useEffect, useState, useRef } from 'react'

const NUM_PARTICLES = 20000;
const REPO_URL = 'https://github.com/suiqingying/semantic-encoding-brain'

export default function Slide16NewYear() {
  const [step, setStep] = useState('idle'); 
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const targetsRef = useRef([]);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const stepRef = useRef('idle');
  const bgElementsRef = useRef({ stars: [], fireworks: [], bokeh: [] });
  const coupletRevealStartRef = useRef(null)

  const today = new Date()
  // For sharing the tail page, always use the New Year theme.
  const isNewYearEve = true
  const year = today.getFullYear()
  const nextYear = year + 1

  const credits = isNewYearEve
    ? {
        name: '新年快乐',
        title: '斗罢艰险又出发',
        info: ''
      }
    : {
        name: 'THANK YOU',
        title: 'Decoding the Semantic Mind',
        info: 'Suiqingying  |  UCAS',
      }

  const watermarkText = isNewYearEve ? `恭贺新禧` : 'THANKS'
  const chineseBlessing = '平安喜乐 · 万事胜意'

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const clamp01 = (v) => Math.max(0, Math.min(1, v))
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

    const palette = isNewYearEve
      ? {
          bgInner: '#0B1735', // night blue
          bgOuter: '#04050B', // deep night
          star: { r: 255, g: 244, b: 214 }, // warm ivory
          spark: { r: 255, g: 215, b: 102 }, // gold
          festRed: { r: 212, g: 22, b: 38 }, // classic red
          festGold: { r: 255, g: 215, b: 102 }, // gold
        }
      : {
          bgInner: '#ECEBE4',
          bgOuter: '#E4E1D8',
          star: { r: 35, g: 48, b: 68 },
          spark: { r: 136, g: 192, b: 208 },
          festRed: { r: 46, g: 52, b: 64 },
          festGold: { r: 46, g: 52, b: 64 },
        }

    const setupTargets = (w, h) => {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = w; tCanvas.height = h;
      const tCtx = tCanvas.getContext('2d');
      tCtx.fillStyle = 'black';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      const baseFontSize = w / 1366;

      const drawFitLine = ({
        text,
        y,
        baseSize,
        weight = '',
        maxWidth = w * 0.86,
        fontFamily = 'system-ui',
      }) => {
        if (!text) return
        let size = Math.floor(baseSize * baseFontSize)
        const setFont = () => {
          tCtx.font = `${weight} ${size}px ${fontFamily}`
        }
        setFont()
        const measure = () => tCtx.measureText(text).width || 0
        let measured = measure()
        let iter = 0
        while (measured > maxWidth && size > 12 && iter < 60) {
          size = Math.max(12, Math.floor(size * 0.95))
          setFont()
          measured = measure()
          iter++
        }
        tCtx.fillText(text, w / 2, y)
      }

      drawFitLine({
        text: credits.name,
        y: h / 2 - 85 * baseFontSize,
        baseSize: 100,
        weight: 'bold',
        fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif',
      })
      drawFitLine({
        text: credits.title,
        y: h / 2 + 55 * baseFontSize,
        baseSize: 48,
        fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif',
      })
      if (credits.info) {
        tCtx.font = `${Math.floor(28 * baseFontSize)}px system-ui`;
        tCtx.fillText(credits.info, w / 2, h / 2 + (130 * baseFontSize));
      }
      
      const data = tCtx.getImageData(0, 0, w, h).data;
      const edgePts = [];
      const fillPts = [];
      const gap = 2.0; 
      
      for (let y = gap; y < h - gap; y += gap) {
        for (let x = gap; x < w - gap; x += gap) {
          const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
          if (data[idx + 3] > 128) {
            const isEdge = data[((Math.floor(y)-1) * w + Math.floor(x)) * 4 + 3] < 128 || data[((Math.floor(y)+1) * w + Math.floor(x)) * 4 + 3] < 128 || data[(Math.floor(y) * w + (Math.floor(x)-1)) * 4 + 3] < 128 || data[(Math.floor(y) * w + (Math.floor(x)+1)) * 4 + 3] < 128;
            if (isEdge) {
              edgePts.push({ x, y, isEdge: true });
            } else if (Math.random() < 0.35) {
              fillPts.push({ x, y, isEdge: false });
            }
          }
        }
      }
      return [...edgePts, ...fillPts].slice(0, NUM_PARTICLES);
    };

    const setupBG = (w, h) => {
      const stars = Array.from({ length: 260 }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.4 + 1.2,
        alpha: Math.random() * 0.6 + 0.35,
        tw: Math.random() * Math.PI * 2
      }));
      const fireworks = !isNewYearEve
        ? []
        : Array.from({ length: 5 }).map(() => ({
            x: Math.random() * w * 0.7 + w * 0.15,
            y: Math.random() * h * 0.45 + h * 0.1,
            period: 3.0 + Math.random() * 3.5,
            offset: Math.random() * 10,
            spokes: 12 + Math.floor(Math.random() * 8),
            maxR: 110 + Math.random() * 150,
            alpha: 0.55,
            hue: 8 + Math.random() * 40,
          }))

      const bokeh = !isNewYearEve
        ? []
        : Array.from({ length: 18 }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 90 + 60,
            vx: (Math.random() - 0.5) * 0.06,
            vy: (Math.random() - 0.5) * 0.05,
            a: Math.random() * 0.18 + 0.08,
            hue: Math.random() < 0.6 ? 10 + Math.random() * 20 : 38 + Math.random() * 20, // red/gold
            phase: Math.random() * Math.PI * 2,
          }))

      bgElementsRef.current = { stars, fireworks, bokeh };
    };

    const initParticles = (w, h, targetPts) => {
      const colorBases = isNewYearEve
        ? [
            { r: 255, g: 215, b: 102 }, // gold
            { r: 255, g: 244, b: 214 }, // ivory
            { r: 255, g: 168, b: 168 }, // warm red accent
          ]
        : [
            { r: 46, g: 52, b: 64 }, // Nord 0
            { r: 45, g: 109, b: 166 }, // Nord Blue
            { r: 76, g: 86, b: 106 }, // Nord 3
          ];

      const spawn = isNewYearEve
        ? {
            x0: w * 0.18,
            x1: w * 0.82,
            y0: h * 0.70,
            y1: h * 0.95,
          }
        : { x0: 0, x1: w, y0: 0, y1: h }
      return Array.from({ length: NUM_PARTICLES }).map((_, i) => {
        const target = i < targetPts.length ? targetPts[i] : null;
        const c = colorBases[i % colorBases.length];
        const x = spawn.x0 + Math.random() * (spawn.x1 - spawn.x0)
        const y = spawn.y0 + Math.random() * (spawn.y1 - spawn.y0)
        return {
          x, y,
          vx: (Math.random() - 0.5) * 1.8, vy: (Math.random() - 0.5) * 1.2,
          size: target?.isEdge ? 2.0 : (target ? 3.0 : (Math.random() * 2.8 + 1.2)),
          alpha: target ? (target.isEdge ? 1.0 : 0.85) : (Math.random() * 0.45 + 0.25),
          color: c,
          target: target,
          phase: Math.random() * Math.PI * 2
        };
      });
    };

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      targetsRef.current = setupTargets(w, h);
      setupBG(w, h);
      particlesRef.current = initParticles(w, h, targetsRef.current);
    };

    resize();
    window.addEventListener('resize', resize);
    const handleMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleClick = () => setStep(curr => (curr === 'idle' ? 'gather' : curr === 'gather' ? 'crystallize' : 'idle'));
    window.addEventListener('mousemove', handleMove); window.addEventListener('click', handleClick);

    const sm = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const render = (time) => {
      const w = window.innerWidth, h = window.innerHeight;
      const s = stepRef.current;
      ctx.clearRect(0, 0, w, h);

      if (coupletRevealStartRef.current == null) {
        const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : time
        coupletRevealStartRef.current = time > 0 ? time : now
      }
      const coupletT = (time - coupletRevealStartRef.current - 350) / 7200
      const coupletReveal = easeOutCubic(clamp01(coupletT))

      // --- 1. Background (Night Sky) ---
      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      grad.addColorStop(0, palette.bgInner); grad.addColorStop(1, palette.bgOuter);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'source-over';
      if (isNewYearEve && bgElementsRef.current.bokeh?.length) {
        bgElementsRef.current.bokeh.forEach((b) => {
          b.x += b.vx
          b.y += b.vy
          if (b.x < -b.r) b.x = w + b.r
          if (b.x > w + b.r) b.x = -b.r
          if (b.y < -b.r) b.y = h + b.r
          if (b.y > h + b.r) b.y = -b.r

          const pulse = 0.75 + Math.sin(time * 0.0008 + b.phase) * 0.25
          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
          grad.addColorStop(0, `hsla(${b.hue}, 90%, 62%, ${b.a * pulse})`)
          grad.addColorStop(1, `hsla(${b.hue}, 90%, 62%, 0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      bgElementsRef.current.stars.forEach(star => {
        const twinkle = 0.75 + Math.sin(time * 0.002 + star.tw) * 0.25;
        ctx.fillStyle = `rgba(${palette.star.r}, ${palette.star.g}, ${palette.star.b}, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isNewYearEve) {
        const roundRectPath = (c, x, y, w0, h0, r0) => {
          const r = Math.min(r0, w0 / 2, h0 / 2)
          c.beginPath()
          c.moveTo(x + r, y)
          c.arcTo(x + w0, y, x + w0, y + h0, r)
          c.arcTo(x + w0, y + h0, x, y + h0, r)
          c.arcTo(x, y + h0, x, y, r)
          c.arcTo(x, y, x + w0, y, r)
          c.closePath()
        }

        // Hanging lanterns
        const drawLantern = (x, topY, scale, phase) => {
          const sway = Math.sin(time * 0.0011 + phase) * 0.10
          const bodyW = 44 * scale
          const bodyH = 58 * scale
          const capH = 10 * scale
          const tasselH = 18 * scale
          const cx = x
          const cy = topY + 46 * scale

          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(sway)
          ctx.translate(-cx, -cy)

          // string
          ctx.strokeStyle = 'rgba(255, 215, 102, 0.55)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(cx, topY - 6)
          ctx.lineTo(cx, cy - bodyH * 0.65)
          ctx.stroke()

          // glow
          ctx.shadowColor = 'rgba(255, 215, 102, 0.55)'
          ctx.shadowBlur = 18 * scale
          const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, bodyW * 1.1)
          g.addColorStop(0, `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.28)`)
          g.addColorStop(1, 'rgba(255, 215, 102, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(cx, cy, bodyW * 1.1, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0

          // body
          ctx.fillStyle = `rgba(${palette.festRed.r}, ${palette.festRed.g}, ${palette.festRed.b}, 0.92)`
          ctx.beginPath()
          ctx.ellipse(cx, cy, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.9)`
          ctx.lineWidth = 2
          ctx.stroke()

          // ribs
          ctx.globalAlpha = 0.9
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath()
            ctx.ellipse(cx + i * (bodyW * 0.09), cy, bodyW * 0.16, bodyH * 0.48, 0, 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.globalAlpha = 1

          // top cap
          ctx.fillStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.95)`
          roundRectPath(ctx, cx - bodyW * 0.35, cy - bodyH * 0.56, bodyW * 0.7, capH, 4 * scale)
          ctx.fill()

          // bottom cap
          roundRectPath(ctx, cx - bodyW * 0.35, cy + bodyH * 0.50, bodyW * 0.7, capH, 4 * scale)
          ctx.fill()

          // tassel
          ctx.strokeStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.95)`
          ctx.lineWidth = 2
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath()
            ctx.moveTo(cx + i * 2 * scale, cy + bodyH * 0.58)
            ctx.lineTo(cx + i * 2 * scale, cy + bodyH * 0.58 + tasselH)
            ctx.stroke()
          }

          ctx.restore()
        }

        drawLantern(w * 0.18, 26, 1.05, 0.4)
        drawLantern(w * 0.82, 32, 0.95, 1.2)

        // Moon
        const moonR = Math.min(w, h) * 0.06
        const moonX = w * 0.84
        const moonY = h * 0.17
        ctx.save()
        ctx.globalAlpha = 1
        ctx.shadowColor = 'rgba(255, 244, 214, 0.5)'
        ctx.shadowBlur = moonR * 1.2
        const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.25, moonY - moonR * 0.35, moonR * 0.2, moonX, moonY, moonR)
        moonGrad.addColorStop(0, 'rgba(255, 248, 232, 1)')
        moonGrad.addColorStop(1, 'rgba(255, 226, 170, 1)')
        ctx.fillStyle = moonGrad
        ctx.beginPath()
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(140, 98, 66, 0.10)'
        ctx.beginPath(); ctx.arc(moonX - moonR * 0.22, moonY + moonR * 0.05, moonR * 0.22, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(moonX + moonR * 0.18, moonY - moonR * 0.18, moonR * 0.14, 0, Math.PI * 2); ctx.fill()
        ctx.restore()

        // Couplet banner (vertical spring couplets)
        const margin = 26
        const coupletW = Math.max(52, Math.min(78, w * 0.06))
        const coupletH = Math.max(320, h * 0.72)
        const topY = (h - coupletH) / 2
        const leftX = margin
        const rightX = w - margin - coupletW
        const border = 3
        const drawCouplet = (x, textChars) => {
          const revealH = coupletH * coupletReveal
          // Draw revealed portion (clipped)
          ctx.save()
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.rect(x, topY, coupletW, Math.max(0, revealH))
          ctx.clip()

          ctx.fillStyle = `rgba(${palette.festRed.r}, ${palette.festRed.g}, ${palette.festRed.b}, 0.92)`
          ctx.fillRect(x, topY, coupletW, coupletH)
          ctx.strokeStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.92)`
          ctx.lineWidth = border
          ctx.strokeRect(x + border / 2, topY + border / 2, coupletW - border, coupletH - border)

          const fontSize = Math.floor(Math.min(36, coupletW * 0.66))
          ctx.fillStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.98)`
          ctx.font = `700 ${fontSize}px "STKaiti", "KaiTi", "Kaiti SC", "DFKai-SB", "SimKai", serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const padTop = fontSize * 1.1
          const usable = coupletH - padTop * 2
          const gap = usable / Math.max(1, textChars.length - 1)
          textChars.forEach((ch, i) => {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
            ctx.shadowBlur = 6
            ctx.fillText(ch, x + coupletW / 2, topY + padTop + i * gap + 0.5)
            ctx.shadowBlur = 0
            ctx.fillText(ch, x + coupletW / 2, topY + padTop + i * gap)
          })
          ctx.restore()

          // Rolled curtain edge (drawn outside clip so it's visible)
          if (coupletReveal > 0 && coupletReveal < 1) {
            const edgeY = topY + revealH
            const rollR = Math.max(10, coupletW * 0.22)
            const rollW = coupletW - border * 2
            const rollX = x + border

            ctx.save()
            ctx.globalAlpha = 1
            const rollGrad = ctx.createLinearGradient(0, edgeY - rollR, 0, edgeY + rollR)
            rollGrad.addColorStop(0, `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.70)`)
            rollGrad.addColorStop(0.5, `rgba(${palette.festRed.r}, ${palette.festRed.g}, ${palette.festRed.b}, 0.95)`)
            rollGrad.addColorStop(1, `rgba(0, 0, 0, 0.45)`)
            ctx.fillStyle = rollGrad
            ctx.beginPath()
            ctx.ellipse(rollX + rollW / 2, edgeY, rollW / 2, rollR, 0, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = 'rgba(0, 0, 0, 0.26)'
            ctx.beginPath()
            ctx.ellipse(rollX + rollW / 2, edgeY + rollR * 0.92, rollW * 0.46, rollR * 0.36, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }

        drawCouplet(leftX, ['岁', '岁', '平', '安', '福', '满', '门'])
        drawCouplet(rightX, ['年', '年', '如', '意', '喜', '临', '家'])

        // Top plaque
        const plaqueW = Math.min(w * 0.28, 360)
        const plaqueH = Math.min(h * 0.07, 64)
        const plaqueX = (w - plaqueW) / 2
        const plaqueY = Math.max(18, h * 0.08)
        ctx.save()
        ctx.fillStyle = `rgba(${palette.festRed.r}, ${palette.festRed.g}, ${palette.festRed.b}, 0.90)`
        ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH)
        ctx.strokeStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.95)`
        ctx.lineWidth = 3
        ctx.strokeRect(plaqueX + 1.5, plaqueY + 1.5, plaqueW - 3, plaqueH - 3)
        ctx.fillStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.98)`
        ctx.font = `800 ${Math.floor(plaqueH * 0.56)}px "STKaiti", "KaiTi", "Kaiti SC", "DFKai-SB", "SimKai", serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(chineseBlessing, plaqueX + plaqueW / 2, plaqueY + plaqueH / 2 + 1)
        ctx.restore()

        // Firecrackers (bottom-left)
        const baseX = margin + coupletW + 18
        const baseY = h - margin - 18
        const crackerCount = 12
        const crackerW = 18
        const crackerH = 26
        const gapY = 8
        const flicker = 0.65 + Math.sin(time * 0.018) * 0.35
        ctx.save()
        for (let i = 0; i < crackerCount; i++) {
          const y = baseY - i * (crackerH + gapY)
          const x = baseX + Math.sin(time * 0.001 + i * 0.7) * 2.5
          ctx.fillStyle = `rgba(${palette.festRed.r}, ${palette.festRed.g}, ${palette.festRed.b}, 0.92)`
          ctx.fillRect(x, y, crackerW, crackerH)
          ctx.strokeStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.9)`
          ctx.lineWidth = 2
          ctx.strokeRect(x + 1, y + 1, crackerW - 2, crackerH - 2)
          ctx.fillStyle = `rgba(${palette.festGold.r}, ${palette.festGold.g}, ${palette.festGold.b}, 0.95)`
          ctx.fillRect(x + crackerW * 0.12, y + crackerH * 0.16, crackerW * 0.76, 2)
        }
        // Fuse spark
        ctx.fillStyle = `rgba(${palette.spark.r}, ${palette.spark.g}, ${palette.spark.b}, ${0.65 * flicker})`
        ctx.beginPath()
        ctx.arc(baseX + crackerW / 2, baseY - crackerCount * (crackerH + gapY) - 10, 6 + 2 * flicker, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (isNewYearEve && bgElementsRef.current.fireworks?.length) {
        bgElementsRef.current.fireworks.forEach((fw) => {
          const t = ((time * 0.001) + fw.offset) % fw.period
          const p = t / fw.period
          if (p > 0.28) return
          const burst = p / 0.28
          const radius = fw.maxR * burst
          const a = fw.alpha * (1 - burst)

          ctx.save()
          ctx.translate(fw.x, fw.y)
          ctx.globalAlpha = 1
          ctx.strokeStyle = `hsla(${fw.hue}, 90%, 65%, ${a})`
          ctx.lineWidth = 2.0
          for (let i = 0; i < fw.spokes; i++) {
            const ang = (i / fw.spokes) * Math.PI * 2
            const r0 = radius * 0.25
            const r1 = radius
            ctx.beginPath()
            ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0)
            ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1)
            ctx.stroke()
          }
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        })
      }

      // --- 3. Dynamic Particles ---
      sm.x += (mouseRef.current.x - sm.x) * 0.12; sm.y += (mouseRef.current.y - sm.y) * 0.12;

      ctx.globalCompositeOperation = isNewYearEve ? 'lighter' : 'source-over'
      particlesRef.current.forEach((p) => {
        if (s === 'idle') {
          p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
          p.vx *= 0.98; p.vy *= 0.98;
          if (isNewYearEve) {
            const region = { x0: w * 0.18, x1: w * 0.82, y0: h * 0.70, y1: h * 0.95 }
            // Keep particles in a bottom "mist" region without squeezing to center.
            if (p.x < region.x0) { p.x = region.x0; p.vx = Math.abs(p.vx) * 0.9; }
            if (p.x > region.x1) { p.x = region.x1; p.vx = -Math.abs(p.vx) * 0.9; }
            if (p.y < region.y0) { p.y = region.y0; p.vy = Math.abs(p.vy) * 0.9; }
            if (p.y > region.y1) { p.y = region.y1; p.vy = -Math.abs(p.vy) * 0.9; }
          } else {
            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
          }
        } else if (s === 'gather') {
          const dx = sm.x - p.x, dy = sm.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const angle = Math.atan2(dy, dx);
          const force = Math.max(0, 1 - dist / 1000);
          p.vx += Math.cos(angle) * force * 2.0 + Math.cos(angle - Math.PI/2) * force * 1.2;
          p.vy += Math.sin(angle) * force * 2.0 + Math.sin(angle - Math.PI/2) * force * 1.2;
          p.vx *= dist < 30 ? 0.7 : 0.92; p.vy *= dist < 30 ? 0.7 : 0.92;
        } else if (s === 'crystallize') {
          if (p.target) {
            const dxm = mouseRef.current.x - p.target.x;
            const dym = mouseRef.current.y - p.target.y;
            const distM = Math.sqrt(dxm*dxm + dym*dym);
            let tx = p.target.x, ty = p.target.y;
            if (distM < 120) {
              const pushForce = (1 - distM / 120) * 50;
              tx -= (dxm / distM) * pushForce;
              ty -= (dym / distM) * pushForce;
            }
            const dx = tx - p.x, dy = ty - p.y;
            p.vx = dx * 0.18; p.vy = dy * 0.18;
            p.alpha += ((p.target.isEdge ? 0.98 : 0.65) - p.alpha) * 0.1;
          } else {
            p.vx *= 0.92; p.vy *= 0.92; p.alpha *= 0.94; 
          }
        }
        p.x += p.vx; p.y += p.vy;
        const renderAlpha =
          s === 'idle'
            ? (p.alpha * (0.5 + Math.sin(time*0.003 + p.phase)*0.5) * (isNewYearEve ? 0.85 : 1))
            : p.alpha;
        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${renderAlpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over'
      animId = requestAnimationFrame(render);
    };
    render(0);
    return () => {
      window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('click', handleClick); cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="deck">
      <div
        className="slide"
        style={{ background: isNewYearEve ? '#04050B' : '#F5F5F0', cursor: 'none', position: 'relative' }}
      >
        <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Open GitHub repository"
          style={{
            position: 'absolute',
            right: 22,
            bottom: 18,
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 12,
            background: isNewYearEve ? 'rgba(5, 6, 13, 0.45)' : 'rgba(245, 245, 240, 0.7)',
            border: isNewYearEve ? '1px solid rgba(236, 239, 244, 0.18)' : '1px solid rgba(46, 52, 64, 0.16)',
            boxShadow: isNewYearEve ? '0 10px 28px rgba(0, 0, 0, 0.35)' : '0 8px 24px rgba(46, 52, 64, 0.10)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: isNewYearEve ? '#ECEFF4' : '#2E3440',
            zIndex: 10,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            e.preventDefault()
            window.open(REPO_URL, '_blank', 'noopener,noreferrer')
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.523 2 12.101c0 4.457 2.865 8.236 6.839 9.571.5.093.682-.218.682-.484 0-.238-.009-.868-.014-1.704-2.782.61-3.369-1.358-3.369-1.358-.454-1.169-1.11-1.48-1.11-1.48-.908-.63.069-.618.069-.618 1.004.072 1.533 1.044 1.533 1.044.892 1.548 2.341 1.101 2.91.842.091-.658.349-1.101.635-1.355-2.22-.256-4.555-1.123-4.555-4.999 0-1.105.39-2.009 1.029-2.716-.103-.257-.446-1.29.098-2.688 0 0 .84-.272 2.75 1.037A9.4 9.4 0 0 1 12 6.823a9.4 9.4 0 0 1 2.507.344c1.909-1.309 2.748-1.037 2.748-1.037.546 1.398.203 2.431.1 2.688.64.707 1.028 1.611 1.028 2.716 0 3.886-2.339 4.74-4.566 4.991.359.313.678.93.678 1.874 0 1.353-.012 2.444-.012 2.776 0 .268.18.58.688.482A10.01 10.01 0 0 0 22 12.101C22 6.523 17.523 2 12 2z" />
          </svg>
        </a>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <h1
            style={{
              fontSize: '14vw',
              fontWeight: 900,
              color: isNewYearEve ? '#ECEFF4' : '#2E3440',
              opacity: isNewYearEve ? (step === 'idle' ? 0.075 : step === 'gather' ? 0.06 : 0.045) : 0.04,
              letterSpacing: '0.18em',
              transform: 'translateX(6vw)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {watermarkText}
          </h1>
        </div>
      </div>
    </div>
  );
}
