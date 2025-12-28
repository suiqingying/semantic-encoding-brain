import { COLORS, NordSlide, Text, Title } from './_nord'

function BrainMark({ opacity = 0.16 }) {
  return (
    <svg width="260" height="260" viewBox="0 0 240 240" fill="none" aria-hidden="true" style={{ opacity }}>
      <path
        d="M118 30c-24 0-45 16-53 39-20 3-35 20-35 41 0 16 9 31 23 38-2 6-3 12-3 18 0 26 21 47 47 47 11 0 21-4 29-10 8 6 18 10 29 10 26 0 47-21 47-47 0-6-1-12-3-18 14-7 23-22 23-38 0-21-15-38-35-41-8-23-29-39-53-39h-6Z"
        stroke="rgba(35,48,68,0.55)"
        strokeWidth="4"
      />
      <path d="M120 52v140" stroke="rgba(35,48,68,0.22)" strokeWidth="3" />
      <path d="M80 92c10 6 18 14 22 24" stroke="rgba(35,48,68,0.22)" strokeWidth="3" />
      <path d="M160 92c-10 6-18 14-22 24" stroke="rgba(35,48,68,0.22)" strokeWidth="3" />
    </svg>
  )
}

export default function Slide15SemanticMap() {
  return (
    <NordSlide>
      <Title stagger={0}>全脑语义地图</Title>
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
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(76,91,107,0.18), rgba(45,109,166,0.14))', filter: 'blur(12px)' }} />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainMark opacity={0.16} />
          </div>

          <div style={{ position: 'absolute', left: '18%', top: '22%', width: 160, height: 160, background: 'rgba(166,90,30,0.24)', borderRadius: 999, filter: 'blur(28px)' }} />
          <div style={{ position: 'absolute', right: '26%', top: '30%', width: 210, height: 210, background: 'rgba(217,138,44,0.24)', borderRadius: 999, filter: 'blur(30px)' }} />
          <div style={{ position: 'absolute', left: '32%', bottom: '22%', width: 150, height: 150, background: 'rgba(45,109,166,0.22)', borderRadius: 999, filter: 'blur(28px)' }} />

          <div
            className="nordCard"
            style={{
              position: 'absolute',
              left: 36,
              bottom: 28,
              width: 620,
              padding: 22,
              background: 'rgba(255,255,255,0.78)',
              borderColor: 'rgba(35,48,68,0.12)',
            }}
          >
            <Text>
              基于最佳文本模型 (Llama) 预测。
              <br />
              <br />
              <strong style={{ color: COLORS.warning }}>核心发现：</strong>
              <br />
              大脑的语义系统是一个广布的分布式网络，横跨双侧大脑半球，覆盖语言、记忆和高级认知功能的核心脑区。
            </Text>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
