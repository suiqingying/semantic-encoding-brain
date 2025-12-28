import { Card, COLORS, NordSlide, Text, Title } from './_nord'
import Waveform from './_waveform'

export default function Slide05Dataset() {
  return (
    <NordSlide>
      <Title stagger={0}>数据集：Narratives — 1st Year</Title>

      <div
        data-stagger=""
        style={{
          '--stagger-delay': '400ms',
          display: 'grid',
          gridTemplateColumns: '0.42fr 0.58fr',
          gap: 44,
          marginTop: 18,
          alignItems: 'center',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingRight: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.text, opacity: 0.95 }}>数据源</div>
          <Text>
            来自公开 Narratives fMRI 数据集，包含 25 名英语母语者收听同一故事的记录。
          </Text>

          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: COLORS.text, opacity: 0.95 }}>刺激详情</div>
          <Text>
            内容：自然叙事播客 “1st year”
            <br />
            时长：约 56 分钟
          </Text>

          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: COLORS.text, opacity: 0.95 }}>fMRI 参数</div>
          <Text>
            N = 25（高信噪比）
            <br />
            TR = 1.5s（约 2249 TRs）
            <br />
            MMP 360 ROIs
          </Text>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(35,48,68,0.12)', background: 'rgba(255,255,255,0.72)' }}>
          <div style={{ padding: 18, borderBottom: '1px solid rgba(35,48,68,0.08)' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, opacity: 0.72, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Audio Waveform Visualized
            </div>
            <div style={{ height: 140, marginTop: 10, borderRadius: 14, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(35,48,68,0.12)', overflow: 'hidden' }}>
              <Waveform color={COLORS.accent1} live opacity={0.9} />
            </div>
          </div>

          <div style={{ padding: 18 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: 'rgba(217,138,44,0.95)', lineHeight: 1.45 }}>
              "...I was 21 years old when I felt the weight of it... my weird when I unnamed it ... I seriously unmurdered to the world seemed to be..."
            </div>
          </div>
        </Card>
      </div>
    </NordSlide>
  )
}
