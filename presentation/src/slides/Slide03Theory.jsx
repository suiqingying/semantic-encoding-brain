import { Card, COLORS, NordSlide, Text, Title } from './_nord'

function MiniBox({ label }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', minWidth: 120, textAlign: 'center' }}>
      {label}
    </div>
  )
}

export default function Slide03Theory() {
  return (
    <NordSlide>
      <Title stagger={0}>理论基础：数字共振</Title>
      <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, marginTop: 22, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Text>
            预训练深度神经网络（如 <span className="kw kwA">Transformer</span>）的层级结构，与大脑皮层处理信息的层级流存在功能上的
            <span style={{ color: COLORS.warning, fontWeight: 700 }}> 对应关系</span>。
          </Text>
          <Card style={{ padding: 18, borderLeft: `6px solid ${COLORS.warning}`, background: `${COLORS.warning}12` }}>
            <div style={{ fontSize: 24, fontStyle: 'italic', opacity: 0.92 }}>
              “Transformer 模型的中间层能够最好地预测大脑的 fMRI 响应。”
            </div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.65 }}>— Toneva et al. (2019)</div>
          </Card>
        </div>

        <div className="nordCenter">
          <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MiniBox label="Input" />
              <MiniBox label="Layers" />
              <MiniBox label="Output" />
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.55 }}>AI Model</div>
            </div>

            <div style={{ width: 80, height: 2, background: `linear-gradient(90deg, ${COLORS.accent3}, ${COLORS.accent1})`, borderRadius: 999, opacity: 0.8 }} />

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MiniBox label="Sensory" />
              <MiniBox label="Cortex" />
              <MiniBox label="Semantic" />
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.55 }}>Human Brain</div>
            </div>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
