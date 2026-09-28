# Architecture

This is a recommended design, not a claim that integrations already exist. Official references and review dates are in SOURCES.md.

## Components

```text
React workspace
  -> authenticated Next.js server endpoints
       -> application service / bounded agent tool dispatcher
            -> Sanity repository: authored knowledge + provenance
            -> geometry engine: deterministic drafting + checks
            -> layout engine: feasible fabric placement + assumptions
            -> private project repository: users + immutable revisions
            -> Gemini adapter: interpretation + grounded explanation
```

The browser controls previews and renders SVG. The server owns validation, authorization, provider credentials, operation dispatch, and authoritative acceptance. A local demo adapter implements the same interfaces using fixtures so the UI can be developed without cloud access.

## Stack and code organization

Use Next.js App Router, React, and TypeScript. Keep styling behind named product tokens. SVG is suitable for the initial pattern renderer. Start with ordinary React state/reducers; add state libraries only when a concrete need appears.

Suggested modules after scaffolding: `src/domain/patterns`, `src/domain/proposals`, `src/domain/geometry`, `src/domain/layout`, `src/domain/instructions`, `src/server/knowledge`, `src/server/agent`, `src/server/projects`, and `src/components/studio`. Sanity schemas can live in `sanity/schemaTypes` with a separate editor entry point. Tests should follow module boundaries.

Use runtime validators for Sanity results, API requests, and model outputs. Pin compatible dependency versions and use a lockfile. Production hosting can be decided after the working vertical slice; nothing in this kit publishes a service.

## Sanity

Sanity holds authored pattern versions, piece metadata, seam relations, adjustment rules, instruction steps, fabric requirements, and source records. Use references for dependencies and GROQ projections for exact context retrieval. The server first selects an authorized pattern version, then executes parameterized, allowlisted queries.

A fixture repository and a Sanity repository return the same domain shape. Sanity Studio is the editorial interface. Its form validation does not replace ingestion and server-side validation: Content Lake is not an enforcement boundary for the application's domain invariants.

Sanity Context MCP backed by an actual Knowledge Base is required for the primary Sanity Challenge Path One candidate. The Gemini agent must retrieve applicable source evidence through it, and that evidence must affect the allowed proposal or explanation. Keep exact versioned constraints and reference validation in the bounded Sanity repository; Knowledge Base prose is not an executable rule or numerical authority. Fixtures may unblock local UI development but cannot satisfy the live gate.

Context is read-only and does not run the agent loop. Use Sanity Studio and appropriately scoped editorial operations to maintain authored knowledge. Preserve source IDs, applicable pattern versions, content snapshots, and available Knowledge Base build/retrieval evidence. When content changes, refresh the Knowledge Base to detect changes, review and apply the resulting issues, verify the served entry, and invalidate affected pending proposals. A refresh alone keeps serving the old entry. Keep accepted snapshots reproducible and flag them for review rather than silently redrafting them. Do not imply that a Knowledge Base rebuild is instantaneous or that Context performs writes.

## Gemini

Use the official `@google/genai` SDK. Evaluate `gemini-3.8-flash`, listed as stable in the official model catalog when this brief was prepared. Keep `GEMINI_MODEL` configurable and verify access in the user's project. Do not silently change models.

Use one bounded agent loop rather than multiple agents. Suggested tools:

| Tool | Responsibility |
| --- | --- |
| `get_pattern_context` | Retrieve the allowed version, rules, relationships, and provenance |
| `get_adjustment_options` | Return supported operations, bounds, units, and locks |
| `preview_adjustment` | Invoke a whitelisted engine operation; return a proposal and dependency trail |
| `check_seams` | Return typed numerical results, assumptions, and unresolved constraints |
| `plan_fabric_layout` | Return placement or insufficiency/incomplete-input results |
| `get_instruction_changes` | Return steps and prerequisites affected by this exact revision |

Acceptance is an explicit authenticated application action, not a free-form model tool. Gemini may produce structured intent, call supported tools, ask for missing information, and explain returned results. It cannot supply arbitrary coordinates, executable expressions, database queries, authoritative measurements, or successful checks.

Use the installed SDK's current documented tool-calling flow. Adapt the application JSON schema to the provider's supported subset rather than assuming every JSON Schema keyword is accepted. Validate semantics after parsing: structured output does not establish factual correctness.

For each turn, bound tool count and elapsed time, validate arguments, tie tool calls to the current user and revision, preserve required provider call identifiers, and handle malformed output, cancellation, quota errors, and unavailable tools. Tests should use a deterministic fake provider. Live integration tests require credentials and must be reported separately.

## Geometry and layout

The source of numerical truth is a deterministic, versioned engine. Inputs are normalized units, a supported pattern definition, measurement values, options, and locks. Outputs include coordinates, piece topology, seam paths, notches, cut counts, grain direction, checks, and the exact engine version.

A seam join may require deliberate ease. Compare the intended relationship and tolerance specified by the pattern; do not enforce identical lengths for every seam. Check finite coordinates, path closure, meaningful dimensions, intersections where disallowed, notches, piece pairing, and locked regions.

Evaluate a FreeSewing design behind an adapter, or implement one scoped drafted block with a competent pattern maker. Verify the code and pattern licensing separately. Store named operation IDs and configuration in Sanity, never executable formulas for the model or server to evaluate unchecked.

A first layout engine may seek a feasible arrangement rather than a globally optimal one. Verify full pattern shapes, clearances, grain/nap, cut counts, mirrored/fold treatment, usable width, length, shrinkage, and any defects supplied by the user. If it cannot establish feasibility, return unknown or infeasible with evidence. Do not disguise a rectangle-area estimate as a cutting layout.

## Private data and revisions

Use Supabase Auth/Postgres for `measurement_profiles`, `projects`, `fabric_items`, `project_revisions`, `proposals`, and `instruction_progress`, with owner-scoped policies and tenant-isolation tests. In the local demo, use labeled sample data and local persistence. Never use public Sanity content for personal measurement records.

Every proposal stores its base revision, exact content snapshot/hash, engine version, canonical inputs, locked regions, checks, and assumptions. Accept using an atomic base-revision comparison and idempotency key. A changed project rejects the stale proposal and requires a refreshed preview. Save the original and each accepted snapshot.

Resolve Sanity references into a validated snapshot before invoking the engine. Sanity document `_rev` values are useful evidence but not a substitute for retaining the resolved snapshot: ordinary references can otherwise resolve to newer content later.

## Tests and operating constraints

Test domain invariants, unit conversion, seam-ease constraints, source conflicts, unknown references, proposal staleness, deterministic replay, and privacy isolation. Add browser tests for the main journey and a geometry fixture suite across the supported measurement envelope. Include physical sewing review before advertising cut-ready fit.

Keep Gemini and Sanity credentials server-side. Separate editorial/import write credentials from application read credentials. Use private object storage for personal exports, authorize download URLs, and define deletion behavior. Avoid logging raw measurements or user prompts by default; record request IDs, source IDs, check summaries, provider/model versions, timings, and error classes.

