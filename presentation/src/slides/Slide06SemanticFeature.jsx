import { useEffect, useMemo, useState } from 'react'
import { Card, COLORS, DotItem, NordSlide, Text, Title } from './_nord'

const LINES = [
  '她第一次走进实验室时，语言被点亮。',
  '上下文在时间轴上堆叠，直到窗口闭合。',
  '我们在 200 tokens 内锁定一个语义切片。',
]

const TIMELINE = [
  { key: 'typing', label: 'Typing Act' },
  { key: 'lock', label: 'Lock-on Act' },
  { key: 'extract', label: 'Extraction Act' },
  { key: 'deposit', label: 'Deposition Act' },
]

export default function Slide06SemanticFeature() {
  const [phase, setPhase] = useState('typing')
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)
  const [extractDots, setExtractDots] = useState('')
  const [outputValue, setOutputValue] = useState('[?, 4096]')

  const outputTicks = useMemo(
    () => ['[?, 4096]', '[1, 3072]', '[1, 3584]', '[1, 4096]'],
    []
  )

  useEffect(() => {
    if (phase !== 'typing') return undefined
    const line = LINES[lineIndex]
    if (charIndex < line.length) {
      const base = 24 + (charIndex % 5) * 8
      const pause = charIndex % 7 === 0 ? 60 : 0
      const timer = setTimeout(() => setCharIndex((v) => v + 1), base + pause)
      return () => clearTimeout(timer)
    }

    if (lineIndex < LINES.length - 1) {
      const timer = setTimeout(() => {
        setLineIndex((v) => v + 1)
        setCharIndex(0)
      }, 360)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => setPhase('lock'), 700)
    return () => clearTimeout(timer)
  }, [phase, lineIndex, charIndex])

  useEffect(() => {
    if (phase === 'lock') {
      const timer = setTimeout(() => setPhase('extract'), 1100)
      return () => clearTimeout(timer)
    }
    if (phase === 'extract') {
      const timer = setTimeout(() => setPhase('deposit'), 1800)
      return () => clearTimeout(timer)
    }
    if (phase === 'deposit') {
      return undefined
    }
    return undefined
  }, [phase])

  useEffect(() => {
    if (phase !== 'typing') {
      setCursorOn(false)
      return undefined
    }
    setCursorOn(true)
    const timer = setInterval(() => setCursorOn((v) => !v), 380)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'extract') {
      setExtractDots('')
      return undefined
    }
    let i = 0
    const timer = setInterval(() => {
      i = (i + 1) % 4
      setExtractDots('.'.repeat(i))
    }, 220)
    return () => clearInterval(timer)
  }, [phase])

  const typedText = LINES.slice(0, lineIndex).join(' ') + (lineIndex > 0 ? ' ' : '') + LINES[lineIndex].slice(0, charIndex)
  const trimmed = typedText.length > 68 ? `...${typedText.slice(-68)}` : typedText
  const inputText = trimmed || '<waiting>'
  const outputShape = phase === 'extract' || phase === 'deposit' ? outputValue : '[?, 4096]'
  const lockActive = phase !== 'typing'
  const depositActive = phase === 'deposit'
  const depositRows = depositActive ? 3 : Math.min(3, cycle % 3)

  useEffect(() => {
    if (phase === 'extract') {
      let i = 0
      const timer = setInterval(() => {
        i = (i + 1) % outputTicks.length
        setOutputValue(outputTicks[i])
      }, 140)
      return () => clearInterval(timer)
    }
    if (phase === 'deposit') {
      setOutputValue('[1, 4096]')
    }
    return undefined
  }, [phase, outputTicks])

  const narrativeCardStyle = {
    background: 'rgba(255,255,255,0.72)',
    borderColor: lockActive ? 'rgba(217,138,44,0.45)' : 'rgba(45,109,166,0.2)',
    boxShadow: lockActive ? '0 18px 40px rgba(45,48,68,0.2)' : '0 12px 30px rgba(45,48,68,0.12)',
    padding: '20px 22px',
  }

  const terminalCardStyle = {
    background: 'rgba(255,255,255,0.8)',
    borderColor: 'rgba(45,109,166,0.2)',
    overflow: 'hidden',
  }

  return (
    <NordSlide className="semanticProcessSlide" data-phase={phase} data-cycle={cycle}>
      <div className="nordGrid2" style={{ alignItems: 'center' }}>
        <section>
          <Title stagger={0} style={{ marginBottom: 12 }}>
            语义特征工程
          </Title>
          <Text className="nordText" style={{ marginBottom: 18 }}>
            以时间轴驱动叙事，展示文本窗口如何被锁定并转化为高维特征。
          </Text>
          <Card className="semanticNarrativeCard" style={narrativeCardStyle}>
            <div className={`semanticLockBadge ${phase === 'lock' ? 'isActive' : ''}`}>
              Window Locked · 200 tokens
            </div>
            <div className="semanticNarrativeLines">
              {LINES.map((line, idx) => {
                const isActive = idx === lineIndex
                const isDone = idx < lineIndex
                const visibleText = isActive ? line.slice(0, charIndex) : isDone ? line : ''
                const color = lockActive ? COLORS.warning : COLORS.accent1
                const dimmed = depositActive && isDone
                return (
                  <div key={`${line}-${idx}`} className={`semanticLine ${isDone ? 'isDone' : ''} ${isActive ? 'isActive' : ''}`}>
                    <span
                      style={{
                        fontSize: 22,
                        letterSpacing: '0.06em',
                        color: dimmed ? COLORS.textDim : color,
                        opacity: dimmed ? 0.6 : 1,
                      }}
                    >
                      {visibleText || ' '}
                    </span>
                    {isActive && cursorOn && phase === 'typing' ? (
                      <span className="semanticCursor" />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </Card>
          <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16 }}>
            {TIMELINE.map((step) => (
              <DotItem key={step.key} color={phase === step.key ? COLORS.warning : COLORS.accent1}>       
                <span style={{ fontWeight: phase === step.key ? 700 : 400, color: phase === step.key ? COLORS.text : COLORS.textDim }}>
                  {step.label}
                </span>
              </DotItem>
            ))}
          </ul>
        </section>

        <section style={{ position: 'relative' }}>
          <Card className="semanticTerminalCard" style={terminalCardStyle}>
            <div className="terminalBar" aria-hidden="true">
              <span className="dotRed" />
              <span className="dotYellow" />
              <span className="dotGreen" />
            </div>
            <div className="terminalBody" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, lineHeight: 1.7 }}>
              <div>
                <span style={{ color: COLORS.purple }}>const</span> <span style={{ color: COLORS.accent1 }}>embedding</span> ={' '}
                <span className={`semanticCodePulse ${phase === 'extract' ? 'isActive' : ''}`} style={{ color: COLORS.success }}>
                  model
                </span>
                .encode(
              </div>
              <div className={`semanticCodeLine ${phase === 'typing' || phase === 'lock' ? 'isActive' : ''}`} style={{ paddingLeft: 16 }}>
                <span style={{ color: COLORS.accent2 }}>input_text</span>: <span style={{ color: COLORS.warning }}>"{inputText}"</span>,
              </div>
              <div className={`semanticCodeLine ${phase === 'lock' ? 'isActive' : ''}`} style={{ paddingLeft: 16 }}>
                <span style={{ color: COLORS.accent2 }}>context_window</span>: <span style={{ color: COLORS.error }}>200</span>,
              </div>
              <div>)</div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim }}>// Output Shape</span>
                <span className={`semanticOutputValue ${phase === 'extract' ? 'isRolling' : ''}`} style={{ color: phase === 'extract' || phase === 'deposit' ? COLORS.warning : COLORS.textDim }}>
                  {outputShape}
                </span>
              </div>
              <div style={{ marginTop: 10, color: COLORS.accent1 }}>
                {phase === 'extract' ? `Extracting${extractDots}` : phase === 'deposit' ? 'Depositing to feature bank' : 'Awaiting lock-on'}
              </div>
            </div>
          </Card>
          <div className={`semanticBank ${depositActive ? 'isActive' : ''}`}>
            <div className="semanticBankTitle">Feature Bank</div>
            <div className="semanticBankGrid">
              {Array.from({ length: 3 }).map((_, row) => (
                <div key={row} className={`semanticBankRow ${row < depositRows ? 'isFilled' : ''}`} style={{ '--row-delay': `${row * 120}ms` }} />
              ))}
            </div>
          </div>
        </section>
      </div>
      <div className="semanticParticleField" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, idx) => (
          <span
            key={idx}
            className="semanticParticle"
            style={{
              '--p-delay': `${idx * 120}ms`,
              '--p-top': `${10 + idx * 6}%`,
            }}
          />
        ))}
      </div>
    </NordSlide>
  )
}
