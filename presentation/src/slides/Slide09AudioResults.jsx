import { ChartBar, COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide11AudioResults() {
  return (
    <NordSlide>
      <Title stagger={0}>音频模型性能对比</Title>
      <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, marginTop: 22, alignItems: 'center' }}>
        <div>
          <ChartBar label="WavLM" value={0.0285} color={COLORS.success} max={0.05} />
          <ChartBar label="Wav2vec 2.0" value={0.0413} color={COLORS.success} max={0.05} highlight note="Best" />
        </div>
        <div>
          <Text>
            <span style={{ fontWeight: 900, color: COLORS.text }}>关键发现：</span>
            <br />
            <br />
            自监督学习模型 <span className="kw kwG">Wav2vec 2.0</span> 表现最佳，整体上音频模型的预测表现与文本模型相近。
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
