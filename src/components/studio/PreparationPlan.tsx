"use client";
import { preparationPlan, planningBrief } from "@/domain/preparation-plan";
import { measurementFields } from "@/domain/measurement-plan";
import type { GuestProject } from "@/domain/guest-project";
import type { DiagnosticRecord } from "@/domain/diagnostic-history";
import type { CompanionCatalogCard } from "@/server/knowledge/companion-catalog";

export function PreparationPlan({ project, source, history, dirty }: { project: GuestProject; source?: CompanionCatalogCard; history: DiagnosticRecord[]; dirty: boolean }) {
  const preparation = preparationPlan(project, source);
  function reviewInputs() {
    const missing = measurementFields(source?.requiredMeasurements).fields.find((field) => field.label === preparation.missingMeasurements[0]);
    const input = missing ? document.querySelector<HTMLInputElement>(`[name="measure-${missing.key}"]`) : document.querySelector<HTMLInputElement>(".project-form input");
    input?.scrollIntoView({ behavior: "smooth", block: "center" }); input?.focus({ preventScroll: true });
  }
  function download() {
    const href = URL.createObjectURL(new Blob([planningBrief(project, history, source)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = href; link.download = `stitches-planning-brief-${project.id.slice(0, 8)}.txt`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return <section className="preparation-plan" aria-labelledby="preparation-plan-heading"><div className="preparation-heading"><div><p className="companion-kicker">PREPARE / THE SAVED REVISION</p><h2 id="preparation-plan-heading">A clear next move.</h2><p>Useful preparation without confusing recorded inputs with a verified pattern.</p></div>
    <button type="button" onClick={download} disabled={dirty}>Download planning brief ↓</button></div>
    {dirty && <p role="status">This review describes saved revision {project.sequence}. Save your draft first to export its changes.</p>}
    <div className="preparation-next"><strong>Next useful action</strong><p>{preparation.next}</p><button type="button" onClick={reviewInputs}>Review working inputs ↗</button></div>
    <ol>{preparation.items.map((item) => <li key={item.id} data-state={item.state}><div><h3>{item.title}</h3><span>{item.state === "recorded" ? "Notes recorded" : item.state === "missing" ? "Input missing" : item.state === "review" ? "Needs review" : "Not qualified"}</span></div><p>{item.detail}</p></li>)}</ol>
    <small>Private plain-text review package. No pattern pages or cutting dimensions. It references sources; it does not redistribute their instructions.</small>
  </section>;
}
