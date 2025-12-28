import { COLORS, NordSlide, Text, Title } from './_nord'

function Bolt() {
  return (
    <svg width="84" height="84" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" fill={COLORS.warning} opacity="0.95" />
    </svg>
  )
}

export default function Slide13Fusion() {
  return (
    <NordSlide>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <Bolt />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(217,138,44,0.40)', filter: 'blur(40px)', zIndex: -1 }} />
        </div>
        <Title>融合与超越</Title>
        <div style={{ maxWidth: 980, marginTop: 16 }}>
          <Text>
            融合模型显著提升了在联合皮层 (TPJ / STS) 的预测准确率。
            <br />
            <br />
            <span style={{ color: COLORS.success, fontWeight: 700 }}>多模态信息的整合是理解自然叙事的关键。</span>
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
