"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GuestProject } from "@/domain/guest-project";
import type { CompanionCatalogCard } from "@/server/knowledge/companion-catalog";
import { currentMakingSession, makingPrerequisites,
  type MakingPlan, type MakingRecord, type MakingOptions, type RecordMakingInput } from "@/domain/making-plan";
import { selectMakingStepPieces } from "@/domain/planning-piece-study";
import "../../app/making.css";

export type ScrapStepContext = { eventId: string; stepId: string; stepTitle: string; planFingerprint: string; historySequence: number };
const noOptions: MakingOptions = { sleeves: false, frontBottom: false, dart: false };

function StepRelationshipDiagram({ pieces, edgeIds }: {
  pieces: Array<{ title: string; pieceKey: string; cutCount: number; fold: string; mirrored: boolean; material: string }>;
  edgeIds: string[];
}) {
  // Step records list involved objects, but do not yet identify verified seam mates.
  // A two-box joining arrow would invent a relationship even when two IDs exist.
  return <div className="making-diagram-wrap making-diagram-study" role="group" aria-label="Authored pieces and edge references for this study step">
    <p>{pieces.length ? "Source-listed pieces in this operation" : "No exact pieces are bound to this step yet. Use the original pattern instructions."}</p>
    {pieces.length > 0 && <ul>{pieces.map((piece) => <li key={piece.pieceKey}><strong>{piece.title}</strong><span>{piece.fold === "none" ? "No fold" : `${piece.fold} fold`} · {piece.mirrored ? "mirrored pair" : `cut ${piece.cutCount}`}</span></li>)}</ul>}
    {edgeIds.length > 0 && <small>Authored edge IDs: {edgeIds.join(" · ")}. These IDs do not by themselves establish a joining partner or stitching path.</small>}
    <small>Exact seam-mate and placement diagram awaits source qualification. Read the original construction instructions before sewing.</small>
  </div>;
}

export function MakeWorkspace({ project, source, dirty, onScrapHelp, onContextInvalidated, onMakingUpdated, onShowPattern }: {
  project: GuestProject; source?: CompanionCatalogCard; dirty: boolean;
  onScrapHelp: (context: ScrapStepContext) => void; onContextInvalidated: () => void;
  onMakingUpdated?: (sequence: number) => void;
  onShowPattern?: () => void;
}) {
  const [plan, setPlan] = useState<MakingPlan | null>(null);
  const [history, setHistory] = useState<MakingRecord[]>([]);
  const [sourceCurrent, setSourceCurrent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<MakingOptions>(noOptions);
  const [configEditing, setConfigEditing] = useState(false);
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [concise, setConcise] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [symptom, setSymptom] = useState<"seam_puckering" | "alignment" | "other">("alignment");
  const [detail, setDetail] = useState("");
  const pending = useRef<{ payload: string; key: string } | null>(null);
  const mounted = useRef(true), requestNumber = useRef(0);
  const reload = useCallback(async () => {
    const request = ++requestNumber.current;
    try {
      const response = await fetch(`/api/projects/${project.id}/making`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Making notebook could not be loaded.");
      if (!mounted.current || request !== requestNumber.current) return;
      setHistory(data.history); setPlan(data.plan); setSourceCurrent(data.sourceCurrent); setMessage(data.message || "");
      if (data.history) onMakingUpdated?.(data.history.length);
      const last = (data.history as MakingRecord[]).at(-1);
      const loadedSession = data.plan ? currentMakingSession(data.history, project, data.plan) : null;
      if (data.sourceCurrent && last?.event.kind === "help_requested" && last.event.symptom === "seam_puckering" &&
        loadedSession?.next?.id === last.event.stepId && last.sessionId === loadedSession.configured.id) {
        onScrapHelp({ eventId: last.id, stepId: loadedSession.next.id, stepTitle: loadedSession.next.title, planFingerprint: data.plan.fingerprint, historySequence: last.sequence });
      } else onContextInvalidated();
    } catch {
      if (mounted.current && request === requestNumber.current) { setPlan(null); setSourceCurrent(false); onContextInvalidated(); setMessage("Construction knowledge could not be refreshed. Saved history remains; keep your draft and retry."); }
    } finally { if (mounted.current && request === requestNumber.current) setLoading(false); }
  }, [project.id, project.sequence, onMakingUpdated]);
  useEffect(() => {
    mounted.current = true; void reload();
    const focus = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", focus);
    const timer = window.setInterval(focus, 60000);
    return () => { mounted.current = false; requestNumber.current++; window.removeEventListener("focus", focus); window.clearInterval(timer); };
  }, [reload]);
  const session = plan ? currentMakingSession(history, project, plan) : null;
  const step = plan?.steps.find((item) => item.id === selected && session?.steps.some((active) => active.id === item.id)) ?? session?.next ?? session?.steps.at(-1);
  useEffect(() => { setConfirmed(false); setHelpOpen(false); setSymptom("alignment"); }, [step?.id]);
  const current = sourceCurrent && !!source && source.fingerprint === project.knowledgeFingerprint;
  const disabled = busy || dirty || !current;
  const pauseBasis = history.findLast((entry) => !entry.imported && entry.basisSequence === project.sequence &&
    entry.basisHash === project.basisHash && entry.catalogFingerprint === project.knowledgeFingerprint);

  async function record(event: RecordMakingInput["event"]) {
    if (busy || dirty || (!current && event.kind !== "paused")) return;
    const body = { expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
      expectedHistorySequence: history.length, planFingerprint: plan?.fingerprint ?? pauseBasis?.planFingerprint, event };
    const payload = JSON.stringify(body);
    if (pending.current?.payload !== payload) pending.current = { payload, key: crypto.randomUUID() };
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/projects/${project.id}/making`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, idempotencyKey: pending.current.key }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "The entry was not saved. Your draft is retained.");
      if (!mounted.current) return;
      const saved = data.record as MakingRecord;
      setHistory((entries) => entries.some((entry) => entry.id === saved.id) ? entries : [...entries, saved]);
      pending.current = null; setConfirmed(false); setHelpOpen(false); onContextInvalidated();
      onMakingUpdated?.(saved.sequence);
      if (event.kind === "configured" || event.kind === "reviewed") setSelected("");
      if (event.kind === "configured") setConfigEditing(false);
      setMessage("Saved privately on this revision. This records a study decision, not verified physical work.");
      if (event.kind === "help_requested" && event.symptom === "seam_puckering" && plan && step) {
        onScrapHelp({ eventId: saved.id, stepId: step.id, stepTitle: step.title, planFingerprint: plan.fingerprint, historySequence: saved.sequence });
        document.getElementById("diagnostic-study-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : "Not saved. Your draft is retained."); }
    finally { if (mounted.current) setBusy(false); }
  }
  const stepPieces = (source && step && session)
    ? selectMakingStepPieces(source.pieceStudy, session.options, step.pieceKeys)
    : (source && step)
      ? source.pieceStudy.filter((piece) => step.pieceKeys.includes(piece.pieceKey))
      : [];
  const reviewed = !!step && !!session?.reviewed.has(step.id);
  const eligible = !!step && !!plan && !!session && makingPrerequisites(plan, session.options, step.id).every((id) => session.reviewed.has(id));

  return <section className="making-workspace" aria-labelledby="making-heading">
    <header className="making-heading"><div><p className="companion-kicker">THE MAKING NOTEBOOK / SOURCE → STEP → CHECK</p><h2 id="making-heading">Understand the next operation.</h2><p>One relationship at a time. Keep questions and review checkpoints with the version you actually studied.</p></div><span className="making-badge">Learning plan · physical review pending</span></header>
    {loading && <p role="status">Loading your construction study…</p>}
    {dirty && <p className="making-caution">Save your working brief first. New checkpoints must belong to a saved revision.</p>}
    {plan && <details className="making-source"><summary>Scope & source · {plan.title}</summary><p>{plan.envelope}</p><p>This is an authored learning summary, not complete sewing instructions. Follow your qualified pattern for allowances, material handling and physical sewing.</p><a href={plan.sourceUrl} target="_blank" rel="noreferrer">Read the original construction instructions ↗</a><small>Sanity plan {plan.id} · revision fingerprint {plan.fingerprint.slice(0, 12)} · no Context rebuild assumed</small></details>}
    {plan && (!session || configEditing) && <form className="making-config" onSubmit={(event) => { event.preventDefault(); void record({ kind: "configured", options }); }}>
      <div><h3>First, confirm the version.</h3><p>{plan.designKey === "sandy" ? "This learning path covers the straight overlapping band and a closure below it. Other closure positions and seamless skirts need another path." : "Select only features actually present in your source pattern. This changes the prerequisite path; it does not draft a new pattern."}</p></div>
      {plan.designKey === "tina" && <fieldset><legend>My chosen version includes</legend>{([
        ["sleeves", "Sleeves"], ["frontBottom", "Lower-front piece"], ["dart", "Bust dart"],
      ] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={(event) => setOptions({ ...options, [key]: event.target.checked })} />{label}</label>)}</fieldset>}
      <button className="making-primary" disabled={disabled} type="submit">Confirm & open the learning path ↗</button>
      {session && <button type="button" onClick={() => setConfigEditing(false)}>Keep the current study session</button>}
    </form>}
    {plan && session && step && !configEditing && <div className="making-layout">
      <aside className="making-rail" aria-label="Authored construction study steps"><p>{session.reviewed.size} / {session.steps.length} study checkpoints</p><ol>{session.steps.map((item, index) => {
        const done = session.reviewed.has(item.id), unlocked = makingPrerequisites(plan, session.options, item.id).every((id) => session.reviewed.has(id));
        return <li key={item.id}><button type="button" aria-current={step.id === item.id ? "step" : undefined} onClick={() => setSelected(item.id)}>
          <b>{done ? "✓" : String(index + 1).padStart(2, "0")}</b><span>{item.title}<small>{done ? "Study reviewed" : unlocked ? "Ready to study" : "Prerequisites first"}</small></span></button></li>;
      })}</ol><button type="button" disabled={disabled} onClick={() => { setOptions(session.options); setConfigEditing(true); }}>Review version choices</button><small>Confirming starts a fresh study session; earlier entries stay in history.</small></aside>
      <article className="making-step" aria-labelledby="making-step-title">
        <div className="making-step-top"><span>{reviewed ? "REVIEWED STUDY" : eligible ? "YOUR NEXT RELATIONSHIP" : "PREVIEW · NOT YET ELIGIBLE"}</span><button type="button" aria-pressed={concise} onClick={() => setConcise(!concise)}>{concise ? "More explanation" : "Concise view"}</button></div>
        <h3 id="making-step-title">{step.title}</h3><p className="making-action">{step.action}</p>
        <div className="making-layer-study">
          <div className="making-layer-label">ORIENTATION / SCHEMATIC, NOT A CUTTING SHAPE</div>
          <StepRelationshipDiagram pieces={stepPieces} edgeIds={step.edgeIds} />
          <p>{step.orientation}</p>
        </div>
        {!concise && <div className="making-pieces"><h4>Bring these pieces into view</h4><ul>{stepPieces.map((piece) => <li key={piece.pieceKey}><strong>{piece.title}</strong><span>Source cut list: {piece.cutCount}{piece.mirrored ? " mirrored" : ""} · {piece.fold === "none" ? "no fold" : `${piece.fold} fold`} · {piece.material}</span></li>)}</ul><p>Counts describe the planning source, not a qualified cutting layout.</p>{step.edgeIds.length > 0 && <div>{plan.designKey === "sandy" && onShowPattern && <button type="button" className="making-pattern-link" onClick={onShowPattern}>Inspect Sandy’s measured edge study ↗</button>}<small>{step.edgeIds.join(" · ")}</small></div>}{plan.designKey === "tina" && <small>Tina’s exact edge mates are not yet qualified; use the original pattern markings.</small>}</div>}
        <div className="making-checkpoint"><span>BEFORE YOU MOVE ON</span><p>{step.checkpoint}</p><label><input type="checkbox" checked={confirmed} disabled={disabled || !eligible || reviewed} onChange={(event) => setConfirmed(event.target.checked)} />I reviewed this study checkpoint. This is not proof that I sewed it.</label></div>
        <div className="making-actions"><button className="making-primary" type="button" disabled={disabled || !confirmed || !eligible || reviewed} onClick={() => record({ kind: "reviewed", stepId: step.id, checkpointConfirmed: true })}>Record study checkpoint ↗</button><button type="button" disabled={disabled || session.next?.id !== step.id} onClick={() => setHelpOpen(!helpOpen)}>I’m stuck here</button></div>
        {helpOpen && <form className="making-help" onSubmit={(event) => { event.preventDefault(); void record({ kind: "help_requested", stepId: step.id, symptom, detail }); }}><h4>Keep the question with this step.</h4><label>What needs attention?<select value={symptom} onChange={(event) => setSymptom(event.target.value as typeof symptom)}><option value="alignment">Piece alignment / orientation</option>{step.diagnostic && <option value="seam_puckering">A scrap seam is puckering</option>}<option value="other">Another question</option></select></label><label>What did you observe?<textarea value={detail} required maxLength={600} rows={3} onChange={(event) => setDetail(event.target.value)} /></label><p>{symptom === "seam_puckering" ? "This opens the shared source-linked sacrificial-sample check, bound to this step. It will not alter your garment." : "This records an unresolved question. No unqualified fix will be generated; consult the original source or a maker."}</p><button type="submit" disabled={disabled || !detail.trim()}>Save question{symptom === "seam_puckering" ? " & open scrap check" : ""} ↗</button></form>}
        {!session.next && <p className="making-caution">All learning checkpoints are reviewed. Physical assembly, fit and cutting qualification are still unverified.</p>}
      </article>
    </div>}
    <footer className="making-foot"><button type="button" disabled={busy} onClick={() => void reload()}>Refresh source & notebook</button>{pauseBasis && <button type="button" disabled={busy || dirty} onClick={() => record({ kind: "paused", reason: detail.trim() || "Maker paused the learning path for source or expert review." })}>Save a private pause</button>}<p role="status">{message}</p></footer>
    <details className="making-history"><summary>Private making history · {history.length} entries</summary>{history.length ? <ol>{[...history].reverse().map((entry) => <li key={entry.id}><strong>{entry.event.kind.replaceAll("_", " ")}</strong><time>{new Date(entry.createdAt).toLocaleString()}</time><p>{entry.event.kind === "help_requested" ? entry.event.detail : entry.event.kind === "paused" ? entry.event.reason : entry.event.kind === "configured" ? `Confirmed features: ${Object.entries(entry.event.options).filter(([, enabled]) => enabled).map(([key]) => key).join(", ") || "none of the optional Tina features"}` : entry.event.stepId.split("-v1-")[1]}</p><small>Project revision {entry.basisSequence} · source {entry.planFingerprint.slice(0, 12)} · {entry.imported ? "imported history, not authority" : "private maker record"}</small></li>)}</ol> : <p>No making entries yet. Your first confirmed configuration starts a source-bound study session.</p>}</details>
  </section>;
}
