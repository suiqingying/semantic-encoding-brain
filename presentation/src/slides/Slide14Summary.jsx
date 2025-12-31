import { COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide14Summary() {
  const maxValue = 0.8
  const barAreaHeight = 180
  const data = [
    { label: '线性模型', value: 0.58, color: COLORS.textDim },
    { label: '非线性模型', value: 0.76, color: COLORS.accent1 },
  ]

  return (
    <NordSlide>
      <Title>综合与展望</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 26, alignItems: 'center' }}>
        <div
          style={{
            aspectRatio: '1 / 1',
            width: '100%',
            maxWidth: 380,
            padding: 28,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(235,241,250,0.7))',
            border: '1px solid rgba(35,48,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(35,48,68,0.08)',
            justifySelf: 'center',
          }}
        >
          <Text style={{ fontSize: 24, lineHeight: 1.6 }}>
            线性与非线性模型的性能对比显示，非线性模型在语义预测任务中取得更高表现，提示高阶表征需要更复杂的映射。
          </Text>
        </div>
        <div
          style={{
            height: 260,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-evenly',
            padding: '18px 18px 12px',
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,248,252,0.7))',
            border: '1px solid rgba(35,48,68,0.1)',
            boxShadow: '0 18px 36px rgba(35,48,68,0.08)',
          }}
        >
          {data.map((item) => {
            const heightPx = Math.max(0, Math.min(1, item.value / maxValue)) * barAreaHeight
            return (
              <div key={item.label} style={{ width: 120, textAlign: 'center' }}>
                <div style={{ height: barAreaHeight, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div
                    style={{
                      height: `${heightPx}px`,
                      minHeight: 18,
                      width: 56,
                      borderRadius: 10,
                      background: item.color,
                      boxShadow: '0 10px 20px rgba(35,48,68,0.12)',
                      transition: 'height 600ms ease',
                    }}
                  />
                </div>
                <div style={{ marginTop: 12, fontSize: 16, color: COLORS.text }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 14, color: COLORS.textDim }}>{item.value.toFixed(2)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </NordSlide>
  )
}
