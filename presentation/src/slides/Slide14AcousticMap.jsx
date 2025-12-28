import { COLORS, NordSlide, Text, Title } from './_nord'

function BrainMark({ opacity = 0.12 }) {
  return (
    <svg width="260" height="260" viewBox="0 0 240 240" fill="none" aria-hidden="true" style={{ opacity }}>
      <path
        d="M118 30c-24 0-45 16-53 39-20 3-35 20-35 41 0 16 9 31 23 38-2 6-3 12-3 18 0 26 21 47 47 47 11 0 21-4 29-10 8 6 18 10 29 10 26 0 47-21 47-47 0-6-1-12-3-18 14-7 23-22 23-38 0-21-15-38-35-41-8-23-29-39-53-39h-6Z"
        stroke="rgba(35,48,68,0.55)"
        strokeWidth="4"
      />
      <path d="M120 52v140" stroke="rgba(35,48,68,0.22)" strokeWidth="3" />
    </svg>
  )
}

export default function Slide16AcousticMap() {
  return (
    <NordSlide>
      <Title stagger={0}>全脑声学地图</Title>
      <div data-stagger="" style={{ '--stagger-delay': '400ms' }}>
        <div
          className="nordCard"
          style={{
            marginTop: 22,
            height: 520,
            borderRadius: 22,
            background: 'rgba(255,255,255,0.74)',
            borderColor: 'rgba(35,48,68,0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(45,109,166,0.18), rgba(255,255,255,0.00))' }} />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainMark opacity={0.14} />
          </div>

          <div
            style={{
              position: 'absolute',
              left: '52%',
              top: '54%',
              transform: 'translate(-50%,-50%)',
              width: 160,
              height: 86,
              background: 'rgba(45,109,166,0.58)',
              borderRadius: 999,
              filter: 'blur(18px)',
              boxShadow: '0 0 70px rgba(45,109,166,0.45)',
            }}
          />

          <div
            className="nordCard"
            style={{
              position: 'absolute',
              right: 36,
              bottom: 28,
              width: 620,
              padding: 22,
              background: 'rgba(255,255,255,0.78)',
              borderColor: 'rgba(35,48,68,0.12)',
            }}
          >
            <Text>
              基于最佳音频模型 (<span className="kw kwG">WavLM</span>) 预测。
              <br />
              <br />
              <strong style={{ color: COLORS.success }}>核心发现：</strong>
              <br />
              处理高度局部化。全脑大部分区域为暗色，唯独双侧颞上回 (<span className="kw kwG">STG/A1</span>) 附近呈现更亮的激活斑块。
            </Text>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
