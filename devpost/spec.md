---
doc: spec
status: approved
---

# Stitches — Technical Spec

## How This Works, In Plain Language

Sanity holds the reviewed pattern, its pieces, joins, adjustment rules, sewing instructions, and the sources behind them. Its Knowledge Base gives the agent a navigable explanation of applicable knowledge. The application also reads the exact current pattern records, because a summary cannot prove a seam length or authorize an operation. Gemini interprets the maker's request and asks for one of a small set of permitted actions. A separate drafting engine calculates the proposed pieces and checks them. The maker sees the result and decides whether to keep it. The server saves each accepted version and refuses a proposal whose pattern or knowledge has changed since it was prepared.

When an editor corrects a rule, Sanity retains the authored change. A Knowledge Base refresh detects it; an editor reviews and applies the resulting issues before the new entry is served. Stitches checks the new evidence and current records before making another proposal. Earlier accepted versions keep their original evidence and gain a review notice if affected.

This separation is the answer to the learner's expressed Sanity question: Context is a read-only window into maintained knowledge; the linked Content Lake records supply exact constraints; the application owns the agent loop, geometry, and project revisions. See [Sanity Context](https://www.sanity.io/docs/ai/sanity-context), [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools), and [Knowledge Base maintenance](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base).

## The Core Journey Through the System

1. The worktable loads the local demo project and the selected reviewed pattern version. The server obtains a bounded, validated Sanity snapshot; fixture mode uses the same shape and is visibly labeled. The browser renders the accepted SVG and next action. Implements `prd.md > Pattern and Project Context`.
2. The maker enters a shoulder request. The server first checks the project revision, measurements, and allowed operation. The Gemini adapter can read a relevant Context Knowledge Base entry and call only registered application tools. A direct, parameterized Sanity read supplies exact rule and relationship records. Missing or conflicting evidence stops the proposal. Implements `prd.md > Fit Proposal and Explanation`.
3. The deterministic engine drafts the change, checks the locked neckline and related seams, and returns coordinates, check results, source IDs, and a proposal ID. The canvas overlays original and proposed pieces; the inspector explains each affected object. Implements `prd.md > Fit Proposal and Explanation`.
4. Acceptance goes to the server, which compares the proposal's base revision and content fingerprint with the current project and reviewed content. A mismatch returns stale. A match saves one immutable accepted snapshot and marks dependent fabric and instruction results for review. Implements `prd.md > Revision Acceptance and Dependency Status` and `Fabric and Sewing Consequences`.
5. An editor changes an applicable Sanity record. The Knowledge Base detects the source change, its issues are reviewed and applied, and the served entry is checked. Repeating the request retrieves the new knowledge and records; an earlier open proposal is stale, while an accepted snapshot stays intact. Implements `prd.md > Maintained Knowledge Demonstration`.

## Stack

- [Next.js App Router](https://nextjs.org/docs/app) with React and TypeScript for the worktable and server routes. The project handoff selected this stack; use a Node.js runtime for provider calls and local demo persistence. Pin compatible installed versions and the lockfile when scaffolding.
- [Sanity Studio and Content Lake](https://www.sanity.io/docs/studio) for editorial records; [@sanity/client](https://www.sanity.io/docs/apis-and-sdks/js-client-querying) for allowlisted, parameterized reads; actual [Context MCP](https://www.sanity.io/docs/ai/sanity-context-mcp) in Knowledge Base mode for agent retrieval. Studio schema deployment is needed if a GROQ-mode Context endpoint is later used; the primary Knowledge Base endpoint is configured with Knowledge Base sources only.
- [Google GenAI SDK](https://ai.google.dev/gemini-api/docs/function-calling) for a server-only bounded tool loop. Start with `gemini-3.8-flash`, as the owner requested. A `gemini-3.7-flash` fallback requires an explicit access and quality check; no paid model or provider spend is authorized. Verify model availability with the supplied key before a live claim.
- SVG rendering and a pure TypeScript geometry engine. A FreeSewing adapter is a candidate only after confirming its specific design, license, adjustment behavior, and testability. The handoff's illustrative SVG formulas are not the engine.
- Runtime schemas at API, Sanity, and model boundaries; [Vitest](https://vitest.dev/guide/) for domain and adapter contracts; [Playwright](https://playwright.dev/docs/intro) for the maker journey and responsive checks. Pin versions during the build.
- A local, server-owned demo project store for sample measurements, proposals, revisions, and sewing progress. It is single-user and bound to local development. The planned private multi-user service remains the separate Supabase milestone.

## Where It Runs and How Someone Tries It

The application is planned to run locally on Node.js. After the build adds and verifies scripts, install with `npm install`, start with `npm run dev`, and open `http://localhost:3000`. Start the local editorial interface with `npm run studio` and open its documented local URL. These are planned commands, not yet verified commands; `docs/STATUS.md` will record the actual versions, URLs, and results once the application exists.

Fixture mode needs no credentials and is clearly marked illustrative. Live mode requires a dedicated Stitches Sanity project/dataset or an explicitly selected Stitches-only dataset, reviewed content, a built Knowledge Base and MCP endpoint, an organization Context Viewer token, a project read token if the dataset is private, and a Gemini key. A public deployment has not been authorized. For Devpost Basics, a short working demo video and a public repository are required; a live deployment is optional. Sanity Path One requires a DEV entry and the Sanity project ID or public dataset URL. See [Devpost event](https://learn-ai-basics.devpost.com/) and [Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16).

## Look and Feel

Carry forward `prd.md > Look and Feel`: warm linen surfaces, olive actions, terracotta change marks, restrained panel chrome, editorial serif headings, and a practical sans-serif for controls. Build named CSS tokens from `docs/DESIGN.md`, use the supplied reference as visual guidance, and keep the pattern larger than the agent panel. Add text and line-style labels for original versus proposal, visible keyboard focus, adequate mobile targets, and reduced-motion behavior.

## Components

### Worktable and Stage Navigation

Shows the selected project, exact pattern/accepted revision, readiness label, and Fit / Fabric / Sew stages. The local store restores sample progress after restart. Implements `prd.md > Pattern and Project Context` and `Screens and Layout`.

### Pattern Canvas and Piece Inspector

Renders engine-owned SVG paths, an original/proposed overlay, grain and piece labels, selection, and the relationship/source trail for the selected piece. It never treats a rendered outline as proof of sewability. Implements `prd.md > Fit Proposal and Explanation` and `Look and Feel`.

### Proposal Controls

Accepts bounded manual input or a natural-language request, shows interpreted units and neckline lock, and presents one explicit “Keep this version” action. The server returns clarification, unsupported, pending, checked, or stale states. Implements `prd.md > Fit Proposal and Explanation` and `Revision Acceptance and Dependency Status`.

### Fabric and Sewing Panels

Fabric shows usable width/length, assumptions, and feasible/insufficient/unknown results. A true feasible result requires a verified placement; otherwise unknown is shown. Sew selects steps for the accepted revision, marks affected steps for review, and stores demo progress. Implements `prd.md > Fabric and Sewing Consequences`.

### Sanity Editorial Surface

Sanity Studio edits linked pattern and source records with form validation and review status. A demonstrated correction updates the dataset; the Knowledge Base is refreshed and its resulting issues applied before a changed retrieval is claimed. Implements `prd.md > Maintained Knowledge Demonstration`.

### Sanity Snapshot Repository

Runs fixed, parameterized GROQ projections for the selected pattern version and resolves references into a bounded validated snapshot. Rejects broken, conflicting, cross-version, or unreviewed required records. Produces a canonical fingerprint from relevant content. Implements `prd.md > Pattern and Project Context`, `Fit Proposal and Explanation`, and `Maintained Knowledge Demonstration`.

### Context Knowledge Base Adapter

Connects to the Stitches Knowledge Base MCP endpoint with an organization token. Reads `initial_context` and relevant entries with `knowledge_base_read`; records KB ID, entry paths, source provenance, and retrieval outcome. No result from a fixture counts as a live Context call. Implements `prd.md > Fit Proposal and Explanation` and `Maintained Knowledge Demonstration`.

### Gemini Agent and Tool Dispatcher

One bounded loop presents the maker request and selected version to Gemini, validates function calls, and runs only whitelisted application tools. It can ask for clarification and explain actual tool results; it cannot send arbitrary GROQ, JavaScript, coordinates, or an acceptance command. Implements `prd.md > Fit Proposal and Explanation` and `States and Boundaries`.

### Geometry and Check Engine

An authorized pattern adapter accepts normalized measurements, operation ID, amount, and locks. It returns versioned coordinates, seams, notches, affected pieces, and explicit pass/fail/unknown checks. Validate the full supported measurement envelope and fail closed on unsupported cases. Implements `prd.md > Fit Proposal and Explanation`.

### Revision Service and Local Demo Store

Stores the initial and accepted snapshots, proposals, content fingerprints, and an idempotency key. The server enforces acceptance and staleness; its local single-user store is replaceable by an owner-scoped private adapter in the later account milestone. Implements `prd.md > Revision Acceptance and Dependency Status` and `States and Boundaries`.

## Data Model

Sanity records follow `docs/CONTENT-MODEL.md`: `pattern`, `patternVersion`, `patternPiece`, `seamConnection`, `adjustmentRule`, `instructionStep`, `fabricRequirement`, and `sourceDocument`. Stable IDs and references connect them; review status and source precedence decide applicability. A Knowledge Base built from scoped, reviewed Stitches records and authorized sources provides navigable evidence. The runtime never stores personal measurements in shared Sanity documents.

A resolved pattern snapshot contains the version ID, reviewed rules, affected pieces and joins, instruction dependencies, source IDs, `_rev` values, and a canonical hash. A proposal contains the project base revision, snapshot hash, engine version, normalized inputs, locks, geometry result, checks, Context evidence, and expiration/stale state. An accepted revision retains its full resolved snapshot and result. The local project store persists these sample records on the development machine; the browser keeps only transient interaction state. On return, the server reloads the accepted revision and progress. When the authoritative Sanity records change, only affected pending proposals become stale; accepted records remain reproducible and are flagged for review.

## File Structure

Planned, subject to minor scaffold naming changes:

```text
Stitches/
├── src/app/                    # worktable, stages, and server routes
│   ├── api/agent/turn/route.ts
│   ├── api/patterns/[versionId]/route.ts
│   ├── api/projects/[projectId]/route.ts
│   └── api/proposals/         # preview and explicit acceptance
├── src/components/studio/      # worktable, SVG canvas, panels, states
├── src/domain/                 # pattern types, geometry, checks, revisions
├── src/server/knowledge/       # fixture, Sanity, and Context adapters
├── src/server/agent/           # Gemini adapter and bounded dispatcher
├── src/server/projects/        # local demo store; private adapter later
├── sanity/schemaTypes/         # authored content schema and Studio config
├── fixtures/                   # illustrative inputs; never live proof
├── tests/                      # domain, contract, and browser checks
├── devpost/                    # approved scope, PRD, spec, build checklist
├── docs/                       # full Stitches brief, evidence, status
├── .env.example                # names and placeholders, no credentials
├── package.json
└── package-lock.json
```

## External Services and Dependencies

**Sanity exact read.** The server uses `@sanity/client` with an explicit project ID, dataset, API version, published perspective, `useCdn: false`, and a server-only read token when required. It calls `client.fetch(fixedGROQ, {versionId})`; the returned projection is validated before graph traversal. No model-written query is executed. The editorial write token is separate and is never exposed to the app agent. [Client querying guide](https://www.sanity.io/docs/apis-and-sdks/js-client-querying).

**Sanity Context.** A Knowledge Base-only MCP endpoint is reached at `https://api.sanity.io/v1/context/organizations/:organizationId/mcp/:mcpEndpointName` with a server-only organization token carrying Context Viewer permission. The adapter performs MCP `tools/list`, then `tools/call` for `initial_context` with `{}` and `knowledge_base_read` with `{knowledgeBase: kbId, paths: [...]}`. Paths come verbatim from the outline and calls are bounded to relevant entries. It validates the returned content and keeps the cited paths. A 401, 403, empty tool set, unavailable KB, or missing entry is a visible unavailable/incomplete result. [MCP reference](https://www.sanity.io/docs/ai/sanity-context-mcp) and [tool reference](https://www.sanity.io/docs/ai/sanity-context-mcp-tools).

**Sanity Knowledge Base maintenance.** Connect a scoped dataset source, build and inspect its entries, and resolve relevant conflicts. After an editorial correction, run change detection, review and apply the resulting issues, and confirm the updated entry is actually served. Refresh detection alone keeps old entries in service. Record before/after content and retrieval evidence. [Create](https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base) and [maintain](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base) guides.

**Gemini.** The server creates `new GoogleGenAI({apiKey})` and uses the installed SDK's documented `interactions.create` function-calling flow with `model: 'gemini-3.8-flash'`, `store: false`, scoped input, and declared tools. Each returned function call is schema- and permission-checked, executed locally, and returned as a `function_result` with its matching `call_id`; the loop has tool, time, and output limits. Preserve provider steps required for continued calls. Return typed clarification, quota, timeout, malformed, or unavailable states. Confirm exact installed SDK types and model access before live tests. [Google function calling](https://ai.google.dev/gemini-api/docs/function-calling) and [model catalog](https://ai.google.dev/gemini-api/docs/models).

**Later private storage.** Supabase Auth/Postgres is planned for accounts, personal measurements, and owner-scoped revisions, with tested row-level security. It is not a prerequisite for the local sample demonstration. [Supabase documentation](https://supabase.com/docs).

## Important Failure Modes

- **Knowledge missing, conflicting, or not yet applied** → withhold the supported operation and show the source or pending review; retain the current accepted version.
- **Provider timeout, quota, or malformed tool call** → show a retry/clarification state and leave manual supported controls usable.
- **Unverified geometry or stale basis** → show failed/unknown checks or reject acceptance; never present a proposal as cut-ready.
- **Insufficient or unknown fabric** → report the actual shortage or missing dimensions. A rough estimate is not called a feasible layout.

## What Was Simplified and Why

- A single supported woven-top family and shoulder operation establish the connected-content journey; additional garments and arbitrary edits remain in the full product roadmap.
- The competition demo uses labeled sample measurements and a server-owned local project store. Multi-user accounts, private cloud storage, and tenant isolation remain a later release milestone.
- Fabric feasibility remains unknown until a full placement engine has evidence. This keeps the Fit / Fabric / Sew consequence visible without misrepresenting an area estimate as a cutting layout.
- Local recording can satisfy the Devpost demo requirement. Any public deployment or final submission requires the owner's separate authorization.

## Decisions and Open Issues

- **Learner choices carried forward:** Stitches name and atelier design; Next.js/React/TypeScript/SVG; Sanity for structured pattern knowledge; Gemini for the application agent; primary Sanity Path One and secondary Devpost Basics; no paid model budget; no external publication yet. These appear in the approved scope, PRD, handoff, and conversation.
- **Derived implementation details:** bounded MCP and Gemini adapters, fixed Sanity projections, canonical content fingerprints, and a local server-owned demo store. These serve the approved stale-proposal and privacy requirements; they are not attributed as new learner preferences.
- **Useful uncertainty clarified:** the learner asked what Sanity contributes beyond keyword search. The live test will compare the same version/source corpus and score applicable rule, source precedence, and complete dependent effects. Context supplies maintained evidence; linked Sanity records establish exact relationships. The result will be reported even if the comparison shows no advantage.
- **Early feasibility gate:** select a pattern design with verified permission and an operation that can preserve the neckline and pass reviewed seam/ease checks. If the candidate fails, select another authorized family or report the gate honestly. The illustrative reference cannot satisfy this gate.
- **Configuration gate:** Stitches needs its own authorized Sanity content scope, Context KB/MCP, and valid server-only tokens. Existing Crossgrade credentials and its dedicated dataset are not assumed to authorize Stitches writes. The live integration remains unverified until configured and tested.
- **Version gate:** package versions, Google SDK function-calling types, Sanity quotas/plan availability, and exact run scripts must be confirmed when dependencies are installed. No external integration or physical sewing trial has been run merely by writing this spec.
