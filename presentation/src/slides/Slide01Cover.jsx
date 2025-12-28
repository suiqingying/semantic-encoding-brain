import { COLORS, NordSlide } from './_nord'

function ActivityMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h4l2-6 4 12 2-6h6"
        stroke={COLORS.accent1}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Slide01Cover() {
  return (
    <NordSlide>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 24 }}>
        <div
          data-stagger=""
          style={{
            '--stagger-delay': '0ms',
            marginBottom: 22,
            padding: 14,
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(94,129,172,0.18)',
          }}
        >
          <ActivityMark />
        </div>

        <h1
          data-stagger=""
          style={{
            '--stagger-delay': '0ms',
            margin: 0,
            fontSize: 96,
            fontWeight: 950,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
          }}
        >
          解码思维
        </h1>

        <div
          data-stagger=""
          style={{
            '--stagger-delay': '200ms',
            height: 8,
            width: 160,
            borderRadius: 999,
            marginTop: 18,
            marginBottom: 36,
            background: `linear-gradient(90deg, ${COLORS.accent1}, ${COLORS.accent3})`,
          }}
        />

        <div
          data-stagger=""
          style={{ '--stagger-delay': '400ms', fontSize: 34, fontWeight: 300, lineHeight: 1.25, color: COLORS.textDim, maxWidth: 900 }}
        >
          基于多模态预训练模型的
          <br />
          <span style={{ color: COLORS.accent1, fontWeight: 600 }}>全脑语义映射</span>
        </div>
      </div>
    </NordSlide>
  )
}
