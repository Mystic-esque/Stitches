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
    if (!ready) {
      const failure = await evaluate("(async()=>({url:location.href,readyState:document.readyState,hero:!!document.querySelector('.companion-hero'),catalogCards:document.querySelectorAll('.catalog-evidence-grid article').length,body:document.body.innerText.slice(0,2200),catalog:await fetch('/api/catalog',{signal:AbortSignal.timeout(12000)}).then(async response=>({status:response.status,body:await response.json()})).catch(error=>({error:error.name}))}))()");
      const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
      await writeFile(join(output, `home-readiness-failed-${width}.png`), Buffer.from(shot.data, 'base64'));
      await writeFile(join(root, 'evidence', 'companion-runtime-home-failure.json'), JSON.stringify({ checkedAt: new Date().toISOString(), passed: false, errors, failure }, null, 2));
      throw new Error(`Home did not settle at ${width}px; actual page/catalog failure capture saved`);
    }
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
  // Save a real local scrap history through the rendered controls; reports are synthetic, not maker trials.
  await evaluate("document.querySelectorAll('.diagnostic-choices button')[1].click()");
  await evaluate("[...document.querySelectorAll('.diagnostic-actions button')].find(x=>x.textContent.includes('Save scrap')).click()");
  for (let i = 0; i < 240; i++) { if (await evaluate("document.querySelectorAll('.diagnostic-history li').length === 1")) break; await pause(250); }
  if (!await evaluate("document.querySelectorAll('.diagnostic-history li').length === 1")) throw new Error('Scrap observation did not persist');
  await evaluate("[...document.querySelectorAll('.diagnostic-actions button')].find(x=>x.textContent.includes('Start source-linked')).click()");
  for (let i = 0; i < 240; i++) { if (await evaluate("!!document.querySelector('[aria-label=\"Comparison result\"]')")) break; await pause(250); }
  await evaluate("[...document.querySelectorAll('.diagnostic-actions button')].find(x=>x.textContent.includes('No improvement')).click()");
  for (let i = 0; i < 240; i++) { if (await evaluate("document.querySelectorAll('.diagnostic-history li').length === 3")) break; await pause(250); }
  if (!await evaluate("document.querySelectorAll('.diagnostic-history li').length === 3 && !document.querySelector('.diagnostic-outcome')?.textContent.includes('lower upper-thread tension')")) throw new Error('Unsuccessful scrap outcome did not stop advice and preserve three separate events');
  await call('Page.reload');
  for (let i = 0; i < 240; i++) { if (await evaluate("document.querySelectorAll('.diagnostic-history li').length === 3 && !!document.querySelector('.diagnostic-outcome.unresolved')")) break; await pause(250); }
  if (!await evaluate("document.querySelectorAll('.diagnostic-history li').length === 3 && !!document.querySelector('.diagnostic-outcome.unresolved')")) throw new Error('Scrap history/stop state did not survive reload');
  if (!await evaluate("document.querySelector('.preparation-plan li[data-state=blocked]')?.textContent.includes('Do not cut') && document.querySelector('.preparation-next')?.textContent.includes('Still to record')")) throw new Error('Preparation did not identify missing source-listed notes or preserve the cutting gate');
  await evaluate("(()=>{const previous=URL.createObjectURL;URL.createObjectURL=blob=>{window.__planningBrief=blob;return previous.call(URL,blob)};document.querySelector('.preparation-heading button').click();URL.createObjectURL=previous;return true})()");
  const brief = await evaluate("window.__planningBrief.text()");
  if (!brief.includes('NOT a sewing pattern') || !brief.includes('Maker reported no improvement') || !brief.includes('PRIVATE PLANNING BRIEF')) throw new Error('Plain-text planning brief omitted limitations or saved scrap results');
  await evaluate("document.querySelector('.preparation-next button').click()");
  if (!await evaluate("document.activeElement?.name === 'measure-waist'")) throw new Error('Preparation review action did not focus the first missing exact measurement');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    if (await evaluate("document.documentElement.scrollWidth > innerWidth")) throw new Error(`Scrap history overflow at ${width}`);
    if (width === 1440 || width === 390) {
      await evaluate("document.querySelector('.diagnostic-history').scrollIntoView()");
      await pause(250);
      const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      await writeFile(join(output, `diagnostic-history-${width}.png`), Buffer.from(shot.data, 'base64'));
      await evaluate("document.querySelector('.preparation-plan').scrollIntoView()"); await pause(250);
      const prepShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      await writeFile(join(output, `preparation-plan-${width}.png`), Buffer.from(prepShot.data, 'base64'));
    }
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
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
  if (!await evaluate("document.querySelectorAll('.diagnostic-history li').length === 3 && document.querySelector('.diagnostic-history').textContent.includes('guidance paused')")) throw new Error('Source outage hid or relabeled saved scrap history');
  await evaluate("document.querySelector('.history-pause').click()");
  for (let i = 0; i < 240; i++) { if (await evaluate("document.querySelectorAll('.diagnostic-history li').length === 4")) break; await pause(250); }
  if (!await evaluate("document.querySelectorAll('.diagnostic-history li').length === 4 && document.querySelector('.diagnostic-history').textContent.includes('Paused this check')")) throw new Error('Source outage prevented a private pause fact');
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
  if (await evaluate("document.querySelectorAll('.measurement-plan .measurement-grid input').length") !== 4) throw new Error('Sandy did not expose its four exact source-listed measurements');
  for (const [key, value] of Object.entries({ waist: '72', hips: '96', waistToFloor: '100', waistToHips: '20' }))
    await evaluate(`(()=>{const field=document.querySelector('[name="measure-${key}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,${JSON.stringify(value)});field.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
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
  if (backup.version !== 3 || backup.notes?.length !== 1 || backup.diagnostics?.length !== 4 || !backup.knowledgeFingerprint) throw new Error('Downloaded backup omitted the journal, scrap history or source binding');
  if (!Object.entries({ waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 }).every(([key, value]) => backup.plan.measurementsMm[key] === value)) throw new Error('Source-listed body notes did not survive save/reload/export with mm units');
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
  if (!await evaluate("document.querySelectorAll('.diagnostic-history li').length === 4 && document.querySelector('.diagnostic-history').textContent.includes('Imported history · not verified')")) throw new Error('Backup import lost or trusted scrap history');
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
  const tinaId = await evaluate("(async()=>{const response=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Disposable angular notes rehearsal',brief:'Synthetic measurements only.',source:{kind:'candidate',designId:'tina'},plan:{features:[],openQuestions:[],measurementsMm:{bust:900,hip:1000,specialistLength:100.3},measurementsDegrees:{shoulderSlope:14},fabric:{description:'',widthMm:null,lengthMm:null,structure:'unknown'},equipment:[]},idempotencyKey:crypto.randomUUID()})});const data=await response.json();if(!response.ok)throw new Error(data.message);return data.project.id})()");
  await call('Page.navigate', { url: `${base}/?project=${tinaId}` });
  let measurementsReady = false;
  for (let i = 0; i < 240; i++) {
    measurementsReady = await evaluate("document.querySelectorAll('.measurement-plan .measurement-grid input').length===14 && document.querySelector('[name=measure-shoulderSlope]')?.value==='14'");
    if (measurementsReady) break;
    await pause(250);
  }
  if (!measurementsReady) throw new Error('Tina did not show all fourteen source-specific fields and the saved degree value');
  await evaluate("(()=>{const field=document.querySelector('[name=measure-shoulderSlope]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,'15.25');field.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  await evaluate("document.querySelector('.save-row button').click()");
  let angularSaved = false;
  for (let i = 0; i < 240; i++) {
    angularSaved = await evaluate("document.querySelector('.project-topline')?.textContent.includes('revision 2')");
    if (angularSaved) break;
    await pause(250);
  }
  if (!angularSaved) throw new Error('Angular measurement revision did not save');
  const measuredPlan = await evaluate(`(async()=>{const response=await fetch('/api/projects/${tinaId}');return (await response.json()).project.plan})()`);
  if (measuredPlan.measurementsDegrees?.shoulderSlope !== 15.25 || measuredPlan.measurementsMm.shoulderSlope !== undefined ||
      measuredPlan.measurementsMm.specialistLength !== 100.3 || measuredPlan.measurementsMm.bust !== 900 || measuredPlan.measurementsMm.hip !== 1000)
    throw new Error('Degree units or unexposed legacy/private measurement preservation failed');
  const measurementLayouts = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    const layout = await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,fields:document.querySelectorAll('.measurement-plan .measurement-grid input').length})");
    if (layout.scrollWidth > width || layout.fields !== 14) throw new Error('Measurement layout failed: ' + JSON.stringify(layout));
    if (width === 1440 || width === 390) {
      await evaluate(width === 1440 ? "document.querySelector('.measurement-plan').scrollIntoView()" : "document.querySelector('[name=measure-shoulderSlope]').scrollIntoView({block:'center'})");
      const screenshot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
      await writeFile(join(output, `project-measurements-tina-${width}.png`), Buffer.from(screenshot.data, 'base64'));
    }
    measurementLayouts.push({ width, noOverflow: true, sourceFields: 14 });
  }
  const measurementJourney = { sourceSpecificSandyFields: 4, savedLengthsInMm: true, reloadAndBackupPreservedLengths: true,
    sourceSpecificTinaFields: 14, angularUnitsPreserved: angularSaved, unexposedLegacyNotesPreserved: true, layouts: measurementLayouts };
  if (errors.length) throw new Error(`Browser runtime errors: ${JSON.stringify(errors)}`);
  const report = { kind: 'production-nextjs-ui', checkedAt: new Date().toISOString(), base, observations, sanityCatalog: { exactContentLakeCards: 2, projectSourceShown: sourceReady, educationalPieceStudy: pieceStudyReady, conditionalPiecesSwitched: switchedPieces, sharedPendingDiagnostic: diagnosticReady, conditionalScrapRemedy: conditionalRemedy, unresolvedPathStops: uncertainStops, simulatedTransportFailurePausedAdvice: pausedOnFailure, simulatedTransportRecovery: recoveredFromFailure, staleBindingObserved: staleBinding, sourceRebased: refreshed, contextKbRebuild: false }, projectJourney: { created, saved, noted, resumed, backupVersion: 2, imported, mobileNoOverflow: true }, runtimeErrors: errors, screenshots: ['home-1440.png', 'home-390.png', 'project-1440.png', 'project-piece-study-1440.png', 'project-journal-1440.png', 'project-source-stale-1440.png', 'project-source-recovered-1440.png', 'project-390.png'], notVerified: ['cut-ready geometry', 'maker review', 'agent', 'Sanity Context revalidation', 'keyboard and screen-reader audit'] };
  report.measurementJourney = measurementJourney;
  // Real profile form/copy/backup journey, in this disposable guest only. No maker or provider claim.
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  async function waitFor(expression, label) {
    for (let i = 0; i < 240; i++) { if (await evaluate(expression)) return; await pause(250); }
    throw new Error(label);
  }
  await waitFor("!!document.querySelector('[name=profile-name]') && !document.querySelector('.maker-profile-panel fieldset').disabled", 'Profile form unavailable');
  const profileSummaryFocused = await evaluate("(()=>{const s=document.querySelector('.maker-profile-panel>details>summary');s.focus();return document.activeElement===s})()");
  if (!profileSummaryFocused) throw new Error('Native profile summary did not receive focus');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitFor("document.querySelector('.maker-profile-panel>details').open", 'Keyboard did not open native profile summary');
  await evaluate("document.querySelector('.profile-body').open=true;(()=>{const change=(name,value)=>{const el=document.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor((el.tagName==='SELECT'?HTMLSelectElement:el.tagName==='TEXTAREA'?HTMLTextAreaElement:HTMLInputElement).prototype,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};change('profile-name','Synthetic maker notebook');change('profile-experience','comfortable');change('profile-equipment','Machine\\nIron');change('profile-measure-waist','72');change('profile-measure-shoulderSlope','17.25');})()");
  await evaluate("document.querySelector('.maker-profile-panel form button[type=submit]').click()");
  await waitFor("document.querySelector('.maker-profile-panel [role=status]')?.textContent.includes('Profile revision 1 saved')", 'Profile did not save');
  const initialProfile = await evaluate("(async()=>{const r=await fetch('/api/profile');return (await r.json()).profile})()");
  if (initialProfile.name !== 'Synthetic maker notebook' || initialProfile.experience !== 'comfortable' || initialProfile.measurementsMm.waist !== 720 || initialProfile.measurementsDegrees.shoulderSlope !== 17.25) throw new Error('Multi-field profile input lost a value or changed its units');
  const profileProjectId = await evaluate("(async()=>{const r=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Synthetic profile copy',brief:'No personal values.',source:{kind:'own_idea'},plan:{features:[],openQuestions:[],measurementsMm:{waist:780},measurementsDegrees:{shoulderSlope:0},fabric:{description:'',widthMm:null,lengthMm:null,structure:'unknown'},equipment:['Iron']},idempotencyKey:crypto.randomUUID()})});return (await r.json()).project.id})()");
  await call('Page.navigate', { url: `${base}/?project=${profileProjectId}` });
  await waitFor("document.querySelector('.profile-copy-preview')?.textContent.includes('waist: kept 78 cm')", 'Copy preview did not retain conflicting waist');
  await evaluate("document.querySelector('.maker-profile-panel>details').open=true");
  if (!await evaluate("document.querySelector('.profile-copy-preview')?.textContent.includes('shoulderSlope: kept 0 degrees')")) throw new Error('Zero angle disappeared from review');
  await evaluate("document.querySelector('.profile-copy button').click()");
  await waitFor("document.querySelector('.project-topline')?.textContent.includes('revision 2')", 'Explicit profile copy did not create a revision');
  const copiedProfileProject = await evaluate(`(async()=>{const r=await fetch('/api/projects/${profileProjectId}');return (await r.json()).project})()`);
  if (copiedProfileProject.plan.measurementsMm.waist !== 780 || copiedProfileProject.plan.measurementsDegrees.shoulderSlope !== 0 || copiedProfileProject.plan.profileBasis.sequence !== 1 || copiedProfileProject.plan.equipment.length !== 2) throw new Error('Copied profile values/basis wrong');
  await evaluate("document.querySelector('.profile-body').open=true;(()=>{const e=document.querySelector('[name=profile-measure-waist]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'80');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  if (!await evaluate("document.querySelector('.profile-copy button').disabled")) throw new Error('Unsaved profile enabled copying');
  await evaluate("document.querySelector('.maker-profile-panel form button[type=submit]').click()");
  await waitFor("document.querySelector('.maker-profile-panel [role=status]')?.textContent.includes('Profile revision 2 saved')", 'Edited profile did not save');
  const projectIndependent = await evaluate(`(async()=>{const r=await fetch('/api/projects/${profileProjectId}');const p=(await r.json()).project;return p.sequence===2&&p.plan.measurementsMm.waist===780&&p.plan.profileBasis.sequence===1})()`);
  if (!projectIndependent) throw new Error('Profile edit silently changed project');
  const privateBackup = await evaluate("(async()=>{const original=URL.createObjectURL;let blob;URL.createObjectURL=(value)=>{blob=value;return original(value)};document.querySelectorAll('.profile-actions button')[1].click();URL.createObjectURL=original;return JSON.parse(await blob.text())})()");
  if (privateBackup.profile.measurementsMm.waist !== 800 || privateBackup.profile.measurementsDegrees.shoulderSlope !== 17.25 || privateBackup.profile.id !== undefined) throw new Error('Private profile backup units/format wrong');
  const importedProfile = { ...privateBackup, profile: { ...privateBackup.profile, name: 'Restored synthetic notes' } };
  await evaluate(`(()=>{const file=new File([JSON.stringify(${JSON.stringify(importedProfile)})],'maker.json',{type:'application/json'});const transfer=new DataTransfer();transfer.items.add(file);const input=document.querySelector('.profile-actions input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await waitFor("document.querySelector('.maker-profile-panel [role=status]')?.textContent.includes('Backup loaded for review only')", 'Import did not enter review');
  if (await evaluate("(async()=>{const r=await fetch('/api/profile');return (await r.json()).profile.sequence})()") !== 2) throw new Error('Backup import saved without review');
  await evaluate("document.querySelector('.maker-profile-panel form button[type=submit]').click()");
  await waitFor("document.querySelector('.maker-profile-panel [role=status]')?.textContent.includes('Profile revision 3 saved')", 'Reviewed backup did not save');
  await call('Page.navigate', { url: `${base}/?project=${profileProjectId}` });
  await waitFor("document.querySelector('.profile-copy-preview')?.textContent.includes('waist: kept 78 cm')", 'Profile did not resume');
  await evaluate("document.querySelector('.maker-profile-panel>details').open=true;document.querySelector('.profile-body').open=false");
  // Use actual computed foreground/background colours, not a design-token assertion. Legacy demo dark mode must not leak.
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  const profileContrast = await evaluate(`(()=>{
    const luminance=(rgb)=>{const c=rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
    const rgb=(text)=>text.match(/[\\d.]+/g).map(Number);
    const selectors=['.profile-copy h3','.profile-copy-preview h4','.profile-copy-preview p','.profile-copy-preview li','.profile-actions label','.profile-body summary','.profile-copy .companion-kicker'];
    return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].map(el=>{let at=el,bg;while(at){bg=rgb(getComputedStyle(at).backgroundColor);if(bg.length===3||bg[3]!==0)break;at=at.parentElement}const foreground=luminance(rgb(getComputedStyle(el).color)),background=luminance(bg);return {selector,ratio:(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)}}));
  })()`);
  if (profileContrast.length<7 || profileContrast.some(item=>item.ratio<4.5)) throw new Error('Profile text contrast failed: '+JSON.stringify(profileContrast));
  const profileLayouts = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await evaluate("document.querySelector('.profile-copy').scrollIntoView({block:'center'})");
    const layout = await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,inputs:document.querySelectorAll('.maker-profile-panel input[type=number]').length})");
    if (layout.scrollWidth > width || layout.inputs !== 19) throw new Error('Profile layout failed: '+JSON.stringify(layout));
    if (width === 1440 || width === 390) {
      const screenshot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
      await writeFile(join(output, `maker-profile-copy-${width}.png`), Buffer.from(screenshot.data, 'base64'));
    }
    await evaluate("document.querySelector('.profile-body').open=true");
    if (await evaluate("document.documentElement.scrollWidth") > width) throw new Error('Expanded profile body notes overflow');
    await evaluate("document.querySelector('.profile-body').open=false");
    profileLayouts.push({ width, expandedAndCollapsedNoOverflow: true });
  }
  if (errors.length) throw new Error(`Browser runtime errors: ${JSON.stringify(errors)}`);
  report.makerProfile = { savedViaForm: true, keyboardSummaryOpened: true, explicitCopy: true, conflictsAndZeroPreserved: true,
    unsavedCopyRefused: true, projectIndependent, plainPrivateBackup: true, importReviewedBeforeSaving: true, resumed: true, layouts: profileLayouts, contrastPreference: 'dark', textContrast: profileContrast };
  // Disposable response delay demonstrates that an in-flight copy cannot discard a newly typed brief.
  await evaluate("window.profileOriginalFetch=window.fetch;window.fetch=async(...args)=>{const r=await window.profileOriginalFetch(...args);if(String(args[0]).endsWith('/profile')&&args[1]?.method==='POST')await new Promise(done=>setTimeout(done,2000));return r};document.querySelector('.profile-copy button').click()");
  await evaluate("(()=>{const el=document.querySelector('.project-form textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Unsaved edit during profile copy');el.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await waitFor("document.querySelector('.project-topline')?.textContent.includes('revision 3')", 'Delayed profile copy did not finish');
  const concurrentDraftPreserved = await evaluate("document.querySelector('.project-form textarea').value==='Unsaved edit during profile copy' && document.querySelector('.journal-warning')?.textContent.includes('Save your plan')");
  await evaluate("window.fetch=window.profileOriginalFetch;delete window.profileOriginalFetch");
  if (!concurrentDraftPreserved) throw new Error('Profile response erased an in-flight brief edit');
  report.makerProfile.concurrentDraftPreserved = concurrentDraftPreserved;
  report.projectJourney.backupVersion = backup.version;
  report.scrapHistory = { savedObservationAttemptResult: true, unsuccessfulStopsAdvice: true, reloadPersistence: true,
    sourceOutageRetainsHistory: true, pauseDuringSourceTransportFailure: true, untrustedRestore: true, fiveWidthNoOverflow: true, syntheticNotMakerTrial: true };
  report.screenshots.push('diagnostic-history-1440.png', 'diagnostic-history-390.png');
  report.preparation = { missingSourceNotesIdentified: true, cuttingRemainsBlocked: true, plainTextBriefDownloaded: true, savedScrapResultsIncluded: true, fiveWidthNoOverflow: true };
  report.screenshots.push('preparation-plan-1440.png', 'preparation-plan-390.png');
  if (errors.length) throw new Error(`Browser runtime errors: ${JSON.stringify(errors)}`);
  report.screenshots.push('maker-profile-copy-1440.png', 'maker-profile-copy-390.png');
  report.screenshots.push('project-measurements-tina-1440.png', 'project-measurements-tina-390.png');
  await writeFile(join(root, 'evidence', 'companion-runtime-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { socket?.close(); chrome.kill(); }
