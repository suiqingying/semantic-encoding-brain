import { COLORS, NordSlide, Text, Title } from './_nord'
import { Brain2DMap } from './_brain2dmap'

export default function Slide15SemanticMap() {
  return (
    <NordSlide>
      <Title stagger={0}>全脑语义地图</Title>
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
            ariaLabel="Semantic ROI map"
            surfaceUrl="/atlas/tpl-fsaverage_den-41k_hemi-L_inflated.surf.gii"
            labelUrl="/atlas/tpl-fsaverage6_hemi-L_desc-MMP_dseg.label.gii"
          />

          <div
            className="nordCard"
            style={{
              position: 'absolute',
              left: 36,
              bottom: 28,
              width: 620,
              padding: 22,
              background: 'rgba(255,255,255,0.78)',
              borderColor: 'rgba(35,48,68,0.12)',
            }}
          >
            <Text>
              基于最佳文本模型 (Llama) 预测。
              <br />
              <br />
              <strong style={{ color: COLORS.warning }}>核心发现：</strong>
              <br />
              大脑的语义系统是一个广布的分布式网络，横跨双侧大脑半球，覆盖语言、记忆和高级认知功能的核心脑区。
            </Text>
          </div>
        </div>
      </div>
    </NordSlide>
  )
}
