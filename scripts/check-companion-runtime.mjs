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
      ready = await evaluate("document.readyState === 'complete' && !!document.querySelector('.companion-hero')");
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
  await call('Page.reload');
  let resumed = false;
  for (let i = 0; i < 240; i++) {
    resumed = await evaluate("document.querySelector('.project-topline')?.textContent.includes('revision 2')");
    if (resumed) break;
    await pause(250);
  }
  if (!resumed) throw new Error('Saved project did not resume after reload');
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  const mobileProject = await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'',right:Math.round(el.getBoundingClientRect().right)}))})");
  if (mobileProject.scrollWidth > 390) throw new Error(`Project mobile overflow: ${JSON.stringify(mobileProject)}`);
  const mobileShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(join(output, 'project-390.png'), Buffer.from(mobileShot.data, 'base64'));
  if (errors.length) throw new Error(`Browser runtime errors: ${JSON.stringify(errors)}`);
  const report = { kind: 'production-nextjs-ui', checkedAt: new Date().toISOString(), base, observations, projectJourney: { created, saved, resumed, mobileNoOverflow: true }, runtimeErrors: errors, screenshots: ['home-1440.png', 'home-390.png', 'project-1440.png', 'project-390.png'], notVerified: ['cut-ready geometry', 'maker review', 'agent', 'Sanity revalidation', 'keyboard and screen-reader audit'] };
  await writeFile(join(root, 'evidence', 'companion-runtime-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { socket?.close(); chrome.kill(); }
