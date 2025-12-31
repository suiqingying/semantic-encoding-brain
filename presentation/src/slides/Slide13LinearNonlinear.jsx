import { useMemo } from 'react'
import { Card, COLORS, hash01, NordSlide, Text, Title } from './_nord'

function ScatterFigure() {
  const vb = { w: 1100, h: 520 }
  const pad = { l: 64, r: 40, t: 40, b: 56 }
  const gap = 42
  const panelW = (vb.w - pad.l - pad.r - gap) / 2
  const panelH = vb.h - pad.t - pad.b

  const data = useMemo(() => {
    const pts = Array.from({ length: 34 }).map((_, i) => {
      const x = 0.05 + (i / 33) * 0.90
      const yBase = 0.18 + 0.62 * (0.35 * x + 0.65 * (0.5 + 0.5 * Math.sin((x * 1.35 + 0.12) * Math.PI)))
      const noise = (hash01(i, 19) - 0.5) * 0.10
      const y = Math.max(0.05, Math.min(0.95, yBase + noise))
      return { x, y }
    })

    // least squares line y = a x + b
    const n = pts.length
    const sx = pts.reduce((s, p) => s + p.x, 0) 
    const sy = pts.reduce((s, p) => s + p.y, 0)
    const sxx = pts.reduce((s, p) => s + p.x * p.x, 0)
    const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
    const denom = n * sxx - sx * sx
    const a = denom === 0 ? 0 : (n * sxy - sx * sy) / denom
    const b = n === 0 ? 0 : (sy - a * sx) / n

    const curve = Array.from({ length: 48 }).map((_, i) => {
      const x = i / 47
      const y = 0.18 + 0.62 * (0.35 * x + 0.65 * (0.5 + 0.5 * Math.sin((x * 1.35 + 0.12) * Math.PI)))
      return { x, y: Math.max(0.05, Math.min(0.95, y)) }
    })

    return { pts, linear: { a, b }, curve }
  }, [])

  const panel = (x0, title, drawFit) => {
    const plot = { x: x0 + 46, y: pad.t + 22, w: panelW - 72, h: panelH - 52 }
    const px = (x) => plot.x + x * plot.w
    const py = (y) => plot.y + (1 - y) * plot.h

    return (
      <g>
        <rect x={x0} y={pad.t} width={panelW} height={panelH} rx="18" fill="rgba(255,255,255,0.78)" stroke="rgba(35,48,68,0.14)" />
        <text x={x0 + 18} y={pad.t + 30} fontSize="18" fontWeight="950" fill={COLORS.text}>
          {title}
        </text>

        {/* axes */}
        <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx="14" fill="rgba(35,48,68,0.03)" stroke="rgba(35,48,68,0.10)" />
        {[0.25, 0.5, 0.75].map((t) => (
          <g key={t}>
            <line x1={px(t)} x2={px(t)} y1={plot.y} y2={plot.y + plot.h} stroke="rgba(35,48,68,0.08)" strokeWidth="1" />
            <line x1={plot.x} x2={plot.x + plot.w} y1={py(t)} y2={py(t)} stroke="rgba(35,48,68,0.08)" strokeWidth="1" />
          </g>
        ))}

        {/* points */}
        {data.pts.map((p, i) => (
          <circle key={i} cx={px(p.x)} cy={py(p.y)} r="5.2" fill="rgba(255,255,255,0.92)" stroke="rgba(35,48,68,0.32)" strokeWidth="2.2" />
        ))}

        {drawFit({ plot, px, py })}

      </g>
    )
  }

  const leftX = pad.l
  const rightX = pad.l + panelW + gap

  return (
    <svg viewBox={`0 0 ${vb.w} ${vb.h}`} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Scatter figure for linear vs nonlinear">
      {panel(leftX, '线性', ({ px, py }) => {
        const y0 = data.linear.a * 0 + data.linear.b
        const y1 = data.linear.a * 1 + data.linear.b
        return (
          <path
            d={`M ${px(0)} ${py(Math.max(0, Math.min(1, y0)))} L ${px(1)} ${py(Math.max(0, Math.min(1, y1)))}`}
            stroke="rgba(35,48,68,0.45)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        )
      })}

      {panel(rightX, '非线性', ({ px, py }) => {
        const d = data.curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x)} ${py(p.y)}`).join(' ')
        return <path d={d} stroke={COLORS.warning} strokeWidth="5" fill="none" strokeLinecap="round" />
      })}
    </svg>
  )
}

export default function Slide13LinearNonlinear() {
  const linear = 0.58
  const nonlinear = 0.76
  const delta = nonlinear - linear

  return (
    <NordSlide>
      <Title stagger={0} style={{ marginBottom: 14 }}>
        线性 vs 非线性
      </Title>
      <Text style={{ marginTop: 0, fontSize: 22, maxWidth: 980 }}>
        同一组特征下：线性映射只能表达全局直线关系；非线性映射可表达弯曲关系。
        <br />
        非线性可用“相似度加权”的方式实现更灵活的映射。
      </Text>

      <Text style={{ marginTop: 10, fontSize: 18, color: COLORS.textDim }}>
        线性：{linear.toFixed(2)}　非线性：<span style={{ color: COLORS.error, fontWeight: 900 }}>{nonlinear.toFixed(2)}</span>　提升：
        <span style={{ color: COLORS.error, fontWeight: 900 }}>+{delta.toFixed(2)}</span>
      </Text>

      <Card style={{ padding: 18, height: 560, marginTop: 14 }}>
        <ScatterFigure />
      </Card>
    </NordSlide>
  )
}
