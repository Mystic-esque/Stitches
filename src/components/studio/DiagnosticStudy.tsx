"use client";

import { useRef, useState } from "react";
import { diagnosticTransitionError, type DiagnosticEvent, type DiagnosticRecord } from "@/domain/diagnostic-history";
import type { GuestProject } from "@/domain/guest-project";
import { pausedScrapAdvice, resolveScrapObservation, type ScrapObservation } from "@/domain/scrap-diagnostic";
import type { CompanionDiagnosticStudy } from "@/server/knowledge/companion-catalog";
import type { ScrapStepContext } from "./MakeWorkspace";

const choices: { value: ScrapObservation; label: string }[] = [
  { value: "not-tested", label: "I haven't tested" },
  { value: "relaxes", label: "The sample relaxed" },
  { value: "unchanged", label: "No visible change" },
];

export function DiagnosticStudy({ study, project, history, disabled, onSaved, onReload, onPrepareNote, makingContext, onClearContext }: {
  study: CompanionDiagnosticStudy; project: GuestProject; history: DiagnosticRecord[]; disabled: boolean;
  onSaved: (record: DiagnosticRecord) => void; onReload: () => Promise<void>; onPrepareNote: (text: string) => void;
  makingContext?: ScrapStepContext | null; onClearContext?: () => void;
}) {
  const [observation, setObservation] = useState<ScrapObservation>(() => {
    const saved = history.filter((item) => !item.imported && item.basisHash === project.basisHash && item.basisSequence === project.sequence &&
      item.binding.diagnosticFingerprint === study.fingerprint && item.event.kind === "observation").at(-1);
    return saved?.event.kind === "observation" ? saved.event.observation : "not-tested";
  });
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const retry = useRef<{ payload: string; key: string } | null>(null);
  const binding = { catalogFingerprint: project.knowledgeFingerprint!, diagnosticFingerprint: study.fingerprint,
    sourceId: study.sourceId, testId: study.testId, remedyId: study.remedyId,
    ...(makingContext ? { makingContext: { eventId: makingContext.eventId, planFingerprint: makingContext.planFingerprint,
      stepId: makingContext.stepId, historySequence: makingContext.historySequence } } : {}) };
  const current = history.filter((record) => !record.imported && record.basisHash === project.basisHash &&
    record.basisSequence === project.sequence && record.binding.diagnosticFingerprint === study.fingerprint).at(-1);
  async function record(event: DiagnosticEvent) {
    if (busy || disabled) return;
    const body = { expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
      expectedHistorySequence: history.length, expectedDiagnosticFingerprint: study.fingerprint, event,
      ...(makingContext ? { makingEventId: makingContext.eventId } : {}) };
    const payload = JSON.stringify(body);
    if (retry.current?.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/projects/${project.id}/diagnostics`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, idempotencyKey: retry.current.key }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save this check.");
      onSaved(data.record); retry.current = null;
      setDetail((draft) => draft === detail ? "" : draft);
      setMessage("Saved privately. This is your reported scrap observation, not a confirmed cause.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check not saved. Your draft is retained."); }
    finally { setBusy(false); }
  }
  const stopped = history.some((item) => !item.imported && item.basisHash === project.basisHash && item.basisSequence === project.sequence &&
    item.binding.diagnosticFingerprint === study.fingerprint && (item.event.kind === "paused" || item.event.kind === "comparison_result"));
  const result = stopped ? pausedScrapAdvice() : resolveScrapObservation(study, observation);
  function prepareNote() {
    onPrepareNote(`Scrap seam check · ${study.title}\nObservation: ${choices.find((choice) => choice.value === observation)?.label}.\nWorking state: ${result.title}.\nSource basis: ${study.fingerprint.slice(0, 12)}.\nWhat I actually saw: `);
  }
  return <section className="diagnostic-study" aria-labelledby="diagnostic-study-title">
    {makingContext && <div className="diagnostic-step-context"><strong>Scrap check for: {makingContext.stepTitle}</strong><small>Saved making question · construction source {makingContext.planFingerprint.slice(0, 12)}. The server rechecks this context before each observation or comparison.</small><button type="button" onClick={onClearContext}>Use the general project scrap check</button></div>}
    <div className="diagnostic-study-head"><p className="companion-kicker">03 / WHEN A SEAM ISN'T BEHAVING</p><h2 id="diagnostic-study-title">Pause. Observe. Then decide.</h2><p>One shared making check for both starting garments, connected to a technical source. A ripple is a symptom, not a diagnosis.</p><span>Source-linked · {study.reviewStatus} review · sample check only</span></div>
    <div className="diagnostic-study-grid"><div className="diagnostic-study-question"><span>THE QUESTION</span><h3>{study.makerQuestion}</h3><p>{study.howToCheck}</p><small>{study.riskNotes}</small></div><div className="diagnostic-study-result"><span>WHAT DID YOU OBSERVE?</span><div className="diagnostic-choices" role="group" aria-label="Scrap seam observation">{choices.map((choice) => <button key={choice.value} type="button" aria-pressed={observation === choice.value} onClick={() => setObservation(choice.value)}>{choice.label}</button>)}</div><div className={`diagnostic-outcome ${result.state}`} aria-live="polite"><small>{result.state === "possible-tension" ? "A POSSIBLE CAUSE · NOT CONFIRMED" : result.state === "unresolved" ? "STOP THIS PATH · MORE EVIDENCE NEEDED" : "NO CAUSE IDENTIFIED YET"}</small><h3>{result.title}</h3><p>{result.explanation}</p><strong>Next safe move</strong><p>{result.nextAction}</p>{result.confirmation && <p className="diagnostic-confirmation"><strong>Check the result:</strong> {result.confirmation}</p>}</div></div></div>
    <div className="diagnostic-record-controls"><label>What did you actually see? <small>Optional · private notes</small><textarea value={detail} maxLength={600} rows={3} onChange={(event) => setDetail(event.target.value)} /></label>
      <div className="diagnostic-actions"><button type="button" disabled={busy || disabled || !!diagnosticTransitionError(history, { kind: "observation", observation, detail }, project.basisHash, binding, project.sequence)} onClick={() => record({ kind: "observation", observation, detail })}>Save scrap observation ↗</button>
      {current?.event.kind === "observation" && current.event.observation === "relaxes" && observation === "relaxes" && !diagnosticTransitionError(history, { kind: "comparison_started", observationId: current.id }, project.basisHash, binding, project.sequence) &&
        <button type="button" disabled={busy || disabled} onClick={() => record({ kind: "comparison_started", observationId: current.id })}>Start source-linked scrap comparison ↗</button>}
      {current?.event.kind === "comparison_started" && <div role="group" aria-label="Comparison result">{([
        ["helped", "It helped the sample"], ["no_change", "No improvement"], ["worse", "The sample got worse"], ["unsure", "I'm unsure"],
      ] as const).map(([outcome, label]) => <button key={outcome} type="button" disabled={busy || disabled} onClick={() => record({ kind: "comparison_result", attemptId: current.id, outcome, detail })}>{label}</button>)}</div>}
      {current && current.event.kind !== "paused" && <button type="button" disabled={busy || disabled} onClick={() => record({ kind: "paused", reason: detail.trim() || "Maker paused this scrap check for review." })}>Pause this check</button>}
      <button type="button" disabled={busy} onClick={() => { void onReload().then(() => setMessage("History reloaded. Review it before continuing.")).catch(() => setMessage("History could not be reloaded; your draft is retained.")); }}>Reload saved history</button></div>
      {disabled && <small>Save your working brief first. Checks must belong to a kept revision.</small>}
      {current?.event.kind === "comparison_result" && <p className="diagnostic-saved-result">{current.event.outcome === "helped" ? "Your sample improved. That is evidence to keep—not proof of the cause or permission to alter the garment." : "Stop this comparison path. Keep the unsuccessful or uncertain result and seek further review; do not repeat it automatically."}</p>}
      {current?.event.kind === "comparison_started" && <p>Comparison in progress on sacrificial material only. Record its result or pause before another check. Follow the source-linked action and confirmation above.</p>}
      {message && <p role="status">{message}</p>}
    </div>
    <div className="diagnostic-study-foot"><p>Only test on sacrificial material here. Do not alter the finished garment from this preliminary result. Saved checks retain the original project and source basis.</p><button type="button" onClick={prepareNote}>Prepare a journal observation ↗</button><a href={study.sourceUrl} target="_blank" rel="noreferrer">Read {study.sourceTitle} ↗</a></div>
  </section>;
}
