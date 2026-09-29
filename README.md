# Stitches

Patterns that adapt to you, with every change explained.

Stitches is a personal sewing studio powered by structured pattern knowledge. This repository contains the product handoff and the first runnable, explicitly illustrative worktable slice.

**Current status:** the local Next.js Fit / Fabric / Sew worktable runs without credentials. Sample shoulder proposals can be accepted as server-owned local revisions; the original remains in history, stale proposals are refused, fabric width and sewing progress persist, and affected work is marked for review. Verified drafting, fabric placement, live Sanity/Gemini connections, accounts, and deployment are not implemented yet. The sample outline is not for cutting.

## Run the first slice

With Node.js 22.18+ and pnpm 11.19.0, run `pnpm install --frozen-lockfile`, then `pnpm dev -- --hostname 127.0.0.1` and open the local URL printed by Next.js. `pnpm typecheck`, `pnpm test`, and `pnpm build` are the local checks. On the build machine, `node_modules\\.bin\\next.cmd dev -H 127.0.0.1 -p 3101` was the verified local run command. No secret is required for the illustrative worktable. Do not deploy the local single-user demo store as a public service.

## Continue in Codex

1. Open this `stitches` folder as the local project folder in Codex. If working from the ZIP, extract it first.
2. Start with [AGENTS.md](AGENTS.md), which records the project's implementation instructions. Codex supports project instructions in this file.
3. Use the prompt in [KICKOFF.md](KICKOFF.md). It tells the next session where to begin, what to preserve, and what to verify.
4. Keep [docs/STATUS.md](docs/STATUS.md) updated after each meaningful milestone so the next session knows exactly what works.

You can also continue in the existing conversation by telling Codex to work in this folder. A new conversation should read these files; it should not assume access to the original chat.

## What is included

| File | Purpose |
| --- | --- |
| [Product brief](docs/PRODUCT.md) | Audience, scope, core journey, acceptance criteria |
| [Design specification](docs/DESIGN.md) | Visual identity, interactions, mobile behavior, accessibility |
| [Architecture](docs/ARCHITECTURE.md) | Sanity, Gemini, geometry, private data, and boundaries |
| [Content model](docs/CONTENT-MODEL.md) | Documents, relationships, provenance, and versioning |
| [Build plan](docs/BUILD-PLAN.md) | Ordered milestones with evidence of completion |
| [Sources](docs/SOURCES.md) | Official documentation checked on September 28, 2026 |
| [Interactive design reference](references/stitches-interactive.html) | Open in a browser; no accounts or API keys needed |
| [Desktop reference](references/stitches-desktop.png) | The visual direction to preserve |
| [Mobile reference](references/stitches-mobile.png) | Responsive concept; evolve into a focused sewing view |
| [Dark reference](references/stitches-dark.png) | Dark appearance |
| [Content fixture](fixtures/knowledge-graph.json) | Illustrative Sanity-shaped linked documents |
| [Agent intent contract](contracts/adjustment-intent.schema.json) | Application-side validation contract |
| [Evaluation cases](fixtures/agent-evaluations.json) | Important reasoning, ambiguity, and failure cases |
| [.env.example](.env.example) | Configuration names; contains no credentials |

## Recommended stack

- Next.js App Router, React, and TypeScript for the application and server endpoints.
- Sanity Studio and Content Lake for the reviewed, versioned pattern knowledge. Use references and parameterized GROQ queries.
- Gemini through Google's `@google/genai` SDK for interpretation, bounded tool use, and grounded explanations. Start by evaluating the documented stable `gemini-3.8-flash`; keep the model configurable and verify availability in the user's project.
- A deterministic TypeScript geometry layer with SVG rendering. Evaluate FreeSewing behind an adapter after checking the exact design's license, supported adjustments, and drafting behavior.
- Supabase Auth and Postgres with tested row-level security for accounts, private measurement profiles, personal fabric inventory, and project versions. It is a later milestone; the initial demo can use local, clearly labeled sample data.
- Runtime validation for external data and model output, plus unit tests for geometry and Playwright for the main journey. Choose and pin compatible package versions when scaffolding, then commit the lockfile.

Sanity is the knowledge layer. Gemini is the interpretation and explanation layer. The geometry engine owns numerical results. An additional vector database is not needed for the first version.

## First working milestone

Rebuild the Fit / Fabric / Sew reference as maintainable application components using fixtures. Implement the shoulder adjustment, original/proposed comparison, explicit version acceptance, fabric-width comparison, and sewing progress. Clearly label all illustrative geometry and estimates. The app should run locally without cloud credentials.

The next milestone connects the structured Sanity model; the following milestone replaces illustrative drafting with one verified pattern family. Natural-language editing is added through the same validated operations as the manual controls.

## Configuration

When integration work begins, copy `.env.example` to a local environment file and supply values through your local environment or hosting secret settings. Do not paste secrets into chat or commit them. Project IDs are configuration, while API tokens and service keys are secrets.

The reference HTML is a design artifact, not production application source. It uses invented pattern geometry and sample fabric estimates. Its measurements are interface demo inputs, not measurements of a real person.

