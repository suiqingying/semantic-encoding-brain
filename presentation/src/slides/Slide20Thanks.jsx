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
  const bgElementsRef = useRef({ lines: [], symbols: [] });

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

    // 1. Edge-Prioritized Target Sampling
    const setupTargets = (w, h) => {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = w; tCanvas.height = h;
      const tCtx = tCanvas.getContext('2d');
      tCtx.fillStyle = 'white';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      
      const baseFontSize = w / 1366;
      const nameSize = Math.floor(180 * baseFontSize);
      const titleSize = Math.floor(52 * baseFontSize);
      const infoSize = Math.floor(28 * baseFontSize);

      tCtx.font = `bold ${nameSize}px system-ui`;
      tCtx.fillText(credits.name, w / 2, h / 2 - (85 * baseFontSize));
      tCtx.font = `${titleSize}px system-ui`;
      tCtx.fillText(credits.title, w / 2, h / 2 + (55 * baseFontSize));
      tCtx.font = `${infoSize}px system-ui`;
      tCtx.fillText(credits.info, w / 2, h / 2 + (130 * baseFontSize));
      
      const data = tCtx.getImageData(0, 0, w, h).data;
      const pts = [];
      const gap = 2; 
      
      for (let y = gap; y < h - gap; y += gap) {
        for (let x = gap; x < w - gap; x += gap) {
          const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
          if (data[idx + 3] > 128) {
            // Edge detection: check if neighbors are empty
            const isEdge = 
              data[((Math.floor(y)-1) * w + Math.floor(x)) * 4 + 3] < 128 ||
              data[((Math.floor(y)+1) * w + Math.floor(x)) * 4 + 3] < 128 ||
              data[(Math.floor(y) * w + (Math.floor(x)-1)) * 4 + 3] < 128 ||
              data[(Math.floor(y) * w + (Math.floor(x)+1)) * 4 + 3] < 128;

            if (isEdge || Math.random() < 0.25) { // Prioritize edge, sparse interior
              pts.push({ x, y, isEdge });
            }
          }
        }
      }
      return pts.sort((a, b) => (b.isEdge ? 1 : -1) - (a.isEdge ? 1 : -1)); // Edges first
    };

    // 2. Setup Background Decorative Elements
    const setupBG = (w, h) => {
      const lines = [];
      for(let i=0; i<15; i++) {
        lines.push({
          x1: Math.random() * w, y1: Math.random() * h,
          x2: Math.random() * w, y2: Math.random() * h,
          alpha: Math.random() * 0.05 + 0.02
        });
      }
      const symbols = ['β', 'ρ', 'ε', '∑', 'TR', '4096', 'BOLD', 'λ'];
      const symList = Array.from({ length: 12 }).map(() => ({
        text: symbols[Math.floor(Math.random() * symbols.length)],
        x: Math.random() * w, y: Math.random() * h,
        size: Math.random() * 15 + 10,
        vx: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.1 + 0.05
      }));
      bgElementsRef.current = { lines, symbols: symList };
    };

    const initParticles = (w, h, targetPts) => {
      const colorBases = ['rgba(136, 192, 208, ', 'rgba(143, 188, 187, ', 'rgba(236, 239, 244, ', 'rgba(129, 161, 193, ', 'rgba(180, 142, 173, '];
      return Array.from({ length: NUM_PARTICLES }).map((_, i) => {
        const hasTarget = i < targetPts.length;
        const target = hasTarget ? targetPts[i] : null;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          // Sharper outlines: Edge particles are smaller and brighter
          size: target?.isEdge ? 1.2 : (Math.random() * 2.0 + 0.8),
          alpha: Math.random() * 0.5 + 0.3,
          colorBase: colorBases[i % colorBases.length],
          target: target,
          phase: Math.random() * Math.PI * 2
        };
      });
    };

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      targetsRef.current = setupTargets(w, h);
      setupBG(w, h);
      particlesRef.current = initParticles(w, h, targetsRef.current);
    };

    resize();
    window.addEventListener('resize', resize);
    const handleMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleClick = () => setStep(curr => (curr === 'idle' ? 'gather' : curr === 'gather' ? 'crystallize' : 'idle'));
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('click', handleClick);

    const sm = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    const render = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const s = stepRef.current;
      ctx.clearRect(0, 0, w, h);

      // --- 1. Background Gradient ---
      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      grad.addColorStop(0, '#1A202C'); grad.addColorStop(1, '#0B0E14');
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(0, 0, w, h);

      // --- 2. Decorative Symbols & Constellation Lines ---
      ctx.font = '12px ui-monospace, monospace';
      bgElementsRef.current.symbols.forEach(sym => {
        sym.x += sym.vx;
        if(sym.x < 0) sym.x = w; if(sym.x > w) sym.x = 0;
        ctx.fillStyle = `rgba(136, 192, 208, ${sym.alpha})`;
        ctx.fillText(sym.text, sym.x, sym.y);
      });
      ctx.strokeStyle = 'rgba(136, 192, 208, 0.04)';
      bgElementsRef.current.lines.forEach(l => {
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      });

      // --- 3. Grid ---
      ctx.strokeStyle = 'rgba(136, 192, 208, 0.02)';
      const gridGap = 120;
      for(let x=0; x<w; x+=gridGap) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for(let y=0; y<h; y+=gridGap) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      // --- 4. Dynamic Particles ---
      ctx.globalCompositeOperation = 'screen';
      sm.x += (mouseRef.current.x - sm.x) * 0.1;
      sm.y += (mouseRef.current.y - sm.y) * 0.1;

      particlesRef.current.forEach((p) => {
        if (s === 'idle') {
          p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
          p.vx *= 0.98; p.vy *= 0.98;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
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
            p.x += (p.target.x - p.x) * 0.15; p.y += (p.target.y - p.y) * 0.15;
            p.vx = 0; p.vy = 0;
            p.alpha += ((p.target.isEdge ? 0.95 : 0.6) - p.alpha) * 0.1;
          } else {
            p.vx *= 0.92; p.vy *= 0.92; p.alpha *= 0.92; 
          }
        }
        if (s !== 'crystallize' || !p.target) { p.x += p.vx; p.y += p.vy; }
        const alpha = s === 'idle' ? (p.alpha * (0.5 + Math.sin(Date.now()*0.003 + p.phase)*0.5)) : p.alpha;
        ctx.fillStyle = p.colorBase + alpha + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="deck">
      <div className="slide" style={{ background: '#0B0E14', cursor: 'none', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
        {step === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <h1 style={{ fontSize: '15vw', fontWeight: 900, color: '#ECEFF4', opacity: 0.04, letterSpacing: '0.2em' }}>THANKS</h1>
          </div>
        )}
      </div>
    </div>
  );
}
