import React, { useEffect, useState, useRef } from 'react'
import { COLORS } from './_nord'

const NUM_PARTICLES = 20000;

export default function Slide15Thanks() {
  const [step, setStep] = useState('idle'); 
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const targetsRef = useRef([]);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const stepRef = useRef('idle');
  const bgElementsRef = useRef({ bokeh: [], dataStreams: [] });

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
            } else if (Math.random() < 0.4) {
              fillPts.push({ x, y, isEdge: false });
            }
          }
        }
      }
      // Combine: Ensure edges are handled first, then fill
      return [...edgePts, ...fillPts].slice(0, NUM_PARTICLES);
    };

    const setupBG = (w, h) => {
      const bokeh = Array.from({ length: 40 }).map(() => ({
        x: Math.random() * w, y: Math.random() * h,
        size: Math.random() * 150 + 50,
        color: Math.random() > 0.5 ? 'rgba(136, 192, 208, 0.05)' : 'rgba(235, 203, 139, 0.04)',
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2
      }));
      const dataStreams = Array.from({ length: 12 }).map((_, i) => ({
        x: i < 6 ? (Math.random()*200 + 50) : (w - Math.random()*200 - 50),
        y: Math.random() * h,
        speed: 0.3 + Math.random() * 1.5,
        chars: Array.from({ length: 10 }).map(() => Math.floor(Math.random()*16).toString(16).toUpperCase())
      }));
      bgElementsRef.current = { bokeh, dataStreams };
    };

    const initParticles = (w, h, targetPts) => {
      const colorBases = [
        { r: 46, g: 52, b: 64 },   // Nord 0
        { r: 45, g: 109, b: 166 }, // Nord Blue
        { r: 180, g: 142, b: 173 }, // Nord Purple
        { r: 208, g: 135, b: 112 }  // Nord Orange
      ];
      return Array.from({ length: NUM_PARTICLES }).map((_, i) => {
        const target = i < targetPts.length ? targetPts[i] : null;
        const c = colorBases[i % colorBases.length];
        return {
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
          size: target?.isEdge ? 1.4 : (target ? 2.4 : (Math.random() * 2.5 + 1.0)),
          alpha: target ? (target.isEdge ? 0.98 : 0.6) : (Math.random() * 0.3 + 0.1),
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
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);

      // --- 1. Background Layer ---
      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, '#F5F5F0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      bgElementsRef.current.bokeh.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if(b.x < -150) b.x = w+150; if(b.x > w+150) b.x = -150;
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
      });

      // --- 2. Data Streams ---
      ctx.font = 'bold 16px ui-monospace, monospace';
      bgElementsRef.current.dataStreams.forEach(stream => {
        stream.y += stream.speed; if(stream.y > h) stream.y = -200;
        stream.chars.forEach((char, idx) => {
          ctx.fillStyle = `rgba(46, 52, 64, ${0.3 - (idx * 0.02)})`;
          ctx.fillText(char, stream.x, stream.y + idx*22);
        });
      });

      // --- 3. Interactive Particles ---
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
        const renderAlpha = s === 'idle' ? (p.alpha * (0.5 + Math.sin(time*0.003 + p.phase)*0.5)) : p.alpha;
        let colorStr = `rgba(${p.color.r},${p.color.g},${p.color.b},${renderAlpha})`;
        if (s === 'crystallize' && p.target && Math.sqrt(p.vx*p.vx + p.vy*p.vy) > 2) {
          colorStr = `rgba(208, 135, 112, ${renderAlpha})`; 
        }
        ctx.fillStyle = colorStr;
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
