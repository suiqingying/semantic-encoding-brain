import { Card, COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide21Summary() {
  return (
    <NordSlide>
      <Title>综合与展望</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 26 }}>
        <Card style={{ padding: 22, borderTop: `6px solid ${COLORS.accent1}` }}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>从耳朵到心灵</div>
          <Text>模型清晰地描绘了从感知（声学）到认知（语义）的层级加工通路。</Text>
        </Card>
        <Card style={{ padding: 22, borderTop: `6px solid ${COLORS.purple}` }}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>非线性的未来</div>
          <Text>在 PFC，非线性模型表现更优，暗示了大脑高级语义计算的复杂性。</Text>
        </Card>
      </div>
    </NordSlide>
  )
}
