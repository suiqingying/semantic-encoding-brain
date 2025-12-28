import { useEffect, useMemo, useState } from 'react'
import { COLORS, NordSlide, Text, Title } from './_nord'
import { Brain2DMap } from './_brain2dmap'

export default function Slide12SemanticMap() {
  const [roiColors, setRoiColors] = useState(null)
  const [roiStats, setRoiStats] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [selectedRoi, setSelectedRoi] = useState(null)

  useEffect(() => {
    let canceled = false
    async function load() {
      try {
        setLoadError(null)
        const [colorsResp, statsResp] = await Promise.all([
          fetch('/assets/corr_layer12_roi_colors_lh.json'),
          fetch('/assets/corr_layer12_roi_stats_lh.json'),
        ])
        if (!colorsResp.ok) throw new Error(`HTTP ${colorsResp.status}`)
        if (!statsResp.ok) throw new Error(`HTTP ${statsResp.status}`)
        const [colorsJson, statsJson] = await Promise.all([colorsResp.json(), statsResp.json()])
        if (!canceled) {
          setRoiColors(colorsJson)
          setRoiStats(statsJson)
        }
      } catch (e) {
        if (!canceled) setLoadError(e?.message || String(e))
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [])

  const legendNote = useMemo(() => {
    if (loadError) return `数据加载失败：${loadError}`
    if (!roiColors) return '正在加载离线颜色映射…'
    return '颜色来自离线预计算（corr_layer12.npy → corr_layer12_roi_colors_lh.json）'
  }, [roiColors, loadError])

  const readout = useMemo(() => {
    if (!selectedRoi) return { title: 'R²（点击 ROI 查看）', body: '—' }
    const stats = roiStats?.[String(selectedRoi)]
    if (!stats) return { title: `ROI ${selectedRoi}`, body: '—' }
    const r2 = typeof stats.r2 === 'number' ? stats.r2 : null
    return {
      title: `ROI ${selectedRoi}`,
      body: r2 == null ? '—' : r2.toFixed(3),
    }
  }, [selectedRoi, roiStats])

  return (
    <NordSlide>
      <Title stagger={0}>全脑语义地图</Title>
      <div
        className="nordGrid2"
        data-stagger=""
        style={{
          ...{ '--stagger-delay': '400ms' },
          marginTop: 18,
          gap: 34,
          alignItems: 'stretch',
          gridTemplateColumns: '1.08fr 1fr',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
          <Text>
            将每个 ROI 的<strong style={{ color: COLORS.text }}>语言相关性</strong>映射为颜色：越红表示越接近语言网络，越蓝表示相关性较弱。
          </Text>
          <div className="nordCard" style={{ padding: 18, background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(35,48,68,0.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, marginBottom: 10 }}>语言相关性</div>
            <div style={{ height: 12, borderRadius: 999, background: 'linear-gradient(90deg, #2d6da6, #d94b4b)', border: '1px solid rgba(35,48,68,0.12)' }} />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textDim }}>
              <span>弱</span>
              <span>强</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: COLORS.textDim }}>{legendNote}</div>
          </div>
          <div className="nordCard" style={{ padding: 18, background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(35,48,68,0.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, marginBottom: 8 }}>核心发现</div>
            <div style={{ fontSize: 20, lineHeight: 1.45, color: COLORS.textDim }}>
              语义表征并非局限于单一“语言区”，而是覆盖语言、记忆与高阶认知相关的分布式网络。
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', height: 520 }}>
          <Brain2DMap
            ariaLabel="Semantic ROI map"
            surfaceUrl="/atlas/tpl-fsaverage_den-41k_hemi-L_inflated.surf.gii"
            labelUrl="/atlas/tpl-fsaverage6_hemi-L_desc-MMP_dseg.label.gii"
            roiColorById={roiColors || undefined}
            onSelect={(id) => {
              if (id != null) setSelectedRoi(id)
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 18,
              top: 18,
              width: 210,
              padding: 10,
              background: 'transparent',
              textAlign: 'right',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.textDim, letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 1px 0 rgba(255,255,255,0.75)' }}>
              R²
            </div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: COLORS.text, textShadow: '0 1px 0 rgba(255,255,255,0.75)' }}>{readout.title}</div>
            <div style={{ marginTop: 8, fontSize: 38, fontWeight: 950, color: COLORS.accent1, lineHeight: 1, textShadow: '0 1px 0 rgba(255,255,255,0.80)' }}>
              {readout.body}
            </div>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
