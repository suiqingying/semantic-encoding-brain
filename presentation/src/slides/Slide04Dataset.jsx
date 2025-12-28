import React, { useEffect, useRef } from 'react'
import { Card, COLORS, NordSlide, Text, Title } from './_nord'

function BarWaveform({ color = COLORS.accent1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let offset = 0

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const barWidth = 3
    const gap = 2
    const totalBar = barWidth + gap

    const render = () => {
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color

      const numBars = Math.ceil(w / totalBar) + 1
      
      // Speed of scrolling
      offset += 0.5 

      for (let i = 0; i < numBars; i++) {
        const pos = i + offset
        const envelope = Math.sin(pos * 0.02) * 0.5 + 0.5
        const detail = Math.sin(pos * 0.2) * Math.cos(pos * 0.57)
        let magnitude = Math.abs(detail * envelope) + Math.random() * 0.1
        let barH = Math.min(1, Math.max(0.05, magnitude)) * (h * 0.8)

        const x = i * totalBar
        const y = (h - barH) / 2
        
        ctx.globalAlpha = 0.85
        ctx.fillRect(x, y, barWidth, barH)
      }

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [color])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

function InfoBlock({ label, children, color }) {
  return (
    <div style={{ paddingLeft: 18, borderLeft: `4px solid ${color}` }}>
      <div style={{ 
        fontSize: 12, 
        fontWeight: 800, 
        color: color, 
        textTransform: 'uppercase', 
        letterSpacing: '0.12em',
        marginBottom: 8 
      }}>
        {label}
      </div>
      <div style={{ fontSize: 18, color: COLORS.text, lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  )
}

export default function Slide04Dataset() {
  const steps = [
    { title: '自然语言刺激', sub: '(Stimulus)', desc: '播放故事音频并提供同步文本。', icon: '/assets/stimulus-icon.png' },
    { title: '特征提取', sub: '(Feature Extraction)', desc: '预训练模型将刺激转化为高维向量。', icon: '/assets/feature-extraction-icon.png' },
    { title: '模型拟合', sub: '(Model Fitting)', desc: '为每位受试者训练岭回归模型。', icon: '/assets/model-fitting-icon.png' },
    { title: '性能评估', sub: '(Evaluation)', desc: '以 Pearson 相关系数衡量预测准确率。', icon: '/assets/evaluation-icon.png' },
  ]

  return (
    <NordSlide>
      <Title stagger={0}>数据集：Narratives — The 21st Year</Title>

      <div
        data-stagger=""
        style={{
          '--stagger-delay': '400ms',
          display: 'grid',
          gridTemplateColumns: '0.42fr 0.58fr',
          gap: 48,
          marginTop: 18,
          alignItems: 'stretch',
          height: 'calc(100% - 100px)', // Leave space for title
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingRight: 10, justifyContent: 'center' }}>
          
          <InfoBlock label="Data Source" color={COLORS.accent1}>
            来自公开 <strong style={{color: COLORS.accent2}}>Narratives fMRI</strong> 数据集，包含 25 名英语母语者收听同一故事的完整神经影像记录。
          </InfoBlock>

          <InfoBlock label="Stimulus Details" color={COLORS.purple}>
            故事：<strong>"The 21st Year"</strong> <span style={{ opacity: 0.7, fontSize: '0.9em' }}>(Mike DeStefano)</span>
            <br />
            类型：第一人称自然口语叙事 <span style={{ opacity: 0.7, fontSize: '0.9em' }}>(The Moth)</span>
            <br />
            时长：约 56 分钟
          </InfoBlock>

          <InfoBlock label="fMRI Parameters" color={COLORS.warning}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: COLORS.textDim, fontSize: '0.85em' }}>SUBJECT</span>
              <span>N = 25 (High SNR)</span>
              
              <span style={{ fontWeight: 600, color: COLORS.textDim, fontSize: '0.85em' }}>RES</span>
              <span>TR = 1.5s</span>
              
              <span style={{ fontWeight: 600, color: COLORS.textDim, fontSize: '0.85em' }}>FOV</span>
              <span>Whole-brain (MMP 360)</span>
            </div>
          </InfoBlock>

        </div>

        <Card style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(35,48,68,0.12)', background: 'rgba(255,255,255,0.72)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Top Half: Waveform (50%) */}
          <div style={{ flex: 1, borderBottom: '1px solid rgba(35,48,68,0.08)', position: 'relative', background: 'rgba(255,255,255,0.4)', minHeight: 0 }}>
             <div style={{ position: 'absolute', top: 12, left: 18, zIndex: 10, fontFamily: 'ui-monospace, monospace', fontSize: 12, opacity: 0.72, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Audio Amplitude
            </div>
            <div style={{ width: '100%', height: '100%' }}>
              <BarWaveform color={COLORS.accent1} />
            </div>
          </div>

          {/* Bottom Half: Text (50%) */}
          <div style={{ flex: 1, minHeight: 0, padding: 0 }}>
             <div style={{ 
               height: '100%', 
               overflowY: 'auto', 
               padding: '24px 28px',
               fontFamily: 'Georgia, serif', 
               fontSize: 21, 
               fontStyle: 'italic', 
               color: 'rgba(35, 48, 68, 0.85)', 
               lineHeight: 1.6,
               scrollbarWidth: 'thin',
               scrollbarColor: `${COLORS.accent3} transparent`
             }}>
              <p style={{ marginTop: 0 }}>
                "...I was 21 years old when I felt the weight of it. It wasn't the first time I'd felt it, but it was the first time I felt it and knew I couldn't carry it anymore."
              </p>
              <p>
                "I was living in the Bronx, teaching at a public school. It was my first year. I was standing in front of thirty-two fifth graders, trying to explain long division, but my mind was miles away, wrapped in a fog that hadn't lifted in weeks."
              </p>
              <p>
                "The kids, they know. They always know when you're not really there. I remember looking at their faces—hopeful, bored, confused—and feeling this profound sense of fraudulence. Who was I to guide them when I couldn't even navigate my own way out of bed some mornings?"
              </p>
              <p>
                "That year, the 21st year, was the breaking point. It was the year everything I thought I knew about myself shattered, and I had to decide whether to pick up the pieces or just let them lie there..."
              </p>
              <p>
                [...Narrative continues for 50+ minutes...]
              </p>
            </div>
          </div>
        </Card>
      </div>
    </NordSlide>
  )
}