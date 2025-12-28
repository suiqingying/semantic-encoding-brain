import React, { useEffect, useState } from 'react'
import { Card, COLORS, NordSlide, SubTitle, Text, Title } from './_nord'

function DynamicWaveform({ type, color = COLORS.accent1 }) {
  const containerRef = React.useRef(null)
  const pathRef = React.useRef(null)
  
  // Store dimensions in ref to avoid re-renders during resize/animation
  const sizeRef = React.useRef({ width: 300, height: 60 })

  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          sizeRef.current = { width, height }
        }
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let phase = 0
    let animId
    const step = 3

    const render = () => {
      phase += 2 // speed
      const { width, height } = sizeRef.current
      const pts = []
      
      for (let x = 0; x <= width; x += step) {
        const t = x + phase
        let y = height / 2

        // Scale amplitude based on height
        if (type === 'signal') {
          y += Math.sin(t * 0.05) * (height * 0.15) + Math.sin(t * 0.02) * (height * 0.08)
        } else if (type === 'error') {
          y += Math.sin(t * 0.2) * (height * 0.1) + Math.cos(t * 0.53) * (height * 0.08) + Math.sin(t * 0.9) * (height * 0.05)
        } else {
          const signal = Math.sin(t * 0.05) * (height * 0.15) + Math.sin(t * 0.02) * (height * 0.08)
          const noise = Math.sin(t * 0.2) * (height * 0.1) + Math.cos(t * 0.53) * (height * 0.08) + Math.sin(t * 0.9) * (height * 0.05)
          y += signal + noise * 0.8
        }
        pts.push(`${x},${y}`)
      }
      
      // Direct DOM manipulation to avoid React render cycle overhead
      if (pathRef.current) {
        pathRef.current.setAttribute('d', `M ${pts.join(' L ')}`)
      }
      
      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [type])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 60,
        border: '1px solid rgba(35,48,68,0.15)',
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        <path ref={pathRef} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function StepCard({ title, sub, desc, index, icon }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
      <div
        style={{
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <img src={icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>
        {title}
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.4, maxWidth: 220 }}>{desc}</div>
    </div>
  )
}

function Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 60, opacity: 0.4 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </div>
  )
}

export default function Slide01Methodology() {
  const steps = [
    { title: '自然语言刺激', sub: '(Stimulus)', desc: '播放故事音频并提供同步文本。', icon: '/assets/stimulus-icon.png' },
    { title: '特征提取', sub: '(Feature Extraction)', desc: '预训练模型将刺激转化为高维向量。', icon: '/assets/feature-extraction-icon.png' },
    { title: '模型拟合', sub: '(Model Fitting)', desc: '为每位受试者训练岭回归模型。', icon: '/assets/model-fitting-icon.png' },
    { title: '性能评估', sub: '(Evaluation)', desc: '以 Pearson 相关系数衡量预测准确率。', icon: '/assets/evaluation-icon.png' },
  ]

  return (
    <NordSlide>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
        <div>
          <Title stagger={0} style={{ marginBottom: 8, fontSize: 56 }}>建模框架与实验流程</Title>
          <SubTitle stagger={1} style={{ marginBottom: 12, fontSize: 24 }}>编码模型的线性分解与数据流转</SubTitle>
        </div>

        <div
          data-stagger=""
          style={{ ...{ '--stagger-delay': '300ms' }, flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 32, alignItems: 'stretch' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Card style={{ padding: 24, borderLeft: `6px solid ${COLORS.accent1}`, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontStyle: 'italic', color: COLORS.accent2, marginBottom: 16 }}>
                Y = Xβ + ε
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
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

            <Card style={{ padding: 24, borderLeft: `6px solid ${COLORS.warning}`, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 14, letterSpacing: '0.14em', color: COLORS.warning, fontWeight: 700, marginBottom: 12 }}>
                OBSERVED = SIGNAL + ERROR
              </div>
              <Text style={{ fontSize: 18 }}>观测值由可解释信号与残差叠加得到。</Text>
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Card style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.12em', marginBottom: 8 }}>
                    OBSERVED DATA (Y)
                  </div>
                  <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <DynamicWaveform type="observed" color={COLORS.accent2} />
                  </div>
                  <div style={{ marginTop: 8, fontStyle: 'italic', color: COLORS.accent2, fontSize: 14 }}>y</div>
                </div>
                <div style={{ fontSize: 24, color: COLORS.textDim }}>=</div>
                <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.12em', marginBottom: 8 }}>
                    SIGNAL
                  </div>
                  <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <DynamicWaveform type="signal" color={COLORS.accent1} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: COLORS.textDim }}>β · X</div>
                </div>
                <div style={{ fontSize: 24, color: COLORS.textDim }}>+</div>
                <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.12em', marginBottom: 8 }}>
                    ERROR
                  </div>
                  <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <DynamicWaveform type="error" color={COLORS.textDim} />
                  </div>
                  <div style={{ marginTop: 8, fontStyle: 'italic', color: COLORS.textDim, fontSize: 14 }}>e</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(35,48,68,0.25), transparent)' }} />

        <div data-stagger="" className="stepsRow" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 20px', '--stagger-delay': '500ms' }}>
          {steps.map((item, idx) => (
            <React.Fragment key={item.title}>
              <StepCard index={idx} {...item} />
              {idx < steps.length - 1 && <Arrow />}
            </React.Fragment>
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
