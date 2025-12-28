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
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>{item.title}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, opacity: 0.65, color: COLORS.textDim }}>{item.sub}</div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 20, opacity: 0.6 }} className="nordText">
        本研究通过四个核心模块，系统性地探究听觉故事在大脑中的加工与整合模式。
      </div>
    </NordSlide>
  )
}
