# Local project assistant

Current KB note (October 2): the owner rebuilt the KB into seven grouped entries. The adapter resolves observed planning paths from the actual outline and rejects numeric body citations with unreliable attribution. Page-specific rewrites repaired the two planning pages and construction order/eligibility; actual two-project preparation read tools pass with zero inference. Full editorial verification is 14/15: diagnostic test/remedy IDs remain absent. Earlier actual Gemini receipts remain dated evidence. Making/scrap actions use exact records; diagnostic agent retrieval is not qualified. See KB-CONSTRUCTION-REVIEW.md and KB-PAGE-CORRECTIONS.md.

This is read-only preparation assistance, not qualified making, diagnosis, drafting, cutting or an autonomous save. The project's manual preparation table remains available without Gemini. Production publication is not authorized.

## Configuration

Use Stitches `.env.local` (never commit it). Required server-only credentials: `GEMINI_API_KEY`, `SANITY_READ_TOKEN`, `SANITY_CONTEXT_TOKEN`. Public routing is restricted to project `l4eeamth`, dataset `development`, organization `o3i0aqvqq`, endpoint `stitches-garments`, KB `kbkvu1vrPsLG`. The agent does not need the Editor token.

Only after the owner confirms free-tier access, enable `STITCHES_COMPANION_AGENT_ENABLED=true`, `STITCHES_GEMINI_ZERO_COST_CONFIRMED=true`, `STITCHES_KNOWLEDGE_MODE=sanity-development`, `GEMINI_MODEL=gemini-3.5-flash-lite`. Committed defaults are off. Free-quota availability is determined by actual responses; the flag is authorization, not a quota measurement. No alternative paid model/provider or billing configuration is enabled. Disable the companion flag to stop new inference while retaining saved history/manual work.

Run `npm run dev`, or `npm run build -- --webpack` then `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100`. Open a source-linked project, save the working brief, review the exact minimized summary and consent per run. Own-idea projects retain manual preparation but are not silently matched to an arbitrary source.

## Persistence and recovery

- Private `.data/stitches-guest.sqlite` holds guest projects, runs, attempted-request ledger and signed Gemini history. Treat it as private; use restrictive filesystem access and a persistent local volume for any separately authorized deployment. Standard version-4 project exports do **not** include provider transcripts or resumable agent runs. Do not publish the database, environment file or cookie. A lost guest cookie means these records cannot be recovered through an unauthenticated project ID.
- A run start saves consent and basis without inference. Each advance reserves at most one request transactionally. The SDK's pinned `retryOptions.attempts=1` means one initial attempt, zero retries. Four attempted requests/run, 120 active seconds, 8 reserved attempts/guest/day and 16/local database/day. UTC daily counts persist through process restart. Failures still consume reservations; these conservative caps are not a provider billing guarantee.
- Only `inspect_project`, `resolve_exact_graph`, `retrieve_context` are exposed to this provider task. Source, project and history are rechecked around operations. Before accepting final prose, reread the actual KB and compare its text hash. No model-selected URLs, IDs, queries or write tools.
- Reload never sends an inference request. Continue requires an explicit action. Known quota rejection can continue only within remaining original bounds. A saved response can repeat a failed **read**, without another model request. Lost/timeout/in-flight provider outcomes become `unknown_outcome`; no automatic or resume retry is allowed. Cancel and changed basis defeat late worker results.
- A 40-second continuation lease (or shorter remaining active allowance) bounds a tick. An expired request lease becomes unknown; an expired acknowledged-response lease can recover its non-charging read. Pauses between ticks do not consume active time. Source changes and physical notes are never rewritten to fit an old answer.

## Construction notebook and backup

Open a saved Sandy or Tina project and confirm the version in the making notebook. Tina's explicit dart, sleeve and lower-front choices resolve the authored prerequisite path. Review eligible learning checkpoints or record a current-step question; only seam-eligible steps offer the source-linked scrap check. These pending records track study, not physical sewing. Source outage removes new advice but preserves private history and pause. A current-step diagnostic cannot move to another step silently.

`node scripts/check-making-workspace.mjs` checks actual production API and disposable Chrome with synthetic guests: owner/origin/input bounds, optional prerequisites, source/current-step bindings, v4 import, native keyboard, lost-save acknowledgement and receipt replay, five widths, source interruption/recovery and private brief download. It makes zero model requests and Sanity writes. Version-4 project backups take saved project/notes/diagnostic/making histories from one transaction; restored events remain historical. v1–v3 imports remain supported. They do not include provider transcripts, old revisions or generated pattern artifacts.

## Verification

### Manual measured pattern study (zero inference)

Open an actual Sanity-linked Sandy project, save its four exact body notes and save/discard any current edits. Under “The pattern, connected / measured study,” explicitly consent to a local non-cuttable draft. Inspect named edges/marks, fold/grain/count and source-linked pending study steps; compare original/redrafted length and inspect the numerical impact. Body values stay in the private guest runtime, not Gemini or shared Sanity. This research command does not keep a variation, approve sewing instructions or enable a cutting download. Tina receives no substituted geometry. A lost cookie, unavailable/stale source or missing notes stops the dependent study while leaving manual preparation usable. Studies regenerate on request; they are not durable approved artifacts in backups.

Production verification: `node scripts/check-pattern-board.mjs` checks actual local API plus disposable Chrome, two synthetic measurement inputs, private owner/Origin/bounds/stale refusals, exact edge/step inspection, five widths, targeted contrast/reduced-motion and an explicitly injected transport fault followed by actual recovery. Zero inference and zero Sanity writes. Receipt and screenshots live under `evidence/pattern-board-verification.json` and `evidence/screenshots/pattern-board`. `src/server/patterns/FREESEWING-LICENSE.txt` preserves upstream code attribution; independent rights and physical qualification remain release gates.


`node node_modules/vitest/vitest.mjs run --maxWorkers=2 --testTimeout=15000` is deterministic; opt-in live tests skip by default. `node --env-file=.env.local node_modules/vitest/vitest.mjs run --maxWorkers=1 src/server/agent/run-live.test.ts` requires `STITCHES_LIVE_AGENT_RUN=true` and uses at most four actual model attempts. Optional `STITCHES_LIVE_AGENT_DESIGN=tina` / `STITCHES_LIVE_AGENT_INTERRUPT=true` rehearses a clearly labeled **injected local Context transport failure**, then actual retrieval and saved-response recovery. It is not evidence of a Sanity service outage or a physical sewing trial. Private synthetic rehearsal state stays under `.data/rehearsals`; redacted receipts are under `evidence`.

`node scripts/check-companion-runtime.mjs` checks actual local Chrome UI at five widths. Its assistant branch checks real consent preview, private start, cancel and reload with **zero inference**, not a scripted model answer. Local child-process permission may be required for Vite/Chrome on Windows; EPERM is not a passed app test.

`node scripts/check-agent-api.mjs` rehearses strict consent, guest/Origin isolation, minimized preview, start replay/conflict, cancellation and stale-plan controls against the running production API and actual development catalog. It creates only synthetic private guest records and never advances a model request. Use the separate opt-in live test for actual provider proof.
