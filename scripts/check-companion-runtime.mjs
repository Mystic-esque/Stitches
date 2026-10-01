import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const base = process.env.STITCHES_BASE_URL ?? 'http://127.0.0.1:3100';
const output = join(root, 'evidence', 'screenshots', 'companion-runtime');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'stitches-runtime-'));
const chrome = spawn(process.env.CHROME_EXE ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let stderr = '';
chrome.stderr.on('data', (part) => { stderr = (stderr + part).slice(-1200); });
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
let socket;
try {
  let port;
  for (let i = 0; i < 900; i++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]); break; }
    catch { await pause(100); }
  }
  if (!port) throw new Error('Chrome did not start: ' + stderr);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((item) => item.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    const waiting = pending.get(message.id);
    if (waiting) { pending.delete(message.id); clearTimeout(waiting.timer); message.error ? waiting.reject(new Error(JSON.stringify(message.error))) : waiting.done(message.result); }
  });
  function call(method, params = {}) {
    return new Promise((done, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, 90000);
      pending.set(id, { done, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result?.value;
  }
  await call('Page.enable'); await call('Runtime.enable');
  const observations = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await call('Page.navigate', { url: `${base}/` });
    let ready = false;
    for (let i = 0; i < 240; i++) {
      ready = await evaluate("document.readyState === 'complete' && !!document.querySelector('.companion-hero') && document.querySelectorAll('.catalog-evidence-grid article').length === 2");
      if (ready) break;
      await pause(250);
    }
    if (!ready) throw new Error(`Home did not settle at ${width}px`);
    await evaluate("window.scrollTo(0, document.body.scrollHeight / 2)"); await pause(350);
    await evaluate("window.scrollTo(0, document.body.scrollHeight)"); await pause(350);
    await evaluate("window.scrollTo(0, 0)");
    for (let i = 0; i < 120; i++) {
      if (await evaluate("[...document.images].every(image => image.complete && !!image.naturalWidth)")) break;
      await pause(250);
    }
    const state = await evaluate("({width:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,heading:document.querySelector('.companion-hero h1')?.innerText,broken:[...document.images].filter(image=>!image.naturalWidth).map(image=>image.src),cardTop:[...document.querySelectorAll('.collection-card')].slice(0,2).map(el=>Math.round(el.getBoundingClientRect().top)),overflow:[...document.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'',right:Math.round(el.getBoundingClientRect().right)}))})");
    if (state.scrollWidth > width || state.broken.length || !state.heading?.includes('I made it') || (width <= 390 && state.cardTop[1] <= state.cardTop[0])) throw new Error(`Home layout ${width}px: ${JSON.stringify(state)}`);
    if (width === 1440 || width === 390) {
      const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
      await writeFile(join(output, `home-${width}.png`), Buffer.from(shot.data, 'base64'));
    }
    observations.push({ width, noOverflow: true, brokenImages: 0 });
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${base}/` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate("document.querySelector('.collection-card button') && !document.querySelector('.companion-projects').innerText.includes('Loading projects')")) break;
    await pause(250);
  }
  await evaluate("document.querySelector('.collection-card button').click()");
  for (let i = 0; i < 40; i++) {
    if (await evaluate("!!document.querySelector('.new-project-dialog button[type=submit]')")) break;
    await pause(250);
  }
  await evaluate("document.querySelector('.new-project-dialog button[type=submit]').click()");
  let created = false;
  for (let i = 0; i < 240; i++) {
    created = await evaluate("!!document.querySelector('.project-workspace') && location.search.includes('project=')");
    if (created) break;
    await pause(250);
  }
  if (!created) throw new Error('Project create did not reach the workspace');
  const projectName = await evaluate("document.querySelector('.project-head h1')?.textContent");
  if (projectName !== 'The circle skirt') throw new Error(`Unexpected project title: ${projectName}`);
  let sourceReady = false;
  for (let i = 0; i < 120; i++) {
    sourceReady = await evaluate("document.querySelector('.project-source-strip')?.textContent.includes('Sandy circle skirt')");
    if (sourceReady) break;
    await pause(250);
  }
  if (!sourceReady) throw new Error('Project did not show the current Sanity planning source');
  const pieceStudyReady = await evaluate("document.querySelector('.piece-study')?.textContent.includes('Skirt section') && document.querySelector('.piece-study')?.textContent.includes('Place on one fabric fold')");
  if (!pieceStudyReady) throw new Error('Current source did not show its linked educational fold study');
  await evaluate("document.querySelectorAll('input[name=skirt-construction][type=radio]')[1]?.click()");
  await evaluate("document.querySelectorAll('input[name=waistband-shape][type=radio]')[1]?.click()");
  const switchedPieces = await evaluate("document.querySelector('.piece-study')?.textContent.includes('Seamless skirt section') && document.querySelector('.piece-study')?.textContent.includes('Place on a double fold') && document.querySelector('.piece-study')?.textContent.includes('Curved waistband') && !document.querySelector('.piece-study-list')?.textContent.includes('Straight waistband')");
  if (!switchedPieces) throw new Error('Sandy option controls did not switch the source-derived cut list');
  const diagnosticReady = await evaluate("document.querySelector('.diagnostic-study')?.textContent.includes('On a short, sacrificial seam') && document.querySelector('.diagnostic-study')?.textContent.includes('Coats')");
  if (!diagnosticReady) throw new Error('Shared source-linked diagnostic did not appear on the current project');
  await evaluate("document.querySelectorAll('.diagnostic-choices button')[1]?.click()");
  const conditionalRemedy = await evaluate("document.querySelector('.diagnostic-outcome.possible-tension')?.textContent.includes('lower upper-thread tension')");
  if (!conditionalRemedy) throw new Error('Observed sample relief did not unlock only the scrap comparison');
  await evaluate("document.querySelectorAll('.diagnostic-choices button')[2]?.click()");
  const uncertainStops = await evaluate("!!document.querySelector('.diagnostic-outcome.unresolved') && !document.querySelector('.diagnostic-outcome')?.textContent.includes('lower upper-thread tension')");
  if (!uncertainStops) throw new Error('Unchanged sample still exposed the tension remedy');
  await evaluate("document.querySelector('.diagnostic-study-foot button')?.click()");
  if (!await evaluate("document.querySelector('.maker-journal textarea')?.value.includes('No visible change')")) throw new Error('Diagnostic observation did not prepare a project-basis journal note');
  const studyShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-piece-study-1440.png'), Buffer.from(studyShot.data, 'base64'));
  await evaluate("(()=>{window.__sourceFetch=window.fetch;window.fetch=(input,init)=>String(input).includes('/api/catalog')?Promise.reject(new Error('disposable source transport failure')):window.__sourceFetch(input,init);window.dispatchEvent(new Event('focus'));return true})()");
  let pausedOnFailure = false;
  for (let i = 0; i < 120; i++) {
    pausedOnFailure = await evaluate("!!document.querySelector('.source-binding.unavailable') && !document.querySelector('.piece-study') && !document.querySelector('.diagnostic-study')");
    if (pausedOnFailure) break;
    await pause(250);
  }
  if (!pausedOnFailure) {
    const state = await evaluate("({binding:[...document.querySelectorAll('.source-binding')].map(x=>x.className),study:[...document.querySelectorAll('.piece-study')].map(x=>({tag:x.tagName,connected:x.isConnected,parent:x.parentElement?.className,text:x.textContent?.slice(0,80)})),diagnostic:[...document.querySelectorAll('.diagnostic-study')].map(x=>({parent:x.parentElement?.className,text:x.textContent?.slice(0,80)})),appRoots:document.querySelectorAll('.companion-app').length,alert:document.querySelector('.project-alert')?.textContent})");
    throw new Error(`Source transport failure left cached guidance visible: ${JSON.stringify(state)}`);
  }
  await evaluate("(()=>{window.fetch=window.__sourceFetch;window.dispatchEvent(new Event('focus'));return true})()");
  let recoveredFromFailure = false;
  for (let i = 0; i < 120; i++) {
    recoveredFromFailure = await evaluate("!!document.querySelector('.source-binding.current') && !!document.querySelector('.piece-study') && !!document.querySelector('.diagnostic-study')");
    if (recoveredFromFailure) break;
    await pause(250);
  }
  if (!recoveredFromFailure) throw new Error('Source transport recovery did not restore the current piece study');
  const projectShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-1440.png'), Buffer.from(projectShot.data, 'base64'));
  await evaluate("document.querySelector('.save-row button').click()");
  let saved = false;
  for (let i = 0; i < 240; i++) {
    saved = await evaluate("document.querySelector('.project-topline')?.textContent.includes('revision 2')");
    if (saved) break;
    await pause(250);
  }
  if (!saved) throw new Error('Project revision save did not complete');
  await evaluate("(()=>{const field=document.querySelector('.maker-journal textarea');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(field,'I tested a sample seam and need to check the edge finish.');field.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  let noteReady = false;
  for (let i = 0; i < 80; i++) {
    noteReady = await evaluate("!!document.querySelector('.journal-add:not(:disabled)')");
    if (noteReady) break;
    await pause(250);
  }
  if (!noteReady) throw new Error('Journal entry did not become ready');
  await evaluate("document.querySelector('.journal-add').click()");
  let noted = false;
  for (let i = 0; i < 240; i++) {
    noted = await evaluate("document.querySelector('.journal-list')?.textContent.includes('I tested a sample seam')");
    if (noted) break;
    await pause(250);
  }
  if (!noted) throw new Error('Journal note was not saved');
  await call('Page.reload');
  let resumed = false;
  for (let i = 0; i < 240; i++) {
    resumed = await evaluate("document.querySelector('.project-topline')?.textContent.includes('revision 2') && document.querySelector('.journal-list')?.textContent.includes('I tested a sample seam')");
    if (resumed) break;
    await pause(250);
  }
  if (!resumed) throw new Error('Saved project and note did not resume after reload');
  const journalShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-journal-1440.png'), Buffer.from(journalShot.data, 'base64'));
  await evaluate("(()=>{const previous=URL.createObjectURL;URL.createObjectURL=function(blob){window.__stitchesBackupBlob=blob;return previous.call(URL,blob)};document.querySelector('.project-topline button:last-child').click();return true})()");
  const backup = await evaluate("(async()=>JSON.parse(await window.__stitchesBackupBlob.text()))()");
  if (backup.version !== 2 || backup.notes?.length !== 1 || !backup.knowledgeFingerprint) throw new Error('Downloaded backup omitted the journal or source binding');
  backup.knowledgeFingerprint = '0'.repeat(64); // Disposable import rehearsal of a prior Sanity source revision.
  await evaluate("document.querySelector('.project-topline button:first-child').click()");
  for (let i = 0; i < 80; i++) {
    if (await evaluate("!!document.querySelector('.import-backup input')")) break;
    await pause(250);
  }
  const backupLiteral = JSON.stringify(JSON.stringify(backup));
  await evaluate(`(()=>{const input=document.querySelector('.import-backup input');const transfer=new DataTransfer();transfer.items.add(new File([${backupLiteral}],'stitches-backup.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  let imported = false;
  for (let i = 0; i < 240; i++) {
    imported = await evaluate("document.querySelector('.project-notice')?.textContent.includes('including its journal') && document.querySelector('.journal-list')?.textContent.includes('Imported source revision')");
    if (imported) break;
    await pause(250);
  }
  if (!imported) throw new Error('Backup import did not restore the journal and provenance');
  const staleBinding = await evaluate("document.querySelector('.source-binding.stale')?.textContent.includes('Source changed')");
  if (!staleBinding) throw new Error('Outdated source binding was not shown as stale');
  if (await evaluate("!!document.querySelector('.piece-study') || !!document.querySelector('.diagnostic-study')")) throw new Error('Stale source still exposed source-linked teaching');
  const staleShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-source-stale-1440.png'), Buffer.from(staleShot.data, 'base64'));
  await evaluate("document.querySelector('.source-binding button').click()");
  let refreshed = false;
  for (let i = 0; i < 240; i++) {
    refreshed = await evaluate("document.querySelector('.source-binding.current')?.textContent.includes('bound to the current') && document.querySelector('.project-topline')?.textContent.includes('revision 2')");
    if (refreshed) break;
    await pause(250);
  }
  if (!refreshed) throw new Error('Source rebase did not restore the current binding');
  if (!await evaluate("!!document.querySelector('.piece-study') && !!document.querySelector('.diagnostic-study')")) throw new Error('Rebased source did not restore linked teaching');
  const recoveredShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-source-recovered-1440.png'), Buffer.from(recoveredShot.data, 'base64'));
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  const mobileProject = await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'',right:Math.round(el.getBoundingClientRect().right)}))})");
  if (mobileProject.scrollWidth > 390) throw new Error(`Project mobile overflow: ${JSON.stringify(mobileProject)}`);
  const mobileShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-390.png'), Buffer.from(mobileShot.data, 'base64'));
  if (errors.length) throw new Error(`Browser runtime errors: ${JSON.stringify(errors)}`);
  const report = { kind: 'production-nextjs-ui', checkedAt: new Date().toISOString(), base, observations, sanityCatalog: { exactContentLakeCards: 2, projectSourceShown: sourceReady, educationalPieceStudy: pieceStudyReady, conditionalPiecesSwitched: switchedPieces, sharedPendingDiagnostic: diagnosticReady, conditionalScrapRemedy: conditionalRemedy, unresolvedPathStops: uncertainStops, simulatedTransportFailurePausedAdvice: pausedOnFailure, simulatedTransportRecovery: recoveredFromFailure, staleBindingObserved: staleBinding, sourceRebased: refreshed, contextKbRebuild: false }, projectJourney: { created, saved, noted, resumed, backupVersion: 2, imported, mobileNoOverflow: true }, runtimeErrors: errors, screenshots: ['home-1440.png', 'home-390.png', 'project-1440.png', 'project-piece-study-1440.png', 'project-journal-1440.png', 'project-source-stale-1440.png', 'project-source-recovered-1440.png', 'project-390.png'], notVerified: ['cut-ready geometry', 'maker review', 'agent', 'Sanity Context revalidation', 'keyboard and screen-reader audit'] };
  await writeFile(join(root, 'evidence', 'companion-runtime-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { socket?.close(); chrome.kill(); }
