import { COLORS, NordSlide, Text, Title } from './_nord'
import { useMemo, useState } from 'react'

function catmullRomToBezier(points) {
  if (points.length < 2) return ''
  const d = [`M ${points[0][0]} ${points[0][1]}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`)
  }
  return d.join(' ')
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

export default function Slide12LayerAnalysis() {
  const [activePoint, setActivePoint] = useState(null)

  const series = [
    { name: 'Qwen-7B', color: '#57a2ff', peak: 0.58, values: [0.037, 0.149, 0.372, 0.576, 0.55, 0.416] },
    { name: 'GPT2-XL', color: '#ffb04a', peak: 0.42, values: [0.03, 0.163, 0.355, 0.42, 0.355, 0.251] },
    { name: 'BERT-Large', color: 'rgba(255,255,255,0.88)', peak: 0.3, values: [0.027, 0.16, 0.279, 0.3, 0.256, 0.147] },
  ]

  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1]
  const xSamples = xTicks
  const yMax = 0.65

  const vb = { w: 1200, h: 540 }
  const pad = { l: 110, r: 60, t: 80, b: 100 }
  const plot = { x: pad.l, y: pad.t, w: vb.w - pad.l - pad.r, h: vb.h - pad.t - pad.b }

  const x2px = (x) => plot.x + clamp01(x) * plot.w
  const y2px = (y) => plot.y + (1 - clamp01(y / yMax)) * plot.h

  const curves = useMemo(() => {
    return series.map((s) => {
      const pts = xSamples.map((x, i) => [x2px(x), y2px(s.values[i])])
      return { ...s, path: catmullRomToBezier(pts), pts }
    })
  }, [xSamples])

  const tooltip = useMemo(() => {
    if (!activePoint) return null
    const activeCurve = curves.find((c) => c.name === activePoint.series)
    if (!activeCurve) return null
    const { index } = activePoint
    const x = xSamples[index]
    const y = activeCurve.values[index]
    const px = activeCurve.pts[index][0]
    const py = activeCurve.pts[index][1]
    return { series: activeCurve.name, color: activeCurve.color, x, y, px, py }
  }, [activePoint, curves, xSamples])

  const tooltipLeftPct = tooltip ? (tooltip.px / vb.w) * 100 : 0
  const tooltipTopPct = tooltip ? (tooltip.py / vb.h) * 100 : 0

  return (
    <NordSlide>
      <Title style={{ marginBottom: 18 }}>层级深度解析：层级如何影响预测能力？</Title>

      <div style={{ position: 'relative', width: '100%', height: 520 }}>
        <div style={{ position: 'absolute', left: 0, top: -2, fontSize: 16, fontWeight: 900, color: COLORS.text }}>
          文本模型层级与预测性能关系
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, fontSize: 13, color: COLORS.textDim, opacity: 0.9 }}>
          点击节点查看数值
        </div>

        <svg viewBox={`0 0 ${vb.w} ${vb.h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* grid */}
          {xTicks.map((t) => (
            <line
              key={`x-${t}`}
              x1={x2px(t)}
              x2={x2px(t)}
              y1={plot.y}
              y2={plot.y + plot.h}
              stroke="rgba(35,48,68,0.14)"
              strokeWidth="1"
            />
          ))}
          {[0, 0.2, 0.4, 0.6].map((t) => (
            <line
              key={`y-${t}`}
              x1={plot.x}
              x2={plot.x + plot.w}
              y1={y2px(t)}
              y2={y2px(t)}
              stroke="rgba(35,48,68,0.12)"
              strokeWidth="1"
            />
          ))}

          {/* axes */}
          <line x1={plot.x} x2={plot.x} y1={plot.y} y2={plot.y + plot.h} stroke="rgba(35,48,68,0.55)" strokeWidth="2" />
          <line x1={plot.x} x2={plot.x + plot.w} y1={plot.y + plot.h} y2={plot.y + plot.h} stroke="rgba(35,48,68,0.55)" strokeWidth="2" />

          {/* y ticks */}
          {[0, 0.2, 0.4, 0.6].map((t) => (
            <g key={`yt-${t}`}>
              <text x={plot.x - 10} y={y2px(t) + 5} fill={COLORS.textDim} fontSize="16" textAnchor="end">
                {t.toFixed(2)}
              </text>
            </g>
          ))}

          {/* x ticks */}
          {xTicks.map((t) => (
            <text key={`xt-${t}`} x={x2px(t)} y={plot.y + plot.h + 34} fill={COLORS.textDim} fontSize="16" textAnchor="middle">
              {t.toFixed(1)}
            </text>
          ))}

          {/* labels */}
          <text
            x={vb.w / 2}
            y={vb.h - 28}
            fill={COLORS.textDim}
            fontSize="18"
            textAnchor="middle"
          >
            标准化模型层深（0=Input，1=Output）
          </text>
          <g transform={`translate(34 ${vb.h / 2}) rotate(-90)`}>
            <text fill={COLORS.textDim} fontSize="18" textAnchor="middle">
              预测性能（Pearson&apos;s r）
            </text>
          </g>

          {/* curves */}
          {curves.map((c) => (
            <g key={c.name} filter="url(#softGlow)">
              <path d={c.path} fill="none" stroke={c.color} strokeWidth="5" strokeLinecap="round" />
            </g>
          ))}

          {/* clickable points (all series) */}
          {curves.flatMap((c) =>
            c.pts.map(([px, py], i) => {
              const selected = activePoint?.series === c.name && activePoint?.index === i
              const r = selected ? 8 : 6
              const sw = selected ? 4 : 3
              return (
                <g key={`pt-${c.name}-${i}`} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={px}
                    cy={py}
                    r={r + 9}
                    fill="rgba(0,0,0,0)"
                    onClick={() => setActivePoint({ series: c.name, index: i })}
                  />
                  <circle
                    cx={px}
                    cy={py}
                    r={r}
                    fill={COLORS.bg}
                    stroke={c.color}
                    strokeWidth={sw}
                    onClick={() => setActivePoint({ series: c.name, index: i })}
                  />
                </g>
              )
            })
          )}
        </svg>

        {/* legend */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 44,
            width: 250,
            borderRadius: 12,
            background: 'transparent',
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10, color: COLORS.text }}>模型</div>
          {series.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: s.color, boxShadow: `0 0 0 1px rgba(35,48,68,0.14) inset` }} />
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', color: COLORS.text }}>
                <span>{s.name}</span>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace', opacity: 0.65 }}>
                  peak {s.peak.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* tooltip */}
        {tooltip ? (
          <div
            style={{
              position: 'absolute',
              left: `${tooltipLeftPct}%`,
              top: `${tooltipTopPct}%`,
              transform: 'translate(18px, -50%)',
              borderRadius: 12,
              border: '1px solid rgba(35,48,68,0.14)',
              background: 'rgba(255,255,255,0.82)',
              padding: '10px 12px',
              minWidth: 190,
              boxShadow: '0 18px 44px rgba(35,48,68,0.16)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 900, color: COLORS.text, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: tooltip.color }} />
              <span>{tooltip.series}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: COLORS.textDim, fontSize: 13 }}>
              <span>层深</span>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace' }}>
                {tooltip.x.toFixed(1)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: COLORS.textDim, fontSize: 13, marginTop: 4 }}>
              <span>Pearson&apos;s r</span>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace' }}>
                {tooltip.y.toFixed(3)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 18 }}>
        <Text style={{ fontSize: 22, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 900, color: COLORS.text }}>关键洞察：</span>
          预测性能通常在<span className="kw kwA">中间层</span>达到峰值；越接近输出端并不一定越好，说明与大脑信号更匹配的是
          <span className="kw kwY">语义整合</span>后的抽象表征，而非低层局部特征。
        </Text>
      </div>
    </NordSlide>
  )
}
