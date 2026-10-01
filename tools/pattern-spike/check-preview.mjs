import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const output = resolve(import.meta.dirname, '../../evidence/pattern-engine');
const server = createServer(async (_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(await readFile(join(output, 'preview.html')));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}/`;
const profile = await mkdtemp(join(tmpdir(), 'stitches-engine-'));
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket, stderr = '';
chrome.stderr.on('data', (data) => { stderr = (stderr + data).slice(-1500); });
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
try {
  let port;
  for (let i = 0; i < 600; i++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]); break; }
    catch { await pause(100); }
  }
  assert.ok(port, 'Disposable Chrome startup timed out: ' + stderr);
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0; const pending = new Map(), errors = [], requests = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
    const waiter = pending.get(message.id);
    if (waiter) { pending.delete(message.id); clearTimeout(waiter.timer); message.error ? waiter.reject(new Error(JSON.stringify(message.error))) : waiter.done(message.result); }
  });
  const call = (method, params = {}) => new Promise((done, reject) => {
    const sequence = ++id;
    const timer = setTimeout(() => { pending.delete(sequence); reject(new Error(method + ' timed out')); }, 45000);
    pending.set(sequence, { done, reject, timer }); socket.send(JSON.stringify({ id: sequence, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true });
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  const states = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: base });
    for (let i = 0; i < 100; i++) { if (await evaluate("document.querySelectorAll('.piece svg').length===2")) break; await pause(100); }
    const state = await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,parts:document.querySelectorAll('.piece svg').length,warning:document.querySelector('.warning')?.textContent})");
    assert.equal(state.parts, 2); assert.ok(state.scrollWidth <= width); assert.match(state.warning, /not cutting instructions/i);
    const selection = await evaluate("(()=>{document.querySelector('[data-piece=\"1\"]').click();return document.getElementById('selection').textContent})()");
    assert.equal(selection, 'Straight waistband');
    const before = await evaluate("document.querySelector('.seam').getAttribute('d')");
    await evaluate("document.querySelector('[data-input=\"1\"]').click()");
    assert.notEqual(await evaluate("document.querySelector('.seam').getAttribute('d')"), before);
    if ([1440, 390].includes(width)) {
      const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
      await writeFile(join(output, `engine-preview-${width}.png`), Buffer.from(shot.data, 'base64'));
    }
    states.push({ width, noOverflow: true, partSelectionPassed: true, inputChangedMeasuredOutline: true });
  }
  assert.equal(errors.length, 0);
  assert.equal(requests.filter((url) => !url.startsWith(base) && !url.startsWith('data:')).length, 0);
  const report = { checkedAt: new Date().toISOString(), provenance: 'actual-disposable-Chrome-engine-study',
    productionApplication: false, states, runtimeErrors: errors, externalRequests: 0,
    screenshots: ['evidence/pattern-engine/engine-preview-1440.png', 'evidence/pattern-engine/engine-preview-390.png'] };
  await writeFile(join(output, 'browser-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { socket?.close(); chrome.kill(); await new Promise((done) => server.close(done)); }
