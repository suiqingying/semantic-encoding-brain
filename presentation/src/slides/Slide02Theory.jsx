import { Card, COLORS, NordSlide, Text, Title } from './_nord'

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
          <Card style={{ padding: 18, borderLeft: `6px solid ${COLORS.warning}`, background: 'rgba(217,138,44,0.12)' }}>
            <div style={{ fontSize: 24, fontStyle: 'italic', opacity: 0.92 }}>
              “Transformer 模型的中间层能够最好地预测大脑的 fMRI 响应。”
            </div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.65 }}>— Toneva et al. (2019)</div>
          </Card>
        </div>

        <div className="nordCenter">
          <img
            src="/assets/duiqi.png"
            alt="对齐示意图"
            style={{
              width: '100%',
              maxWidth: 760,
              maxHeight: 520,
              objectFit: 'contain',
              background: 'transparent',
            }}
          />
        </div>
      </div>
    </NordSlide>
  )
}
