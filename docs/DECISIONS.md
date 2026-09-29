# Implementation decisions

## September 29, 2026 — Sanity isolation and proof boundaries

- Stitches uses its own Sanity project (`l4eeamth`) in organization `o3i0aqvqq`. The `development` public dataset is for illustrative content and integration tests. The separate `production` dataset remains empty until a reviewed pattern and sources exist. Crossgrade credentials and its dedicated dataset are not silently reused for Stitches writes.
- The product app reads a bounded, fixed set of parameterized GROQ queries using a published perspective and no CDN. The resolver validates document types, IDs, references, pattern-version consistency, prerequisite cycles, operation registration, and reviewed status before returning a content fingerprint and effect trail. Fixture and Sanity adapters use the same resolver. There is no model-authored GROQ or fallback from a failed live request to fixture content.
- A separate adapter calls Sanity's documented read-only Context MCP Knowledge Base tools. The project read/write tokens and organization Context Viewer token are distinct; a project token cannot stand in for the Context credential. A mock transport test is not a live KB result.
- The local Studio points only at `l4eeamth/development`. A dry-run-only-by-default seeder refuses any other project/dataset and uses a dedicated write token only with `--apply`. Illustrative records must not become reviewed or cut-ready merely because they are stored in Sanity.
- No public Studio/app deployment, final submission, billing enablement, or production dataset write has been authorized.
