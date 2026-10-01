"use client";
import { measurementCoverage, measurementFields, type MeasurementDraft } from "@/domain/measurement-plan";

export function MeasurementPlan({ draft, requiredLabels, onChange }: {
  draft: MeasurementDraft; requiredLabels?: string[];
  onChange: (draft: MeasurementDraft) => void;
}) {
  const { fields, unmappedLabels } = measurementFields(requiredLabels);
  const visible = new Set(fields.filter((field) => field.unit === "cm").map((field) => field.key));
  const retained = Object.keys(draft.lengths).filter((key) => !visible.has(key));
  const known = measurementCoverage(fields, draft);
  return <section className="measurement-plan" aria-labelledby="measurement-heading">
    <div className="form-divider">03 / BODY MEASUREMENT NOTES</div>
    <div className="measurement-heading"><h3 id="measurement-heading">A clear basis, not a guessed size.</h3>
      <span>{known} / {fields.length} recorded</span></div>
    <p className="field-help">{requiredLabels ? "Fields follow this design’s current Sanity measurement list. " : "Optional notes for your idea. "}
      Lengths are entered in cm and stored in mm; angles stay in degrees. These are body notes, not finished garment dimensions, ease or a verified fit.</p>
    <div className="measurement-grid">{fields.map((field) => {
      const group = field.unit === "degrees" ? "angles" : "lengths";
      return <div className="measurement-field" key={`${group}-${field.key}`}>
        <label>{field.label}<small>{field.unit === "degrees" ? "degrees · angle" : "cm · body length"}</small>
          <input name={`measure-${field.key}`} type="number" inputMode="decimal" min={field.unit === "degrees" ? "0" : "0.1"}
            max={field.unit === "degrees" ? "90" : "300"} step="any" value={draft[group][field.key] ?? ""}
            onChange={(event) => onChange({ ...draft, [group]: { ...draft[group], [field.key]: event.target.value } })} /></label>
        {field.helpUrl && <a href={field.helpUrl} target="_blank" rel="noreferrer">Measurement reference ↗</a>}
      </div>;
    })}</div>
    {unmappedLabels.length > 0 && <p className="measurement-caution" role="status">The source also lists {unmappedLabels.join(", ")}. Its units/key are not mapped; Stitches will not guess them.</p>}
    {retained.length > 0 && <details className="measurement-retained"><summary>{retained.length} other saved measurement notes retained</summary>
      <p>These are not substituted for the source’s measurement names. Nothing is silently converted or deleted.</p>
      <dl>{retained.map((key) => <div key={key}><dt>{key}</dt><dd>{draft.lengths[key]} cm</dd></div>)}</dl></details>}
    <p className="measurement-caution">Recording every field does not unlock cutting. Pattern, ease, layout, print and maker checks are still required.</p>
  </section>;
}
