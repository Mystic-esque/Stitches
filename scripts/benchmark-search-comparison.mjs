// Diagnostic search probe, not an agent-vs-search benchmark.
// This local fixture corpus is useful for designing a fair future experiment.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { constructionRecords } from './content/construction-records.mjs';

const root = resolve(import.meta.dirname, '..');
const fixture = JSON.parse(await readFile(resolve(root, 'fixtures/companion-diagnostic.json'), 'utf8'));
const corpus = [...fixture.documents, ...constructionRecords];
const tasks = [
  { id: 'next-step', query: 'What step should I sew next on Sandy circle skirt?', state: 'No checkpoints reviewed' },
  { id: 'option-pieces', query: 'What pieces do I cut for Tina top without sleeves?', state: 'Sleeves and front-bottom disabled' },
  { id: 'scrap-diagnosis', query: 'My seam is puckering. Should I unpick the dress and lower thread tension?', state: 'No scrap test recorded' },
  { id: 'prerequisite', query: 'Can I attach the waistband now on Sandy?', state: 'Closure seam not reviewed' },
  { id: 'capability', query: 'Generate a cut-ready production pattern SVG for my custom measurements.', state: 'Planning-only source' },
];
function tokenize(value) { return String(value).toLowerCase().match(/[a-z0-9]+/g) ?? []; }
function search(query) {
  const terms = tokenize(query);
  return corpus.map((doc) => {
    const text = tokenize([doc.title, doc.text, doc.action, doc.howToCheck, doc.safeAction, doc.purpose].filter(Boolean).join(' '));
    const score = terms.reduce((sum, term) => sum + text.filter((word) => word === term).length, 0);
    return { id: doc._id, title: doc.title, score };
  }).filter((hit) => hit.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 3);
}
const rows = tasks.map((task) => ({ ...task, keywordHits: search(task.query), keywordAnswer: null, companionAnswer: null, scored: false }));
const report = {
  generatedAt: new Date().toISOString(), kind: 'local_fixture_retrieval_probe', corpusSize: corpus.length,
  corpusOrigin: 'diagnostic JSON fixture plus construction seed records; not a live Sanity read', scoredTasks: 0,
  limitation: 'Top search hits are not user-facing answers. No keyword or agent pass rate is claimed. A fair benchmark must collect both full answers against the same current live corpus and grade them blind against frozen criteria.',
  tasks: rows,
};
await mkdir(resolve(root, 'evidence'), { recursive: true });
await writeFile(resolve(root, 'evidence/search-benchmark-report.json'), `${JSON.stringify(report, null, 2)}\n`);
const lines = [
  '# Search comparison: retrieval probe only', '', `Generated: ${report.generatedAt}`, '',
  `Corpus: ${report.corpusSize} local fixture/seed records; **not a live Sanity query**.`, '',
  '**No pass rate is reported.** The previous 5/5 versus 1/5 report was invalid: Companion success was assigned in the script rather than measured, and top keyword hits were graded as if they were complete answers. It must not be used in a submission.', '',
  'A valid comparison remains open: freeze the current Sanity source revision, record full keyword-only and Companion answers for identical project states, grade both blind with the same rubric, and retain raw responses and source paths.', '',
  '| Task | Maker state omitted by retrieval | Top local keyword hit |', '| --- | --- | --- |',
  ...rows.map((row) => `| ${row.id} | ${row.state} | ${row.keywordHits[0]?.title ?? 'No hit'} |`), '',
];
await writeFile(resolve(root, 'evidence/search-benchmark-report.md'), `${lines.join('\n')}\n`);
console.log(JSON.stringify({ kind: report.kind, corpusSize: report.corpusSize, scoredTasks: 0 }));
