import { Card, ChartBar, COLORS, DotItem, NordSlide, SubTitle, Text, Title } from './_nord'

function Bolt() {
  return (
    <svg width="84" height="84" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" fill={COLORS.warning} opacity="0.95" />
    </svg>
  )
}

export default function Slide13Fusion() {
  return (
    <NordSlide>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 72, height: 72, display: 'grid', placeItems: 'center' }}>
              <Bolt />
              <div className="fusionGlow" aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <Title stagger={0} style={{ margin: 0 }}>
                多模态融合：<span style={{ color: COLORS.warning }}>Text + Audio</span> → Brain
              </Title>
              <Text style={{ marginTop: 10, marginBottom: 0, maxWidth: 980 }}>
                融合模型在联合皮层（TPJ / STS）显著提升预测准确率：语义提供“<span style={{ color: COLORS.accent1, fontWeight: 800 }}>意义</span>”，声学提供“
                <span style={{ color: COLORS.success, fontWeight: 800 }}>形</span>”。
              </Text>
            </div>
          </div>
        </div>

        <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '350ms' }, alignItems: 'stretch', gap: 34, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card className="fusionCard" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <SubTitle style={{ margin: 0, fontSize: 20 }}>融合管线</SubTitle>
                <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.textDim, fontWeight: 900 }}>late-fusion (concat + pca)</div>
              </div>

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="fusionBox fusionBoxText">
                  <div className="fusionBoxKicker">TEXT</div>
                  <div className="fusionBoxTitle">LLM 层特征</div>
                  <div className="fusionBoxMeta">align → TR mean</div>
                </div>
                <div className="fusionBox fusionBoxAudio">
                  <div className="fusionBoxKicker">AUDIO</div>
                  <div className="fusionBoxTitle">自监督语音特征</div>
                  <div className="fusionBoxMeta">TR window pooling</div>
                </div>
              </div>

              <div className="fusionArrowRow" aria-hidden="true">
                <svg viewBox="0 0 100 20" width="100%" height="20" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="fusionGrad" x1="0" x2="1">
                      <stop offset="0%" stopColor={COLORS.accent1} />
                      <stop offset="45%" stopColor={COLORS.warning} />
                      <stop offset="100%" stopColor={COLORS.success} />
                    </linearGradient>
                  </defs>
                  <path className="fusionArrowPath" d="M2 10 H 98" stroke="url(#fusionGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M92 4 L98 10 L92 16" stroke="url(#fusionGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="fusionBox fusionBoxFuse">
                <div className="fusionBoxKicker">FUSE</div>
                <div className="fusionBoxTitle">z-score → concat → PCA(d)</div>
                <div className="fusionBoxMeta">X = [X_text || X_audio]</div>
              </div>

              <div className="fusionArrowRow" aria-hidden="true">
                <svg viewBox="0 0 100 20" width="100%" height="20" preserveAspectRatio="none">
                  <path className="fusionArrowPath" d="M2 10 H 98" stroke="rgba(35,48,68,0.35)" strokeWidth="2.25" fill="none" strokeLinecap="round" />
                  <path d="M92 4 L98 10 L92 16" stroke="rgba(35,48,68,0.35)" strokeWidth="2.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="fusionBox fusionBoxNeutral">
                  <div className="fusionBoxKicker">TEMPORAL</div>
                  <div className="fusionBoxTitle">FIR 展开</div>
                  <div className="fusionBoxMeta">window + offset</div>
                </div>
                <div className="fusionBox fusionBoxNeutral">
                  <div className="fusionBoxKicker">FIT</div>
                  <div className="fusionBoxTitle">RidgeCV</div>
                  <div className="fusionBoxMeta">multi-subject CV</div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 18, background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(35,48,68,0.12)' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, marginBottom: 12 }}>关键直觉</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16 }}>
                <DotItem color={COLORS.accent1}>文本捕捉长程语义与叙事结构</DotItem>
                <DotItem color={COLORS.success}>音频捕捉韵律、音素与节律线索</DotItem>
                <DotItem color={COLORS.warning}>融合在“联合表征区”形成互补增益</DotItem>
              </ul>
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <SubTitle style={{ margin: 0, fontSize: 20 }}>性能对比（示意）</SubTitle>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: COLORS.textDim }}>metric: Pearson r</div>
              </div>
              <ChartBar label="Best Text" value={0.58} color={COLORS.accent1} max={0.8} />
              <ChartBar label="Best Audio" value={0.32} color={COLORS.success} max={0.8} />
              <ChartBar label="Fusion" value={0.64} color={COLORS.warning} max={0.8} highlight note="Synergy" />
              <Text style={{ marginTop: 14, marginBottom: 0, fontSize: 16 }}>
                增益主要出现在：<span className="kw kwO">TPJ</span> / <span className="kw kwO">STS</span>（多线索整合）。
              </Text>
            </Card>

            <Card className="fusionTerminal" style={{ overflow: 'hidden' }}>
              <div className="terminalBar" aria-hidden="true">
                <span className="dotRed" />
                <span className="dotYellow" />
                <span className="dotGreen" />
                <div style={{ marginLeft: 8, fontSize: 12, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase', color: COLORS.textDim }}>fusion.py (core)</div>
              </div>
              <div className="terminalBody" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.75 }}>
                <div className="fusionCodeLine">
                  <span style={{ color: COLORS.purple }}>text_tr</span> = <span style={{ color: COLORS.accent1 }}>align_word_features_to_tr</span>(...)
                </div>
                <div className="fusionCodeLine">
                  <span style={{ color: COLORS.purple }}>X_text</span> = <span style={{ color: COLORS.warning }}>zscore</span>(text_tr)
                </div>
                <div className="fusionCodeLine">
                  <span style={{ color: COLORS.purple }}>X_audio</span> = <span style={{ color: COLORS.warning }}>zscore</span>(audio_features)
                </div>
                <div className="fusionCodeLine">
                  <span style={{ color: COLORS.purple }}>X</span> = <span style={{ color: COLORS.warning }}>PCA(d)</span>(concat(X_text, X_audio))
                </div>
                <div className="fusionCodeLine">
                  <span style={{ color: COLORS.purple }}>X_fir</span> = <span style={{ color: COLORS.accent2 }}>build_fir</span>(X, window, offset)
                </div>
                <div className="fusionCodeLine">
                  <span style={{ color: COLORS.purple }}>corr</span> = <span style={{ color: COLORS.accent2 }}>run_cv_multi_subjects</span>(X_fir, fmri)
                </div>

                <div className="fusionTags">
                  <span className="fusionTag">ctx_words=200</span>
                  <span className="fusionTag">tr_win=2</span>
                  <span className="fusionTag">pca_dim=DEFAULT</span>
                  <span className="fusionTag">fir_window=DEFAULT</span>
                  <span className="fusionTag">kfold=DEFAULT</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        .fusionGlow{
          position:absolute;
          inset:-8px;
          background: rgba(217,138,44,0.38);
          filter: blur(30px);
          z-index: -1;
          border-radius: 999px;
        }

        .fusionCard{
          background: rgba(255,255,255,0.75);
          border-color: rgba(35,48,68,0.12);
          box-shadow: 0 18px 44px rgba(45,48,68,0.14);
        }

        .fusionBox{
          border-radius: 14px;
          border: 1px solid rgba(35,48,68,0.12);
          padding: 14px 14px 12px;
          background: rgba(245,245,240,0.65);
          position: relative;
        }
        .fusionBoxKicker{
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 900;
          color: rgba(35,48,68,0.58);
        }
        .fusionBoxTitle{
          margin-top: 6px;
          font-size: 18px;
          font-weight: 950;
          color: ${COLORS.text};
          line-height: 1.15;
        }
        .fusionBoxMeta{
          margin-top: 6px;
          font-size: 12px;
          color: ${COLORS.textDim};
          font-family: ui-monospace, monospace;
          opacity: 0.85;
        }

        .fusionBoxText{
          border-left: 6px solid ${COLORS.accent1};
          background: rgba(45,109,166,0.06);
        }
        .fusionBoxAudio{
          border-left: 6px solid ${COLORS.success};
          background: rgba(45,109,166,0.06);
        }
        .fusionBoxFuse{
          border-left: 6px solid ${COLORS.warning};
          background: linear-gradient(90deg, rgba(45,109,166,0.06), rgba(217,138,44,0.08), rgba(45,109,166,0.06));
        }
        .fusionBoxNeutral{
          border-left: 6px solid rgba(35,48,68,0.22);
          background: rgba(255,255,255,0.55);
        }

        .fusionArrowRow{
          margin: 10px 0;
          opacity: 0.85;
        }
        .fusionArrowPath{
          stroke-dasharray: 10 10;
          animation: fusionFlow 2.2s linear infinite;
        }
        @keyframes fusionFlow{
          to { stroke-dashoffset: -40; }
        }

        .fusionTerminal{
          border-color: rgba(35,48,68,0.12);
          background: rgba(255,255,255,0.8);
        }
        .fusionCodeLine{
          padding: 2px 0;
        }
        .fusionTags{
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fusionTag{
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(35,48,68,0.14);
          background: rgba(245,245,240,0.70);
          color: ${COLORS.textDim};
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        @media (prefers-reduced-motion: reduce){
          .fusionArrowPath{ animation: none; }
        }
      `}</style>
    </NordSlide>
  )
}
