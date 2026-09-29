"use client";

import { useState } from "react";
import { demoPattern, demoPiecePath, normalizeDemoAmount, type PieceKey } from "@/domain/demo-pattern";
import { currentRevision, type DemoProject, type StepKey } from "@/domain/demo-project";
import type { PatternSnapshot } from "@/domain/knowledge/resolve-pattern";

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

type Stage = "fit" | "fabric" | "sew";

const sewingSteps: { key: StepKey; title: string; description: string; affected: boolean }[] = [
  { key: "join-shoulders", title: "Join the shoulders", description: "Match the front and back shoulder seams. Use the seam allowance specified by your reviewed pattern.", affected: true },
  { key: "finish-neckline", title: "Finish the neckline", description: "After joining the shoulders, finish the neckline using the version-specific instructions.", affected: false },
  { key: "prepare-sleeves", title: "Prepare the sleeves", description: "Check the sleeve-cap relationship before setting either sleeve.", affected: true },
];

export function Worktable({ initialProject, contentFingerprint, knowledge }: { initialProject: DemoProject; contentFingerprint: string; knowledge: PatternSnapshot }) {
  const [project, setProject] = useState(initialProject);
  const [stage, setStage] = useState<Stage>("fit");
  const [amount, setAmount] = useState(() => currentRevision(initialProject).amountMm === 0 ? 10 : currentRevision(initialProject).amountMm);
  const [selected, setSelected] = useState<PieceKey>("front");
  const [originalView, setOriginalView] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"error" | "success">("success");
  const piece = demoPattern.pieces.find((entry) => entry.key === selected)!;
  const accepted = currentRevision(project);
  const hasProposal = amount !== accepted.amountMm;
  const effects = knowledge.effectsByOperation["shoulder-width"];
  const directlyAffected = effects?.pieces.filter((item) => item.via === "direct") ?? [];
  const joinAffected = effects?.pieces.filter((item) => item.via === "join") ?? [];
  const currentSteps = sewingSteps.filter((step) => project.completedStepRevision[step.key] === project.currentSequence).length;

  async function updateProject(url: string, method: "POST" | "PATCH", body: object) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "The local demo could not save this change.");
      setProject(result.project as DemoProject);
      return result.project as DemoProject;
    } catch (error) {
      setNoticeKind("error");
      setNotice(error instanceof Error ? error.message : "The local demo is unavailable. Your accepted version was not changed.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function keepProposal() {
    if (!hasProposal || busy) return;
    const next = await updateProject("/api/demo/accept", "POST", { baseSequence: project.currentSequence, amountMm: amount, contentFingerprint, requestId: crypto.randomUUID() });
    if (next) { setNoticeKind("success"); setNotice(`Demo revision ${next.currentSequence} saved. Fabric and sewing checks need review.`); }
  }

  return <main className="studio-shell">
    <header className="topbar">
      <div className="wordmark">stitches.</div>
      <p className="topbar-promise">A little more you. In every seam.</p>
      <div className="topbar-end"><span className="status-dot" /> Demo revision {project.currentSequence} <span className="avatar" aria-label="Sample workspace">DEMO</span></div>
    </header>
    <div className="project-heading">
      <div><p className="eyebrow">On your worktable / Project 01</p><h1>{demoPattern.title}</h1><p className="subhead">Relaxed silhouette · Woven linen · Sample measurements</p></div>
      <nav className="stage-tabs" aria-label="Project stages">{(["fit", "fabric", "sew"] as const).map((item, index) => <button key={item} type="button" className={`stage-tab ${stage === item ? "active" : "inactive"}`} aria-current={stage === item ? "step" : undefined} onClick={() => setStage(item)}><small>0{index + 1}</small> {item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
    </div>
    <div className="worktable-grid">
      <aside className="context-panel" aria-label="Project context">
        <p className="eyebrow">Your pattern</p><GarmentSketch /><h2>Everyday,<br /> remade.</h2><p className="context-muted">Sample pattern · Three main pieces</p>
        <div className="context-rule" /><p className="eyebrow">Pattern pieces</p>
        <div className="piece-list">{demoPattern.pieces.map((item) => <button key={item.key} type="button" className={`piece-button ${selected === item.key ? "selected" : ""}`} aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}><span className="piece-code">{item.code}</span><span>{item.title}</span><span className="change-dot" aria-hidden="true" /></button>)}</div>
        <div className="context-rule" /><p className="eyebrow">From your stash</p><div className="fabric-swatch" role="img" aria-label="Illustrative oatmeal linen weave" /><p className="context-muted">Oatmeal linen<br />2.00 m available · sample data</p>
      </aside>
      {stage === "fit" && <section className="canvas-panel" aria-labelledby="canvas-title">
        <div className="canvas-toolbar"><h2 id="canvas-title">The pattern, connected.</h2><button type="button" className="outline-button" aria-pressed={originalView} onClick={() => setOriginalView((value) => !value)}>{originalView ? "See proposal" : "See original"}</button></div>
        <div className="pattern-paper"><PatternMap amount={amount} selected={selected} originalView={originalView} /><div className="map-legend"><span><i className="legend-proposal" /> Proposed change</span><span><i className="legend-original" /> Original outline</span></div></div>
        <div className="canvas-note" aria-live="polite"><span className="branch-icon" aria-hidden="true">⌘</span><div><strong>{effects?.pieces.some((item) => item.pieceId === `piece.${selected}`) ? `${effects.pieces.length} pieces in this knowledge trail.` : "This piece is outside the selected rule."}</strong><span>{piece.reason}</span></div></div>
      </section>}
      {stage === "fabric" && <section className="canvas-panel" aria-labelledby="fabric-title">
        <div className="canvas-toolbar"><h2 id="fabric-title">Make the most of your linen.</h2><span className="context-muted">Layout study only</span></div>
        <div className="fabric-workspace">
          <div className="fabric-roll-heading"><strong>{project.fabricWidthCm} cm usable width</strong><span>Selvedge ↓</span></div>
          <div className={`fabric-roll ${project.fabricWidthCm === 110 ? "narrow" : ""}`} role="img" aria-label="Concept-only cloth diagram. The shapes are not a verified placement.">
            <svg viewBox="0 0 300 270" aria-hidden="true"><path d="M10 40 Q34 42 42 15 L97 30 Q87 64 112 78 L106 186 10 186Z"/><path d="M126 27 Q150 31 158 15 L213 30 Q203 64 228 78 L222 186 126 186Z"/><path d="M16 229 Q26 197 61 198 Q94 197 110 229 L101 258 24 258Z"/><path d="M132 229 Q142 197 177 198 Q210 197 226 229 L217 258 140 258Z"/><text x="46" y="113">A</text><text x="162" y="113">B</text><text x="57" y="237">C</text><text x="173" y="237">C</text></svg>
          </div>
          <p className="fabric-diagram-caption">Diagram from the concept reference · not a cutting layout</p>
        </div>
        <div className="canvas-note"><span className="branch-icon" aria-hidden="true">◇</span><div><strong>Placement is unknown.</strong><span>Final piece geometry, shrinkage, grain restrictions, and a real layout check are missing.</span></div></div>
      </section>}
      {stage === "sew" && <section className="canvas-panel" aria-labelledby="sew-title">
        <div className="canvas-toolbar"><h2 id="sew-title">Your next few stitches.</h2><span className="context-muted">{currentSteps} of {sewingSteps.length} current</span></div>
        <div className="sew-workspace"><p className="eyebrow">Assembly / Sample sequence</p><h2>One seam at a time.</h2><p className="subhead">Instructions stay connected to demo revision {project.currentSequence}.</p>
          <div className="sew-steps">{sewingSteps.map((step, index) => {
            const completedOn = project.completedStepRevision[step.key];
            const current = completedOn === project.currentSequence;
            const prerequisiteCurrent = index === 0 || project.completedStepRevision["join-shoulders"] === project.currentSequence;
            return <div className="sew-step" key={step.key}><label><input type="checkbox" checked={current} disabled={busy || (!prerequisiteCurrent && !current)} onChange={(event) => void updateProject("/api/demo/progress", "PATCH", { kind: "sewing-step", stepKey: step.key, complete: event.target.checked })} /><span>{step.title}</span><small>0{index + 1}</small></label><p>{step.description}</p>{completedOn !== undefined && !current && <span className="review-tag">Completed on revision {completedOn} · review again</span>}{project.currentSequence > 0 && step.affected && <span className="review-tag">Affected by shoulder change</span>}</div>;
          })}</div>
        </div>
        <div className="canvas-note"><span className="branch-icon" aria-hidden="true">⌁</span><div><strong>Your place is saved locally.</strong><span>Sample instructions and completion state are tied to the selected demo revision.</span></div></div>
      </section>}
      {stage === "fit" && <aside className="proposal-panel" aria-label="Fit proposal">
        <p className="eyebrow">A suggestion from Stitches</p><h2>Room to move.</h2><p className="request-copy">“A little more room at the shoulders. Keep the neckline just as it is.”</p>
        <div className="control-label"><label htmlFor="shoulder-amount">Added width per shoulder</label><output htmlFor="shoulder-amount">+{amount} mm</output></div>
        <input id="shoulder-amount" className="amount-slider" type="range" min="0" max="20" step="1" value={amount} onChange={(event) => setAmount(normalizeDemoAmount(Number(event.target.value)))} aria-describedby="amount-help" />
        <div className="range-ends" id="amount-help"><span>Original</span><span>+20 mm demo limit</span></div>
        <div className="lock-notice"><span aria-hidden="true">♧</span> Neckline shown unchanged in concept preview</div>
        <p className="impact-heading eyebrow">What follows this change</p>
        <ol className="impact-list"><li><span>01</span><div><strong>{directlyAffected.map((item) => item.pieceTitle).join(" + ") || "No direct pieces"}</strong><small>Directly linked by the structured adjustment rule</small></div></li><li><span>02</span><div><strong>{joinAffected.map((item) => item.pieceTitle).join(" + ") || "No additional join pieces"}</strong><small>{effects?.unresolvedChecks.length ?? 0} seam relationship(s) still unreviewed</small></div></li><li><span>03</span><div><strong>Fabric + instructions</strong><small>{effects?.stepIds.length ?? 0} linked step(s); {effects?.invalidates.join(" and ") || "no"} invalidation</small></div></li></ol>
        <details className="why-details"><summary>Why these pieces?</summary><p>This trail is computed from <code>{knowledge.ruleIds.join(", ")}</code> and source <code>{knowledge.sourceIds.join(", ")}</code>, fingerprint <code>{knowledge.fingerprint.slice(0, 12)}</code>. The records are illustrative; seam validity is unresolved and cutting is not authorized.</p></details>
        <div className="proposal-end"><div className="not-ready">Illustrative proposal · not for cutting</div><p className="accepted-basis">Accepted: revision {project.currentSequence} · +{accepted.amountMm} mm sample change</p><button className="keep-button" type="button" disabled={!hasProposal || busy} onClick={() => void keepProposal()}>{busy ? "Saving…" : "Keep this demo version →"}</button><div className="proposal-secondary"><button type="button" onClick={() => setAmount(accepted.amountMm)} disabled={!hasProposal || busy}>Discard proposal</button><button type="button" onClick={() => { setAmount(0); setOriginalView(false); }} disabled={busy}>Propose original</button></div><p>Your original remains in revision history.</p></div>
      </aside>}
      {stage === "fabric" && <aside className="proposal-panel" aria-label="Fabric planning">
        <p className="eyebrow">From your fabric stash</p><h2>Good things,<br /> less waste.</h2><p className="request-copy">Explore how usable width changes the planning question. This is not a placement result.</p>
        <label className="fabric-select-label" htmlFor="fabric-width">Cuttable fabric width</label><select id="fabric-width" className="fabric-select" value={project.fabricWidthCm} disabled={busy} onChange={(event) => void updateProject("/api/demo/progress", "PATCH", { kind: "fabric-width", widthCm: Number(event.target.value) })}><option value="140">140 cm · wide linen</option><option value="110">110 cm · narrow linen</option></select>
        <div className="fabric-facts"><div><span>Available length</span><strong>2.00 m · sample</strong></div><div><span>Layout result</span><strong>Unknown</strong></div><div><span>Shrinkage</span><strong>Not entered</strong></div><div><span>Fit basis</span><strong>Demo revision {project.currentSequence}</strong></div></div>
        <div className="unknown-result"><strong>Check needed before cutting</strong><p>{project.currentSequence > 0 ? "The accepted fit changed. Any previous fabric plan needs review. " : ""}A verified piece set, grain direction, shrinkage, and placement calculation are still required.</p></div>
        <details className="why-details"><summary>What needs checking?</summary><p>Cut counts, mirrored and fold pieces, grain, nap, usable width and length, defects, and the final scale of every piece. No area estimate is treated as a feasible layout.</p></details>
        <button type="button" className="keep-button stage-next" onClick={() => setStage("sew")}>Explore the sewing plan →</button>
      </aside>}
      {stage === "sew" && <aside className="proposal-panel" aria-label="Sewing progress">
        <p className="eyebrow">Your sewing companion</p><h2>Made by you.</h2><div className="sew-art" aria-hidden="true">A <span>⤳</span> B</div><p className="control-label">Sample sequence <strong>{currentSteps} / {sewingSteps.length} current</strong></p><div className="progress-track"><div style={{width: `${currentSteps / sewingSteps.length * 100}%`}} /></div><p className="request-copy">Your pattern, sample adjustment, and place in these instructions—together.</p>
        <div className="lock-notice">Linked to demo revision {project.currentSequence} · +{accepted.amountMm} mm</div><p className="context-muted">These are sample steps, not a complete construction guide for a cut-ready pattern.</p><button type="button" className="keep-button stage-next" onClick={() => setStage("fit")}>Back to your fit ↗</button>
      </aside>}
    </div>
    {notice && <div className={`save-notice ${noticeKind}`} role="status"><span>{notice}</span>{noticeKind === "error" && <button type="button" onClick={() => window.location.reload()}>Reload current version</button>}</div>}
    <footer className="studio-footer"><strong>Considered changes. Confident making.</strong><span>Local demo · Illustrative geometry · Not for cutting</span></footer>
  </main>;
}
