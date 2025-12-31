import React from 'react'
import { Card, COLORS, NordSlide, SubTitle, Title } from './_nord'

// Inline SVGs to replace lucide-react icons
const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
)

const AudioLinesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v3" />
    <path d="M6 6v11" />
    <path d="M10 3v18" />
    <path d="M14 8v7" />
    <path d="M18 5v13" />
    <path d="M22 10v3" />
  </svg>
)

const LayersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const ModelCard = ({ title, enTitle, icon: Icon, models, stagger }) => (
  <div data-stagger style={{ '--stagger-delay': `${stagger * 150}ms`, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
      <div style={{ padding: 12, background: 'rgba(45, 109, 166, 0.1)', borderRadius: 16, color: COLORS.accent1 }}>
        <Icon size={32} />
      </div>
      <div>
        <h3 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, lineHeight: 1.1 }}>{title}</h3>
        <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.textDim }}>{enTitle}</p>
      </div>
    </div>
    
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, listStyle: 'none', padding: 0, margin: 0 }}>
      {models.map((model, idx) => (
        <li key={idx} data-stagger style={{ '--stagger-delay': `${stagger * 150 + idx * 80 + 300}ms`, display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: COLORS.textDim }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.accent3 }} />
          <span>{model}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Divider = () => (
  <div style={{ width: '1px', background: 'rgba(35, 48, 68, 0.15)', alignSelf: 'stretch', margin: '60px 0' }} />
)

export default function Slide05FeatureIntro() {
  const data = [
    { title: "文本模型", enTitle: "Text Models", icon: FileTextIcon, models: ["GPT-2", "BERT", "Qwen2"] },
    { title: "音频模型", enTitle: "Audio Models", icon: AudioLinesIcon, models: ["Wav2Vec 2.0", "WavLM"] },
    { title: "多模态模型", enTitle: "Multimodal Models", icon: LayersIcon, models: ["CLAP", "Whisper"] }
  ];

  return (
    <NordSlide>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center', justifyContent: 'center', gap: 60, padding: '40px 0' }}>
        
        {/* Top Title Block */}
        <div>
          <Title data-stagger style={{ fontSize: 52, marginBottom: 12 }}>
            特征提取器: <span style={{ color: COLORS.accent1 }}>一个全面的跨模态预训练模型库</span>
          </Title>
          <SubTitle data-stagger style={{ '--stagger-delay': '300ms', fontSize: 22, color: COLORS.textDim, maxWidth: 800, margin: '0 auto' }}>
            为全面探索大脑的语言表征，我们构建了一个包含多种架构和模态的模型库，满足每种模态至少对比三个模型的要求。
          </SubTitle>
        </div>

        {/* Middle Content Block */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {data.map((item, idx) => (
            <React.Fragment key={idx}>
              <ModelCard {...item} stagger={idx + 1} />
              {idx < data.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom Details Block */}
        <div data-stagger style={{ '--stagger-delay': '1200ms', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 12, color: COLORS.textDim }}>
          <SettingsIcon />
          <p style={{ fontSize: 16, margin: 0 }}>
            <strong style={{ fontWeight: 800, color: COLORS.text }}>技术细节:</strong>
            {' '}文本模型采用 <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(45, 109, 166, 0.4)' }}>200-token</span> 上下文窗口；所有模态特征均对每个 TR (1.5s) 进行平均池化。
          </p>
        </div>
      </div>
    </NordSlide>
  );
};
