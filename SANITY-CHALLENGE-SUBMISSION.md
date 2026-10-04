*This is a submission for the [Sanity Challenge, Path One: Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

Stitches is a sewing project workspace for people who want to understand and make a garment—not just ask an AI for sewing advice. Choose a distinct garment plan or start with your own idea, explore the source-listed pieces and construction choices, keep a private project record, and get a bounded, source-grounded explanation for the piece or making step in front of you. When a seam problem is uncertain, Stitches guides a test-first investigation on scrap fabric instead of guessing a repair.

Sanity supplies the linked garment facts and maintained construction knowledge that make the agent useful. The maker’s measurements, observations, and saved project history stay in the private local workspace. Pattern work is clearly labeled as a study where it has not passed cutting and maker review; Stitches does not claim cut-ready patterns, certified fit, or automatic sewing.

![Stitches cover: From “I could make that” to “I made it.”](docs/submission/stitches-cover.jpg)

## Demo

There is no public deployment or walkthrough video yet. The [README’s step-by-step guide](README.md#try-the-workspace) explains how to operate the application locally, including fixture mode when API credentials are unavailable. Desktop and mobile captures are also embedded there.

For a reviewer walkthrough, run the local app and:

1. Start the Sandy circle skirt or Tina faux-wrap top. These are distinct garment plans, not color variants.
2. Open **Pattern** to inspect the Sandy plan-only measured study and its changed versus unchanged edges. Do not cut from this study.
3. Open **Make**, confirm the documented construction configuration, and inspect the current step and its source-linked learning notes.
4. Select a piece or step, open the companion, review the minimized data, and explicitly consent before a live Gemini call. Ask it to explain the selected piece or next preparation check.
5. In **Check**, use the diagnostic as an educational scrap-test flow; do not treat its result as a confirmed cause or a repair instruction for a finished garment.

Live model and Knowledge Base paths require the local Stitches credentials described in the README. Fixture mode makes no claim of live retrieval. A public demonstration link can be added after deployment is separately authorized and its persistence/security configuration is qualified.

## Code

Repository: [github.com/Mystic-esque/Stitches](https://github.com/Mystic-esque/Stitches). The owner supplied this repository for the release push. The code push does not deploy the application or submit the challenge entry.

## How I Used Sanity

Stitches uses Sanity as the garment knowledge and relationship layer, not as a place to store private user measurements. The dedicated Stitches project (`l4eeamth`, dataset `development`) contains structured records for distinct planning candidates, their pieces and material constraints, prerequisite-bearing construction plans/steps, and a shared scrap-diagnostic graph. Typed references and applicability rules let application tools resolve what belongs to the selected garment, piece, confirmed options, or current step. Exact records—not generated prose—determine piece counts, fold/mirror flags, source identity, and allowed transitions.

The Stitches Context Knowledge Base (`kbkvu1vrPsLG`, MCP endpoint `stitches-garments`) is the maintained source-linked explanation layer. The application uses its scoped Context MCP outline and selected entry together with fixed, validated Content Lake reads. The bounded Gemini tool loop can inspect the current project, resolve its exact structured graph, and retrieve relevant Context knowledge before returning a source-bound explanation. It cannot write Sanity content, change a pattern, advance sewing progress, or certify a physical result. Missing, stale, or mismatched knowledge blocks the relevant agent answer; fixture text is never presented as a live Context response.

The maintained-content example is a construction-source correction: the source records and corresponding served Knowledge Base entry were updated and checked independently. Live read-only verification passed 15/15 current Content Lake/Context editorial checks. A recorded live selected-piece run used `gemini-3.5-flash-lite` with four bounded requests and actual Stitches Content Lake plus Context retrieval; it returned a piece explanation without changing the private project. These checks demonstrate integration and source binding, not a fair benchmark, maker trial, or pattern qualification.

Private projects, body notes, observations, and pattern-study history stay in the local guest store and are not written to Sanity. The prototype’s local single-server persistence is not yet a public multi-instance deployment design.

## Sanity Project Details

- Project ID: `l4eeamth`
- Dataset used: `development` (prototype/editorial content; production dataset untouched)
- Context Knowledge Base ID: `kbkvu1vrPsLG`
- Context endpoint name: `stitches-garments`
- No Viewer, Editor, organization Context, or Gemini secrets are included here. The dataset is not public; use the project ID for Sanity review access.

## Agent Session

Optional; no public session transcript is linked. The live run receipt is retained locally at `evidence/companion-live-selected-tina-verification.json`. If a transcript is curated later, remove secrets and private project data, verify its share visibility, and add its public link here.
