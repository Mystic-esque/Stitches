"use client";

import { useState } from "react";
import { demoPiecePath } from "@/domain/demo-pattern";
import type { PatternSnapshot } from "@/domain/knowledge/resolve-pattern";
import type { PieceKey } from "@/domain/demo-pattern";

function cutDescription(count?: number, mirrored?: boolean, onFold?: boolean): string {
  if (!count) return "Cut details not reviewed";
  return `Cut ${count}${mirrored ? " mirrored" : ""}${onFold ? " on fold" : ""}`;
}

const illustratedPieceOrder: PieceKey[] = ["front", "back", "sleeve"];
function isIllustratedPieceKey(key: string): key is PieceKey {
  return illustratedPieceOrder.some((candidate) => candidate === key);
}

function AssemblyKnowledgeNote({ fingerprint }: { fingerprint: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState("");
  async function readNote() {
    setStatus("loading");
    try {
      const response = await fetch("/api/knowledge/assembly", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ snapshotFingerprint: fingerprint }),
      });
      const data = await response.json();
      if (!response.ok || data.note?.snapshotFingerprint !== fingerprint || typeof data.note?.explanation !== "string") {
        setMessage(data.error?.message ?? "The maintained construction note is unavailable.");
        setStatus("unavailable");
        return;
      }
      setExplanation(data.note.explanation);
      setStatus("ready");
    } catch {
      setMessage("The maintained construction note is unavailable. The authored steps above remain visible.");
      setStatus("unavailable");
    }
  }
  return <div className="assembly-knowledge-note" aria-live="polite">
    <button type="button" onClick={readNote} disabled={status === "loading"}>{status === "loading" ? "Checking maintained knowledge…" : status === "ready" ? "Recheck Sanity construction note" : "Why can these steps run in parallel?"}</button>
    {status === "ready" && <p><strong>Verified with Sanity Context.</strong> {explanation}<small>Knowledge Base explanation corroborates this exact development pattern graph. Still illustrative, not a sewing instruction or cut-ready pattern.</small></p>}
    {status === "unavailable" && <p className="knowledge-note-error">{message}</p>}
  </div>;
}

export function GarmentExplorer({ knowledge, knowledgeOrigin, selected, onSelectPiece, onStartFit }: {
  knowledge: PatternSnapshot;
  knowledgeOrigin: "fixture" | "sanity-development" | "sanity-reviewed";
  selected: PieceKey;
  onSelectPiece: (key: PieceKey) => void;
  onStartFit: () => void;
}) {
  const [view, setView] = useState<"front" | "back">("front");
  const [assemblyIndex, setAssemblyIndex] = useState(0);
  const assemblyStep = knowledge.assemblySteps[assemblyIndex];
  const piece = knowledge.garmentPieces.find((item) => item.key === selected);
  const joins = knowledge.garmentConnections.filter((item) => item.pieceKeys.includes(selected));
  const displayedPieces = [...knowledge.garmentPieces].sort((a, b) => {
    const aOrder = isIllustratedPieceKey(a.key) ? illustratedPieceOrder.indexOf(a.key) : illustratedPieceOrder.length;
    const bOrder = isIllustratedPieceKey(b.key) ? illustratedPieceOrder.indexOf(b.key) : illustratedPieceOrder.length;
    return aOrder - bOrder || a.key.localeCompare(b.key);
  });

  return <>
    <section className="canvas-panel explore-panel" aria-labelledby="explore-title">
      <div className="canvas-toolbar"><h2 id="explore-title">A garment, from the inside out.</h2><div className="view-toggle" role="group" aria-label="Garment view"><button type="button" aria-pressed={view === "front"} onClick={() => setView("front")}>Front</button><button type="button" aria-pressed={view === "back"} onClick={() => setView("back")}>Back</button></div></div>
      <div className="explore-scene">
        <div className="explore-scene-head"><span>01 / Finished form</span><span>Illustrative construction study</span></div>
        <svg className="explore-garment" viewBox="0 0 430 415" role="img" aria-label={`Illustrative ${view} view of the everyday blouse; selected pattern piece: ${piece?.title ?? selected}. Not a fit simulation.`}>
          <defs><pattern id="cloth-weave" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0H8M0 4H8" stroke="currentColor" strokeWidth=".22" opacity=".25" /></pattern></defs>
          <path className="garment-shadow" d="M155 64 Q215 101 275 64 L321 92 388 194 334 226 306 177 315 355 Q215 374 115 355 L124 177 96 226 42 194 109 92Z" />
          <path className="garment-body" d={view === "front" ? "M155 64 Q215 110 275 64 L304 85 309 166 315 355 Q215 374 115 355 L121 166 126 85Z" : "M155 64 Q215 89 275 64 L304 85 309 166 315 355 Q215 374 115 355 L121 166 126 85Z"} />
          <path className="garment-sleeve" d="M126 85 L109 92 42 194 96 226 124 177 139 103Z M304 85 L321 92 388 194 334 226 306 177 291 103Z" />
          <path className="garment-weave" d="M155 64 Q215 110 275 64 L304 85 309 166 315 355 Q215 374 115 355 L121 166 126 85Z M126 85 L109 92 42 194 96 226 124 177 139 103Z M304 85 L321 92 388 194 334 226 306 177 291 103Z" />
          <path className="garment-seams" d="M126 85 Q123 119 121 166 M304 85 Q307 119 309 166 M118 346 Q215 361 312 346 M96 217 L47 189 M334 217 L383 189 M155 64 Q215 110 275 64" />
          {view === "front" && <path className="garment-detail" d="M215 91 V351 M191 99 Q195 140 185 175 M239 99 Q235 140 245 175" />}
          {view === "back" && <path className="garment-detail" d="M215 88 V352 M180 99 Q215 115 250 99" />}
          <circle className="garment-marker" cx={selected === "sleeve" ? 335 : selected === "back" ? 243 : 180} cy={selected === "sleeve" ? 158 : 203} r="20" />
          <text className="garment-marker-label" x={selected === "sleeve" ? 335 : selected === "back" ? 243 : 180} y={selected === "sleeve" ? 164 : 209} textAnchor="middle">{selected === "front" ? "A" : selected === "back" ? "B" : "C"}</text>
        </svg>
        <div className="explore-scene-foot"><span>Finished silhouette</span><span>↔</span><span>{knowledge.garmentPieces.length} linked pattern pieces</span></div>
      </div>
      <div className="explore-anatomy"><div className="explore-section-head"><span className="eyebrow">02 / Dissect the design</span><span>Choose a piece to see how it joins</span></div><div className="anatomy-list">{displayedPieces.map((item) => <button key={item.id} type="button" className={selected === item.key ? "anatomy-card selected" : "anatomy-card"} aria-pressed={selected === item.key} disabled={!isIllustratedPieceKey(item.key)} onClick={() => { if (isIllustratedPieceKey(item.key)) onSelectPiece(item.key); }}><span className="anatomy-letter">{isIllustratedPieceKey(item.key) ? String.fromCharCode(65 + illustratedPieceOrder.indexOf(item.key)) : "?"}</span><strong>{item.title}</strong><small>{isIllustratedPieceKey(item.key) ? cutDescription(item.cutCount, item.mirrored, item.onFold) : "Illustration not mapped"}</small></button>)}</div>
        <div className="flat-piece-study"><div><span className="eyebrow">Flat piece / {piece?.key ?? selected}</span><h3>{piece?.title ?? "Piece unavailable"}</h3><p>{piece ? cutDescription(piece.cutCount, piece.mirrored, piece.onFold) : "Cut details not reviewed"}. This outline is a concept illustration, not a cuttable pattern.</p><span className="flat-piece-id">Version-linked record · {piece?.id ?? "missing"}</span></div><svg viewBox="-12 -9 170 245" role="img" aria-label={`Illustrative flat outline of ${piece?.title ?? selected}; not to scale and not for cutting.`}><path d={demoPiecePath(selected, 0)} /></svg></div>
      </div>
      <div className="canvas-note" aria-live="polite"><span className="branch-icon" aria-hidden="true">⌁</span><div><strong>{piece?.title ?? "Unknown piece"} · {joins.length} connected seam record{joins.length === 1 ? "" : "s"}</strong><span>{joins.length ? joins.map((item) => `${item.pieceKeys.filter((key) => key !== selected).join(" + ")} (${item.constraintStatus})`).join(" · ") : "No seam connection is authored for this piece."} This map is source-linked, not a verified cutting pattern.</span></div></div>
    </section>
    <aside className="proposal-panel explore-aside" aria-label="Explore this garment">
      <p className="eyebrow">The connected wardrobe / 01</p><h2>See what makes it.</h2><p className="request-copy">Start with a garment you love. Lift it apart into pieces, follow the seams, then shape a supported version of your own.</p>
      <div className="explore-fact"><span>Garment study</span><strong>{knowledge.patternTitle}</strong></div><div className="explore-fact"><span>Knowledge version</span><strong>{knowledge.version} · {knowledge.mode}</strong></div><div className="explore-fact"><span>Construction</span><strong>{knowledge.garmentPieces.length} pieces · {knowledge.garmentConnections.length} seam records</strong></div>
      <div className="assembly-guide"><p className="eyebrow">03 / Follow the making</p><h3>{assemblyStep?.title ?? "Assembly not authored"}</h3><p>{assemblyStep ? `Step ${assemblyIndex + 1} of ${knowledge.assemblySteps.length}. Uses ${assemblyStep.pieceKeys.length ? assemblyStep.pieceKeys.join(" + ") : "the current garment"}.` : "No authored assembly steps are available."}</p><input type="range" min="0" max={Math.max(0, knowledge.assemblySteps.length - 1)} value={assemblyIndex} onChange={(event) => setAssemblyIndex(Number(event.target.value))} disabled={knowledge.assemblySteps.length < 2} aria-label="Assembly step" /><div className="assembly-actions"><button type="button" disabled={assemblyIndex === 0} onClick={() => setAssemblyIndex((value) => value - 1)}>← Previous</button><button type="button" disabled={assemblyIndex >= knowledge.assemblySteps.length - 1} onClick={() => setAssemblyIndex((value) => value + 1)}>Next →</button></div><p className="assembly-caution">Sample sequence only. Seam allowances, ease, and full technique instructions still need review.</p></div>
      {knowledgeOrigin === "sanity-development" && <AssemblyKnowledgeNote fingerprint={knowledge.fingerprint} />}
      <button type="button" className="keep-button stage-next" onClick={onStartFit}>Shape this blouse →</button>
    </aside>
  </>;
}
