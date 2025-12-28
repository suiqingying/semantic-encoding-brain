import { Card, COLORS, DotItem, NordSlide, Text, Title } from './_nord'

export default function Slide08SemanticFeature() {
  return (
    <NordSlide>
      <div className="nordGrid2" style={{ alignItems: 'center' }}>
        <div>
          <Title stagger={0}>语义特征工程</Title>
          <Text className="nordText" style={{ marginTop: 0 }}>
            利用预训练语言模型 (LLMs)，将单词及其上下文语境编码为高维向量。
          </Text>
          <ul style={{ margin: '26px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 22, fontWeight: 300, opacity: 0.9 }}>
            <DotItem color={COLORS.accent1}>Models: GPT-2, Llama, Qwen</DotItem>
            <DotItem color={COLORS.accent1}>Key: Context Window (200 tokens)</DotItem>
          </ul>
        </div>

        <Card style={{ background: 'rgba(0,0,0,0.28)', borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
          <div className="terminalBar" aria-hidden="true">
            <span className="dotRed" />
            <span className="dotYellow" />
            <span className="dotGreen" />
          </div>
          <div className="terminalBody" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, lineHeight: 1.75 }}>
            <span style={{ color: COLORS.purple }}>const</span> <span style={{ color: COLORS.accent1 }}>embedding</span> ={' '}
            <span style={{ color: COLORS.success }}>model</span>.encode(
            <br />
            &nbsp;&nbsp;<span style={{ color: COLORS.warning }}>"...the first time I saw her..."</span>,
            <br />
            &nbsp;&nbsp;{'{'} context_window: <span style={{ color: COLORS.error }}>200</span> {'}'}
            <br />
            );
            <br />
            <span style={{ color: COLORS.textDim, opacity: 0.6 }}>// Output Shape: [2249, 4096]</span>
          </div>
        </Card>
      </div>
    </NordSlide>
  )
}
