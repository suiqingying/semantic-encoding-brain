import { COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide12LayerAnalysis() {
  return (
    <NordSlide>
      <Title>层级深度解析</Title>
      <div
        style={{
          position: 'relative',
          height: 280,
          width: '100%',
          marginTop: 30,
          background: 'rgba(0,0,0,0.20)',
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
          <path d="M0,260 Q420,20 840,220 L1400,260" fill="none" stroke={COLORS.accent3} strokeWidth="5" />
          <circle cx="50%" cy="12%" r="8" fill={COLORS.accent1} />
        </svg>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, opacity: 0.55, marginBottom: 8 }}>Middle Layers</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.accent1 }}>Peak Performance</div>
        </div>
      </div>
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <Text>模型预测性能随层数增加呈倒 U 型，中间层表征与大脑最为匹配。</Text>
      </div>
    </NordSlide>
  )
}

