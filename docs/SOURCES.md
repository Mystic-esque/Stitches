# Official sources

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

