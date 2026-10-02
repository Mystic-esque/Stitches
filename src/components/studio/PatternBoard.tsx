"use client";

import { useEffect, useRef, useState } from "react";
import "../../app/pattern-board.css";
import { operationsPath, studyBounds, type PatternStudy, type StudyDraft } from "@/domain/pattern-study";
import type { GuestProject } from "@/domain/guest-project";
import type { CompanionCatalogCard } from "@/server/knowledge/companion-catalog";

const names: Record<string, string> = { "sandy.skirt": "Skirt section", "sandy.waistband": "Straight waistband", waist: "Waist stitch edge", hem: "Hem stitch edge", opening: "Opening edge", fold: "Fold line", attachment: "Band attachment edge", finish: "Inside finishing edge", "left-end": "Left band end", "right-end": "Right band end", "in2-notch": "Engine notch: in2", "gridAnchor-notch": "Engine notch: grid anchor", center: "Engine center mark" };
const label = (id: string) => names[id.split("/").at(-1)!] ?? id.split("/").at(-1)!.replaceAll("-", " ");
const measurementNames: Record<string, string> = { waist: "Waist circumference", hips: "Hips circumference", waistToFloor: "Waist to floor", waistToHips: "Waist to hips" };
type Piece = StudyDraft["parts"][number];
export function PatternBoard({ project, source, dirty }: { project: GuestProject; source: CompanionCatalogCard; dirty: boolean }) {
  const [study, setStudy] = useState<PatternStudy>(), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false), [ratio, setRatio] = useState(50), [delta, setDelta] = useState(5), [allowance, setAllowance] = useState(10);
  const [pieceId, setPieceId] = useState("sandy.skirt"), [selection, setSelection] = useState("sandy.skirt/waist"), [zoom, setZoom] = useState(1), [overlay, setOverlay] = useState(true);
  const requestSequence = useRef(0), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; ++requestSequence.current; }; }, []);
  useEffect(() => { ++requestSequence.current; setStudy(undefined); setConfirmed(false); setError(""); setBusy(false); }, [project.sequence, project.basisHash, source.fingerprint]);
  const missing = Object.keys(measurementNames).filter(key => project.plan.measurementsMm[key] === undefined);
  const current = source.fingerprint === project.knowledgeFingerprint;
  async function generate() {
    const sequence = ++requestSequence.current; setBusy(true); setError(""); setStudy(undefined);
    try {
      const response = await fetch(`/api/projects/${project.id}/pattern-study`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ expectedSequence: project.sequence, expectedBasisHash: project.basisHash, expectedSourceFingerprint: source.fingerprint, useSavedMeasurements: true,
          command: "study_hem_length", lengthRatio: ratio / 100, deltaLengthMm: delta * 10, seamAllowanceMm: allowance }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? "The measured study could not be checked.");
      if (mounted.current && sequence === requestSequence.current) { setStudy(data.study); setPieceId("sandy.skirt"); setSelection("sandy.skirt/waist"); }
    } catch (cause) { if (mounted.current && sequence === requestSequence.current) setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The study timed out. No project was changed; you can continue your manual plan."); }
    finally { if (mounted.current && sequence === requestSequence.current) setBusy(false); }
  }
  const piece = study?.after.draft.parts.find(part => part.id === pieceId);
  const original = study?.before.draft.parts.find(part => part.id === pieceId);
  const selectedEdge = study?.after.mapping.edges.find(edge => edge.id === selection);
  const selectedMark = study?.after.mapping.markings.find(mark => mark.id === selection);
  const steps = study?.after.mapping.steps.filter(step => step.edges.includes(selection)) ?? [];
  const stepTitle = (id: string) => study?.after.mapping.steps.find(step => step.id === id)?.title ?? id;
  const changed = new Set(study?.impact.changedEdgeIds);
  const selectPiece = (id: string) => { setPieceId(id); setSelection(`${id}/${id === "sandy.skirt" ? "waist" : "attachment"}`); setZoom(1); };
  const select = (id: string) => setSelection(id);
  function renderPiece(part: Piece, prior: Piece) {
    const paths = [...Object.values(part.paths), ...Object.values(prior.paths)].map(path => path.operations);
    return <div className="pattern-viewport"><span className="pattern-view-label">STUDY ONLY · DO NOT CUT</span><svg style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }} viewBox={studyBounds(paths)} role="group" aria-label={`${names[part.id]} measured engine study; not a cutting template`}>
      <title>{names[part.id]}: actual stitch outline, engine allowance, fold and marks</title>
      {overlay && <path className="pattern-original" d={operationsPath(prior.paths.seam.operations)} />}
      <path className="pattern-outline" d={operationsPath(part.paths.seam.operations)} />
      {part.paths.sa && <path className="pattern-allowance" d={operationsPath(part.paths.sa.operations)} />}
      {Object.entries(part.paths).filter(([id]) => /cutonfold|grainline|^fold$/.test(id)).map(([id, path]) => <path key={id} className={id.includes("grainline") ? "pattern-grain" : "pattern-fold"} d={operationsPath(path.operations)} />)}
      {study!.after.mapping.edges.filter(edge => edge.pieceId === part.id).map(edge => <g key={edge.id}>
        {changed.has(edge.id) && <path className="pattern-changed" d={operationsPath(edge.operations)} />}
        {selection === edge.id && <path className="pattern-selected" d={operationsPath(edge.operations)} />}
        <path className="pattern-hit" d={operationsPath(edge.operations)} tabIndex={0} role="button" aria-label={`Inspect ${label(edge.id)}${changed.has(edge.id) ? ", changed" : ""}`} aria-pressed={selection === edge.id} onClick={() => select(edge.id)} onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); select(edge.id); } }} />
      </g>)}
      {study!.after.mapping.markings.filter(mark => mark.pieceId === part.id).map(mark => <circle key={mark.id} className={selection === mark.id ? "pattern-mark selected" : "pattern-mark"} cx={mark.anchor.x} cy={mark.anchor.y} r={selection === mark.id ? 6 : 3} />)}
      <text className="pattern-watermark" x="0" y="80" textAnchor="middle">STUDY ONLY · DO NOT CUT</text>
    </svg></div>;
  }
  return <section className="pattern-board" aria-labelledby="pattern-board-heading">
    <header><div><p className="companion-kicker">THE PATTERN, CONNECTED / MEASURED STUDY</p><h2 id="pattern-board-heading">Understand the shape. See what changes.</h2><p>Real FreeSewing Sandy 4.10.2 geometry from your saved notes—not a drawing made by AI.</p></div><span className="pattern-capability">Plan only · no cutting export</span></header>
    <div className="pattern-warning">This narrow study is a half-circle, one-panel, straight-band construction with no lining, pockets or gathering. Closure details, mark pairing, complete allowance/layout checks and physical review are not qualified. It does not change your plan or certify fit.</div>
    <div className="pattern-controls"><label>Starting length option <span>{ratio}% of waist-to-floor</span><input aria-label="Starting length percentage" type="range" min="10" max="100" step="1" value={ratio} disabled={busy} onChange={event => { setRatio(Number(event.target.value)); setStudy(undefined); }} /></label>
      <label>Compare hem length <span>cm · research range −20 to +20</span><input aria-label="Hem length comparison in centimetres" type="number" min="-20" max="20" step="1" value={delta} disabled={busy} onChange={event => { setDelta(Number(event.target.value)); setStudy(undefined); }} /></label>
      <label>Engine allowance <span>mm · not method approval</span><input aria-label="Engine allowance in millimetres" type="number" min="0" max="30" step="1" value={allowance} disabled={busy} onChange={event => { setAllowance(Number(event.target.value)); setStudy(undefined); }} /></label></div>
    {missing.length > 0 && <p className="pattern-input-notice">Save body notes first: {missing.map(key => measurementNames[key]).join(", ")}. <a href="#measurement-heading">Open measurements ↓</a> No sample values are inserted.</p>}
    {dirty && <p className="pattern-input-notice">Save or discard your edits before studying the saved revision.</p>}
    <div className="pattern-consent"><label><input type="checkbox" checked={confirmed} disabled={busy || dirty} onChange={event => setConfirmed(event.target.checked)} />Use my saved measurements for this local, non-cuttable study. No measurements go to Gemini or shared Sanity.</label><button type="button" disabled={busy || dirty || !confirmed || !current || missing.length > 0} onClick={generate}>{busy ? "Drafting and checking…" : "Generate measured study ↗"}</button></div>
    {error && <p role="alert" className="pattern-input-notice">{error}</p>}
    {study && piece && original && <><div className="pattern-workbench">
      <div className="pattern-canvas"><div className="pattern-toolbar"><div role="group" aria-label="Pattern pieces">{study.after.draft.parts.map(part => <button key={part.id} type="button" aria-pressed={pieceId === part.id} onClick={() => selectPiece(part.id)}>{names[part.id]}</button>)}</div><div role="group" aria-label="Pattern zoom"><button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .5))}>−</button><output>{zoom * 100}%</output><button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(Math.min(3, zoom + .5))}>+</button></div></div>
        {renderPiece(piece, original)}<div className="pattern-legend"><span>Solid sage / stitch outline</span><span>Dashed grey / engine allowance</span><span>Yellow / fold & grain</span><span>Coral / changed edge</span><span>Blue / selected edge</span><span>Dotted original / before</span></div>
        <label className="pattern-overlay"><input type="checkbox" checked={overlay} onChange={event => setOverlay(event.target.checked)} />Show original stitch outline</label>
        <div className="pattern-edge-buttons" role="group" aria-label="Select an edge">{study.after.mapping.edges.filter(edge => edge.pieceId === pieceId).map(edge => <button type="button" key={edge.id} aria-pressed={selection === edge.id} onClick={() => select(edge.id)}>{label(edge.id)}{changed.has(edge.id) ? " · changed" : ""}</button>)}</div>
      </div>
      <aside className="pattern-inspector" aria-live="polite"><p className="companion-kicker">LOOK CLOSER</p><h3>{selectedMark ? "An engine mark, not a matched pair" : label(selection)}</h3><dl><dt>Piece</dt><dd>{names[piece.id]}</dd><dt>Engine fabric count</dt><dd>{piece.cut.materials.fabric[0].cut} · {piece.cut.materials.fabric[0].onFold ? "on a single fold" : "not cut on fold"}</dd><dt>Grain in engine coordinates</dt><dd>{piece.cut.grain}° · not a fabric placement check</dd>{selectedEdge && <><dt>Selected segment length</dt><dd>{selectedEdge.lengthMm.toFixed(2)} mm {pieceId === "sandy.skirt" && selection.endsWith("/waist") ? "· folded half, not full waist" : ""}</dd><dt>Changed in comparison?</dt><dd>{changed.has(selection) ? "Yes · full engine redraft" : "No · preserved exactly"}</dd></>}</dl>
        {selectedMark && <p>No source-approved mating mark is assigned. Do not shift, trim or recut to make this mark match another.</p>}
        <h4>Connected study steps</h4>{steps.length ? <ol className="pattern-step-links">{steps.map(step => <li key={step.id}><strong>{step.title}</strong><p>{step.explanation}</p><small>All prerequisites: {step.requires.length ? step.requires.map(stepTitle).join("; ") : "none in this study"}</small><a href={step.sourceUrl} target="_blank" rel="noreferrer">Source section: {step.section} ↗</a><small>Local paraphrase · pending review · execution disabled</small></li>)}</ol> : <p>No exact making-step binding is qualified for this selection.</p>}
        <details><summary>Inspect the engine marks</summary><div className="pattern-mark-buttons">{study.after.mapping.markings.filter(mark => mark.pieceId === pieceId).map(mark => <button type="button" key={mark.id} aria-pressed={selection === mark.id} onClick={() => select(mark.id)}>{label(mark.id)}</button>)}</div></details>
        <p className="pattern-unresolved">Interfacing template, right/wrong-side mapping and closure position are unresolved. Curved-band output is excluded because its cut count conflicts with current instructions.</p>
      </aside>
    </div>
    <section className="pattern-impact" aria-labelledby="pattern-impact-heading"><div><p className="companion-kicker">WHAT FOLLOWS THIS COMPARISON</p><h3 id="pattern-impact-heading">One change. Visible consequences.</h3><p>Requested length option change: {study.command.deltaLengthMm > 0 ? "+" : ""}{study.command.deltaLengthMm} mm. This is a study, not a kept alteration.</p></div><div><ul>{study.impact.edgeLengthChanges.map(change => <li key={change.id}><strong>{names[change.id.split("/")[0]]} / {label(change.id)}</strong><span>{change.beforeMm.toFixed(2)} → {change.afterMm.toFixed(2)} mm</span></li>)}</ul>{study.impact.changedEdgeIds.length === 0 && <p>No geometry changed.</p>}<p>Waist and waistband edges remain unchanged. Affected local study steps: {study.impact.affectedStudyStepIds.map(stepTitle).join("; ") || "none"}. Fabric placement and actual sewing instructions are not recalculated or approved.</p></div></section>
    <details className="pattern-evidence"><summary>Provenance & remaining gates</summary><p>Saved revision {study.basis.sequence} · FreeSewing Sandy {study.engine.designVersion}, core {study.engine.version} · Erica Alcusa Sáez / Joost De Cock · MIT code notice retained.</p><p>Independent scalar waist difference: {study.after.draft.measuredJoin.differenceMm.toFixed(6)} mm, with {study.after.draft.measuredJoin.overlapMm.toFixed(2)} mm overlap excluded. This is a numerical research check, not joining or fit approval.</p><code>Before: {study.before.mapping.artifactHash}<br />After: {study.after.mapping.artifactHash}</code><ul>{study.missingReceipts.map(item => <li key={item}>{item.replaceAll("-", " ")}</li>)}</ul><a href={study.sourceUrl} target="_blank" rel="noreferrer">Open original design documentation ↗</a></details></>}
  </section>;
}
