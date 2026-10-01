"use client";

import { useState } from "react";
import { resolveScrapObservation, type ScrapObservation } from "@/domain/scrap-diagnostic";
import type { CompanionDiagnosticStudy } from "@/server/knowledge/companion-catalog";

const choices: { value: ScrapObservation; label: string }[] = [
  { value: "not-tested", label: "I haven't tested" },
  { value: "relaxes", label: "The sample relaxed" },
  { value: "unchanged", label: "No visible change" },
];

export function DiagnosticStudy({ study, onPrepareNote }: { study: CompanionDiagnosticStudy; onPrepareNote: (text: string) => void }) {
  const [observation, setObservation] = useState<ScrapObservation>("not-tested");
  const result = resolveScrapObservation(study, observation);
  function prepareNote() {
    onPrepareNote(`Scrap seam check · ${study.title}\nObservation: ${choices.find((choice) => choice.value === observation)?.label}.\nWorking state: ${result.title}.\nSource basis: ${study.fingerprint.slice(0, 12)}.\nWhat I actually saw: `);
  }
  return <section className="diagnostic-study" aria-labelledby="diagnostic-study-title">
    <div className="diagnostic-study-head"><p className="companion-kicker">03 / WHEN A SEAM ISN'T BEHAVING</p><h2 id="diagnostic-study-title">Pause. Observe. Then decide.</h2><p>One shared making check for both starting garments, connected to a technical source. A ripple is a symptom, not a diagnosis.</p><span>Source-linked · {study.reviewStatus} review · sample check only</span></div>
    <div className="diagnostic-study-grid"><div className="diagnostic-study-question"><span>THE QUESTION</span><h3>{study.makerQuestion}</h3><p>{study.howToCheck}</p><small>{study.riskNotes}</small></div><div className="diagnostic-study-result"><span>WHAT DID YOU OBSERVE?</span><div className="diagnostic-choices" role="group" aria-label="Scrap seam observation">{choices.map((choice) => <button key={choice.value} type="button" aria-pressed={observation === choice.value} onClick={() => setObservation(choice.value)}>{choice.label}</button>)}</div><div className={`diagnostic-outcome ${result.state}`} aria-live="polite"><small>{result.state === "possible-tension" ? "A POSSIBLE CAUSE · NOT CONFIRMED" : result.state === "unresolved" ? "STOP THIS PATH · MORE EVIDENCE NEEDED" : "NO CAUSE IDENTIFIED YET"}</small><h3>{result.title}</h3><p>{result.explanation}</p><strong>Next safe move</strong><p>{result.nextAction}</p>{result.confirmation && <p className="diagnostic-confirmation"><strong>Check the result:</strong> {result.confirmation}</p>}</div></div></div>
    <div className="diagnostic-study-foot"><p>Only test on sacrificial material here. Do not alter the finished garment from this preliminary result. Your journal can keep the observation with this project revision.</p><button type="button" onClick={prepareNote}>Prepare a journal observation ↗</button><a href={study.sourceUrl} target="_blank" rel="noreferrer">Read {study.sourceTitle} ↗</a></div>
  </section>;
}
