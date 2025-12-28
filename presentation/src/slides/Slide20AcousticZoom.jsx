import { COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide20AcousticZoom() {
  return (
    <NordSlide>
      <Title>聚焦：初级听觉皮层 (A1)</Title>
      <div className="nordGrid2" style={{ alignItems: 'center' }}>
        <div className="nordCenter">
          <div
            className="nordSpinRing"
            style={{
              width: 280,
              height: 280,
              borderRadius: 999,
              border: `5px dashed ${COLORS.success}`,
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="nordPulseBlob" style={{ width: 210, height: 210, borderRadius: 999, background: 'rgba(45,109,166,0.18)', filter: 'blur(10px)' }} />
              <div style={{ position: 'absolute', fontWeight: 900, fontSize: 26, color: COLORS.success }}>STG / A1</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 14, color: COLORS.success }}>信号的高度汇聚</div>
          <Text>
            验证了听觉信号处理的早期阶段是高度模块化和局域化的。
            <br />
            这与高级语义处理的分布特性形成鲜明对比。
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
