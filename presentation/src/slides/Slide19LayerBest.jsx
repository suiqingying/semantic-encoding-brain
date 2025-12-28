import { COLORS, NordSlide, Title } from './_nord'

export default function Slide19LayerBest() {
  const hs = [20, 40, 60, 85, 95, 80, 60, 40, 30]
  return (
    <NordSlide>
      <Title>层级分析：最佳“频点”</Title>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 72px 56px', gap: 12 }}>
        {hs.map((h, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              flex: 1,
              height: `${h}%`,
              borderRadius: '14px 14px 0 0',
              background: i === 4 ? COLORS.accent1 : COLORS.bgLight,
              opacity: i === 4 ? 1 : 0.9,
            }}
          >
            {i === 4 ? (
              <div style={{ position: 'absolute', top: -54, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: 180 }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: COLORS.accent1 }}>Best Fit</div>
                <div style={{ height: 18, width: 1, background: 'currentColor', margin: '8px auto 0' }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </NordSlide>
  )
}
