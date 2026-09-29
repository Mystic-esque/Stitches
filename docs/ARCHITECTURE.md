# Architecture — Stitches Studio 1.0

This is the current target architecture, not a claim about implemented code. The normative contracts are devpost/spec.md C01–C10. Current verified behavior remains in STATUS.md.

## One project, connected representations

A shared immutable design basis connects the garment preview, flat pieces, seam checks, cutting layout, making steps and export. A feature cannot be accepted just because one representation looks right.

```text
Sanity Content Lake ── exact graph + versioned rules ─┐
Sanity Context KB ─── maintained explanatory sources ├─ Server application services
Guest measurements/options/fabric ─────────────────┘       │
                         registered deterministic tools ← Gemini bounded planner
                                      │
                       proposal + checks + consequence report
                                      │ explicit user keep
                    immutable guest revision + artifact manifest
                       │             │              │
                2D / 3D views   cutting layout   steps / export
```

The model chooses supported tools and explains their results; it never determines numerical validity or performs unchecked operations. Three.js displays educational construction, not physical drape.

## Trust and storage boundaries

- Browser: UI state, camera, selected piece, provisional interaction. No Sanity/Gemini secrets.
- Server: guest isolation, fixed queries, schema validation, source bindings, geometry and layout authority, bounded execution, atomic acceptance and private artifacts.
- Local transactional SQLite: hashed opaque guest sessions, projects/revisions/proposals, measurement/fabric input, progress, run checkpoints, manifests. Do not reuse the global demo JSON store for actual guests.
- Sanity development: shared garment/pattern/method/instruction/source records only. No private measurements or reference photos.
- Context KB-only MCP endpoint: maintained guidance. Exact Content Lake reads use a separate fixed-query adapter. Different retrieval roles must remain observable.
- Private temporary upload storage: validated photo bytes with expiry; no Sanity upload or implicit long-term retention.
- Pattern/preview adapters: pinned, licensed, complete artifacts with stable piece and edge IDs and honest review status.

## Existing code: preserve the useful foundation

The exact resolver, Content Lake and Context adapters, assembly conflict checks, Gemini signed-message handling, and stale/immutable test ideas are reusable. The shoulder-fragment module and garment SVG are illustrative; new engine qualification is required. Existing fixture/live modes remain distinct during migration.

## Change propagation

Relevant source, measurements, option, fabric or equipment change → compute semantic basis → invalidate dependent receipts → regenerate/check → show consequences → deliberate keep. Keep previous accepted artifacts immutable. Content changes may update discoverable guidance but never silently rewrite what a person has already cut or sewn.

Editorial impact detection is a pure local service first, with a prepared Sanity Function wrapper. Until separate deployment approval, compare fingerprints on requests and rehearse events locally. A Function deployment is not needed to claim local correctness.

## Guest-first, no authentication product

No signup, identity provider, billing or cloud account workflow. An opaque HttpOnly guest cookie isolates local workspace state. Provide explicit backup/import and honest device/browser persistence copy. Test cross-guest access and stale multi-tab mutations. A public release needs a compatible persistent server/database and retention policy; do not deploy SQLite to an ephemeral host by accident.

## Target module boundaries

UI routes and components / pure domain geometry-layout-instructions / application services / provider adapters / guest repository / artifact generation / editorial impact. See spec File structure for paths and SOL_HANDOFF for current-file migration.

Do not add a vector database, arbitrary model shell, hosted orchestration framework or alternate paid model to compensate for missing domain tools.

