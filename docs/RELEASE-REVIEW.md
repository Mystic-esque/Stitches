# Local release candidate review

Stitches is a project-aware sewing companion. Review the actual private planning, pattern literacy, construction-learning and scrap-check journey—not gallery size or an imagined drape simulation. No external deployment or submission is authorized. This document prepares a local review; it does not certify release readiness.

**Latest verification (October 4):** the owner reports the production build completed; current typecheck passed and the serial suite passed 141 tests with 3 opt-in skips. The post-fix production Make/API browser rehearsal now passes its v5 private-brief assertion at all five widths. The prior failure is retained as `evidence/making-verification-pre-v5-brief-fix.json`; current pass is `evidence/making-verification.json`. See the Path One reviewer package in `docs/FIRST-SUBMISSION-REVIEW.md`.

## Reproduce

Use Node 22.18+ and the pinned lockfile. From the Stitches directory:

```powershell
pnpm install --frozen-lockfile
node scripts/check-local-env.mjs
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --testTimeout=15000
node node_modules/next/dist/bin/next build --webpack
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
```

Keep `.env.local`, `.data/`, cookies, body notes and provider transcripts private. Credential checks print only presence/format, never values. Viewer access serves exact knowledge; the running app does not need the Editor token. Gemini remains optional, free-tier-only and bounded by the agent runbook. Do not enable billing or change provider/model as a recovery step.

Run these from another terminal while the local production server is running:

```powershell
node scripts/check-making-workspace.mjs
node scripts/check-pattern-board.mjs
node scripts/check-companion-runtime.mjs
node scripts/check-agent-api.mjs
```

These create synthetic guest projects and disposable browser profiles, not real maker evidence. They do not charge Gemini, write Sanity, deploy or submit. Preserve failed receipts rather than editing expected answers. Receipts may overwrite the latest result; retain a dated failure before rerunning when it is material.

## Four reviewer journeys

1. **Understand a garment.** Start Sandy or Tina. Inspect conditional source cut counts, fold, mirroring, material and measurement requirements. Save a working brief. Sandy alone can generate a measured non-cuttable study from its four saved body notes with explicit consent. Inspect affected hem/opening/fold versus preserved waist/band. No Tina geometry substitute, layout or cut-ready download exists.
2. **Study a construction decision.** Open the making notebook. Read the envelope. Explicitly confirm the source version; Tina's optional dart/sleeve/lower-front nodes change the prerequisite path. Preview a later step, observe the checkpoint refusal, then review eligible study checkpoints. Inspect involved source pieces, orientation and unresolved checks. These records describe understanding, not completed physical sewing.
3. **Recover without losing evidence.** At an eligible seam-study step save a puckering question. Its sacrificial-sample check is bound to the exact question, project revision, history head and construction fingerprint. Untested/unchanged observations do not enable the tension comparison; unsuccessful/uncertain results stop repetition. Change the source/brief or making step and verify that the old context cannot authorize a new check. A private pause and exact acknowledged retry work even when source access fails.
4. **Continue privately.** Reload, download a v5 latest-saved-state JSON backup and plain making brief, and restore into a new private project. Making, scrap and saved study records remain imported history, never prerequisite completion, current cutting authority or treatment authority. Old revision snapshots, full draft geometry and resumable provider transcripts are not included. Guest cookie ownership is required; a project ID alone is not recovery authentication.

## Evidence and release gates

| Claim | Evidence | Remaining gate |
| --- | --- | --- |
| Two genuinely distinct candidates | Actual dedicated Sanity Sandy/Tina catalog and piece read-back | Independent source/output rights and pattern qualification |
| Interactive measured pattern understanding | Pinned Sandy redraft tests, saved-study v5 store tests and actual pattern-board save/reopen production rehearsal/screenshots | Complete closure, marks, allowance, placement and physical checks |
| Authored construction learning | 15 exact development records, graph/state tests and current making API/browser rehearsal | Qualified physical procedures; independent maker review |
| Private continuity and recovery | SQLite/owner/replay/restart/backup/import tests; actual lost-acknowledgement rehearsal | Broader security, screen-reader and intended-user assessment |
| Real bounded Gemini + Context | Actual selected Tina-front four-request Gemini/Content Lake/Context receipt plus current 15/15 live KB read | Dynamic tool choice, complete creative maker task and fair benchmark |

Source/reference/license ledger: `evidence/pattern-qualification.md`. Current facts and exact counts: `docs/STATUS.md` and `BUILD_LOG.md`. New KB review: `docs/KB-CONSTRUCTION-REVIEW.md`; full rebuild regrouping is not semantic approval. Check served entries, not only Content Lake or a dashboard success toast.

Before any separately authorized public release: restrict filesystem access to private SQLite/WAL, use persistent storage and stable signing secrets, TLS/secure cookies, retention and backup recovery, per-owner/global inference caps and fail-closed provider flags. This local single-server guest design has no account-based recovery or reviewed multi-tenant hosting architecture. Do not publish the database, credentials, private measurements, photos or live token screenshots. No cloud infrastructure is provisioned here.

## Human evidence still required

Use `docs/MAKER-REVIEW.md` for the source/physical review request. Observe at least three intended users with consent; record actual success, confusion, time and accessibility barriers. Do not invent those observations. Physical printing/making is required for any future cut-ready claim. Until then the useful local software remains explicitly planning/learning/sample-only. Submission stories and demos must retain that distinction; no “enterprise-ready” or “validated fit” claim is supported yet.
