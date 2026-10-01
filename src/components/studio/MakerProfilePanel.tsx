"use client";
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { emptyProjectPlan, type GuestProject } from "@/domain/guest-project";
import { profileBackupSchema, profileCopyPreview, profileValuesSchema, type MakerProfile, type ProfileValues } from "@/domain/maker-profile";
import { applyMeasurementDraft, measurementDraftFor, profileMeasurementFields, type MeasurementDraft } from "@/domain/measurement-plan";

const blank = (): ProfileValues => ({ name: "My maker notes", experience: "beginner", measurementsMm: {}, equipment: [] });
async function read(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Maker profile unavailable.");
  return data;
}
export function MakerProfilePanel({ project, projectBusy, projectDirty, onCopied }: {
  project: GuestProject | null; projectBusy: boolean; projectDirty: boolean; onCopied: (project: GuestProject) => void;
}) {
  const heading = useId();
  const [profile, setProfile] = useState<MakerProfile | null>(null);
  const [values, setValues] = useState<ProfileValues>(blank);
  const [measurements, setMeasurements] = useState<MeasurementDraft>(() => measurementDraftFor(emptyProjectPlan()));
  const [equipment, setEquipment] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);
  const pending = useRef<{ signature: string; key: string } | null>(null);
  const keyFor = (value: unknown) => {
    const signature = JSON.stringify(value);
    if (pending.current?.signature !== signature) pending.current = { signature, key: crypto.randomUUID() };
    return pending.current.key;
  };
  function fill(next: ProfileValues) {
    setValues({ name: next.name, experience: next.experience, measurementsMm: next.measurementsMm,
      ...(next.measurementsDegrees !== undefined ? { measurementsDegrees: next.measurementsDegrees } : {}), equipment: next.equipment });
    setMeasurements(measurementDraftFor({ ...emptyProjectPlan(), measurementsMm: next.measurementsMm,
      ...(next.measurementsDegrees !== undefined ? { measurementsDegrees: next.measurementsDegrees } : {}) }));
    setEquipment(next.equipment.join("\n"));
  }
  useEffect(() => {
    let alive = true;
    fetch("/api/profile", { cache: "no-store" }).then(read).then((data) => {
      if (alive) { setProfile(data.profile); fill(data.profile ?? blank()); setState("ready"); }
    }).catch(() => { if (alive) { setState("unavailable"); setError("Private profile could not be loaded. Retry before editing."); } });
    return () => { alive = false; };
  }, []);
  function draftValues() {
    const plan = applyMeasurementDraft({ ...emptyProjectPlan(), measurementsMm: values.measurementsMm,
      ...(values.measurementsDegrees !== undefined ? { measurementsDegrees: values.measurementsDegrees } : {}) }, measurements);
    return profileValuesSchema.parse({ name: values.name, experience: values.experience, measurementsMm: plan.measurementsMm,
      ...(plan.measurementsDegrees !== undefined ? { measurementsDegrees: plan.measurementsDegrees } : {}),
      equipment: [...new Set(equipment.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))] });
  }
  let dirty = true;
  try { dirty = importing || JSON.stringify(draftValues()) !== JSON.stringify(profile ? valuesFromProfile(profile) : blank()); } catch { /* Invalid draft remains unsaved. */ }
  let preview: ReturnType<typeof profileCopyPreview> | null = null, previewError = "";
  if (project && profile) {
    try { preview = profileCopyPreview(project.plan, profile); } catch { previewError = "Combined tools exceed the project limit. Review your equipment before copying."; }
  }
  async function reload() {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await read(await fetch("/api/profile", { cache: "no-store" }));
      setProfile(data.profile); fill(data.profile ?? blank()); setState("ready"); setImporting(false); pending.current = null;
      setNotice("Loaded the saved profile. No project changed.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Profile unavailable."); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || state !== "ready") return;
    setBusy(true); setError(""); setNotice("");
    try {
      const profileDraft = draftValues(), basis = { expectedSequence: profile?.sequence ?? 0, expectedBasisHash: profile?.basisHash ?? null };
      const input = importing ? { ...basis, backup: profileBackupSchema.parse({ format: "stitches-maker-backup", version: 1, profile: profileDraft }) } : { ...basis, profile: profileDraft };
      const data = await read(await fetch("/api/profile", { method: importing ? "POST" : "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, idempotencyKey: keyFor(input) }) }));
      setProfile(data.profile); fill(data.profile); setImporting(false); pending.current = null;
      setNotice(`Profile revision ${data.profile.sequence} saved privately. Existing projects are unchanged.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Review your profile values."); }
    finally { setBusy(false); }
  }
  async function copy() {
    if (!project || !profile || dirty || projectDirty || projectBusy || busy || !preview) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const input = { expectedSequence: project.sequence, expectedBasisHash: project.basisHash, profileId: profile.id,
        expectedProfileSequence: profile.sequence, expectedProfileBasisHash: profile.basisHash };
      const data = await read(await fetch(`/api/projects/${project.id}/profile`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, idempotencyKey: keyFor({ projectId: project.id, ...input }) }) }));
      onCopied(data.project); pending.current = null;
      setNotice(`Copied into project revision ${data.project.sequence}. Existing measurements were kept; future profile edits will not change this copy.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not copy profile."); }
    finally { setBusy(false); }
  }
  function download() {
    if (!profile) return;
    const backup = profileBackupSchema.parse({ format: "stitches-maker-backup", version: 1, profile: profileValuesSchema.parse(valuesFromProfile(profile)) });
    const href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = href; link.download = "stitches-private-maker.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    setNotice("Backup contains private body notes and tools in plain JSON. Store it safely; it includes saved values, not unsaved edits or revision history.");
  }
  async function prepareImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || busy) return;
    setError(""); setNotice("");
    try {
      if (file.size > 128_000) throw new Error("Choose a maker backup smaller than 128 KB.");
      const backup = profileBackupSchema.parse(JSON.parse(await file.text()));
      fill(backup.profile); setImporting(true); pending.current = null;
      setNotice("Backup loaded for review only. Saving will replace this guest’s current profile as a new revision. Existing projects stay unchanged.");
    } catch { setError("Choose a valid Stitches maker backup (version 1), smaller than 128 KB. Nothing was saved."); }
  }
  const fields = profileMeasurementFields(), visible = new Set(fields.map((field) => field.key));
  const other = Object.keys(measurements.lengths).filter((key) => !visible.has(key));
  return <section className="maker-profile-panel" aria-labelledby={heading}>
    <details><summary><span><small>PRIVATE / REUSABLE</small><strong id={heading}>Your maker profile</strong></span>
      <span>{state === "loading" ? "Loading…" : profile ? `${profile.name} · revision ${profile.sequence}` : "Body notes, experience & tools"} <b>＋</b></span></summary>
      <div className="maker-profile-content"><p className="profile-intro">Keep the notes you use across projects. Stored for this guest browser on this local server, never in shared Sanity. One profile for now; no account sync or fit certification.</p>
        <form onSubmit={save}><fieldset disabled={busy || state !== "ready"}><div className="field-row"><label>Profile name<input name="profile-name" required maxLength={100} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Sewing experience<select name="profile-experience" value={values.experience} onChange={(event) => setValues((current) => ({ ...current, experience: event.target.value as ProfileValues["experience"] }))}><option value="beginner">Learning / beginner</option><option value="comfortable">Comfortable with basics</option><option value="experienced">Experienced maker</option></select></label></div>
          <label>Equipment you have<small>One tool per line · no required machine assumed</small><textarea name="profile-equipment" rows={3} value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder={"Sewing machine\nIron"} /></label>
          <details className="profile-body"><summary>Body measurement notebook <span>{Object.keys(values.measurementsMm).length} saved lengths</span></summary>
            <p>Optional body notes, not garment dimensions or ease. cm → mm; shoulder slope stays in degrees. No invented defaults or chest/bust and hip/hips substitutions.</p>
            <div className="measurement-grid">{fields.map((field) => {
              const group = field.unit === "degrees" ? "angles" : "lengths";
              return <div className="measurement-field" key={field.key}><label>{field.label}<small>{field.unit === "degrees" ? "degrees · angle" : "cm · body length"}</small>
                <input name={`profile-measure-${field.key}`} type="number" min={field.unit === "degrees" ? "0" : "0.1"} max={field.unit === "degrees" ? "90" : "300"} step="any" inputMode="decimal" value={measurements[group][field.key] ?? ""}
                  onChange={(event) => setMeasurements((current) => ({ ...current, [group]: { ...current[group], [field.key]: event.target.value } }))} /></label>
                {field.helpUrl && <a href={field.helpUrl} target="_blank" rel="noreferrer">Measurement reference ↗</a>}</div>;
            })}</div>
            {other.length > 0 && <p>Other imported length notes retained: {other.map((key) => `${key}: ${measurements.lengths[key]} cm`).join("; ")}. Not aliased to source fields.</p>}
          </details><button className="profile-primary" type="submit" disabled={!dirty && !!profile}>{busy ? "Saving…" : importing ? "Save reviewed backup as new profile revision" : "Save maker profile"} ↗</button></fieldset></form>
        <div className="profile-actions"><button type="button" onClick={reload} disabled={busy}>Discard draft & reload saved profile</button><button type="button" onClick={download} disabled={busy || !profile}>Download private profile ↓</button>
          <label>Review a maker backup<input type="file" accept="application/json,.json" disabled={busy || state !== "ready"} onChange={prepareImport} /></label></div>
        {project && <div className="profile-copy"><p className="companion-kicker">EXPLICIT COPY / {project.title}</p><h3>Bring these notes into this project.</h3>
          <p>Only missing measurements and experience are filled. Tools are added; existing values, fabric and design decisions stay as they are. The saved profile’s name and revision are recorded. This is a snapshot, not a live link.</p>
          {project.plan.profileBasis && <p className="profile-origin">Previous copy: {project.plan.profileBasis.name} #{project.plan.profileBasis.sequence}. {project.plan.experience && `Project experience: ${project.plan.experience}.`}</p>}
          {preview && <div className="profile-copy-preview"><div><h4>Will add</h4>{preview.added.length ? <ul>{preview.added.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No missing values. Only copy provenance will be recorded.</p>}</div><div><h4>Will keep</h4>{preview.retained.length ? <ul>{preview.retained.map((item) => <li key={item}>{item}</li>)}</ul> : <p>All existing project values.</p>}</div></div>}
          {previewError && <p role="alert">{previewError}</p>}<button type="button" className="profile-primary" onClick={copy} disabled={!profile || !preview || dirty || projectDirty || projectBusy || busy}>Copy saved profile into a new project revision ↗</button>
          {(dirty || projectDirty) && <small>Save or discard both drafts before copying. The preview uses the saved profile and saved project.</small>}
        </div>}
        {error && <p className="project-alert" role="alert">{error}</p>}{notice && <p className="project-notice" role="status">{notice}</p>}
      </div></details>
  </section>;
}
function valuesFromProfile(profile: MakerProfile): ProfileValues {
  return { name: profile.name, experience: profile.experience, measurementsMm: profile.measurementsMm,
    ...(profile.measurementsDegrees !== undefined ? { measurementsDegrees: profile.measurementsDegrees } : {}), equipment: profile.equipment };
}
