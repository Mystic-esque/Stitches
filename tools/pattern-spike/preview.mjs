// Render the actual measured artifact, not an independently illustrated pattern.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { draftSandy } from './draft.mjs';

const inputs = [
  { measurements: { waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 }, lengthRatio: 0.55, seamAllowanceMm: 10, waistbandShape: 'straight' },
  { measurements: { waist: 880, hips: 1100, waistToFloor: 1080, waistToHips: 220 }, lengthRatio: 0.7, seamAllowanceMm: 10, waistbandShape: 'straight' },
];
const artifacts = inputs.map(draftSandy);
const svg = (part) => {
  const points = Object.values(part.paths).flatMap((path) => path.operations.flatMap((op) => [op.to, op.cp1, op.cp2].filter(Boolean)));
  const left = Math.min(...points.map((point) => point.x)), right = Math.max(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y)), bottom = Math.max(...points.map((point) => point.y));
  const annotations = Object.entries(part.paths).filter(([id]) => /cutonfold|grainline|^fold$/.test(id));
  return `<svg role="img" aria-label="Engine-drafted ${part.id} with seam, allowance, fold and notch layers" viewBox="${left - 28} ${top - 28} ${right - left + 56} ${bottom - top + 56}">
    <path class="seam" d="${part.paths.seam.svgPath}"/><path class="allowance" d="${part.paths.sa.svgPath}"/>
    ${annotations.map(([id, path]) => `<path class="${id.includes('grainline') ? 'grain' : 'fold'}" d="${path.svgPath}"/>`).join('')}
    ${part.markings.map((mark) => `<circle class="notch" cx="${mark.anchor.x}" cy="${mark.anchor.y}" r="3"/>`).join('')}
    </svg>`;
};
const data = artifacts.map((artifact) => ({
  input: artifact.input, join: artifact.measuredJoin,
  pieces: artifact.parts.map((part) => ({ id: part.id, svg: svg(part), facts: {
    cut: part.cut.materials.fabric[0].cut, fold: Boolean(part.cut.cutOnFold),
    grain: part.cut.grain, notchIds: part.markings.map((mark) => mark.id),
  } })),
}));
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stitches · measured engine study</title><style>
*{box-sizing:border-box}body{margin:0;background:#20231e;color:#ede9dd;font:16px/1.6 system-ui}main{max-width:1280px;margin:auto;padding:40px 30px}h1{font:48px/1.12 Georgia;margin:18px 0}h2{font:30px Georgia}small,.muted{color:#babfaf}.eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:12px;color:#c2cdae}.warning{border-left:3px solid #dfa487;padding:14px 20px;background:#2e3028;max-width:900px}nav{display:flex;gap:10px;flex-wrap:wrap;margin:26px 0}button{font:inherit;padding:10px 16px;border:1px solid #7d8870;border-radius:5px;color:#ede9dd;background:none;cursor:pointer}button[aria-pressed=true]{background:#c2cdae;color:#20231e}button:focus-visible{outline:3px solid #f4b599;outline-offset:4px}.board{display:grid;grid-template-columns:minmax(0,2fr) minmax(240px,1fr);gap:26px}.pieces{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.6fr);gap:16px}.piece{background:#292d26;border:1px solid #505a46;border-radius:6px;padding:18px;min-width:0}.piece svg{width:100%;height:420px;background-image:radial-gradient(#606858 0.7px,transparent 0.7px);background-size:18px 18px}.seam{fill:#a9b59726;stroke:#c2cdae;stroke-width:1.4}.allowance{fill:none;stroke:#9ca591;stroke-width:1;stroke-dasharray:5 3}.fold{fill:none;stroke:#f4b599;stroke-width:2;stroke-dasharray:5 3}.grain{fill:none;stroke:#c2cdae;stroke-width:1.4}.notch{fill:#f4b599}.legend{display:flex;flex-wrap:wrap;gap:20px;font-size:13px;color:#bdc4b3}aside{padding:22px;background:#292d26;border-radius:6px}dl{margin:0}dt{color:#b6bfac;font-size:13px}dd{margin:0 0 18px}#receipt{border-top:1px solid #56604d;margin-top:20px;padding-top:18px}code{font-size:12px;overflow-wrap:anywhere}a{color:#cedbbb}footer{margin-top:32px;color:#b6bfac;font-size:13px}@media(max-width:800px){.board{grid-template-columns:1fr}h1{font-size:36px}.piece svg{height:340px}}@media(max-width:450px){main{padding:24px 16px}.pieces{grid-template-columns:1fr}.piece svg{height:320px}.legend{gap:10px}}
.pieces{align-items:start}.piece:nth-child(2) svg{height:180px}.seam,.allowance,.fold,.grain{vector-effect:non-scaling-stroke}@media(max-width:450px){.piece:nth-child(2) svg{height:120px}}
</style><main><div class="eyebrow">Stitches / research workbench</div><h1>A pattern with a measurable basis.</h1>
<p class="muted">Actual FreeSewing Sandy 4.10.2 draft · named parts, folds, grain and notches · synthetic measurements</p>
<div class="warning"><strong>Qualification study—not cutting instructions.</strong> No fabric layout, physical print, complete making-step map or maker review. This is not the production application.</div>
<nav aria-label="Synthetic input comparison"><button data-input="0" aria-pressed="true">Draft A · 720 mm waist</button><button data-input="1" aria-pressed="false">Draft B · 880 mm waist</button></nav>
<div class="board"><section><div class="pieces" id="pieces"></div><p class="legend"><span>Sage · stitch outline</span><span>Dashed grey · engine allowance</span><span>Coral · fold / notch</span></p></section><aside><div class="eyebrow">Inspect the source</div><h2 id="selection"></h2><dl id="facts"></dl><div id="receipt" aria-live="polite"></div><p class="muted">Cut and grain metadata above come from this engine draft. They do not silently replace the pending-review Sanity planning records.</p></aside></div>
<footer>Design: Erica Alcusa Sáez · Code: Erica Alcusa Sáez & Joost De Cock · FreeSewing MIT notice retained in the spike folder.<br><a href="https://freesewing.eu/docs/designs/sandy/">Original design documentation</a> · Closed local research preview; no deployed app or fit claim.</footer>
</main><script>const drafts=${JSON.stringify(data).replaceAll('<', '\\u003c')};let active=0,selected=0;function render(){const d=drafts[active];document.querySelectorAll('[data-input]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.input)===active)));document.getElementById('pieces').innerHTML=d.pieces.map((p,i)=>'<article class="piece">'+p.svg+'<button data-piece="'+i+'" aria-pressed="'+(i===selected)+'">'+p.id+'</button></article>').join('');const p=d.pieces[selected];document.getElementById('selection').textContent=p.id==='sandy.skirt'?'Skirt section':'Straight waistband';document.getElementById('facts').innerHTML='<dt>Exact engine ID</dt><dd><code>'+p.id+'</code></dd><dt>Engine cut count</dt><dd>'+p.facts.cut+'</dd><dt>Cut on fold</dt><dd>'+(p.facts.fold?'Yes · single fold':'No · internal fold line shown')+'</dd><dt>Grain angle (engine coordinates)</dt><dd>'+p.facts.grain+'°</dd><dt>Source notch IDs</dt><dd><code>'+p.facts.notchIds.join(', ')+'</code></dd>';document.getElementById('receipt').textContent='Independent waist join difference: '+d.join.differenceMm.toFixed(4)+' mm. Scalar check only; not an assembly approval.';document.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.piece);render()});}document.querySelectorAll('[data-input]').forEach(b=>b.onclick=()=>{active=Number(b.dataset.input);render()});render();</script></html>`;
const directory = resolve(import.meta.dirname, '../../evidence/pattern-engine');
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'preview.html'), html);
console.log('Generated evidence/pattern-engine/preview.html from the measured draft artifacts.');
