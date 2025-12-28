import { COLORS, NordSlide, Title } from './_nord'

export default function Slide07Pipeline() {
  const steps = ['Input Stimulus', 'Feature Extract', 'Downsample', 'Ridge Regression', 'Pearson r']
  return (
    <NordSlide>
      <Title stagger={0}>编码模型管线</Title>
      <div data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, position: 'relative', marginTop: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 6, background: 'rgba(255,255,255,0.10)', borderRadius: 999 }} />
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px', zIndex: 1 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 22,
                marginBottom: 14,
                border: `5px solid ${COLORS.accent2}`,
                background: COLORS.bgLight,
              }}
            >
              {i + 1}
            </div>
            <div style={{ width: 140, textAlign: 'center', fontSize: 20, fontWeight: 300, color: COLORS.textDim }}>{step}</div>
          </div>
        ))}
      </div>
    </NordSlide>
  )
}
