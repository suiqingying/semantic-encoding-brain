import { COLORS, NordSlide, Text, Title } from './_nord'
import { Brain2DMap } from './_brain2dmap'

export default function Slide16AcousticMap() {
  return (
    <NordSlide>
      <Title stagger={0}>全脑声学地图</Title>
      <div data-stagger="" style={{ '--stagger-delay': '400ms' }}>
        <div
          className="nordCard"
          style={{
            marginTop: 22,
            height: 520,
            borderRadius: 22,
            background: 'rgba(255,255,255,0.74)',
            borderColor: 'rgba(35,48,68,0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Brain2DMap
            ariaLabel="Acoustic ROI map"
            surfaceUrl="/atlas/tpl-fsaverage_den-41k_hemi-L_inflated.surf.gii"
            labelUrl="/atlas/tpl-fsaverage6_hemi-L_desc-MMP_dseg.label.gii"
          />

          <div
            className="nordCard"
            style={{
              position: 'absolute',
              right: 36,
              bottom: 28,
              width: 620,
              padding: 22,
              background: 'rgba(255,255,255,0.78)',
              borderColor: 'rgba(35,48,68,0.12)',
            }}
          >
            <Text>
              基于最佳音频模型 (<span className="kw kwG">WavLM</span>) 预测。
              <br />
              <br />
              <strong style={{ color: COLORS.success }}>核心发现：</strong>
              <br />
              处理高度局部化。全脑大部分区域为暗色，唯独双侧颞上回 (<span className="kw kwG">STG/A1</span>) 附近呈现更亮的激活斑块。
            </Text>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
