import { Card, COLORS, NordSlide, Text, Title } from './_nord'
import Waveform from './_waveform'
import { useEffect, useState } from 'react'
import WavingRow from './_waving'

export default function Slide09AcousticFeature() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('waveformMode')
    return saved || 'demo'
  })

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '1') {
        e.preventDefault()
        setMode('demo')
      } else if (e.key === '2') {
        e.preventDefault()
        setMode('ambient')
      } else if (e.key === '3') {
        e.preventDefault()
        setMode('mic')
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault()
        setMode((m) => (m === 'demo' ? 'ambient' : m === 'ambient' ? 'mic' : 'demo'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('waveformMode', mode)
    } catch {}
  }, [mode])

  return (
    <NordSlide>
      <div className="nordGrid2" style={{ alignItems: 'center' }}>
        <div>
          <Title stagger={0}>声学特征工程</Title>
          <Text className="nordText" style={{ marginTop: 0 }}>
            利用音频模型捕捉音高、音色、韵律等非语义信息。
          </Text>
          <ul style={{ margin: '26px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 22, fontWeight: 300, opacity: 0.9 }}>
            <li className="nordDotItem">
              <span className="nordDot" style={{ background: COLORS.success }} />
              <span>Models: Wav2vec 2.0, WavLM</span>
            </li>
            <li className="nordDotItem">
              <span className="nordDot" style={{ background: COLORS.success }} />
              <span>Window: 3s (2 TRs)</span>
            </li>
          </ul>
        </div>

        <Card style={{ padding: 18, background: 'rgba(0,0,0,0.22)', borderColor: 'rgba(255,255,255,0.10)' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, opacity: 0.72, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Live Acoustic Visualization
          </div>
          <div style={{ height: 260, marginTop: 12, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {mode === 'demo' ? (
              <WavingRow color={COLORS.success} />
            ) : (
              <Waveform
                color={COLORS.success}
                opacity={0.90}
                live={mode === 'mic'}
                forceAmbient={mode !== 'mic'}
              />
            )}
          </div>
        </Card>
      </div>
    </NordSlide>
  )
}
