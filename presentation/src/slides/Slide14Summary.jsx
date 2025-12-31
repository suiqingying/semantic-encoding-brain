import { useEffect, useMemo, useState } from 'react'
import { COLORS, NordSlide, Text, Title } from './_nord'

export default function Slide14Summary() {
  const barAreaHeight = 180
  const [linearAvg, setLinearAvg] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let canceled = false
    async function load() {
      try {
        setLoadError(null)
        const resp = await fetch('/assets/corr_layer12_roi_stats_lh.json')
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const stats = await resp.json()
        const values = Object.values(stats || {})
          .map((item) => (typeof item?.r2 === 'number' ? item.r2 : null))
          .filter((v) => v != null)
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
        if (!canceled) setLinearAvg(avg)
      } catch (e) {
        if (!canceled) setLoadError(e?.message || String(e))
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [])

  const data = useMemo(() => {
    return [
      { label: '线性模型', value: linearAvg ?? 0, color: COLORS.textDim, display: linearAvg },
      { label: '非线性模型', value: 0.02534, color: COLORS.accent1, display: 0.02534 },
    ]
  }, [linearAvg])
  const maxValue = useMemo(() => {
    const values = data.map((item) => item.value).filter((v) => typeof v === 'number')
    const max = values.length ? Math.max(...values) : 1
    return max > 0 ? max : 1
  }, [data])


  return (
    <NordSlide>
      <Title>综合与展望</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 26, alignItems: 'center' }}>
        <div
          style={{
            aspectRatio: '1 / 1',
            width: '100%',
            maxWidth: 380,
            padding: 28,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(235,241,250,0.7))',
            border: '1px solid rgba(35,48,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(35,48,68,0.08)',
            justifySelf: 'center',
          }}
        >
          <Text style={{ fontSize: 24, lineHeight: 1.6 }}>
            线性与非线性模型的性能对比显示，非线性模型在语义预测任务中取得更高表现，提示高阶表征需要更复杂的映射。
          </Text>
        </div>
        <div
          style={{
            height: 260,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-evenly',
            padding: '18px 18px 12px',
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,248,252,0.7))',
            border: '1px solid rgba(35,48,68,0.1)',
            boxShadow: '0 18px 36px rgba(35,48,68,0.08)',
          }}
        >
          {data.map((item) => {
            const heightPx = Math.max(0, Math.min(1, item.value / maxValue)) * barAreaHeight
            return (
              <div key={item.label} style={{ width: 120, textAlign: 'center' }}>
                <div style={{ height: barAreaHeight, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div
                    style={{
                      height: `${heightPx}px`,
                      minHeight: 18,
                      width: 56,
                      borderRadius: 10,
                      background: item.color,
                      boxShadow: '0 10px 20px rgba(35,48,68,0.12)',
                      transition: 'height 600ms ease',
                    }}
                  />
                </div>
                <div style={{ marginTop: 12, fontSize: 16, color: COLORS.text }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 14, color: COLORS.textDim }}>{item.display == null ? '—' : item.display.toFixed(3)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </NordSlide>
  )
}
