import { ChartBar, COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide10TextResults() {
  return (
    <NordSlide>
      <Title stagger={0}>文本模型性能对比</Title>
      <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, marginTop: 22, alignItems: 'center' }}>
        <div>
          <ChartBar label="Qwen-7B" value={0.58} color={COLORS.accent1} max={0.8} highlight note="Best" />
          <ChartBar label="Llama-7B" value={0.55} color={COLORS.accent1} max={0.8} />
          <ChartBar label="GPT2-XL" value={0.42} color={COLORS.textDim} max={0.8} />
          <ChartBar label="BERT-Large" value={0.3} color={COLORS.textDim} max={0.8} />
        </div>
        <div>
          <Text>
            <span style={{ fontWeight: 900, color: COLORS.text }}>关键发现：</span>
            <br />
            <br />
            基于 <span className="kw kwA">Transformer</span> 的 LLM（特别是 <span className="kw kwA">Llama</span> 和{' '}
            <span className="kw kwA">Qwen</span>）在拟合大脑语义响应方面表现最佳，暗示了其表征空间与人脑的高度相似性。
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
