import { COLORS, NordSlide, Title } from './_nord'
import Waveform from './_waveform'

export default function Slide13Windowing() {
  return (
    <NordSlide>
      <Title stagger={0}>声波转感知向量：窗口策略</Title>
      <div className="nordCenter" style={{ height: '100%' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 1050,
            height: 170,
            background: 'rgba(255,255,255,0.72)',
            borderRadius: 999,
            border: '1px solid rgba(35,48,68,0.12)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
            <Waveform color={COLORS.success} live opacity={0.6} />
          </div>
          <div style={{ position: 'absolute', left: 0, width: '33.333%', height: '100%', borderRight: '2px dashed rgba(35,48,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, opacity: 0.6 }}>TR 1</span>
          </div>
          <div style={{ position: 'absolute', left: '33.333%', width: '33.333%', height: '100%', background: 'rgba(45,109,166,0.10)', borderLeft: '2px solid rgba(35,48,68,0.18)', borderRight: '2px solid rgba(35,48,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 18, color: COLORS.success }}>Audio Window (3s)</span>
          </div>
          <div style={{ position: 'absolute', right: 0, width: '33.333%', height: '100%', borderLeft: '2px dashed rgba(35,48,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, opacity: 0.6 }}>TR 3</span>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
