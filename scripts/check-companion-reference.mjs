import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '..');
const html = join(root, 'design', 'stitches-companion.html');
const images = new Map([
  ['/hero-wrap-skirt.png', join(root, 'design', 'hero-wrap-skirt.png')],
  ['/card-utility-overshirt.png', join(root, 'design', 'card-utility-overshirt.png')],
]);
const server = createServer(async (req, res) => {
  const imagePath = images.get(new URL(req.url, 'http://127.0.0.1').pathname);
  res.writeHead(200, { 'Content-Type': imagePath ? 'image/png' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(await readFile(imagePath ?? html));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}/`;
const profile = await mkdtemp(join(tmpdir(), 'stitches-companion-'));
const output = join(root, 'design', 'screenshots', 'companion');
await mkdir(output, { recursive: true });
const chrome = spawn(process.env.CHROME_EXE ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let stderr = '';
chrome.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-1000); });
let socket;
const pause = ms => new Promise(done => setTimeout(done, ms));
try {
  let port;
  for (let i = 0; i < 900; i++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]); break; }
    catch { await pause(100); }
  }
  if (!port) throw new Error('Chrome did not start: ' + stderr);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let seq = 0; const pending = new Map(); const errors = []; const network = [];
  socket.addEventListener('message', event => {
    const m = JSON.parse(event.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent') network.push(m.params.request.url);
    const p = pending.get(m.id);
    if (p) { pending.delete(m.id); clearTimeout(p.timer); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.done(m.result); }
  });
  function call(method, params = {}) {
    return new Promise((done, reject) => {
      const id = ++seq; const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timeout')); }, 30000);
      pending.set(id, { done, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  }
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  const screens = ['home', 'project', 'pattern', 'make']; const widths = [1440, 1024, 768, 390, 320];
  const states = [];
  for (const width of widths) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    for (const screen of screens) {
      await call('Page.navigate', { url: base + '#' + screen });
      let ready = false;
      for (let i = 0; i < 80; i++) {
        ready = await evaluate(`document.readyState==='complete' && document.getElementById('${screen}')?.classList.contains('active')`);
        if (ready) break;
        await pause(70);
      }
      if (!ready) throw new Error(`screen not ready: ${screen}/${width}`);
      const state = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.querySelector('.view.active h1')?.textContent,brokenImages:[...document.images].filter(x=>!x.complete||!x.naturalWidth).length})`);
      if (state.scrollWidth > width || state.brokenImages) throw new Error(`layout failed ${screen}/${width}: ${JSON.stringify(state)}`);
      if ([1440, 390].includes(width)) {
        const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: screen === 'home', fromSurface: true });
        await writeFile(join(output, `${screen}-${width}.png`), Buffer.from(shot.data, 'base64'));
      }
      states.push({ screen, width, noOverflow: true });
    }
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: base + '#pattern' }); await pause(180);
  const selection = await evaluate(`(()=>{document.querySelector('[data-piece="back"]').click();const selected=document.querySelector('[data-piece="back"]').getAttribute('aria-pressed')==='true'&&document.getElementById('inspector-title').textContent==='Back';document.getElementById('show-original').click();const hidden=getComputedStyle(document.querySelector('.changed')).display==='none';document.getElementById('show-change').click();const restored=getComputedStyle(document.querySelector('.changed')).display!=='none';return {selected,hidden,restored}})()`);
  await call('Page.navigate', { url: base + '#make' }); await pause(180);
  const diagnostic = await evaluate(`(()=>{document.getElementById('stuck-button').click();const open=!document.getElementById('diagnostic-question').hidden;document.querySelector('[data-answer="no"]').click();const answer=document.getElementById('diagnostic-result').textContent.includes('No corrective cut');return {open,answer}})()`);
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const reducedMotion = await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.button')).transitionDuration==='0s'`);
  const outsideRequests = network.filter(x => !x.startsWith(base) && !x.startsWith('data:') && !x.startsWith('blob:'));
  if (Object.values(selection).some(x => !x) || Object.values(diagnostic).some(x => !x) || !reducedMotion || errors.length || outsideRequests.length) throw new Error(JSON.stringify({ selection, diagnostic, reducedMotion, errors, outsideRequests }));
  const report = { kind: 'design-reference-only', checkedAt: new Date().toISOString(), states, interactions: { selection, diagnostic, reducedMotion }, runtimeErrors: errors, externalRequests: outsideRequests, screenshots: '8 actual isolated Chrome captures', notVerified: ['production Next.js UI', 'qualified garment geometry', 'real agent/Sanity call', 'physical sewing', 'full keyboard/screen-reader audit'] };
  await writeFile(join(root, 'design', 'companion-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checkedStates: states.length, interactions: report.interactions, screenshots: output, errors, outsideRequests }, null, 2));
} finally { socket?.close(); chrome.kill(); server.close(); }
