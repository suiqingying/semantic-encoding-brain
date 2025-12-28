import React, { useEffect, useState, useRef } from 'react'
import { Card, COLORS, NordSlide, SubTitle, Text, Title } from './_nord'
import Waveform from './_waveform'
import WavingRow from './_waving'

const FeatureMatrix = ({ isExtracting }) => {
  const numRows = 8;
  const numCols = 18;
  return (
    <div className={`feature-matrix ${isExtracting ? 'extracting' : ''}`}>
      {Array.from({ length: numRows * numCols }).map((_, i) => {
        const col = Math.floor(i / numRows);
        return (
          <div 
            key={i} 
            className="feature-cell" 
            style={{ 
              '--col': col, 
              background: `hsl(${200 + Math.random() * 40}, 70%, ${50 + Math.random() * 20}%)`
            }} 
          />
        )
      })}
    </div>
  );
};

export default function Slide07AcousticFeature() {
  const [extractionStatus, setExtractionStatus] = useState('idle'); // 'idle', 'extracting', 'done'
  const [mode, setMode] = useState(() => localStorage.getItem('waveformMode') || 'demo');
  const [animationKey, setAnimationKey] = useState(0); // Used to reset animations

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (extractionStatus !== 'idle') return; // Disable mode switching during/after animation
      if (key === '1' || key === '2' || key === '3') {
        e.preventDefault();
        setMode(key === '1' ? 'demo' : key === '2' ? 'ambient' : 'mic');
      } else if (key === 'v') {
        e.preventDefault();
        setMode(m => (m === 'demo' ? 'ambient' : m === 'ambient' ? 'mic' : 'demo'));
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [extractionStatus])

  useEffect(() => {
    try {
      localStorage.setItem('waveformMode', mode)
    } catch {}
  }, [mode])
  
  useEffect(() => {
    if (extractionStatus === 'extracting') {
      const timer = setTimeout(() => {
        setExtractionStatus('done');
      }, 3500); // Match animation duration + buffer
      return () => clearTimeout(timer);
    }
  }, [extractionStatus]);

  const handleStart = () => {
    setExtractionStatus('extracting');
  };

  const handleReset = () => {
    setExtractionStatus('idle');
    setAnimationKey(prevKey => prevKey + 1); // Change key to force re-mount and re-play animations
  };

  return (
    <NordSlide>
      <style>{`
        .feature-matrix { 
          display: grid; 
          grid-template-columns: repeat(18, 1fr); 
          gap: 4px; 
          position: relative;
        }
        .feature-cell { 
          aspect-ratio: 1; 
          background: #ccc; 
          border-radius: 3px; 
          opacity: 0;
          transform: scale(0);
        }
        .extracting .feature-cell {
          animation: pop-in 0.4s ease forwards;
          /* Delay is based on the column index, creating a left-to-right fill */
          animation-delay: calc(var(--col) * 150ms);
        }
        @keyframes pop-in {
          to { opacity: 1; transform: scale(1); }
        }
        .scanner {
          position: absolute;
          top: 0;
          left: 0;
          width: 18%;
          height: 100%;
          background: rgba(217, 138, 44, 0.25);
          border-left: 2px solid ${COLORS.warning};
          border-right: 2px solid ${COLORS.warning};
          box-shadow: 0 0 16px rgba(217, 138, 44, 0.5);
          opacity: 0;
        }
        .extracting .scanner {
          opacity: 1;
          animation: scan 3s linear forwards;
        }
        @keyframes scan {
          from { left: 0%; opacity: 1; }
          99% { left: 100%; opacity: 1; }
          to { left: 100%; opacity: 0; }
        }
        .start-button, .reset-button {
          font-family: ui-monospace, monospace;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: transparent;
        }
        .start-button { color: ${COLORS.accent1}; }
        .reset-button { color: ${COLORS.success}; }
        .start-button:hover:not(:disabled) {
          background: rgba(45, 109, 166, 0.1);
          border-color: rgba(45, 109, 166, 0.3);
        }
        .reset-button:hover {
          background: rgba(45, 109, 100, 0.1);
          border-color: rgba(45, 109, 100, 0.3);
        }
        .start-button:disabled {
          color: ${COLORS.textDim};
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>

      <Title stagger={0}>声学特征提取: 扫描与生成</Title>
      
      <div key={animationKey} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginTop: 20 }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SubTitle style={{marginTop: 0, fontSize: 22}}>原始音频信号 (Raw Audio)</SubTitle>
          <Card className={`waveform-card ${extractionStatus === 'extracting' ? 'extracting' : ''}`} style={{ height: 400, padding: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%' }}>
               {mode === 'demo' ? (
                <WavingRow color={COLORS.success} />
              ) : (
                <Waveform
                  color={COLORS.success}
                  opacity={0.90}
                  live={mode === 'mic'}
                  forceAmbient={mode === 'ambient'} /* CORRECTED: Only force ambient in ambient mode */
                />
              )}
            </div>
            <div className="scanner" />
          </Card>
          <div style={{textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center'}}>
            <button onClick={handleStart} disabled={extractionStatus !== 'idle'} className="start-button">
              {extractionStatus === 'idle' && '▶ 开始扫描/提取'}
              {extractionStatus === 'extracting' && '正在提取...'}
              {extractionStatus === 'done' && '提取完成'}
            </button>
            {extractionStatus === 'done' && (
              <button onClick={handleReset} className="reset-button">
                ↻ 重置
              </button>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SubTitle style={{marginTop: 0, fontSize: 22}}>声学特征矩阵 (Feature Matrix)</SubTitle>
           <Card style={{ padding: 20 }}>
            <FeatureMatrix isExtracting={extractionStatus === 'extracting'} />
          </Card>
           <Text>
            一个“扫描窗口”划过原始声波，每一步都将窗口内的音频通过模型转化为一列高维特征向量，最终生成完整的特征矩阵。
          </Text>
        </div>
      </div>
    </NordSlide>
  )
}
