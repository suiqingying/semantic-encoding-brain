import { Card, COLORS, NordSlide, Text, Title } from './_nord'
import Waveform from './_waveform'

export default function Slide06StimulusFlow() {
  return (
    <NordSlide>
      <Title stagger={0}>多模态刺激流</Title>
      <div data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 42 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 22, alignItems: 'center', maxWidth: 980 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 10, color: COLORS.accent1, fontWeight: 900 }}>A</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Audio Stream</div>
          </div>

          <div style={{ position: 'relative', height: 1, background: 'rgba(255,255,255,0.20)' }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%,-50%)',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.20)',
                border: '1px solid rgba(255,255,255,0.20)',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
              }}
            >
              TR = 1.5s Sync
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 10, color: COLORS.success, fontWeight: 900 }}>T</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Text Stream</div>
          </div>
        </div>

        <div style={{ opacity: 0.75 }}>
          <Text>对齐音频与文本的时间轴，让模型在统一的 TR 网格下提取特征并预测 BOLD。</Text>
        </div>
      </div>
    </NordSlide>
  )
}
