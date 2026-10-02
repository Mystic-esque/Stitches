"use client";

import { diagnosticEventLabel, type DiagnosticRecord } from "@/domain/diagnostic-history";
import type { GuestProject } from "@/domain/guest-project";
import { useRef, useState } from "react";

export function DiagnosticHistory({ history, project, currentFingerprint, disabled, onSaved }: { history: DiagnosticRecord[]; project: GuestProject; currentFingerprint?: string; disabled: boolean; onSaved: (record: DiagnosticRecord) => void }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const retry = useRef<{ payload: string; key: string } | null>(null);
  const last = history.filter((item) => !item.imported && item.basisSequence === project.sequence && item.basisHash === project.basisHash && item.binding.catalogFingerprint === project.knowledgeFingerprint).at(-1);
  async function pause() {
    if (!last || busy || disabled) return;
    const body = { expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash, expectedHistorySequence: history.length,
      expectedDiagnosticFingerprint: last.binding.diagnosticFingerprint, event: { kind: "paused", reason: "Maker paused this saved scrap check; no new source advice." } };
    const payload = JSON.stringify(body); if (retry.current?.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/projects/${project.id}/diagnostics`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, idempotencyKey: retry.current.key }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Pause not saved.");
      onSaved(data.record); retry.current = null; setMessage("Pause saved privately; no new source advice was issued.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pause not saved. Retry or reload the project."); }
    finally { setBusy(false); }
  }
  return <section className="diagnostic-history" aria-labelledby="diagnostic-history-title">
    <p className="companion-kicker">YOUR SCRAP CHECK NOTEBOOK</p><h2 id="diagnostic-history-title">What actually happened.</h2>
    <p>Private, version-bound observations—not a diagnosis. Old work stays visible when a plan or source changes.</p>
    {last && last.event.kind !== "paused" && <button className="history-pause" type="button" disabled={disabled || busy} onClick={pause}>Pause saved check · no new advice</button>}
    {message && <p role="status">{message}</p>}
    {history.length === 0 ? <p>No saved checks yet. Try a source-linked check on sacrificial material, then record what you saw.</p> : <ol>{history.slice().reverse().map((record) => {
      const current = !record.imported && record.basisHash === project.basisHash && record.basisSequence === project.sequence &&
        record.binding.diagnosticFingerprint === currentFingerprint;
      const detail = "detail" in record.event ? record.event.detail : record.event.kind === "paused" ? record.event.reason : "";
      return <li key={record.id}><div><strong>{diagnosticEventLabel(record.event)}</strong><small>{record.imported ? "Imported history · not verified" : current ? `Current revision #${record.basisSequence}` : `Historical basis #${record.basisSequence} · guidance paused`}</small></div>
        {detail && <p>{detail}</p>}<details className="diagnostic-history-source"><summary>Source basis & check identifiers</summary><small>Source: {record.binding.sourceId} · test: {record.binding.testId} · remedy: {record.binding.remedyId} · basis {record.binding.diagnosticFingerprint.slice(0, 12)}</small></details>
        <time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString()}</time>
        {record.event.kind === "comparison_result" && <p className="diagnostic-history-limit">User-reported scrap result only. No cause or finished-garment fix confirmed.</p>}
      </li>;
    })}</ol>}
  </section>;
}
