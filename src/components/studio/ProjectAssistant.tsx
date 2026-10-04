"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { agentRunCanResume, agentRunIsActive, agentTaskText, type AgentBasis, type AgentRun, type AgentTask } from "@/domain/agent-run";
import type { GuestProject } from "@/domain/guest-project";
import type { CompanionCatalogCard } from "@/server/knowledge/companion-catalog";

type Preview = {
  basis: AgentBasis;
  sharedSummary: Record<string, unknown>;
  makingSummary?: {
    configured: boolean;
    status?: string;
    stepFocus?: string;
    progress?: string;
    confirmedOptions?: Record<string, boolean>;
    activeStep?: {
      id: string;
      title: string;
      ordinal: number;
      focus?: string;
      action?: string;
      checkpoint?: string;
      orientation?: string;
      pieces?: Array<{ title: string; pieceKey: string; cutCount: number; fold: string; mirrored: boolean; material: string }>;
      activeHelpSymptom?: string | null;
    } | null;
    allStepsReviewed?: boolean;
    withheld?: string[];
  } | null;
};
const toolLabels: Record<string, string> = { inspect_project: "Saved preparation checked", resolve_exact_graph: "Exact Sanity pieces read", inspect_making: "Construction step and prerequisites checked", retrieve_context: "Stitches Knowledge Base read" };
const statusLabel: Record<AgentRun["status"], string> = { ready: "Checkpoint saved", requesting: "Waiting for Gemini", response_ready: "Response saved · ready to continue",
  processing: "Checking the evidence", completed: "Planning insight", quota: "Free quota unavailable", missing_knowledge: "Source inspection paused",
  unknown_outcome: "Provider outcome unknown", cancelled: "Stopped by you", stale: "Earlier project basis", failed: "Answer not accepted", limit: "Run limit reached", budget: "Free-call gate closed" };
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("`") && part.endsWith("`")
      ? <code key={index}>{part.slice(1, -1)}</code> : part);
}
// Small escaped React renderer, not arbitrary HTML or executable Markdown.
function insight(text: string) {
  return text.split(/\n\s*\n/).map((block, index) => {
    const lines = block.split("\n");
    return lines.every((line) => /^[-*] /.test(line)) ? <ul key={index}>{lines.map((line, item) => <li key={item}>{inline(line.slice(2))}</li>)}</ul>
      : <p key={index}>{inline(block)}</p>;
  });
}
async function result(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "The assistant is unavailable. Your manual plan is unchanged.");
  return data;
}

export function ProjectAssistant({ project, source, historySequence, makingSequence = 0, dirty }: {
  project: GuestProject; source?: CompanionCatalogCard; historySequence: number; makingSequence?: number; dirty: boolean;
}) {
  const [runs, setRuns] = useState<AgentRun[]>([]), [preview, setPreview] = useState<Preview>(), [enabled, setEnabled] = useState(false);
  const [consent, setConsent] = useState(false), [task, setTask] = useState<AgentTask>("next_preparation");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const alive = useRef(true), continuing = useRef(false), startKey = useRef<string | undefined>(undefined);
  const refreshSequence = useRef(0);
  const base = `/api/projects/${encodeURIComponent(project.id)}/agent`;
  const put = useCallback((run: AgentRun) => { if (alive.current) setRuns((items) => [run, ...items.filter((item) => item.id !== run.id)]); }, []);
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    try {
      const data = await result(await fetch(base, { cache: "no-store" }));
      if (alive.current && sequence === refreshSequence.current) { setRuns(data.runs); setPreview(data.preparation); setEnabled(data.enabled); }
    } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : "Saved runs are unavailable."); }
  }, [base]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; continuing.current = false; }; }, []);
  useEffect(() => { setConsent(false); startKey.current = undefined; void refresh(); }, [refresh, project.sequence, historySequence, makingSequence, source?.fingerprint]);
  const latest = runs[0];
  useEffect(() => {
    if (!latest || !["requesting", "processing"].includes(latest.status) || busy) return;
    const timer = window.setInterval(async () => {
      try { const data = await result(await fetch(`${base}/${latest.id}`, { cache: "no-store" })); put(data.run); }
      catch { /* Read-only polling failure never resends an inference request. */ }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [base, latest, busy, put]);

  async function control(id: string, action: "advance" | "resume" | "cancel") {
    const data = await result(await fetch(`${base}/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }));
    put(data.run); return data.run as AgentRun;
  }
  async function continueRun(initial: AgentRun) {
    continuing.current = true;
    let current = initial;
    // Advance only acknowledged checkpoints. Transport failure stops this loop, never retries a request.
    for (let step = 0; step < 4 && alive.current && continuing.current && ["ready", "response_ready"].includes(current.status); step++) {
      current = await control(current.id, "advance");
    }
  }
  const isMaking = task === "step_guidance" || task === "troubleshoot_step";
  const makingNotConfigured = isMaking && preview?.makingSummary?.configured === false;
  async function start() {
    if (!preview || !consent || dirty || !enabled || makingNotConfigured) return;
    setBusy(true); setError("");
    try {
      startKey.current ??= crypto.randomUUID();
      const data = await result(await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: startKey.current, expectedBasis: preview.basis, task, consent: { version: "preparation-v1", sharePreparationSummary: true } }) }));
      put(data.run); startKey.current = undefined; await continueRun(data.run);
    } catch (cause) { if (alive.current) { setError(`${cause instanceof Error ? cause.message : "Connection interrupted."} Refresh saved status before continuing; no inference retry was sent.`); await refresh(); } }
    finally { continuing.current = false; if (alive.current) setBusy(false); }
  }
  async function resume(run: AgentRun) {
    setBusy(true); setError("");
    try { await continueRun(agentRunCanResume(run) ? await control(run.id, "resume") : run); }
    catch (cause) { if (alive.current) { setError(cause instanceof Error ? cause.message : "Connection interrupted; inspect saved status."); await refresh(); } }
    finally { continuing.current = false; if (alive.current) setBusy(false); }
  }
  async function cancel(run: AgentRun) {
    continuing.current = false;
    try { await control(run.id, "cancel"); }
    catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : "Stop could not be acknowledged; refresh saved status."); }
  }
  const sourceCurrent = !!source && source.fingerprint === project.knowledgeFingerprint;
  const active = latest && agentRunIsActive(latest.status);
  const basisChanged = (run: AgentRun) => run.basis.projectSequence !== project.sequence || run.basis.projectHash !== project.basisHash ||
    run.basis.historySequence !== historySequence || !sourceCurrent || run.basis.catalogFingerprint !== source?.fingerprint ||
    (preview && (run.basis.makingSequence !== preview.basis.makingSequence || run.basis.makingHash !== preview.basis.makingHash || run.basis.planFingerprint !== preview.basis.planFingerprint));
  return <section className="project-assistant" aria-labelledby="assistant-heading">
    <div className="assistant-intro"><p className="companion-kicker">A SECOND PAIR OF EYES</p><h2 id="assistant-heading">Understand your next move.</h2>
      <p>A read-only companion checks this saved plan, its exact Sanity pieces and the maintained Knowledge Base. You stay in charge of every making decision.</p>
      <span className="assistant-privacy">Private notebook · no automatic saves or sewing actions</span>
      <a href="#preparation-plan-heading">Continue with the manual preparation plan ↓</a>
    </div>
    <div className="assistant-work">
      <label className="assistant-task">What would help now?<select value={task} disabled={busy || !!active} onChange={(event) => { setTask(event.target.value as AgentTask); setConsent(false); startKey.current = undefined; }}>
        <option value="next_preparation">Find my next preparation action</option><option value="understand_pieces">Help me understand these pieces</option><option value="review_gaps">Review the gaps before I make</option><option value="step_guidance">Guide next unreviewed construction step</option><option value="troubleshoot_step">Troubleshoot next unreviewed step / symptom</option></select></label>
      <div className="assistant-consent"><strong>Before anything goes to Gemini</strong><p>{agentTaskText[task]}</p>
        {isMaking && preview?.makingSummary?.activeStep && <p style={{ margin: "6px 0", fontSize: "12px", color: "#344f3b" }}><strong>Step in focus:</strong> Next unreviewed checkpoint — Step #{preview.makingSummary.activeStep.ordinal}: {preview.makingSummary.activeStep.title}</p>}
        {isMaking && preview?.makingSummary?.allStepsReviewed && <p style={{ margin: "6px 0", fontSize: "12px", color: "#74401f" }}>All study checkpoints for this confirmed configuration are reviewed.</p>}
        <p>{isMaking
          ? "Shared: this question, confirmed construction options, checkpoint progress, next unreviewed step title/orientation/pieces (with mirrored flags), and saved symptom category (if help requested). Not shared: freeform notes, private questions, body measurements or photos."
          : "Shared: this question, required/missing note labels, preparation states and counts, source/piece records, version IDs and public KB excerpts. Not shared: body values, your name or brief, tool names, fabric description, observation text or photos."}</p>
        {preview && <details><summary>Inspect the exact {isMaking ? "construction study" : "preparation"} summary</summary><pre>{JSON.stringify(isMaking && preview.makingSummary ? preview.makingSummary : preview.sharedSummary, null, 2)}</pre></details>}
        {makingNotConfigured && <p className="assistant-notice" role="status">The construction study version has not been confirmed yet. Confirm your version choices in the making notebook above before asking for step guidance.</p>}
        <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={busy || !!active || dirty || makingNotConfigured} />I agree to send this minimized summary and public source context to Gemini for this run.</label>
        <small>gemini-3.5-flash-lite · at most 4 requests / 120 active seconds · $0 paid budget · no paid fallback</small>
      </div>
      {dirty && <p className="assistant-notice">Save or discard your working edits before asking about this saved revision.</p>}
      {!enabled && <p className="assistant-notice">Live inference is disabled until the local free-tier gate is enabled. All manual preparation tools remain available.</p>}
      {!preview && <p className="assistant-notice">Current source-linked preparation is unavailable. Earlier runs and private notes are preserved.</p>}
      <div className="assistant-actions"><button type="button" onClick={start} disabled={busy || !!active || dirty || !preview || !consent || !enabled}>Check my saved project ↗</button>
        <button type="button" onClick={() => { setError(""); void refresh(); }}>Refresh saved status</button></div>
      {error && <p role="alert" className="assistant-notice">{error}</p>}
      {latest && <article className="assistant-run" aria-label="Latest assistant run"><div className="assistant-run-title"><strong>{basisChanged(latest) ? "Historical insight · review new basis" : statusLabel[latest.status]}</strong><span>{latest.requests}/4 requests · revision {latest.basis.projectSequence}</span></div>
        <ol className="assistant-trace">{latest.tools.map((tool) => <li key={tool}>{toolLabels[tool] ?? tool}</li>)}{busy && <li aria-live="polite">Waiting for the next acknowledged checkpoint…</li>}</ol>
        {latest.text && <div className="assistant-insight">{insight(latest.text)}</div>}
        {latest.text && <p className="assistant-disclaimer">AI explanation, not independently verified. Planning only; no fit, cutting, making completion or cause is certified. {basisChanged(latest) ? "Do not use this earlier basis as current guidance." : "Source content remains pending review."}</p>}
        {latest.message && <p role="status">{latest.message}</p>}
        <div className="assistant-actions">{(["ready", "response_ready"].includes(latest.status) || agentRunCanResume(latest)) && <button type="button" disabled={busy || dirty || basisChanged(latest) || !enabled} onClick={() => resume(latest)}>Continue saved run</button>}
          {(agentRunIsActive(latest.status) || agentRunCanResume(latest)) && <button type="button" onClick={() => cancel(latest)}>Stop run</button>}</div>
        <details><summary>Run evidence & checkpoints</summary><p>Dedicated Stitches KB · {latest.model} · no project changes</p><code className="assistant-binding">{latest.knowledgeHash ? `Served KB text SHA-256: ${latest.knowledgeHash}` : "No acknowledged KB text hash yet"}</code>
          <ol>{latest.checkpoints.map((item) => <li key={item.sequence}>{item.event.replaceAll("_", " ")}{item.tool ? ` · ${toolLabels[item.tool] ?? item.tool}` : ""} · request {item.request}</li>)}</ol></details>
      </article>}
      {runs.length > 1 && <details className="assistant-history"><summary>Earlier runs ({runs.length - 1})</summary>{runs.slice(1).map((run) => <article key={run.id}><strong>{statusLabel[run.status]} · revision {run.basis.projectSequence}</strong><p>{run.text ?? run.message ?? "Saved checkpoint"}</p><small>Historical, unverified planning record · {run.requests} requests</small></article>)}</details>}
    </div>
  </section>;
}
