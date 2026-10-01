"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { projectBackupSchema, type GuestProject, type ProjectNote, type ProjectPlan, type ProjectSource } from "@/domain/guest-project";

const starts = [
  { id: "sandy", name: "The circle skirt", kind: "Woven · skirt", image: "/images/circle-skirt.png", caption: "A full silhouette from measured curves", question: "Waistband, fabric width and fold layout" },
  { id: "tina", name: "The wrap top", kind: "Knit · top", image: "/images/wrap-top.png", caption: "Overlapping fronts and soft stretch", question: "Stretch, notches and front options" },
] as const;
function startFor(source: ProjectSource) {
  if (source.kind !== "candidate") return null;
  const id = source.designId;
  return starts.find((item) => item.id === id) ?? null;
}

type Draft = { title: string; brief: string; features: string; questions: string; equipment: string; fabric: string; width: string; length: string; structure: ProjectPlan["fabric"]["structure"]; waist: string; bust: string; hip: string };
const lines = (value: string) => [...new Set(value.split(/\r?\n/).map((part) => part.trim()).filter(Boolean))];
const cm = (value?: number) => value === undefined ? "" : String(value / 10);
const mm = (value: string) => { const number = Number(value); return value.trim() && Number.isFinite(number) && number > 0 ? Math.round(number * 10) : undefined; };
function draftFor(project: GuestProject): Draft {
  const plan = project.plan;
  return { title: project.title, brief: project.brief, features: plan.features.join("\n"), questions: plan.openQuestions.join("\n"), equipment: plan.equipment.join("\n"), fabric: plan.fabric.description, width: cm(plan.fabric.widthMm ?? undefined), length: cm(plan.fabric.lengthMm ?? undefined), structure: plan.fabric.structure, waist: cm(plan.measurementsMm.waist), bust: cm(plan.measurementsMm.bust), hip: cm(plan.measurementsMm.hip) };
}
function planFor(draft: Draft): ProjectPlan {
  const measurementsMm: Record<string, number> = {};
  for (const field of ["waist", "bust", "hip"] as const) { const value = mm(draft[field]); if (value) measurementsMm[field] = value; }
  return { features: lines(draft.features), openQuestions: lines(draft.questions), equipment: lines(draft.equipment), measurementsMm, fabric: { description: draft.fabric.trim(), widthMm: mm(draft.width) ?? null, lengthMm: mm(draft.length) ?? null, structure: draft.structure } };
}
async function json(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "This request could not be completed.");
  return data;
}

export function CompanionHome() {
  const [projects, setProjects] = useState<GuestProject[]>([]);
  const [active, setActive] = useState<GuestProject | null>(null);
  const [revisions, setRevisions] = useState<GuestProject[]>([]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteKind, setNoteKind] = useState<"journal" | "question">("journal");
  const [noteStage, setNoteStage] = useState<"plan" | "prepare" | "make" | "check">("plan");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newSource, setNewSource] = useState<ProjectSource | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");

  const open = useCallback(async (id: string) => {
    try {
      setError(""); setNotice("");
      const data = await json(await fetch(`/api/projects/${encodeURIComponent(id)}`, { cache: "no-store" }));
      setActive(data.project); setDraft(draftFor(data.project)); setRevisions(data.revisions); setNotes(data.notes);
      window.history.pushState({}, "", `/?project=${encodeURIComponent(id)}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Project unavailable."); }
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await json(await fetch("/api/projects", { cache: "no-store" }));
        if (!mounted) return;
        setProjects(data.projects);
        const id = new URLSearchParams(window.location.search).get("project");
        if (id) await open(id);
      } catch (cause) { if (mounted) setError(cause instanceof Error ? cause.message : "Projects unavailable."); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [open]);

  function begin(source: ProjectSource) {
    setNewSource(source);
    setNewTitle(source.kind === "candidate" ? starts.find((item) => item.id === source.designId)?.name ?? "New project" : "");
    setNewBrief(""); setError(""); setNotice("");
    window.setTimeout(() => document.getElementById("new-project-title")?.focus(), 0);
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!newSource || busy) return;
    setBusy(true); setError("");
    try {
      const data = await json(await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, brief: newBrief, source: newSource, idempotencyKey: crypto.randomUUID() }) }));
      setProjects((current) => [data.project, ...current]); setNewSource(null); setActive(data.project); setDraft(draftFor(data.project)); setRevisions([data.project]); setNotes([]);
      window.history.pushState({}, "", `/?project=${data.project.id}`);
      setNotice("Project saved privately in this browser's guest workspace.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create project."); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!active || !draft || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await json(await fetch(`/api/projects/${active.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: draft.title, brief: draft.brief, plan: planFor(draft), expectedSequence: active.sequence, expectedBasisHash: active.basisHash, idempotencyKey: crypto.randomUUID() }) }));
      setActive(data.project); setDraft(draftFor(data.project)); setRevisions((current) => [...current, data.project]);
      setProjects((current) => current.map((item) => item.id === data.project.id ? data.project : item));
      setNotice(`Revision ${data.project.sequence} saved. Earlier versions remain available.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save project."); }
    finally { setBusy(false); }
  }
  const back = () => { setActive(null); setDraft(null); setRevisions([]); setNotes([]); setError(""); setNotice(""); window.history.pushState({}, "", "/"); };
  const update = (field: keyof Draft, value: string) => setDraft((current) => current ? { ...current, [field]: value } : current);

  function downloadBackup() {
    if (!active) return;
    const backup = projectBackupSchema.parse({ format: "stitches-project-backup", version: 2, title: active.title, brief: active.brief, source: active.source, plan: active.plan,
      notes: notes.map(({ kind, stage, text, basisSequence, basisHash, createdAt, importedFromSequence }) => ({
        kind, stage, text, basisSequence: importedFromSequence ?? basisSequence, basisHash, createdAt,
      })) });
    const href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = href; link.download = `stitches-${active.id.slice(0, 8)}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    try {
      if (file.size > 4_000_000) throw new Error("Choose a Stitches backup smaller than 4 MB.");
      const backup = projectBackupSchema.parse(JSON.parse(await file.text()));
      setBusy(true);
      const data = await json(await fetch("/api/projects/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ backup, idempotencyKey: crypto.randomUUID() }) }));
      setProjects((current) => [data.project, ...current]); setActive(data.project); setDraft(draftFor(data.project)); setRevisions([data.project]); setNotes(data.notes);
      window.history.pushState({}, "", `/?project=${data.project.id}`);
      setNotice("Backup imported as a new private project, including its journal. Original revision snapshots are not included.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not import backup."); }
    finally { setBusy(false); }
  }

  async function recordNote() {
    if (!active || !draft || JSON.stringify(draft) !== JSON.stringify(draftFor(active)) || !noteText.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await json(await fetch(`/api/projects/${active.id}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: noteKind, stage: noteStage, text: noteText,
          expectedProjectSequence: active.sequence, expectedBasisHash: active.basisHash, idempotencyKey: crypto.randomUUID() }),
      }));
      setNotes((current) => [...current, data.note]); setNoteText("");
      setNotice("Private note saved against this project revision.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save note."); }
    finally { setBusy(false); }
  }

  const unsavedChanges = !!(active && draft && JSON.stringify(draft) !== JSON.stringify(draftFor(active)));
  return <div className="companion-app">
    <header className="companion-nav"><a href="/" className="companion-logo" aria-label="Stitches home">stitches<span>.</span></a><nav aria-label="Main navigation"><a href="/#how-it-works">How it works</a><a href="/#collection">Explore starts</a><a href="/demo">Pattern study ↗</a></nav><button type="button" onClick={() => active ? back() : document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })} className="nav-action">{active ? "All projects" : "Start making"} ↗</button></header>
    {active && draft ? <main className="companion-project">
      <div className="project-topline"><button type="button" onClick={back}>← All projects</button><span>Private guest project · revision {active.sequence}</span><button type="button" onClick={downloadBackup}>Download latest-state backup ↓</button></div>
      <div className="project-head"><div><p className="companion-kicker">YOUR MAKING COMPANION / 01</p><h1>{active.title}</h1><p>Carry your idea, materials and decisions in one place. Every save becomes a reviewable revision.</p></div><span className="capability-chip">Planning only · no cutting yet</span></div>
      <div className="project-workspace"><aside className="project-rail" aria-label="Project stages"><p className="rail-caption">THE JOURNEY</p><ol><li className="current"><b>01</b><span>Plan your idea<small>Available now</small></span></li><li><b>02</b><span>Understand the pattern<small>Qualification in progress</small></span></li><li><b>03</b><span>Cut with confidence<small>Not yet verified</small></span></li><li><b>04</b><span>Make & troubleshoot<small>Not yet verified</small></span></li></ol><a href="/demo">Explore the pattern study ↗</a></aside>
        <form className="project-form" onSubmit={save}><div className="form-intro"><p className="companion-kicker">THE WORKING BRIEF</p><h2>Make it yours, one decision at a time.</h2><p>Describe what you want to make. Stitches keeps constraints together while drafting and making tools are verified.</p></div>
          <div className="field-row"><label>Project name<input value={draft.title} maxLength={100} required onChange={(event) => update("title", event.target.value)} /></label><label>Fabric structure<select value={draft.structure} onChange={(event) => update("structure", event.target.value)}><option value="unknown">Not sure yet</option><option value="woven">Woven</option><option value="knit">Knit / stretch</option></select></label></div>
          <label>What are you hoping to make?<textarea value={draft.brief} maxLength={1500} rows={4} placeholder="A loose summer skirt from the linen I already have…" onChange={(event) => update("brief", event.target.value)} /></label>
          <div className="form-divider">01 / DESIGN DECISIONS</div><div className="field-row"><label>Features you want<small>One per line</small><textarea value={draft.features} rows={4} placeholder={"Midi length\nDeep pockets"} onChange={(event) => update("features", event.target.value)} /></label><label>Things to resolve<small>One per line</small><textarea value={draft.questions} rows={4} placeholder={"Will this fit my fabric width?\nCan I sew without an overlocker?"} onChange={(event) => update("questions", event.target.value)} /></label></div>
          <div className="form-divider">02 / WHAT YOU HAVE</div><label>Fabric notes<input value={draft.fabric} maxLength={180} placeholder="Cotton-linen, soft hand, prewashed" onChange={(event) => update("fabric", event.target.value)} /></label><div className="field-row"><label>Fabric width <small>cm · optional</small><input type="number" min="10" max="500" step="0.1" value={draft.width} onChange={(event) => update("width", event.target.value)} /></label><label>Fabric length <small>cm · optional</small><input type="number" min="10" max="5000" step="0.1" value={draft.length} onChange={(event) => update("length", event.target.value)} /></label></div><label>Tools available <small>One per line</small><textarea value={draft.equipment} rows={3} placeholder={"Basic sewing machine\nIron"} onChange={(event) => update("equipment", event.target.value)} /></label>
          <div className="form-divider">03 / MEASUREMENTS</div><p className="field-help">Optional planning notes in centimeters. These do not generate or validate a pattern yet.</p><div className="field-row three"><label>Waist<input type="number" min="1" max="300" step="0.1" value={draft.waist} onChange={(event) => update("waist", event.target.value)} /></label><label>Bust<input type="number" min="1" max="300" step="0.1" value={draft.bust} onChange={(event) => update("bust", event.target.value)} /></label><label>Hip<input type="number" min="1" max="300" step="0.1" value={draft.hip} onChange={(event) => update("hip", event.target.value)} /></label></div>
          {error && <p className="project-alert" role="alert">{error}</p>}{notice && <p className="project-notice" role="status">{notice}</p>}<div className="save-row"><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save this revision"} ↗</button><small>Saved on this local server · no account</small></div>
          <section className="maker-journal" aria-labelledby="journal-heading"><div className="form-divider">04 / MAKER JOURNAL</div><h3 id="journal-heading">Remember what happened, not just what you planned.</h3><p>Keep a private observation or question beside this exact saved revision. Earlier notes stay visible when your plan changes; they are not sewing instructions or verified advice.</p><div className="field-row"><label>Entry type<select value={noteKind} onChange={(event) => setNoteKind(event.target.value as "journal" | "question")}><option value="journal">Observation</option><option value="question">Question to resolve</option></select></label><label>Where are you?<select value={noteStage} onChange={(event) => setNoteStage(event.target.value as "plan" | "prepare" | "make" | "check")}><option value="plan">Planning</option><option value="prepare">Preparing</option><option value="make">Making</option><option value="check">Checking result</option></select></label></div><label>Your note<textarea value={noteText} maxLength={1000} rows={3} placeholder="I tested a sample seam, and the fabric puckered…" onChange={(event) => setNoteText(event.target.value)} /></label><button className="journal-add" type="button" disabled={busy || unsavedChanges || !noteText.trim()} onClick={recordNote}>Add to journal ↗</button>{unsavedChanges && <small className="journal-warning">Save your plan changes first so this note points to the right revision.</small>}<small className="journal-disclosure">Stored on this local server for this guest browser. Latest-state backup includes journal entries, but not old revision snapshots.</small><ol className="journal-list">{notes.slice().reverse().map((note) => <li key={note.id}><div><strong>{note.kind === "question" ? "Question" : "Observation"} · {note.stage}</strong><small>{note.importedFromSequence ? `Imported source revision #${note.importedFromSequence}` : note.basisHash === active.basisHash && note.basisSequence === active.sequence ? `Current revision #${note.basisSequence}` : `Earlier revision #${note.basisSequence}`}</small></div><p>{note.text}</p><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time></li>)}</ol>{notes.length === 0 && <p className="journal-empty">Your first entry will appear here.</p>}</section>
        </form><aside className="project-notes"><div className="note-card"><p className="companion-kicker">SOURCE</p><h3>{startFor(active.source)?.name ?? "Your own idea"}</h3><p>{active.source.kind === "candidate" ? "A distinct design candidate, not an approved printable pattern. We are testing geometry, instructions and rights before enabling cutting." : "Record your concept now. Photo analysis and drafting are not yet enabled."}</p></div><div className="note-card dark"><p className="companion-kicker">HONEST CAPABILITY</p><h3>Not a pattern file. Yet.</h3><p>Measurements and fabric notes are planning inputs. Do not cut fabric from the editorial images or illustrative demo.</p></div><div className="note-card"><p className="companion-kicker">REVISION TRAIL</p><strong>{active.plan.features.length} features · {active.plan.openQuestions.length} open questions</strong><ol className="revision-list">{revisions.slice().reverse().map((item) => <li key={item.sequence}><b>#{item.sequence}</b><span>{new Date(item.updatedAt).toLocaleString()}</span></li>)}</ol><p>Earlier snapshots are preserved on this server. Download exports the latest state only.</p></div></aside></div>
    </main> : <main><section className="companion-hero"><Image src="/images/atelier-hero.png" fill priority sizes="100vw" alt="Sewing workroom with a garment on a dress form and paper pattern pieces on a table" /><div className="hero-shade" /><div className="hero-content"><p className="companion-kicker">THE SEWING COMPANION</p><h1>From “I could make that”<br />to <em>“I made it.”</em></h1><p>Stitches connects the garment you imagine to the pieces, decisions and steps needed to make it — beginning with a project that remembers your plan.</p><button type="button" onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}>Explore your starting point ↗</button><small>For curious beginners, hobby makers and designers.</small></div><div className="hero-foot"><span>01 / IMAGINE</span><span>02 / UNDERSTAND</span><span>03 / MAKE</span><span>↓ EXPLORE</span></div></section>
      <section className="companion-intro" id="how-it-works"><p className="companion-kicker">WHY STITCHES EXISTS</p><div><h2>Clothing is a collection of decisions.<br /><em>Let’s make them visible.</em></h2><p>A finished garment is only the beginning. The pieces, fabric, fit and order of construction determine what you can actually make. Stitches is being built to keep those relationships connected — and help you learn as you go.</p></div></section>
      <section className="companion-collection" id="collection"><div className="collection-heading"><div><p className="companion-kicker">START A PROJECT</p><h2>Where will you begin?</h2><p>Choose a distinct garment direction or bring your own idea. These are planning starts while the pattern engines are qualified.</p></div><span>01—03 / PROJECT STARTS</span></div><div className="collection-grid">{starts.map((item, index) => <article className="collection-card" key={item.id}><div className="collection-image"><Image src={item.image} fill sizes="(max-width: 800px) 100vw, 33vw" alt={`Editorial concept of ${item.name}`} /><span>0{index + 1} / {item.kind}</span></div><div className="collection-copy"><h3>{item.name}</h3><p>{item.caption}</p><small>{item.question}</small><button type="button" onClick={() => begin({ kind: "candidate", designId: item.id })}>Start this project ↗</button></div></article>)}<article className="collection-card own"><div className="own-art"><span>✳</span><p>What do you<br />want to make?</p></div><div className="collection-copy"><h3>Your own idea</h3><p>A photo, a sketch, or something you pictured.</p><small>Record your brief now. Image analysis is a future verified capability.</small><button type="button" onClick={() => begin({ kind: "own_idea" })}>Begin with an idea ↗</button></div></article></div><p className="collection-caption">Editorial concept images only. No card represents a verified cut-ready pattern or fit preview.</p></section>
      <section className="companion-projects"><div><p className="companion-kicker">PICK UP A THREAD</p><h2>Your projects</h2><p>Saved in this guest browser session on this local server. Keep this browser’s cookie to reopen them.</p><label className="import-backup">Import a Stitches backup<input type="file" accept="application/json,.json" onChange={importBackup} disabled={busy} /></label></div>{loading ? <p>Loading projects…</p> : projects.length ? <div className="project-card-list">{projects.map((project) => <button type="button" key={project.id} onClick={() => open(project.id)}><span><strong>{project.title}</strong><small>{startFor(project.source)?.kind ?? "Your own idea"} · revision {project.sequence}</small></span><span>Open ↗</span></button>)}</div> : <p className="empty-projects">No projects yet. Choose a starting point above and make the first decision.</p>}{error && <p className="project-alert" role="alert">{error}</p>}</section>
      <section className="companion-demo-bridge"><p className="companion-kicker">INSIDE THE PATTERN</p><h2>Curious how pieces become a garment?</h2><p>Explore the existing, explicitly illustrative pattern study. It links a garment, flat pieces, and a Sanity-backed construction explanation.</p><a href="/demo">Open the pattern study ↗</a></section></main>}
    {newSource && <div className="new-project-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewSource(null); }}><div className="new-project-dialog" role="dialog" aria-modal="true" aria-labelledby="new-project-heading"><button className="dialog-close" type="button" onClick={() => setNewSource(null)} aria-label="Close">×</button><p className="companion-kicker">A NEW THREAD</p><h2 id="new-project-heading">Tell us what you want to make.</h2><p>Start with a brief. You can add fabric, measurements and open questions in your project.</p><form onSubmit={create}><label>Project name<input id="new-project-title" value={newTitle} maxLength={100} required placeholder="My summer skirt" onChange={(event) => setNewTitle(event.target.value)} /></label><label>What do you have in mind?<textarea value={newBrief} maxLength={1500} rows={4} placeholder="I want a skirt I can sew from the linen I already own…" onChange={(event) => setNewBrief(event.target.value)} /></label>{error && <p className="project-alert" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy ? "Creating…" : "Create my project"} ↗</button></form><small>No account required. This starts a planning project, not a printable pattern.</small></div></div>}
    <footer className="companion-footer"><span className="companion-logo">stitches<span>.</span></span><p>See how it’s made. Make it yours.</p><span>Local development preview</span></footer>
  </div>;
}
