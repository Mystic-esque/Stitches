import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..'), base = process.env.STITCHES_BASE_URL ?? 'http://127.0.0.1:3100', origin = new URL(base).origin;
const output = join(root, 'evidence/screenshots/making'); await mkdir(output, { recursive: true });
const report = { kind: 'actual-production-construction-api-and-browser', checkedAt: new Date().toISOString(), passed: false,
  syntheticPrivateGuests: true, source: 'actual-Stitches-development-Content-Lake', providerRequests: 0, sanityWrites: 0,
  kbBuildNotProvedByThisHarness: true, physicalWorkNotClaimed: true };
async function api(path, { cookie, method = 'GET', body, raw, foreign = false } = {}) {
  const response = await fetch(new URL(path, base), { method, headers: { ...(cookie ? { Cookie: cookie } : {}),
    ...(body !== undefined || raw !== undefined ? { Origin: foreign ? 'https://foreign.invalid' : origin, 'Content-Type': 'application/json' } : {}) },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)), signal: AbortSignal.timeout(45000) });
  return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() };
}
let chrome, socket;
try {
  const guest = await api('/api/projects'), stranger = await api('/api/projects'); assert.ok(guest.cookie && stranger.cookie);
  const catalogResponse = await api('/api/catalog');
  assert.equal(catalogResponse.status, 200, 'The live catalog must be available before this rehearsal can run.');
  const catalog = catalogResponse.data.cards; assert.equal(catalog.length, 2);
  const projects = [];
  for (const designId of ['sandy', 'tina']) {
    const created = await api('/api/projects', { cookie: guest.cookie, method: 'POST', body: {
      title: `Synthetic ${designId} construction study`, brief: 'No physical garment or maker qualification claim.',
      source: { kind: 'candidate', designId }, idempotencyKey: randomUUID() } }); assert.equal(created.status, 201);
    projects.push(created.data.project);
  }
  const tina = projects[1], path = `/api/projects/${tina.id}/making`, source = catalog.find(card => card.designKey === 'tina');
  const loaded = await api(path, { cookie: guest.cookie }); assert.equal(loaded.status, 200);
  const plan = loaded.data.plan; assert.equal(plan.capability, 'plan_only'); assert.equal(plan.reviewStatus, 'pending'); assert.equal(plan.steps.length, 8);
  const input = (event, sequence) => ({ expectedProjectSequence: tina.sequence, expectedBasisHash: tina.basisHash,
    expectedHistorySequence: sequence, planFingerprint: plan.fingerprint, event, idempotencyKey: randomUUID() });
  const configured = input({ kind: 'configured', options: { sleeves: false, frontBottom: false, dart: false } }, 0);
  assert.equal((await api(path, { cookie: stranger.cookie })).status, 404);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: configured, foreign: true })).status, 403);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', raw: ' '.repeat(5000) })).status, 413);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: { ...configured, arbitraryPath: 'M0 0' } })).status, 400);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: configured })).status, 200);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: configured })).status, 200);
  assert.equal((await api(path, { cookie: guest.cookie })).data.history.length, 1);
  const step = key => `${plan.id}-${key}`;
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: input({ kind: 'reviewed', stepId: step('sides'), checkpointConfirmed: true }, 1) })).status, 400);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: input({ kind: 'help_requested', stepId: step('marks'), symptom: 'seam_puckering', detail: 'No seam at this markings step.' }, 1) })).status, 400);
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: input({ kind: 'reviewed', stepId: step('marks'), checkpointConfirmed: true }, 1) })).status, 200);
  const help = await api(path, { cookie: guest.cookie, method: 'POST', body: input({ kind: 'help_requested', stepId: step('shoulders'), symptom: 'seam_puckering', detail: 'Synthetic sample question, no physical claim.' }, 2) }); assert.equal(help.status, 200);
  const diagnosticInput = { expectedProjectSequence: tina.sequence, expectedBasisHash: tina.basisHash,
    expectedHistorySequence: 0, expectedDiagnosticFingerprint: source.diagnosticStudy.fingerprint,
    event: { kind: 'observation', observation: 'not-tested', detail: 'Synthetic untested scrap, not an actual maker observation.' }, idempotencyKey: randomUUID(), makingEventId: help.data.record.id };
  const observed = await api(`/api/projects/${tina.id}/diagnostics`, { cookie: guest.cookie, method: 'POST', body: diagnosticInput }); assert.equal(observed.status, 201);
  assert.equal(observed.data.record.binding.makingContext.stepId, step('shoulders'));
  assert.equal((await api(path, { cookie: guest.cookie, method: 'POST', body: input({ kind: 'reviewed', stepId: step('shoulders'), checkpointConfirmed: true }, 3) })).status, 200);
  assert.equal((await api(`/api/projects/${tina.id}/diagnostics`, { cookie: guest.cookie, method: 'POST', body: { ...diagnosticInput, expectedHistorySequence: 1, idempotencyKey: randomUUID() } })).status, 409);
  const backup = (await api(`/api/projects/${tina.id}/backup`, { cookie: guest.cookie })).data.backup;
  assert.equal(backup.version, 4); assert.equal(backup.making.length, 4); assert.equal(backup.diagnostics.length, 1);
  const imported = await api('/api/projects/import', { cookie: guest.cookie, method: 'POST', body: { backup, idempotencyKey: randomUUID() } }); assert.equal(imported.status, 201);
  const restored = await api(`/api/projects/${imported.data.project.id}/making`, { cookie: guest.cookie });
  assert.ok(restored.data.history.every(entry => entry.imported));
  assert.equal((await api(`/api/projects/${tina.id}/backup`, { cookie: stranger.cookie })).status, 404);
  assert.deepEqual((await api(`/api/projects/${tina.id}`, { cookie: guest.cookie })).data.project, tina);
  report.api = { distinctStepCounts: [5, 8], exactPendingSourceGraph: true, conditionalPrerequisites: true,
    ownerOriginStrictBounds: true, privateIdempotency: true, currentStepDiagnosticBinding: true,
    staleStepContextDenied: true, v4ImportedFactsNeverAuthority: true, privateProjectUnchanged: true };

  const profile = await mkdtemp(join(tmpdir(), 'stitches-making-browser-'));
  chrome = spawn(process.env.CHROME_EXE ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const pause = ms => new Promise(done => setTimeout(done, ms)); let port;
  for (let i = 0; i < 600; i++) { try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]); break; } catch { await pause(100); } } assert.ok(port);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(item => item.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0; const pending = new Map(), errors = [];
  socket.addEventListener('message', event => { const m = JSON.parse(event.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(item => String(item.value ?? item.description)).join(' ').slice(0, 1200));
    const item = pending.get(m.id); if (item) { pending.delete(m.id); clearTimeout(item.timer); m.error ? item.reject(Error(JSON.stringify(m.error))) : item.done(m.result); }
  });
  const call = (method, params = {}) => new Promise((done, reject) => { const id = ++sequence,
    timer = setTimeout(() => { pending.delete(id); reject(Error(method + ' timeout')); }, 60000); pending.set(id, { done, reject, timer }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value; };
  const wait = async expression => { for (let i = 0; i < 240; i++) { if (await evaluate(`Boolean(${expression})`)) return; await pause(250); } throw Error('UI wait failed: ' + expression); };
  const screenshot = async name => { const clip = await evaluate("(()=>{const view=new URLSearchParams(location.search).get('view');const selector=view==='pattern'?'.piece-study':view==='materials'?'.preparation-plan':'.making-workspace';const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()");
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true, clip }); await writeFile(join(output, name), Buffer.from(shot.data, 'base64')); };
  await call('Runtime.enable'); await call('Page.enable');
  await call('Network.setCookie', { name: guest.cookie.split('=')[0], value: guest.cookie.slice(guest.cookie.indexOf('=') + 1), url: base, httpOnly: true, sameSite: 'Lax' });
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${base}/?project=${projects[0].id}&view=make` }); await wait("document.querySelector('.making-config button')&&!document.querySelector('.making-config button').disabled");
  assert.ok(await evaluate("new URLSearchParams(location.search).get('view')==='make'"));
  const shellShot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(join(output, 'workspace-shell-1440.png'), Buffer.from(shellShot.data, 'base64'));
  await screenshot('workspace-make-1440.png');
  await evaluate("[...document.querySelectorAll('.studio-view-nav button')].find(b=>b.textContent.trim()==='Overview').click()");
  await wait("document.querySelector('.project-workspace')&&new URLSearchParams(location.search).get('view')==='overview'");
  await evaluate("[...document.querySelectorAll('.studio-view-nav button')].find(b=>b.textContent.trim()==='Fit & checks').click()");
  await wait("document.querySelector('.diagnostic-study')&&new URLSearchParams(location.search).get('view')==='check'");
  await evaluate("[...document.querySelectorAll('.studio-view-nav button')].find(b=>b.textContent.trim()==='Pattern').click()");
  await wait("document.querySelector('.piece-study')&&new URLSearchParams(location.search).get('view')==='pattern'");
  await screenshot('workspace-pattern-1440.png');
  await evaluate("[...document.querySelectorAll('.studio-view-nav button')].find(b=>b.textContent.trim()==='Materials').click()");
  await wait("document.querySelector('.preparation-plan')&&new URLSearchParams(location.search).get('view')==='materials'");
  await screenshot('workspace-materials-1440.png');
  await evaluate("history.back()");
  await wait("document.querySelector('.piece-study')&&new URLSearchParams(location.search).get('view')==='pattern'");
  await evaluate("history.forward()");
  await wait("document.querySelector('.preparation-plan')&&new URLSearchParams(location.search).get('view')==='materials'");
  await evaluate("[...document.querySelectorAll('.studio-view-nav button')].find(b=>b.textContent.trim()==='Make').click()");
  await wait("document.querySelector('.making-config button')&&!document.querySelector('.making-config button').disabled");
  await evaluate("document.querySelector('.making-config button').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await wait("document.querySelector('.making-layout')"); assert.equal(await evaluate("document.querySelectorAll('.making-rail li').length"), 5);
  // An actual save commits, but this disposable browser deliberately loses its response.
  await evaluate("window.stitchesMakingFetch=window.fetch;window.__lostMakingResponse=false;window.fetch=async(...a)=>{const response=await window.stitchesMakingFetch(...a);if(String(a[0]).endsWith('/making')&&a[1]?.method==='POST'&&!window.__lostMakingResponse){window.__lostMakingResponse=true;throw new TypeError('Injected lost save acknowledgement after actual local commit')}return response};document.querySelector('.making-checkpoint input').click()");
  await wait("document.querySelector('.making-actions button')&&!document.querySelector('.making-actions button').disabled");
  await evaluate("document.querySelector('.making-actions button').click()");
  await wait("document.querySelector('.making-foot [role=status]')?.textContent.includes('Injected lost save')"); await screenshot('making-lost-save-1440.png');
  const beforeRetry = await api(`/api/projects/${projects[0].id}/making`, { cookie: guest.cookie }); assert.equal(beforeRetry.data.history.length, 2);
  await evaluate("document.querySelector('.making-actions button').click()"); await wait("document.querySelector('#making-step-title')?.textContent==='Plan the opening'");
  const afterRetry = await api(`/api/projects/${projects[0].id}/making`, { cookie: guest.cookie }); assert.equal(afterRetry.data.history.length, 2); assert.deepEqual(beforeRetry.data.history, afterRetry.data.history);
  await evaluate("window.fetch=window.stitchesMakingFetch;delete window.stitchesMakingFetch");
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'dark' }] });
  const layouts = [];
  await evaluate("document.querySelector('.studio-agent-close')?.click()");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 });
    await evaluate("document.querySelector('.making-workspace').scrollIntoView()"); await pause(250);
    assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), `Overflow at ${width}`);
    assert.ok(await evaluate("[...document.querySelectorAll('.making-workspace button')].filter(b=>b.getBoundingClientRect().height>0).every(b=>b.getBoundingClientRect().height>=43)"), `Touch target at ${width}`);
    layouts.push({ width, noOverflow: true, minimum44pxButtons: true }); if ([1440, 390].includes(width)) await screenshot(`making-sandy-${width}.png`);
  }
  const contrast = await evaluate(`(()=>{const rgb=s=>s.match(/[\\d.]+/g).map(Number);const lum=rgb=>{const c=rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};return ['.making-badge','.making-action','.making-step-top>span','.making-checkpoint>span','.making-rail small','.making-pieces li span','.making-primary'].flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getBoundingClientRect().height>0).map(el=>{let at=el,bg;while(at){bg=rgb(getComputedStyle(at).backgroundColor);if(bg.length===3||bg[3]!==0)break;at=at.parentElement}const a=lum(rgb(getComputedStyle(el).color)),b=lum(bg);return {selector,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}}))})()`);
  assert.ok(contrast.length && contrast.every(item => item.ratio >= 4.5), JSON.stringify(contrast));
  // A source transport failure removes the live path but never the committed history.
  await evaluate("window.stitchesMakingFetch=window.fetch;window.fetch=(...a)=>String(a[0]).endsWith('/making')&&a[1]?.method!=='POST'?Promise.resolve(new Response(JSON.stringify({message:'Injected construction read interruption'}),{status:503,headers:{'Content-Type':'application/json'}})):window.stitchesMakingFetch(...a);document.querySelector('.making-foot button').click()");
  await wait("!document.querySelector('.making-layout')&&document.querySelector('.making-foot [role=status]')?.textContent.includes('could not be refreshed')");
  assert.ok(await evaluate("document.querySelector('.making-history summary').textContent.includes('2 entries')"));
  await evaluate("window.fetch=window.stitchesMakingFetch;delete window.stitchesMakingFetch;document.querySelector('.making-foot button').click()");
  await wait("document.querySelector('#making-step-title')?.textContent==='Plan the opening'");
  await call('Page.navigate', { url: `${base}/?project=${tina.id}&view=make` }); await wait("document.querySelector('.making-layout')&&document.querySelector('#making-step-title')?.textContent==='Follow the neckline binding'");
  assert.equal(await evaluate("document.querySelectorAll('.making-rail li').length"), 5);
  await screenshot('making-tina-390.png');
  await wait("document.querySelector('.making-rail>button:not([disabled])')");
  await evaluate("[...document.querySelectorAll('.making-rail>button')].find(b=>b.textContent.includes('version choices')).click()");
  await wait("document.querySelector('.making-config input')");
  await evaluate("document.querySelector('.making-config input').click()");
  await evaluate("document.querySelector('.making-config button').click()");
  await wait("document.querySelector('.making-rail')?.textContent.includes('0 / 6')");
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }); await screenshot('making-tina-1440.png');
  await call('Page.reload'); await wait("document.querySelector('.making-rail')?.textContent.includes('0 / 6')");
  await call('Page.navigate', { url: `${base}/?project=${imported.data.project.id}&view=make` }); await wait("document.querySelector('.making-config')&&document.querySelector('.making-history summary')?.textContent.includes('4 entries')");
  assert.equal(await evaluate("document.querySelectorAll('.making-layout').length"), 0);
  await evaluate("window.__stitchesDownloaded=[];const oldURL=URL.createObjectURL;URL.createObjectURL=b=>{window.__stitchesDownloaded.push(b);return oldURL.call(URL,b)};[...document.querySelectorAll('.project-topline button')].find(b=>b.textContent.includes('making brief')).click()");
  await wait("window.__stitchesDownloaded?.length===1");
  const brief = await evaluate("window.__stitchesDownloaded[0].text()"); assert.ok(brief.includes('PRIVATE MAKING BRIEF') && brief.includes('imported history') && brief.includes('No cut-ready'));
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
  await call('Page.navigate', { url: `${base}/?project=${projects[0].id}&view=pattern` });
  await wait("document.querySelector('.piece-study')&&document.querySelector('.studio-agent-dock')");
  assert.ok(await evaluate("document.querySelector('.studio-agent-dock').hidden"));
  assert.deepEqual(errors, []);
  report.browser = { layouts, contrast, nativeKeyboardConfiguration: true, confirmedConditionalReconfigurationPersists: true,
    fiveFocusViewsNavigate: true, browserHistoryRestoresWorkspaceView: true, freshMobileCompanionDefaultsClosed: true,
    actualCommittedSaveLostAcknowledgementExactReplayNoDuplicate: true, injectedReadFailurePreservesHistoryAndActualRecovery: true,
    restoredHistoryRequiresFreshConfiguration: true, plainPrivateBrief: true, runtimeErrors: errors };
  report.passed = true;
} catch (error) { report.failure = error.message;
  if (socket?.readyState === WebSocket.OPEN) {
    // Retain focused UI diagnostics for real harness failures, without cookies or owner data.
    try { const id = 999999; socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: "JSON.stringify({focus:document.activeElement?.outerHTML?.slice(0,500),making:document.querySelector('.making-workspace')?.textContent?.slice(0,6500)})", returnByValue: true } }));
      await new Promise(done => { const listener = event => { const m = JSON.parse(event.data); if (m.id === id) { report.failedUi = m.result?.result?.value; socket.removeEventListener('message', listener); done(); } }; socket.addEventListener('message', listener); setTimeout(done, 1000); });
    } catch { /* Failure remains a failure if capture is unavailable. */ }
  }
  throw error; }
finally { socket?.close(); chrome?.kill(); await writeFile(join(root, 'evidence/making-verification.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)); }
