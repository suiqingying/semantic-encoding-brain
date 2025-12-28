import React, { useEffect, useState } from 'react'
import { Card, COLORS, NordSlide, SubTitle, Text, Title } from './_nord'

function DynamicWaveform({ type, color = COLORS.accent1, height = 60 }) {
  const [d, setD] = useState('')

  useEffect(() => {
    let phase = 0
    let animId
    const width = 180
    // Density of points
    const step = 2

    const render = () => {
      phase += 2 // speed
      const pts = []
      for (let x = 0; x <= width; x += step) {
        // We use (x - phase) to simulate moving left, or (x + phase) for right.
        // Let's ensure the wave looks like it's traveling.
        const t = x + phase
        let y = height / 2

        if (type === 'signal') {
          // Clean low-freq waves
          y += Math.sin(t * 0.05) * 12 + Math.sin(t * 0.02) * 6
        } else if (type === 'error') {
          // "Noise-like" high freq waves
          y += Math.sin(t * 0.2) * 8 + Math.cos(t * 0.53) * 6 + Math.sin(t * 0.9) * 4
        } else {
          // Observed = Signal + Noise
          const signal = Math.sin(t * 0.05) * 12 + Math.sin(t * 0.02) * 6
          const noise = Math.sin(t * 0.2) * 8 + Math.cos(t * 0.53) * 6 + Math.sin(t * 0.9) * 4
          // Weight them slightly differently or just sum
          y += signal + noise * 0.8
        }
        pts.push(`${x},${y}`)
      }
      setD(`M ${pts.join(' L ')}`)
      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [type, height])

  return (
    <div
      style={{
        width: 180,
        height: height,
        border: '1px solid rgba(35,48,68,0.15)',
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg width="180" height={height} style={{ display: 'block' }}>
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function StepCard({ title, sub, desc, index }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          border: '1px solid rgba(35,48,68,0.12)',
          background: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: COLORS.accent2,
          fontWeight: 700,
        }}
      >
        {index + 1}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>
        {title}
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.4, maxWidth: 190 }}>{desc}</div>
    </div>
  )
}

export default function Slide01Methodology() {
  return (
    <NordSlide>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
        <div>
          <Title stagger={0} style={{ marginBottom: 8, fontSize: 56 }}>建模框架与实验流程</Title>
          <SubTitle stagger={1} style={{ marginBottom: 12, fontSize: 24 }}>编码模型的线性分解与数据流转</SubTitle>
        </div>

        <div
          className="nordGrid2"
          data-stagger=""
          style={{ ...{ '--stagger-delay': '300ms' }, flex: 1, alignItems: 'center', gap: 32 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card style={{ padding: 18, borderLeft: `6px solid ${COLORS.accent1}` }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontStyle: 'italic', color: COLORS.accent2 }}>
                Y = Xβ + ε
              </div>
              <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>
                  <strong style={{ color: COLORS.accent2 }}>Y</strong>：观测到的 fMRI 信号
                </Text>
                <Text style={{ fontSize: 18 }}>
                  <strong style={{ color: COLORS.accent2 }}>X</strong>：从刺激中提取的特征
                </Text>
                <Text style={{ fontSize: 18 }}>
                  <strong style={{ color: COLORS.accent2 }}>β</strong>：模型学习的权重
                </Text>
                <Text style={{ fontSize: 18 }}>
                  <strong style={{ color: COLORS.accent2 }}>ε</strong>：模型无法解释的噪声
                </Text>
              </div>
            </Card>

            <Card style={{ padding: 14, borderLeft: `6px solid ${COLORS.warning}` }}>
              <div style={{ fontSize: 12, letterSpacing: '0.14em', color: COLORS.warning, fontWeight: 700 }}>
                OBSERVED = SIGNAL + ERROR
              </div>
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>观测值由可解释信号与残差叠加得到。</Text>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <Card style={{ padding: 16, display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.12em' }}>
                    OBSERVED DATA (Y)
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <DynamicWaveform type="observed" color={COLORS.accent2} height={60} />
                  </div>
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: COLORS.accent2, fontSize: 12 }}>y</div>
                </div>
                <div style={{ fontSize: 20, color: COLORS.textDim }}>=</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.12em' }}>
                    SIGNAL
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <DynamicWaveform type="signal" color={COLORS.accent1} height={60} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textDim }}>β · X</div>
                </div>
                <div style={{ fontSize: 20, color: COLORS.textDim }}>+</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.12em' }}>
                    ERROR
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <DynamicWaveform type="error" color={COLORS.textDim} height={60} />
                  </div>
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: COLORS.textDim, fontSize: 12 }}>e</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(35,48,68,0.25), transparent)' }} />

        <div className="nordGrid4" data-stagger="" style={{ ...{ '--stagger-delay': '500ms' } }}>
          {[
            { title: '自然语言刺激', sub: '(Stimulus)', desc: '播放故事音频并提供同步文本。' },
            { title: '特征提取', sub: '(Feature Extraction)', desc: '预训练模型将刺激转化为高维向量。' },
            { title: '模型拟合', sub: '(Model Fitting)', desc: '为每位受试者训练岭回归模型。' },
            { title: '性能评估', sub: '(Evaluation)', desc: '以 Pearson 相关系数衡量预测准确率。' },
          ].map((item, idx) => (
            <StepCard key={item.title} index={idx} {...item} />
          ))}
        </div>
      </div>

      <style>{`
        .waveSvg { overflow: visible; }
        .wavePath {
          stroke-dasharray: 480;
          stroke-dashoffset: 480;
          animation: waveDraw 1.6s ease-in-out forwards;
        }

        @keyframes waveDraw {
          from { stroke-dashoffset: 480; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>
    </NordSlide>
  )
}
