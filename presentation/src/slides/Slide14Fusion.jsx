import { Card, COLORS, hash01, NordSlide, Text, Title } from './_nord'

function FusionFigure() {
  const W = 1100
  const H = 360

  const pad = 20
  const gap = 18
  const panelW = 200
  const panelH = 300
  const y0 = (H - panelH) / 2

  const panelX = (i) => pad + i * (panelW + gap)

  const panel = (x, title, subtitle, accent, children) => (
    <g>
      <rect x={x} y={y0} width={panelW} height={panelH} rx="16" fill="rgba(255,255,255,0.76)" stroke="rgba(35,48,68,0.14)" strokeWidth="1.2" />
      <rect x={x} y={y0} width={panelW} height={panelH} rx="16" fill="transparent" stroke={accent} strokeWidth="6" opacity="0.12" />
      <text x={x + 16} y={y0 + 30} fontSize="15" fontWeight="950" fill={COLORS.text}>
        {title}
      </text>
      <text x={x + 16} y={y0 + 50} fontSize="11.5" fill="rgba(35,48,68,0.58)">
        {subtitle}
      </text>
      <g transform={`translate(${x} ${y0})`}>{children}</g>
    </g>
  )

  const arrow = (x1, x2) => {
    const y = y0 + panelH / 2
    const mid = (x1 + x2) / 2
    return (
      <path
        d={`M ${x1} ${y} C ${mid} ${y}, ${mid} ${y}, ${x2} ${y}`}
        stroke="rgba(35,48,68,0.28)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        markerEnd="url(#figArrow)"
      />
    )
  }

  const heatmap = (x, y, w, h, rows, cols, base, seed) => {
    const cellW = w / cols
    const cellH = h / rows
    const cells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        const v = hash01(i, seed)
        const a = 0.08 + 0.75 * Math.pow(v, 1.7)
        cells.push(
          <rect
            key={`${seed}-${i}`}
            x={x + c * cellW}
            y={y + r * cellH}
            width={Math.max(0, cellW - 1.2)}
            height={Math.max(0, cellH - 1.2)}
            rx="2.2"
            fill={`rgba(${base}, ${a.toFixed(3)})`}
          />,
        )
      }
    }
    return cells
  }

  const brain = (x, y) => {
    return (
      <g transform={`translate(${x} ${y})`}>
        <path
          d="M115 22c-34 0-63 24-63 59 0 19 8 34 20 45-6 9-9 18-9 30 0 28 22 50 52 50 10 0 20-3 28-8 8 5 18 8 28 8 30 0 52-22 52-50 0-12-3-21-9-30 12-11 20-26 20-45 0-35-29-59-63-59-12 0-23 3-33 9-10-6-21-9-33-9Z"
          fill="rgba(255,255,255,0.65)"
          stroke="rgba(35,48,68,0.18)"
          strokeWidth="1.3"
        />
        <path
          d="M92 90c14-16 38-20 56-10 18 10 28 28 24 48-3 17-14 31-30 38-15 6-33 4-46-6-16-13-19-35-4-50Z"
          fill="rgba(45,109,166,0.12)"
        />
        <path d="M120 74c20 4 34 18 34 38" stroke="rgba(35,48,68,0.18)" strokeWidth="1.1" fill="none" />
        <path d="M98 132c10 18 30 26 52 22" stroke="rgba(35,48,68,0.18)" strokeWidth="1.1" fill="none" />
        <path d="M84 120c2-18 16-34 36-40" stroke="rgba(35,48,68,0.18)" strokeWidth="1.1" fill="none" />
        <circle cx="160" cy="110" r="26" fill="rgba(217,138,44,0.18)" />
        <circle cx="160" cy="110" r="14" fill="rgba(217,138,44,0.30)" />
      </g>
    )
  }

  const textPanel = panel(
    panelX(0),
    '文本（Text）',
    '语义 / 叙事结构',
    'rgba(45,109,166,0.30)',
    <g>
      <rect x={16} y={68} width={panelW - 32} height={46} rx="10" fill="rgba(35,48,68,0.04)" stroke="rgba(35,48,68,0.10)" />
      {Array.from({ length: 14 }).map((_, i) => {
        const v = hash01(i, 11)
        const w = 10 + v * 18
        return (
          <rect
            key={i}
            x={26 + i * 12}
            y={80 + (i % 2) * 14}
            width={w}
            height={10}
            rx="5"
            fill={`rgba(45,109,166, ${(0.12 + 0.55 * v).toFixed(3)})`}
          />
        )
      })}
      <text x={16} y={134} fontSize="11.5" fill="rgba(35,48,68,0.56)">
        语义嵌入示意
      </text>
      <rect x={16} y={146} width={panelW - 32} height={132} rx="12" fill="rgba(35,48,68,0.04)" stroke="rgba(35,48,68,0.10)" />
      {heatmap(24, 156, panelW - 48, 112, 8, 14, '45,109,166', 101)}
    </g>,
  )

  const audioPanel = panel(
    panelX(1),
    '音频（Audio）',
    '韵律 / 音素 / 节律',
    'rgba(74,127,176,0.30)',
    <g>
      <rect x={16} y={68} width={panelW - 32} height={210} rx="12" fill="rgba(35,48,68,0.04)" stroke="rgba(35,48,68,0.10)" />
      <text x={16} y={294} fontSize="11.5" fill="rgba(35,48,68,0.56)">
        声学谱图示意
      </text>
      {heatmap(24, 80, panelW - 48, 186, 18, 16, '74,127,176', 202)}
      <path
        d={() => {
          const x0 = 24
          const y0 = 220
          const w = panelW - 48
          const h = 36
          const pts = []
          const n = 28
          for (let i = 0; i <= n; i++) {
            const t = i / n
            const v = 0.2 + 0.8 * hash01(i, 303)
            const x = x0 + t * w
            const y = y0 + (1 - v) * h
            pts.push([x, y])
          }
          const d = [`M ${pts[0][0]} ${pts[0][1]}`]
          for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i][0]} ${pts[i][1]}`)
          return d.join(' ')
        }}
        stroke="rgba(217,138,44,0.55)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </g>,
  )

  const alignPanel = panel(
    panelX(2),
    '对齐（Align）',
    'TR / 延迟建模',
    'rgba(217,138,44,0.34)',
    <g>
      <rect x={16} y={68} width={panelW - 32} height={210} rx="12" fill="rgba(35,48,68,0.04)" stroke="rgba(35,48,68,0.10)" />
      <text x={16} y={294} fontSize="11.5" fill="rgba(35,48,68,0.56)">
        TR 时间窗示意
      </text>
      {Array.from({ length: 18 }).map((_, i) => {
        const v = 0.25 + 0.75 * hash01(i, 404)
        const h = 24 + v * 92
        const x = 26 + i * 9
        const y = 254 - h
        const active = i >= 7 && i <= 10
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={6}
            height={h}
            rx="3"
            fill={active ? 'rgba(217,138,44,0.40)' : 'rgba(35,48,68,0.14)'}
            stroke={active ? 'rgba(217,138,44,0.55)' : 'transparent'}
          />
        )
      })}
      <rect x={26 + 7 * 9 - 4} y={94} width={(10 - 7 + 1) * 9 + 8} height={172} rx="12" fill="rgba(217,138,44,0.08)" stroke="rgba(217,138,44,0.25)" />
      <path
        d="M 28 122 C 66 90, 96 172, 128 138 C 150 116, 166 126, 176 146"
        transform={`translate(${panelW - 220} 0)`}
        stroke="rgba(45,109,166,0.35)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <text x={panelW - 112} y={110} fontSize="11" fill="rgba(35,48,68,0.55)">
        FIR kernel
      </text>
    </g>,
  )

  const fusePanel = panel(
    panelX(3),
    '融合（Fuse）',
    '统一表征',
    'rgba(217,138,44,0.34)',
    <g>
      <rect x={16} y={68} width={panelW - 32} height={210} rx="12" fill="rgba(35,48,68,0.04)" stroke="rgba(35,48,68,0.10)" />
      <text x={16} y={294} fontSize="11.5" fill="rgba(35,48,68,0.56)">
        Feature matrix
      </text>
      <rect x={24} y={84} width={panelW - 48} height={118} rx="10" fill="rgba(255,255,255,0.60)" stroke="rgba(35,48,68,0.10)" />
      {heatmap(32, 92, (panelW - 64) * 0.55, 102, 8, 8, '45,109,166', 505)}
      <path d={`M ${24 + (panelW - 48) * 0.55} 86 V ${84 + 118 - 2}`} stroke="rgba(35,48,68,0.12)" strokeWidth="2" />
      {heatmap(32 + (panelW - 64) * 0.55, 92, (panelW - 64) * 0.45, 102, 8, 6, '74,127,176', 606)}

      <rect x={24} y={214} width={panelW - 48} height={50} rx="10" fill="rgba(255,255,255,0.60)" stroke="rgba(35,48,68,0.10)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const v = 0.1 + 0.9 * hash01(i, 707)
        return <circle key={i} cx={34 + i * 12} cy={238} r={2.5 + v * 3.2} fill="rgba(217,138,44,0.42)" />
      })}
      <text x={24} y={212} fontSize="11" fill="rgba(35,48,68,0.55)">
        投影示意
      </text>
    </g>,
  )

  const brainPanel = panel(
    panelX(4),
    '大脑（Brain）',
    '预测 / 映射',
    'rgba(35,48,68,0.22)',
    <g>
      <rect x={16} y={68} width={panelW - 32} height={210} rx="12" fill="rgba(35,48,68,0.04)" stroke="rgba(35,48,68,0.10)" />
      <text x={16} y={294} fontSize="11.5" fill="rgba(35,48,68,0.56)">
        皮层映射示意
      </text>
      {brain(6, 70)}
      <g transform={`translate(${panelW - 178} 232)`}>
        <rect x={0} y={0} width={152} height={34} rx="10" fill="rgba(255,255,255,0.65)" stroke="rgba(35,48,68,0.10)" />
        <rect x={10} y={14} width={80} height={8} rx="999" fill="rgba(35,48,68,0.08)" />
        <rect x={10} y={14} width={80} height={8} rx="999" fill="url(#brainGrad)" />
        <text x={98} y={22} fontSize="11.5" fill="rgba(35,48,68,0.58)">
          弱 → 强
        </text>
      </g>
    </g>,
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fusionFigure" role="img" aria-label="Multimodal fusion visualization (illustration)">
      <defs>
        <marker id="figArrow" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(35,48,68,0.30)" />
        </marker>
        <linearGradient id="brainGrad" x1="0" x2="1">
          <stop offset="0%" stopColor={COLORS.accent1} stopOpacity="0.30" />
          <stop offset="100%" stopColor={COLORS.warning} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {arrow(panelX(0) + panelW + 4, panelX(1) - 4)}
      {arrow(panelX(1) + panelW + 4, panelX(2) - 4)}
      {arrow(panelX(2) + panelW + 4, panelX(3) - 4)}
      {arrow(panelX(3) + panelW + 4, panelX(4) - 4)}

      {textPanel}
      {audioPanel}
      {alignPanel}
      {fusePanel}
      {brainPanel}
    </svg>
  )
}

export default function Slide14Fusion() {
  return (
    <NordSlide>
      <Title stagger={0} style={{ marginBottom: 10 }}>
        展望：多模态融合
      </Title>
      <Text style={{ marginTop: 0, maxWidth: 980, fontSize: 24 }}>语义 × 声学：联合表征 → 脑响应预测</Text>

      <Card style={{ padding: 18, marginTop: 18 }}>
        <FusionFigure />
      </Card>

      <style>{`
        .fusionFigure{width:100%;height:360px;display:block}
        @media (prefers-reduced-motion: reduce){
          .fusionFigure path[marker-end]{transition:none}
        }
      `}</style>
    </NordSlide>
  )
}
