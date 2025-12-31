import { ChartBar, COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide10TextResults() {
  const data = [
    { label: 'Qwen-7B', value: 0.0423, color: COLORS.accent1, highlight: true, note: 'Best' },
    { label: 'GPT2-XL', value: 0.0238, color: COLORS.textDim },
    { label: 'BERT-Large', value: 0.0065, color: COLORS.textDim },
  ]
  const maxValue = 0.05
  return (
    <NordSlide>
      <Title stagger={0}>文本模型性能对比</Title>
      <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, marginTop: 22, alignItems: 'center' }}>
        <div>
          {data.map((item) => (
            <ChartBar key={item.label} label={item.label} value={item.value} color={item.color} max={maxValue} highlight={item.highlight} note={item.note} />
          ))}
        </div>
        <div>
          <Text>
            <span style={{ fontWeight: 900, color: COLORS.text }}>关键发现：</span>
            <br />
            <br />
            基于 <span className="kw kwA">Transformer</span> 的 LLM（尤其是 <span className="kw kwA">Qwen</span>）在拟合大脑语义响应方面表现最佳，暗示其表征空间与人脑高度相似。
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
