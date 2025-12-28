import { Card, COLORS, NordSlide, Title } from './_nord'

function BadgeIcon({ color, label }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
        fontWeight: 900,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </div>
  )
}

export default function Slide04Dashboard() {
  const items = [
    { label: 'AC', title: '声学特征', sub: 'Wav2vec / WavLM', color: COLORS.success },
    { label: 'MD', title: '编码模型', sub: 'Ridge Regression', color: COLORS.purple },
    { label: 'SE', title: '语义特征', sub: 'Llama / GPT-2 / Qwen', color: COLORS.accent1 },
    { label: 'MP', title: '全脑映射', sub: 'Cortical Mapping', color: COLORS.warning },
  ]

  return (
    <NordSlide>
      <Title stagger={0}>任务全景仪表盘</Title>
      <div className="nordGrid4" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, marginTop: 36 }}>
        {items.map((item) => (
          <Card key={item.title} style={{ padding: 22, height: 320, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <BadgeIcon color={item.color} label={item.label} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 15, opacity: 0.7, color: COLORS.textDim }}>{item.sub}</div>
            </div>
          </Card>
        ))}
      </div>
    </NordSlide>
  )
}
