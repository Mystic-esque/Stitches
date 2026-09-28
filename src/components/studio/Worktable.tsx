"use client";

import { useState } from "react";
import { demoPattern, demoPiecePath, normalizeDemoAmount, type PieceKey } from "@/domain/demo-pattern";

const positions: Record<PieceKey, { x: number; y: number; scale: number; letterY: number; labelY: number }> = {
  front: { x: 78, y: 48, scale: .84, letterY: 145, labelY: 290 },
  back: { x: 295, y: 48, scale: .84, letterY: 145, labelY: 290 },
  sleeve: { x: 207, y: 313, scale: .85, letterY: 361, labelY: 487 },
};

function GarmentSketch() {
  return <svg className="garment-sketch" viewBox="0 0 140 150" role="img" aria-label="Line drawing of a relaxed short-sleeved blouse">
    <path d="M46 22 Q70 42 94 22 L115 32 136 73 114 88 103 67 110 137 Q70 145 30 137 L37 67 26 88 4 73 25 32Z" fill="var(--soft-olive)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M46 22 Q70 52 94 22 M25 32 Q44 43 37 67 M115 32 Q96 43 103 67 M8 71 26 83 M132 71 114 83 M31 131 Q70 139 109 131" fill="none" stroke="currentColor" strokeWidth=".8" />
    <path d="M47 54 Q39 85 44 123 M96 54 Q103 85 96 123 M66 46 Q58 90 65 134" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".35" />
  </svg>;
}

function PatternMap({ amount, originalView, selected }: { amount: number; originalView: boolean; selected: PieceKey }) {
  return <svg className="pattern-map" viewBox="0 0 560 520" role="img" aria-label={`Illustrative front, back, and sleeve outlines. ${originalView ? "Original view." : `Proposed ${amount} millimeter shoulder change, with dashed original.`} Not for cutting.`}>
    {demoPattern.pieces.map((piece) => {
      const p = positions[piece.key];
      const center = p.x + (piece.key === "sleeve" ? 73 : 70) * p.scale;
      const shownAmount = originalView ? 0 : amount;
      const shift = shownAmount * .45;
      return <g key={piece.key} className={`map-piece ${selected === piece.key ? "is-selected" : ""}`}>
        <g transform={`translate(${p.x} ${p.y}) scale(${p.scale})`}>
          <path className="piece-fill" d={demoPiecePath(piece.key, shownAmount)} />
          {!originalView && amount > 0 && <path className="piece-original" d={demoPiecePath(piece.key, 0)} />}
          {!originalView && amount > 0 && <path className="piece-change" d={piece.key === "sleeve" ? `M0 90 C15 50 24 5 ${70 + shift} 0 C${105 + shift} 4 ${126 + shift} 53 ${146 + shift * 2} 90` : `M44 0 L${108 + shift} 22 C${100 + shift} 49 ${110 + shift} 80 140 95`} />}
          <path className="grain-line" d={piece.key === "sleeve" ? "M72 75 V150 m-4 -8 4 8 4 -8 M72 75 l-4 8 m4 -8 4 8" : "M70 91 V175 m-4 -8 4 8 4 -8 M70 91 l-4 8 m4 -8 4 8"} />
        </g>
        <text className="piece-letter" x={center} y={p.letterY} textAnchor="middle">{piece.code}</text>
        <text className="piece-label" x={center} y={p.labelY} textAnchor="middle">{piece.title}</text>
        <text className="piece-cut" x={center} y={p.labelY + 18} textAnchor="middle">{piece.cut}</text>
      </g>;
    })}
  </svg>;
}

export function Worktable() {
  const [amount, setAmount] = useState(10);
  const [selected, setSelected] = useState<PieceKey>("front");
  const [originalView, setOriginalView] = useState(false);
  const piece = demoPattern.pieces.find((entry) => entry.key === selected)!;

  return <main className="studio-shell">
    <header className="topbar">
      <div className="wordmark">stitches.</div>
      <p className="topbar-promise">A little more you. In every seam.</p>
      <div className="topbar-end"><span className="status-dot" /> Illustrative worktable <span className="avatar" aria-label="Sample workspace">DEMO</span></div>
    </header>
    <div className="project-heading">
      <div><p className="eyebrow">On your worktable / Project 01</p><h1>{demoPattern.title}</h1><p className="subhead">Relaxed silhouette · Woven linen · Sample measurements</p></div>
      <nav className="stage-tabs" aria-label="Project stages"><span className="stage-tab active" aria-current="step"><small>01</small> Fit</span><span className="stage-tab inactive"><small>02</small> Fabric <em>next</em></span><span className="stage-tab inactive"><small>03</small> Sew <em>next</em></span></nav>
    </div>
    <div className="worktable-grid">
      <aside className="context-panel" aria-label="Project context">
        <p className="eyebrow">Your pattern</p><GarmentSketch /><h2>Everyday,<br /> remade.</h2><p className="context-muted">Sample pattern · Three main pieces</p>
        <div className="context-rule" /><p className="eyebrow">Pattern pieces</p>
        <div className="piece-list">{demoPattern.pieces.map((item) => <button key={item.key} type="button" className={`piece-button ${selected === item.key ? "selected" : ""}`} aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}><span className="piece-code">{item.code}</span><span>{item.title}</span><span className="change-dot" aria-hidden="true" /></button>)}</div>
        <div className="context-rule" /><p className="eyebrow">From your stash</p><div className="fabric-swatch" role="img" aria-label="Illustrative oatmeal linen weave" /><p className="context-muted">Oatmeal linen<br />2.00 m available · sample data</p>
      </aside>
      <section className="canvas-panel" aria-labelledby="canvas-title">
        <div className="canvas-toolbar"><h2 id="canvas-title">The pattern, connected.</h2><button type="button" className="outline-button" aria-pressed={originalView} onClick={() => setOriginalView((value) => !value)}>{originalView ? "See proposal" : "See original"}</button></div>
        <div className="pattern-paper"><PatternMap amount={amount} selected={selected} originalView={originalView} /><div className="map-legend"><span><i className="legend-proposal" /> Proposed change</span><span><i className="legend-original" /> Original outline</span></div></div>
        <div className="canvas-note" aria-live="polite"><span className="branch-icon" aria-hidden="true">⌘</span><div><strong>{selected === "sleeve" ? "The sleeve follows the armhole." : "One adjustment. Three connected pieces."}</strong><span>{piece.reason}</span></div></div>
      </section>
      <aside className="proposal-panel" aria-label="Fit proposal">
        <p className="eyebrow">A suggestion from Stitches</p><h2>Room to move.</h2><p className="request-copy">“A little more room at the shoulders. Keep the neckline just as it is.”</p>
        <div className="control-label"><label htmlFor="shoulder-amount">Added width per shoulder</label><output htmlFor="shoulder-amount">+{amount} mm</output></div>
        <input id="shoulder-amount" className="amount-slider" type="range" min="0" max="20" step="1" value={amount} onChange={(event) => setAmount(normalizeDemoAmount(Number(event.target.value)))} aria-describedby="amount-help" />
        <div className="range-ends" id="amount-help"><span>Original</span><span>+20 mm demo limit</span></div>
        <div className="lock-notice"><span aria-hidden="true">♧</span> Neckline shown unchanged in concept preview</div>
        <p className="impact-heading eyebrow">What follows this change</p>
        <ol className="impact-list"><li><span>01</span><div><strong>Front + back</strong><small>Shoulder points move in this illustration</small></div></li><li><span>02</span><div><strong>Sleeve cap</strong><small>Real seam and ease check still needed</small></div></li><li><span>03</span><div><strong>Fabric + instructions</strong><small>Review after a verified version exists</small></div></li></ol>
        <details className="why-details"><summary>Why these pieces?</summary><p>This sample links the shoulder rule to front and back pieces and an armhole–sleeve join. The source is <code>{demoPattern.sourceId}</code>. These relationships are illustrative; no seam or fit validity is claimed.</p></details>
        <div className="proposal-end"><strong>Illustrative proposal · not for cutting</strong><p>Acceptance and saved revisions arrive in the next build slice. Your original remains available.</p></div>
      </aside>
    </div>
    <footer className="studio-footer"><strong>Considered changes. Confident making.</strong><span>Local demo · Illustrative geometry · Not for cutting</span></footer>
  </main>;
}
