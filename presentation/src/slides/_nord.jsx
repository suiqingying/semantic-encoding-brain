import { useEffect, useState } from 'react'

export const COLORS = {
  bg: '#f5f5f0',
  bgLight: '#efe9df',
  text: '#233044',
  textDim: '#4b5a6b',
  accent1: '#2d6da6',
  accent2: '#205081',
  accent3: '#4a7fb0',
  success: '#2d6da6',
  warning: '#d98a2c',
  error: '#a65a1e',
  purple: '#4c5b6b',
}

export function NordSlide({ children, className = '' }) {
  return (
    <div className="deck">
      <div className={`slide nordSlide ${className}`}>
        <div className="nordAurora" aria-hidden="true">
          <div className="nordGlow nordGlowA" />
          <div className="nordGlow nordGlowB" />
        </div>
        <div className="nordContent">{children}</div>
      </div>
    </div>
  )
}

function withStaggerStyle(stagger, style) {
  const out = { ...(style || {}) }
  if (typeof stagger === 'number' && Number.isFinite(stagger)) {
    out['--stagger-delay'] = `${Math.max(0, stagger) * 200}ms`
  }
  return out
}

export function Title({ children, className = '', stagger, style, ...props }) {
  const staggered = withStaggerStyle(stagger, style)
  return (
    <h2
      className={['nordTitle', className].filter(Boolean).join(' ')}
      data-stagger={typeof stagger === 'number' ? '' : undefined}
      style={staggered}
      {...props}
    >
      {children}
    </h2>
  )
}

export function SubTitle({ children, className = '', stagger, style, ...props }) {
  const staggered = withStaggerStyle(stagger, style)
  return (
    <h3
      className={['nordSubTitle', className].filter(Boolean).join(' ')}
      data-stagger={typeof stagger === 'number' ? '' : undefined}
      style={staggered}
      {...props}
    >
      {children}
    </h3>
  )
}

export function Text({ children, className = '', stagger, style, ...props }) {
  const staggered = withStaggerStyle(stagger, style)
  return (
    <p
      className={['nordText', className].filter(Boolean).join(' ')}
      data-stagger={typeof stagger === 'number' ? '' : undefined}
      style={staggered}
      {...props}
    >
      {children}
    </p>
  )
}

export function Card({ children, className = '', style }) {
  return (
    <div className={`nordCard ${className}`} style={style}>
      {children}
    </div>
  )
}

export function ChartBar({ label, value, color, max = 1, highlight = false, note = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const width = mounted ? pct : 0
  return (
    <div className={['nordChartRow', highlight ? 'nordChartRowHighlight' : ''].filter(Boolean).join(' ')}>
      <div className="nordChartHeader">
        <span>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {highlight && note ? <span className="nordChartNote">{note}</span> : null}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="nordChartTrack">
        <div className="nordChartFill" style={{ width: `${width}%`, backgroundColor: color, '--fill-color': color }} />
      </div>
    </div>
  )
}

export function DotItem({ color, children }) {
  return (
    <li className="nordDotItem">
      <span className="nordDot" style={{ background: color }} />
      <span>{children}</span>
    </li>
  )
}

export function Stagger({ children, className = '', style, ...props }) {
  return (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  )
}

export function staggerDelay(step) {
  return { '--stagger-delay': `${Math.max(0, step) * 200}ms` }
}

export function hash01(i, seed = 1337) {
  // Deterministic [0,1) hash; keeps visual "randomness" stable across renders.
  let x = (i + 1) * 0x9e3779b1
  x ^= seed * 0x85ebca6b
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d)
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}
