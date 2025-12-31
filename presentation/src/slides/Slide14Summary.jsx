import { Card, ChartBar, COLORS, DotItem, NordSlide, SubTitle, Text, Title } from './_nord'

export default function Slide14Summary() {
  const maxValue = 0.8
  const linear = 0.58
  const nonlinear = 0.76
  const delta = nonlinear - linear

  return (
    <NordSlide>
      <Title stagger={0}>综合与展望：线性 vs 非线性编码</Title>

      <div className="nordGrid2" data-stagger="" style={{ ...{ '--stagger-delay': '350ms' }, marginTop: 18, gap: 34, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
          <Card className="summaryHeroCard" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <SubTitle style={{ margin: 0, fontSize: 22 }}>同一套特征，不同映射假设</SubTitle>
              <div className="summaryTagRow">
                <span className="summaryTag summaryTagLinear">Linear</span>
                <span className="summaryTag summaryTagNonlinear">Nonlinear</span>
              </div>
            </div>
            <Text style={{ marginTop: 12, marginBottom: 0, fontSize: 18 }}>
              当我们从“<span className="kw kwA">可解释</span>”走向“<span className="kw kwO">更强表达力</span>”，模型开始更像大脑：尤其在
              <span className="kw kwO">PFC</span> 等高阶整合区域，非线性映射更可能带来额外增益。
            </Text>
          </Card>

          <Card style={{ padding: 18, background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(35,48,68,0.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, marginBottom: 12 }}>对比要点</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16 }}>
              <DotItem color={COLORS.textDim}>
                <span style={{ fontWeight: 900 }}>线性岭回归</span>：稳定、快速、权重可解释（β 映射）。
              </DotItem>
              <DotItem color={COLORS.warning}>
                <span style={{ fontWeight: 900 }}>核岭回归</span>：用 Kernel 捕捉非线性组合（RBF / poly）。
              </DotItem>
              <DotItem color={COLORS.accent1}>启示：高阶表征可能依赖更复杂的组合与交互项。</DotItem>
            </ul>
          </Card>

          <Card style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="summaryEquation summaryEquationLinear">
              <div className="summaryEquationKicker">LINEAR</div>
              <div className="summaryEquationBody">
                y = Xβ<span className="summaryEquationNote"> + ε</span>
              </div>
              <div className="summaryEquationMeta">Ridge / RidgeCV</div>
            </div>
            <div className="summaryEquation summaryEquationNonlinear">
              <div className="summaryEquationKicker">KERNEL</div>
              <div className="summaryEquationBody">
                y = K(X, X<sub>train</sub>)w
              </div>
              <div className="summaryEquationMeta">KernelRidge (RBF)</div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <SubTitle style={{ margin: 0, fontSize: 22 }}>性能对比（示意）</SubTitle>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: COLORS.textDim }}>metric: Pearson r</div>
            </div>
            <ChartBar label="线性模型（Ridge）" value={linear} color={COLORS.textDim} max={maxValue} />
            <ChartBar label="非线性模型（Kernel Ridge）" value={nonlinear} color={COLORS.warning} max={maxValue} highlight note="Best" />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ margin: 0, fontSize: 16 }}>
                关注增益区域：<span className="kw kwO">PFC</span> / <span className="kw kwO">TPJ</span>
              </Text>
              <div className="summaryDelta">
                <span>Δ</span>
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>+{delta.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="summaryTerminal" style={{ overflow: 'hidden' }}>
            <div className="terminalBar" aria-hidden="true">
              <span className="dotRed" />
              <span className="dotYellow" />
              <span className="dotGreen" />
              <div style={{ marginLeft: 8, fontSize: 12, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase', color: COLORS.textDim }}>
                nonlinear.py (Kernel Ridge)
              </div>
            </div>
            <div className="terminalBody" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.75 }}>
              <div className="summaryCodeLine">
                <span style={{ color: COLORS.purple }}>X</span> = <span style={{ color: COLORS.accent2 }}>build_fir</span>(features, window, offset)
              </div>
              <div className="summaryCodeLine">
                <span style={{ color: COLORS.purple }}>X</span> = X[10:-10] <span style={{ color: COLORS.textDim }}># excluded edges</span>
              </div>
              <div className="summaryCodeLine">
                <span style={{ color: COLORS.purple }}>kfold</span> = KFold(n_splits=<span style={{ color: COLORS.error }}>DEFAULT</span>, shuffle=False)
              </div>
              <div className="summaryCodeLine" style={{ marginTop: 6 }}>
                model = KernelRidge(alpha=<span style={{ color: COLORS.error }}>α</span>, kernel=<span style={{ color: COLORS.warning }}>'rbf'</span>, gamma=<span style={{ color: COLORS.error }}>γ</span>)
              </div>
              <div className="summaryCodeLine">model.fit(X_train, y_train) → y_pred = model.predict(X_test)</div>
              <div className="summaryCodeLine">corr = corr_with_np(y_pred, y_test) → mean over voxels</div>

              <div className="summaryTags">
                <span className="summaryTagChip">kernel=rbf</span>
                <span className="summaryTagChip">alpha=1.0</span>
                <span className="summaryTagChip">gamma=None</span>
                <span className="summaryTagChip">fir=DEFAULT</span>
                <span className="summaryTagChip">kfold=DEFAULT</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .summaryHeroCard{
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(235,241,250,0.72));
          border-color: rgba(35,48,68,0.12);
          box-shadow: 0 18px 44px rgba(45,48,68,0.12);
        }

        .summaryTagRow{display:flex;gap:8px;flex-wrap:wrap}
        .summaryTag{
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(35,48,68,0.14);
          background: rgba(245,245,240,0.72);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }
        .summaryTagLinear{color:${COLORS.textDim}}
        .summaryTagNonlinear{
          color:${COLORS.warning};
          box-shadow: 0 0 18px rgba(217,138,44,0.18);
        }

        .summaryEquation{
          border-radius: 16px;
          border: 1px solid rgba(35,48,68,0.12);
          padding: 14px 14px 12px;
          background: rgba(255,255,255,0.75);
        }
        .summaryEquationKicker{
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 900;
          color: rgba(35,48,68,0.58);
        }
        .summaryEquationBody{
          margin-top: 8px;
          font-size: 20px;
          font-weight: 950;
          color: ${COLORS.text};
          font-family: ui-monospace, monospace;
        }
        .summaryEquationNote{margin-left: 6px; font-size: 14px; color: ${COLORS.textDim}; font-weight: 800}
        .summaryEquationMeta{
          margin-top: 8px;
          font-size: 12px;
          color: ${COLORS.textDim};
          font-family: ui-monospace, monospace;
          opacity: 0.85;
        }
        .summaryEquationLinear{border-left: 6px solid rgba(35,48,68,0.25)}
        .summaryEquationNonlinear{border-left: 6px solid ${COLORS.warning}}

        .summaryDelta{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(217,138,44,0.38);
          background: rgba(217,138,44,0.10);
          color: ${COLORS.error};
          font-weight: 950;
        }

        .summaryTerminal{
          border-color: rgba(35,48,68,0.12);
          background: rgba(255,255,255,0.82);
        }
        .summaryCodeLine{padding: 2px 0}
        .summaryTags{
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .summaryTagChip{
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(35,48,68,0.14);
          background: rgba(245,245,240,0.70);
          color: ${COLORS.textDim};
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
      `}</style>
    </NordSlide>
  )
}
