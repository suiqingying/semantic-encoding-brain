import { ChartBar, COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide11AudioResults() {
  return (
    <NordSlide>
      <Title stagger={0}>音频模型性能对比</Title>
      <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, marginTop: 22, alignItems: 'center' }}>
        <div>
          <ChartBar label="WavLM" value={0.32} color={COLORS.success} max={0.8} highlight note="Best" />
          <ChartBar label="Wav2vec 2.0" value={0.28} color={COLORS.success} max={0.8} />
        </div>
        <div>
          <Text>
            <span style={{ fontWeight: 900, color: COLORS.text }}>关键发现：</span>
            <br />
            <br />
            自监督学习模型 <span className="kw kwG">WavLM</span> 能最有效地捕捉听觉特征。但总体而言，
            <span className="kw kwA">语义信息</span> 的预测能力显著高于声学信息。
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
