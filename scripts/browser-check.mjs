import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// Runs against an already-started local Stitches server. It uses an isolated
// disposable Chrome profile and does not touch the user's signed-in browser.
const url = process.argv[2] ?? "http://127.0.0.1:3102/";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/$/.test(url)) throw new Error("Browser check accepts only a loopback app URL.");
const expectedOrigin = process.env.STITCHES_EXPECT_ORIGIN === "sanity-development" ? "sanity-development" : "fixture";
const expectedBadge = expectedOrigin === "fixture" ? "Local fixture" : "Sanity development";
const chrome = process.env.CHROME_EXE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const root = resolve(process.cwd());
const profileParent = join(root, ".data");
await mkdir(profileParent, { recursive: true });
const profile = await mkdtemp(join(profileParent, "chrome-cdp-"));
const output = join(root, "evidence", "screenshots");
await mkdir(output, { recursive: true });
const child = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--disable-background-networking", "--no-first-run",
  "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
let chromeStderr = "";
child.stderr.on("data", (chunk) => { chromeStderr = (chromeStderr + chunk.toString()).slice(-3000); });

const pause = (ms) => new Promise((done) => setTimeout(done, ms));
async function activePort() {
  for (let attempt = 0; attempt < 200; attempt++) {
    try { return Number((await readFile(join(profile, "DevToolsActivePort"), "utf8")).split(/\r?\n/)[0]); }
    catch { await pause(100); }
  }
  throw new Error(`Chrome did not expose its isolated debugging port (exit ${child.exitCode ?? "running"}). ${chromeStderr}`);
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.pending = new Map();
    this.nextId = 0;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const wait = this.pending.get(message.id);
      if (!wait) return;
      this.pending.delete(message.id);
      if (message.error) wait.reject(new Error(`CDP ${message.error.code}: ${message.error.message}`));
      else wait.resolve(message.result);
    });
  }
  call(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolveCall, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP ${method} timed out.`)); }, 45000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolveCall(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error("Browser evaluation failed.");
    return result.result?.value;
  }
}

let socket;
try {
  const port = await activePort();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === "page");
  if (!target?.webSocketDebuggerUrl) throw new Error("Chrome did not expose a page target.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  const cdp = new Cdp(socket);
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  const results = [];
  for (const size of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 900 },
    { name: "small-mobile", width: 320, height: 900 },
  ]) {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: size.width, height: size.height, deviceScaleFactor: 1, mobile: size.width < 500 });
    await cdp.call("Page.navigate", { url });
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      ready = await cdp.evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.explore-panel'))");
      if (ready) break;
      await pause(100);
    }
    if (!ready) throw new Error(`The ${size.name} worktable did not load.`);
    await cdp.evaluate("[...document.querySelectorAll('.anatomy-card')].find((item) => item.textContent.includes('Sleeve')).click(); [...document.querySelectorAll('.view-toggle button')].find((item) => item.textContent.includes('Back')).click(); [...document.querySelectorAll('.assembly-actions button')].find((item) => item.textContent.includes('Next')).click()");
    const state = await cdp.evaluate(`({
      title: document.querySelector('h1')?.textContent,
      flatPiece: document.querySelector('.flat-piece-study h3')?.textContent,
      selectedPiece: document.querySelector('.anatomy-card.selected strong')?.textContent,
      backSelected: [...document.querySelectorAll('.view-toggle button')].find((item) => item.textContent.includes('Back'))?.getAttribute('aria-pressed'),
      assemblyStep: document.querySelector('.assembly-guide h3')?.textContent,
      assemblyDetail: document.querySelector('.assembly-guide h3 + p')?.textContent,
      mobileSource: document.querySelector('.knowledge-origin-mobile')?.textContent,
      mobileSourceVisible: getComputedStyle(document.querySelector('.knowledge-origin-mobile')).display !== 'none',
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      controls: [...document.querySelectorAll('.stage-tab')].map((item) => item.textContent.trim()),
    })`);
    if (!state?.title?.toLowerCase().includes("everyday blouse") || state.flatPiece !== 'Sleeve' || state.selectedPiece !== 'Sleeve' || state.backSelected !== 'true' || !state.assemblyStep || state.assemblyStep === 'Join the shoulders' || (expectedOrigin === 'sanity-development' && !state.assemblyDetail?.includes('front + back')) ||
      (size.width <= 390 && (!state.mobileSourceVisible || !state.mobileSource?.includes(expectedBadge))) ||
      state.documentWidth > state.viewportWidth) throw new Error(`${size.name} worktable failed browser assertions: ${JSON.stringify(state)}`);
    if (expectedOrigin === 'sanity-development') {
      await cdp.evaluate("document.querySelector('.assembly-knowledge-note button')?.click()");
      let corroborated = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        corroborated = await cdp.evaluate("document.querySelector('.assembly-knowledge-note strong')?.textContent === 'Verified with Sanity Context.'");
        if (corroborated) break;
        await pause(200);
      }
      if (!corroborated) throw new Error(`${size.name} did not show corroborated live Context knowledge: ${await cdp.evaluate("document.querySelector('.assembly-knowledge-note')?.textContent")}`);
      state.contextNote = await cdp.evaluate("document.querySelector('.assembly-knowledge-note p')?.textContent");
    }
    const screenshot = await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
    const filename = `explore-${expectedOrigin}-${size.name}-light.png`;
    await writeFile(join(output, filename), Buffer.from(screenshot.data, "base64"));
    results.push({ viewport: size.name, ...state, screenshot: `evidence/screenshots/${filename}` });
    await cdp.evaluate("[...document.querySelectorAll('.stage-tab')].find((item) => item.textContent.includes('Fit')).click()");
    let fitReady = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      fitReady = await cdp.evaluate("Boolean(document.querySelector('.why-details'))");
      if (fitReady) break;
      await pause(100);
    }
    if (!fitReady) throw new Error(`${size.name} Fit stage did not open.`);
    await cdp.evaluate("document.querySelector('.why-details').open = true");
    const fitState = await cdp.evaluate(`({sourceTitle: document.querySelector('.evidence-source strong')?.textContent, sourceStatus: document.querySelector('.evidence-source span')?.textContent, evidenceOpen: document.querySelector('.why-details')?.open, documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth})`);
    if (!fitState.sourceTitle || !fitState.evidenceOpen || fitState.documentWidth > fitState.viewportWidth) throw new Error(`${size.name} Fit evidence failed: ${JSON.stringify(fitState)}`);
    const fitScreenshot = await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
    const fitFilename = `fit-${expectedOrigin}-${size.name}-light-evidence.png`;
    await writeFile(join(output, fitFilename), Buffer.from(fitScreenshot.data, "base64"));
    results.push({ viewport: `${size.name}-fit`, ...fitState, screenshot: `evidence/screenshots/${fitFilename}` });
  }
  // This checks the actual client navigation; no project state is mutated.
  await cdp.evaluate("[...document.querySelectorAll('.stage-tab')].find((item) => item.textContent.includes('Fabric')).click()");
  const fabricVisible = await cdp.evaluate("Boolean(document.querySelector('#fabric-title'))");
  if (!fabricVisible) throw new Error("Fabric stage did not open after clicking its tab.");
  process.stdout.write(`${JSON.stringify({ results, fabricVisible }, null, 2)}\n`);
} finally {
  socket?.close();
  child.kill();
}
