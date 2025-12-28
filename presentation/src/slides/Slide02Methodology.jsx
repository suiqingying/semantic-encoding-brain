import { Card, COLORS, NordSlide, SubTitle, Text, Title } from './_nord'

export default function Slide02Methodology() {
  return (
    <NordSlide>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div>
          <Title stagger={0}>方法论演进</Title>
          <SubTitle stagger={1}>从单一响应到全脑编码</SubTitle>
        </div>

        <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '400ms' }, flex: 1, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26, justifyContent: 'center' }}>
            <Text>
              传统 <strong style={{ color: COLORS.error }}>通用线性模型 (GLM)</strong> 难以将语言等复杂刺激表示为简单数值。
            </Text>
            <Text>
              为解决此问题，我们采用 <strong style={{ color: COLORS.success }}>“体素编码模型”</strong> 范式，将刺激表征为高维特征向量，从而拟合全脑每个体素的 BOLD 响应。
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
            <Card style={{ borderLeft: `6px solid ${COLORS.error}`, opacity: 0.72, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, letterSpacing: '0.18em', color: COLORS.error }}>
                  LEGACY: GLM
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  padding: 14,
                  borderRadius: 12,
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  fontSize: 22,
                  color: 'rgba(35,48,68,0.75)',
                }}
              >
                y = b0 + b1 X + ... + e
              </div>
              <div style={{ marginTop: 10, opacity: 0.55, fontSize: 13, textAlign: 'right' }}>Simple Scalar Mapping</div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.35, fontSize: 18 }}>-&gt;</div>

            <Card style={{ borderLeft: `6px solid ${COLORS.success}`, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 13,
                    letterSpacing: '0.18em',
                    color: COLORS.success,
                  }}
                >
                  PROPOSED: VOXELWISE ENCODING
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(35,48,68,0.12)' }}>
                  <div style={{ opacity: 0.55, fontSize: 11, letterSpacing: '0.12em' }}>INPUT</div>
                  <div style={{ marginTop: 6, fontSize: 16 }}>Stimulus</div>
                </div>
                <div style={{ opacity: 0.35 }}>-&gt;</div>
                <div style={{ flex: 1.2, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(35,48,68,0.12)' }}>
                  <div style={{ opacity: 0.55, fontSize: 11, letterSpacing: '0.12em' }}>FEATURES</div>
                  <div style={{ marginTop: 6, fontSize: 16 }}>High-D</div>
                </div>
                <div style={{ opacity: 0.35 }}>-&gt;</div>
                <div style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(35,48,68,0.12)' }}>
                  <div style={{ opacity: 0.55, fontSize: 11, letterSpacing: '0.12em' }}>OUTPUT</div>
                  <div style={{ marginTop: 6, fontSize: 16 }}>BOLD</div>
                </div>
              </div>

              <div style={{ marginTop: 12, opacity: 0.72, fontSize: 13, textAlign: 'right' }}>High-Dimensional Feature Mapping</div>
            </Card>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
