// Live, read-only evidence capture. Run with --experimental-transform-types and --env-file=.env.local.
// Source records, served prose, and editorial review are separate checks.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SanityContextKnowledgeBase, contextConfiguration } from '../src/server/knowledge/context-mcp.ts';
import { createCompanionCatalogClient, loadCompanionCatalog } from '../src/server/knowledge/companion-catalog.ts';
import { companionKbPaths, kbAttributionNeedsReview } from '../src/server/knowledge/companion-kb-paths.ts';
import { constructionRecords } from './content/construction-records.mjs';

const config = contextConfiguration();
if (config.organizationId !== 'o3i0aqvqq' || config.mcpName !== 'stitches-garments' ||
    config.knowledgeBaseId !== 'kbkvu1vrPsLG') throw new Error('Expected scoped Stitches Context configuration.');
const context = new SanityContextKnowledgeBase(config);
const [cards, outline] = await Promise.all([
  loadCompanionCatalog(createCompanionCatalogClient()), context.initialContext(),
]);
const planningPaths = Object.fromEntries(cards.map(card => [card.designKey, companionKbPaths(outline.text, card.designKey)]));
const grouped = /^seam_quality(?:\s|$)/m.test(outline.text);
const diagnosticPath = grouped ? 'seam_quality' : 'seam_puckering';
const constructionPaths = grouped ? ['construction/sandy_circle_skirt', 'construction/tina_faux_wrap_top'] : [];
const paths = [...new Set([...Object.values(planningPaths).flat(), diagnosticPath, ...constructionPaths])];
for (const path of paths) if (!new RegExp(`^${path}(?:\\s|$)`, 'm').test(outline.text))
  throw new Error(`Required entry is absent from the actual outline: ${path}`);
const entries = await Promise.all(paths.map(async (path) => ({ path, result: await context.readPaths([path]) })));
const capturedAt = new Date().toISOString();
const directory = resolve(import.meta.dirname, '../evidence/context-companion-review');
await mkdir(directory, { recursive: true });
const hash = (text) => createHash('sha256').update(text).digest('hex');
async function snapshot(name, text) {
  const digest = hash(text);
  const filename = `${name.replaceAll('/', '-')}-${digest.slice(0, 16)}.md`;
  try { await writeFile(resolve(directory, filename), text, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return { sha256: digest, file: `evidence/context-companion-review/${filename}`, characters: text.length };
}
const diagnostic = entries.find(({ path }) => path === diagnosticPath).result.text;
// Accept the two observed paragraph/table representations; require an explicit test-first branch.
const notTestedSection = diagnostic.match(/###\s+Not[ -]tested\s*\n([\s\S]*?)(?=\n###\s|\n##\s|$)/i)?.[1]
  ?? diagnostic.split(/\r?\n/).find((line) => /^\|[^|]*not-tested[^|]*\|/i.test(line))
  ?? '';
const sourceIdentities = [
  ['Thread tension may be contributing', 'companion-issue-tension-pucker-20261001'],
  ['Cause remains unresolved', 'companion-issue-unresolved-pucker-20261001'],
  ['Does a test seam relax when the stitches are released?', 'companion-test-scrap-stitch-release-20261001'],
  ['Compare a lower-tension sample', 'companion-remedy-sample-lower-tension-20261001'],
];
const body = diagnostic.split('## Sources')[0];
const stableSourceIdentities = !/\[\d+\]/.test(body) && sourceIdentities.every(([title, id]) =>
  body.split(/\r?\n/).some((line, index, lines) => line.includes(title) &&
    lines.slice(index, index + 5).join('\n').includes(id)));
const entryBody = (path) => entries.find((entry) => entry.path === path).result.text.split('## Sources')[0];
const planningBodies = cards.map((card) => ({ card, text: entryBody(planningPaths[card.designKey][0]) }));
const planningIdentities = planningBodies.every(({ card, text }) => !/\[\d+\]/.test(text) &&
  text.includes(`companion-candidate-${card.designKey}-20261001`) &&
  text.includes(`companion-source-${card.designKey}-20261001`) &&
  card.pieceStudy.every((piece) => text.includes(`companion-piece-${card.designKey}-${piece.pieceKey}-20261001`)));
// Table column order and boolean spelling may change; named fields must still equal the exact catalog.
const tableCells = row => row.split('|').slice(1, -1).map(cell => cell.replace(/[`*]/g, '').trim().toLowerCase());
const planningRowsMatch = planningBodies.every(({ card, text }) => card.pieceStudy.every((piece) => {
  const id = `companion-piece-${card.designKey}-${piece.pieceKey}-20261001`;
  const lines = text.split(/\r?\n/), index = lines.findIndex(line => line.startsWith('|') && line.includes(id));
  const header = lines.slice(0, index).reverse().find(line => line.startsWith('|') && /\bCondition\b/i.test(line) && /\bFold\b/i.test(line));
  if (index < 0 || !header) return false;
  const columns = tableCells(header), cells = tableCells(lines[index]);
  const field = name => cells[columns.indexOf(name)];
  return field('condition') === piece.condition && field('cut count') === String(piece.cutCount) &&
    field('fold') === piece.fold && field('material') === piece.material &&
    (piece.mirrored ? ['yes', 'true'] : ['no', 'false']).includes(field('mirrored'));
}));
const materialBody = grouped ? planningBodies.map(entry => entry.text).join('\n') : entryBody('fabric_constraints');
const materialIdentities = !/\[\d+\]/.test(materialBody) && cards.every((card) =>
  materialBody.includes(`companion-candidate-${card.designKey}-20261001`) &&
  materialBody.includes(`companion-source-${card.designKey}-20261001`));
// Regression for the specific unsubstantiated additions observed during full editorial review.
// This is not a general semantic-certification algorithm; new prose still requires review.
const materialUnsupportedClaimsAbsent = !/no inherent stretch|grain direction governs|sufficient stretch to accommodate|Stretch required for fit/i.test(materialBody);
const constructionBodies = constructionPaths.map(path => ({ path, text: entryBody(path) }));
const exactConstruction = grouped ? await createCompanionCatalogClient().fetch(
  '*[_id in $ids][0...16]{_id,_type,title,diagnostic,condition}', { ids: constructionRecords.map(record => record._id) },
  { signal: AbortSignal.timeout(12000) }) : [];
const constructionIdentities = !grouped || (exactConstruction.length === 15 && constructionBodies.every(({ path, text }) => {
  const design = path.includes('sandy') ? 'sandy' : 'tina';
  return !kbAttributionNeedsReview(text) && exactConstruction.filter(record => record._id.startsWith(`companion-making-${design}-`))
    .every(record => text.includes(record._id));
}));
const constructionDiagnosticFlags = !grouped || constructionBodies.every(({ path, text }) => {
  const design = path.includes('sandy') ? 'sandy' : 'tina';
  return exactConstruction.filter(record => record._type === 'constructionStep' && record._id.startsWith(`companion-making-${design}-`)).every(record => {
    const section = text.split(/^### /m).find(section => section.includes(record._id)) ?? '';
    const flag = section.match(/\*\*Diagnostic:\*\*\s*(yes|no)/i)?.[1]?.toLowerCase();
    return flag === (record.diagnostic ? 'yes' : 'no');
  });
});
const checks = {
  bothDistinctCandidatesPresent: entries[0].result.text.includes('companion-candidate-sandy-20261001') &&
    entries[1].result.text.includes('companion-candidate-tina-20261001'),
  diagnosticPendingReviewDisclosed: /pending[ -]review|pending\*?\*? review|reviewStatus.{0,20}pending/i.test(diagnostic),
  diagnosticOriginAttributed: /\bCoats\b|coats\.com/i.test(diagnostic),
  observedUntestedShortcutAbsent: Boolean(notTestedSection) &&
    /perform (?:this|the).{0,60}test first|do not (?:advance|proceed)|perform it before proceeding/i.test(notTestedSection) &&
    !/(?<!do not )proceed to (?:the )?(?:sample[ -]tension|lower[ -]tension)/i.test(notTestedSection),
  garmentUnpickingProhibited: /Do not remove stitches from the actual garment|never on the actual garment|do not unpick a finished garment|never unpick or alter the finished garment/i.test(diagnostic),
  diagnosticDoesNotFalselyExcludeTension: !/thread tension is not (?:the issue|the cause)|rules out (?:thread )?tension/i.test(body),
  diagnosticStableSourceIdentities: stableSourceIdentities,
  planningStableSourceIdentities: planningIdentities,
  planningPieceRowsMatchExactCatalog: planningRowsMatch,
  planningMeasurementsPreserved: planningBodies.every(({ card, text }) =>
    card.requiredMeasurements.every((measurement) => text.toLowerCase().includes(measurement.toLowerCase()))),
  fabricStableSourceIdentities: materialIdentities,
  fabricObservedUnsubstantiatedClaimsAbsent: materialUnsupportedClaimsAbsent,
  constructionStableSourceIdentities: constructionIdentities,
  constructionDiagnosticEligibilityMatchesExactRecords: constructionDiagnosticFlags,
  constructionOptionalStepsCarryPrerequisites: !grouped ||
    (/carry.{0,30}prerequisites/i.test(entryBody('construction/tina_faux_wrap_top')) &&
      /do not require the omitted physical action/i.test(entryBody('construction/tina_faux_wrap_top'))) ||
    ['dart', 'sleeves', 'front-bottom'].every(branch => new RegExp(`When the ${branch} branch is absent, its prerequisite.{0,100}carries through`, 'i')
      .test(entryBody('construction/tina_faux_wrap_top'))),
};
const report = {
  capturedAt, provenance: 'live-content-lake-and-context-mcp', knowledgeBaseId: config.knowledgeBaseId,
  exactCatalog: cards.map(({ designKey, fingerprint, reviewStatus, capability, diagnosticStudy }) => ({
    designKey, fingerprint, reviewStatus, capability, diagnosticFingerprint: diagnosticStudy.fingerprint,
  })),
  outline: await snapshot('outline', outline.text),
  entries: await Promise.all(entries.map(async ({ path, result }) => ({ path, ...await snapshot(path, result.text) }))),
  checks, automatedChecksPassed: Object.values(checks).every(Boolean),
  observedNotTestedBranch: notTestedSection || null,
  diagnosticCitationIdentityReviewRequired: !stableSourceIdentities,
  planningCitationIdentityReviewRequired: !planningIdentities || !planningRowsMatch,
  materialEditorialReviewRequired: !materialIdentities || !materialUnsupportedClaimsAbsent,
  constructionEditorialReviewRequired: !constructionIdentities || !constructionDiagnosticFlags,
  makerReviewNotEstablished: true,
  importCountAndBuildJobNotVerified: true,
};
const json = JSON.stringify(report, null, 2) + '\n';
await writeFile(resolve(directory, `review-${capturedAt.replace(/[:.]/g, '-')}.json`), json, { flag: 'wx' });
await writeFile(resolve(directory, '../companion-context-verification.json'), json);
console.log(json);
if (!report.automatedChecksPassed) process.exitCode = 1;
