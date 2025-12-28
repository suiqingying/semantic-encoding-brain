import { Card, COLORS, NordSlide, Text, Title } from './_nord'

function BigBadge({ color, label }) {
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${color}55`,
        background: `${color}18`,
        color,
        fontWeight: 950,
        fontSize: 26,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </div>
  )
}

export default function Slide14FunctionalPreference() {
  return (
    <NordSlide>
      <Title>脑区功能偏好</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, height: '100%', paddingBottom: 24, marginTop: 22 }}>
        <Card style={{ padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22 }}>
          <BigBadge color={COLORS.success} label="A1" />
          <div style={{ fontSize: 34, fontWeight: 900 }}>Primary A1</div>
          <Text>强偏好底层声学特征</Text>
        </Card>
        <Card style={{ padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22 }}>
          <BigBadge color={COLORS.accent2} label="PFC" />
          <div style={{ fontSize: 34, fontWeight: 900 }}>PFC / Assc.</div>
          <Text>强偏好抽象语义特征</Text>
        </Card>
      </div>
    </NordSlide>
  )
}
