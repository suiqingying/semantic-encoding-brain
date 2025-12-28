import React, { useEffect, useState, useRef } from 'react'
import { COLORS } from './_nord'

const NUM_PARTICLES = 20000;

export default function Slide20Thanks() {
  const [step, setStep] = useState('idle'); 
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const targetsRef = useRef([]);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const stepRef = useRef('idle');
  const bgElementsRef = useRef({ stars: [], waves: [], dataStreams: [], lines: [] });

  const credits = {
    name: "THANK YOU",
    title: "Decoding the Semantic Mind",
    info: "suiqingying  |  UCAS"
  };

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const setupTargets = (w, h) => {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = w; tCanvas.height = h;
      const tCtx = tCanvas.getContext('2d');
      tCtx.fillStyle = 'black'; 
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      const baseFontSize = w / 1366;
      tCtx.font = `bold ${Math.floor(180 * baseFontSize)}px system-ui`;
      tCtx.fillText(credits.name, w / 2, h / 2 - (85 * baseFontSize));
      tCtx.font = `${Math.floor(52 * baseFontSize)}px system-ui`;
      tCtx.fillText(credits.title, w / 2, h / 2 + (55 * baseFontSize));
      tCtx.font = `${Math.floor(28 * baseFontSize)}px system-ui`;
      tCtx.fillText(credits.info, w / 2, h / 2 + (130 * baseFontSize));
      const data = tCtx.getImageData(0, 0, w, h).data;
      const pts = [];
      const gap = 2.0; 
      for (let y = gap; y < h - gap; y += gap) {
        for (let x = gap; x < w - gap; x += gap) {
          const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
          if (data[idx + 3] > 128) {
            const isEdge = data[((Math.floor(y)-1) * w + Math.floor(x)) * 4 + 3] < 128 || data[((Math.floor(y)+1) * w + Math.floor(x)) * 4 + 3] < 128 || data[(Math.floor(y) * w + (Math.floor(x)-1)) * 4 + 3] < 128 || data[(Math.floor(y) * w + (Math.floor(x)+1)) * 4 + 3] < 128;
            if (isEdge || Math.random() < 0.25) pts.push({ x, y, isEdge });
          }
        }
      }
      return pts.sort((a, b) => (b.isEdge ? 1 : -1) - (a.isEdge ? 1 : -1));
    };

    const setupBG = (w, h) => {
      const stars = Array.from({ length: 300 }).map(() => ({
        x: Math.random() * w, y: Math.random() * h,
        size: Math.random() * 2.5 + 1.0,
        baseAlpha: Math.random() * 0.2 + 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02
      }));
      const dataStreams = Array.from({ length: 14 }).map((_, i) => ({
        x: i < 7 ? (Math.random()*250) : (w - Math.random()*250),
        y: Math.random() * h,
        speed: 0.2 + Math.random() * 1.0,
        chars: Array.from({ length: 12 }).map(() => Math.floor(Math.random()*16).toString(16).toUpperCase())
      }));
      const lines = Array.from({ length: 25 }).map(() => ({
        p1: Math.floor(Math.random() * 300),
        p2: Math.floor(Math.random() * 300),
        opacity: Math.random() * 0.15 + 0.05
      }));
      bgElementsRef.current = { stars, dataStreams, lines };
    };

    const initParticles = (w, h, targetPts) => {
      const colorBases = [
        'rgba(46, 52, 64, ', 
        'rgba(59, 66, 82, ',  
        'rgba(45, 109, 166, ', 
        'rgba(191, 97, 106, ', 
        'rgba(208, 135, 112, '  
      ];
      return Array.from({ length: NUM_PARTICLES }).map((_, i) => {
        const hasTarget = i < targetPts.length;
        const target = hasTarget ? targetPts[i] : null;
        return {
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.0, vy: (Math.random() - 0.5) * 1.0,
          size: target?.isEdge ? 1.4 : (hasTarget ? 2.0 : (Math.random() * 2.0 + 0.8)),
          alpha: hasTarget ? (target.isEdge ? 0.95 : 0.65) : (Math.random() * 0.3 + 0.15),
          colorBase: colorBases[i % colorBases.length],
          target: target,
          phase: Math.random() * Math.PI * 2
        };
      });
    };

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
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
      
      // Use standard composite for better performance
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);

      // --- 1. Fast Background ---
      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      grad.addColorStop(0, '#FFFFFF'); 
      grad.addColorStop(1, '#F5F5F0'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // --- 2. BG Elements ---
      bgElementsRef.current.stars.forEach(star => {
        const twinkle = star.baseAlpha + Math.sin(time * star.speed + star.phase) * 0.1;
        ctx.fillStyle = `rgba(76, 86, 106, ${Math.max(0.05, twinkle)})`; 
        ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.lineWidth = 1.2;
      bgElementsRef.current.lines.forEach(l => {
        const s1 = bgElementsRef.current.stars[l.p1];
        const s2 = bgElementsRef.current.stars[l.p2];
        ctx.strokeStyle = `rgba(129, 161, 193, ${l.opacity})`;
        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
      });

      ctx.font = 'bold 18px ui-monospace, monospace';
      bgElementsRef.current.dataStreams.forEach(stream => {
        stream.y += stream.speed; if(stream.y > h) stream.y = -300;
        stream.chars.forEach((char, idx) => {
          ctx.fillStyle = `rgba(46, 52, 64, ${0.35 - (idx * 0.03)})`; 
          ctx.fillText(char, stream.x, stream.y + idx*24);
        });
      });

      // --- 3. Grid ---
      ctx.strokeStyle = 'rgba(46, 52, 64, 0.03)';
      ctx.lineWidth = 1;
      const gapSize = 120;
      for(let x=0; x<w; x+=gapSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for(let y=0; y<h; y+=gapSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      // --- 4. Dynamic Particles (Optimized) ---
      sm.x += (mouseRef.current.x - sm.x) * 0.12; sm.y += (mouseRef.current.y - sm.y) * 0.12;

      particlesRef.current.forEach((p) => {
        if (s === 'idle') {
          p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
          p.vx *= 0.98; p.vy *= 0.98;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        } else if (s === 'gather') {
          const dx = sm.x - p.x, dy = sm.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const angle = Math.atan2(dy, dx);
          const force = Math.max(0, 1 - dist / 1000);
          p.vx += Math.cos(angle) * force * 1.6 + Math.cos(angle - Math.PI/2) * force * 0.9;
          p.vy += Math.sin(angle) * force * 1.6 + Math.sin(angle - Math.PI/2) * force * 0.9;
          p.vx *= dist < 40 ? 0.75 : 0.93; p.vy *= dist < 40 ? 0.75 : 0.93;
        } else if (s === 'crystallize') {
          if (p.target) {
            p.x += (p.target.x - p.x) * 0.18; p.y += (p.target.y - p.y) * 0.18;
            p.vx = 0; p.vy = 0;
            p.alpha += ((p.target.isEdge ? 0.98 : 0.65) - p.alpha) * 0.1;
          } else {
            p.vx *= 0.92; p.vy *= 0.92; p.alpha *= 0.92; 
          }
        }
        if (s !== 'crystallize' || !p.target) { p.x += p.vx; p.y += p.vy; }
        const alpha = s === 'idle' ? (p.alpha * (0.5 + Math.sin(time*0.003 + p.phase)*0.5)) : p.alpha;
        ctx.fillStyle = p.colorBase + alpha + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
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
      <div className="slide" style={{ background: '#F5F5F0', cursor: 'none', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
        {step === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <h1 style={{ fontSize: '15vw', fontWeight: 900, color: '#2E3440', opacity: 0.04, letterSpacing: '0.2em' }}>THANKS</h1>
          </div>
        )}
      </div>
    </div>
  );
}