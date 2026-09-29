---
doc: scope
status: revised-for-full-application
revision: studio-1.0
---

# Stitches — scope

## Primary Goal

Deliver the complete garment studio in ../docs/PRODUCT.md, with Sanity as a core dependency and a useful Gemini assistant. Sanity is the primary entry; Devpost is a second presentation of the same work. The owner explicitly requested a premium application and a detailed design and Sol implementation handoff. Routine product and technical decisions are delegated.

## The Unique Kernel

A maker changes one design and sees the connected consequences across the preview, pieces, seams, cloth, cutting, and sewing. The assistant executes supported tools to carry a multi-part brief through that process and recover from a failed constraint. Construction rules and evidence are maintained in Sanity; exact relationships and actual Context Knowledge Base retrieval both affect the result.

## Target User

A home sewist with basic machine skills and limited pattern-alteration confidence. Beginners can explore construction; experienced makers can inspect values and sources. Do not infer gender, body shape, or skill from a photo.

## Full First Release

Landing page; six supported looks across two qualified families; garment detail; photo analysis and template matching; guest projects; 3D construction and linked flat pieces; design options and measurements; an assistant using actual Sanity knowledge and deterministic tools; immutable revisions; feasible fabric placement; cutting preparation; scale-correct PDF/SVG and making package; focused sewing and saved progress; editorial correction evidence; recovery; polished desktop/mobile UI.

The two-family/six-look target is a release gate. Build the whole journey for the lead top first, then qualify the skirt and every preset. One family is a milestone, not the completed release. The former shoulder-only POC boundary is superseded.

## Kept Out of This Release

No signup/accounts, collaboration, marketplace, body scanning, arbitrary photo/PDF-to-pattern conversion, or physical cloth simulation. No public deployment or submission is authorized. Guest isolation and backup are required. Shared Sanity content never stores personal measurements or reference photos.

## Working Means

A maker begins at a collection or photo, selects a supported look, inspects construction, supplies required measurements, makes meaningful changes, resolves a fabric or technique constraint with the assistant, retains a version, exports its cutting/making package, and follows its exact sewing steps.

Evidence establishes determinism, actual seam/layout validation, source bindings, stale refusal, live Gemini and Context, recovery, accessibility, and print scale. At least one documented physical make qualifies the lead family before a ready-to-cut claim; the second family cannot borrow that review. Real-world review may remain an explicit open gate but cannot be fabricated.

## Constraints and Collaboration

Next.js/React/TypeScript, Sanity, Gemini, and the atelier identity remain. Paid-provider budget is $0. Use the allowlisted gemini-3.5-flash-lite within confirmed free quotas, with bounded calls and no paid fallback. Content writes stay in l4eeamth/development. Sol implements without recurring milestone approval requests. Verification and local commits are required. Physical making and external release are separately evidenced.

## Planning and Event Records

Existing proof remains in Git and ../BUILD_LOG.md. Revised documents describe a larger target, not completed features. Legacy devpost/ paths remain canonical; the newer plugin's alternate state/directory layout is not silently initialized. Event requirements must be checked through the official workflow when submission preparation becomes active.
