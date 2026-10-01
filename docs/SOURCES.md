# Official sources

## Pattern-engine boundary check — October 1, 2026

The owner's attached SVG/parametric-pattern prose had unresolved `chatgpt-content-reference` markers. These direct sources support the engineering decision in `PATTERN-ENGINE-DECISION.md`; they do **not** establish any Stitches engine integration or garment rights.

- [FreeSewing developer portal](https://freesewing.dev/): JavaScript parametric pattern library and code-based designs.
- [FreeSewing Pattern API](https://freesewing.dev/reference/api/pattern/) and [render method](https://freesewing.dev/reference/api/pattern/render/): a `Pattern` is the parametric blueprint; after drafting it can render SVG. This does not promise our required IDs/markings for an arbitrary design.
- [FreeSewing editor rendering](https://freesewing.eu/docs/editor/menus/preferences/renderer/): its own interactive editor uses React by default; SVG is used mainly for export/printing. Stitches may still use semantic interactive SVG, but should not assume FreeSewing's exported markup already provides our UX bindings.
- [FreeSewing archived monorepo](https://github.com/freesewing/freesewing) and [current core package](https://www.npmjs.com/package/@freesewing/core): historical MIT repository moved to Codeberg; inspect current exact design/package and generated-output terms before adoption.
- [SeamScape MCP](https://seamscape.com/docs/api/mcp) and [Pattern API](https://seamscape.com/docs/api/v1/pattern): structured inspect/preview/confirmed apply/save and parameterized JSON/DXF. [Pricing](https://seamscape.com/pricing) places full API access under Enterprise; it is a reference, not an authorized paid dependency.
- [Seamly project wiki](https://wiki.seamly.io/wiki/Main_Page/en) and [PatternSoft project](https://patternsoft.drytrix.com/): patternmaking terminology and a separate FreeSewing-plus-editor example. No software or design was imported from either.

October 1 Companion 2.0 note: this is a historical research ledger. The supplied project-aware companion text is assessed separately in DIRECTION-REVIEW.md and is not a reviewed sewing source. Before seeding diagnostic rules, choosing pattern rights, or depending on current provider behavior, verify task-specific primary documentation and physical sewing expertise. The former Three.js and six-preset architecture are no longer required release decisions.

## Studio 1.0 architectural research — September 29, 2026

These primary sources informed the upgraded specification. They do not prove our implementation, qualify pattern rights, or replace maker testing. No new model call or cloud operation occurred during this design pass.

- [Sanity Context source types](https://www.sanity.io/docs/ai/sanity-context-source-types) and [retrieval modes](https://www.sanity.io/docs/ai/sanity-context-retrieval-modes): keep exact dataset retrieval separate from the existing KB-only endpoint.
- [Maintain a Knowledge Base](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base): change detection, application/rebuild and served-entry verification are distinct. Record the actual result rather than assuming refresh means current.
- [Context CLI](https://www.sanity.io/docs/cli-reference/cli-context): documented maintenance surface; check installed CLI compatibility before use. No invented control-plane URLs.
- [Sanity Functions](https://www.sanity.io/docs/functions) and [local testing](https://www.sanity.io/docs/functions/functions-local-testing): foundation for a prepared, locally rehearsed editorial-impact wrapper, not authorization to deploy it.
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [image understanding](https://ai.google.dev/gemini-api/docs/image-understanding), and [structured output](https://ai.google.dev/gemini-api/docs/structured-output): feasibility of bounded visible-feature extraction. Model access/free quotas and provider image-data terms still need task-time validation; image input is not pattern-generation competence.
- [Three.js glTF](https://threejs.org/manual/pages/load-gltf.html), [picking](https://threejs.org/manual/pages/picking.html), and [responsive rendering](https://threejs.org/manual/pages/responsive.html): display, selection and responsive rendering building blocks. These do not provide a garment drafting or fit-physics system.
- [FreeSewing developer portal](https://freesewing.dev/) and [design catalog](https://freesewing.eu/designs/): programmable pattern candidates. Exact package/source/license and generated-output rights remain W01 work; a repository host lookup did not complete qualification in this pass.
- [Teagan](https://freesewing.eu/designs/teagan): a knit T-shirt candidate, not a woven blouse substitution. [Tamiko](https://freesewing.eu/docs/designs/tamiko/) and [Tina](https://freesewing.eu/docs/designs/tina/) document material/construction constraints that make casual relabeling inappropriate. [Sandy](https://freesewing.eu/docs/designs/sandy/) is a skirt candidate to evaluate; [Tiberius](https://freesewing.eu/designs/tiberius/) is a different tunic design, not an already qualified everyday top.

The new spec intentionally does not repeat novelty claims from earlier discussion or claim superiority over existing garment tools without evidence. The differentiation to demonstrate is maintained, connected construction knowledge carrying a real design through making and correction.

## Earlier reference review

Reviewed September 28, 2026. Recheck provider SDK details and model availability when implementation starts. The architecture recommendations are design judgments, not guarantees from these vendors.

- [Codex project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md): how project-level AGENTS.md guidance is discovered and used.
- [Codex projects and chats](https://learn.chatgpt.com/docs/projects): local folders and project context.
- [Sanity Content Lake](https://www.sanity.io/docs/content-lake): structured documents and querying.
- [Sanity schema introduction](https://www.sanity.io/docs/apis-and-sdks/introduction-to-schemas): schema roles and the distinction between Studio structure and the schema-less Content Lake.
- [Sanity connected content](https://www.sanity.io/docs/studio/connected-content): document references and querying connected records.
- [Sanity GROQ](https://www.sanity.io/docs/content-lake/how-queries-work): reference traversal and projections.
- [Sanity Context](https://www.sanity.io/docs/ai/sanity-context): required read-only retrieval for the primary agent entry, prerequisites, and current limitations. Rechecked September 28, 2026.
- [Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16) and [contest rules](https://dev.to/page/sanity-challenge-v26-09-16-contest-rules): Path One requirements, judging criteria, submission materials, and October 4 deadline. Checked September 28, 2026.
- [Google GenAI SDK](https://ai.google.dev/gemini-api/docs/libraries): official JavaScript/TypeScript package `@google/genai`.
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling): tool declaration, execution, and result handling.
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output): schema-shaped output and supported schema features.
- [Gemini model catalog](https://ai.google.dev/gemini-api/docs/models): model IDs and stability labels. The catalog listed `gemini-3.8-flash` as stable on the review date; account availability was not tested.
- [Next.js App Router](https://nextjs.org/docs/app): application and server structure.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): owner-scoped access policies; the proposed application still needs its own policies and tests.
- [FreeSewing developer documentation](https://freesewing.dev/): candidate drafting foundation, subject to design-specific evaluation.
- [FreeSewing monorepo notice](https://github.com/freesewing/freesewing): the old MIT GitHub repository was archived and points to Codeberg; no design or drafting code has been imported into Stitches.
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/generate-content/function-calling): official JavaScript SDK manual tool loop, exact function-response IDs, and preservation of Gemini 3 thought signatures.
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): per-project quotas and usage-tier distinctions; model listing alone does not establish a zero-cost account tier.
- [pnpm 11 configuration](https://pnpm.io/11.x/configuring): project dependency-build policy belongs in `pnpm-workspace.yaml`.
- [FreeSewing custom patterns](https://freesewing.eu/docs/about/site/draft/): measurement-driven drafting and design options. This is not evidence that the Stitches shoulder operation is implemented or verified.

The screenshots and reference are original Stitches design artifacts from this conversation. The fixture content is illustrative and is not attributed to FreeSewing or another pattern publisher.

