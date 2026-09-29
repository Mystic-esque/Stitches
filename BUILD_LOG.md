# Build log

All checks below ran against the Stitches folder on the local Windows machine. This log distinguishes illustrative work from live provider or pattern proof.

## September 28, 2026 — first worktable slice

- Added pinned Next.js 16.3.5, React 19.3.0, TypeScript 5.9.3, Vitest 5.0.1, and pnpm 11.19.0 lockfile; created the responsive Fit worktable and sample SVG interaction.
- Initial `npm view` failed with cache `EPERM`. Online npm install did not complete; offline npm could not resolve a cached type package. The bundled pnpm runtime completed `pnpm install --offline` from local cache in 10m 16s. No paid service was used.
- Elevated `node_modules\\.bin\\tsc.cmd --noEmit` passed. Elevated `node_modules\\.bin\\vitest.cmd run` passed 2/2 tests. Elevated `node_modules\\.bin\\next.cmd build` passed with static `/`. The non-elevated attempts failed on sandbox write/spawn `EPERM` because this folder is outside this chat's writable root, not on a code assertion.
- Browser on `http://localhost:3100`: shoulder slider 10→16, original comparison and piece explanation by keyboard; 320px/390px overflow checks passed. The SVG was visually inspected against the reference in dark appearance. No live Sanity/Gemini test occurred.
- Local commit: `be69255` (`Build-illustrative-Stitches-worktable`). No push.

## September 29, 2026 — revisions and Fit / Fabric / Sew

- Added server-owned local `.data/` project store, immutable sample revisions, idempotent acceptance, stale-content and stale-base refusal, fabric width selection, and revision-aware sewing progress. Fabric status remains unknown until a real placement engine exists.
- Elevated `tsc --noEmit` passed. Elevated `vitest run` passed 5/5 tests across two files. Browser on `http://127.0.0.1:3101`: accepted sample revision 1, persisted 110 cm width and first sewing step across reload, accepted revision 2 in another tab, then observed the older tab's HTTP 409 refusal. Reload retained revision 2; old step completion appeared as needing review. 320px/390px width checks found no horizontal overflow.
- First `next build` attempt compiled successfully after 10.9 minutes but was interrupted before final checks, so it was not counted as a pass. Warm-cache rerun completed compilation, TypeScript, page generation, and route optimization with exit code 0. Dynamic routes: `/`, `/api/demo/accept`, `/api/demo/progress`.
- Still illustrative: no live Context MCP retrieval, Gemini call, verified geometry, fabric feasibility, maker review, or public deployment.
