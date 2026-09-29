import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

// Isolated local-only reference check; never opens the user's signed-in profile.
const root = resolve(import.meta.dirname, '..');
const files = new Map([
  ['/', ['design/stitches-studio.html', 'text/html']],
  ['/stitches-studio.html', ['design/stitches-studio.html', 'text/html']],
  ['/studio-reference.css', ['design/studio-reference.css', 'text/css']],
  ['/studio-reference.js', ['design/studio-reference.js', 'text/javascript']],
  ['/docs/SOL_HANDOFF.md', ['docs/SOL_HANDOFF.md', 'text/plain']],
]);
const serveOnly = process.argv.includes('--serve');
const server = createServer(async (req, res) => {
  const selected = files.get(new URL(req.url, 'http://localhost').pathname);
  if (!selected) { res.writeHead(404).end(); return; }
  try { res.writeHead(200, { 'Content-Type': selected[1] + '; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(await readFile(join(root, selected[0]))); }
  catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(serveOnly ? 4175 : 0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/`;
if (serveOnly) {
  console.log(`Stitches local design reference: ${url}`);
} else {
  const pause = ms => new Promise(done => setTimeout(done, ms));
  const profile = await mkdtemp(join(tmpdir(), 'stitches-reference-'));
  const output = join(root, 'design', 'screenshots');
  await mkdir(output, { recursive: true });
  const chrome = spawn(process.env.CHROME_EXE ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  let browserError = '';
  chrome.stderr.on('data', chunk => { browserError = (browserError + chunk).slice(-2000); });
  const errors = [];
  const network = [];
  try {
    let port;
    for (let i=0; i<150; i++) {
      try { port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/)[0]); break; }
      catch { await pause(100); }
    }
    if (!port) throw new Error('Isolated Chrome did not start: '+browserError);
    const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
    await new Promise((done,reject)=>{socket.addEventListener('open',done,{once:true});socket.addEventListener('error',reject,{once:true});});
    let seq=0;const pending=new Map();
    socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='Network.requestWillBeSent')network.push(m.params.request.url);const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.done(m.result);}});
    function call(method,params={}){return new Promise((done,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timeout'));},45000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
    async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result?.value;}
    await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
    const results=[];
    for(const width of [1440,1024,768,390,320]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
      for(const screen of ['landing','collection','studio','fabric','make','inspiration']){
        await call('Page.navigate',{url:url+'#'+screen});
        let ready=false;
        for(let i=0;i<60;i++){ready=await evaluate(`document.readyState==='complete' && document.body.dataset.screen==='${screen}' && document.querySelector('main').children.length>0`);if(ready)break;await pause(70);}
        if(!ready)throw new Error(`Did not render ${screen} at ${width}`);
        await pause(80);
        await evaluate("document.activeElement?.blur()");
        const state=await evaluate(`({width:innerWidth,documentWidth:document.documentElement.scrollWidth,title:document.querySelector('main h1,main h2')?.textContent,brokenImages:[...document.images].filter(i=>!i.hidden&&(!i.complete||i.naturalWidth===0)).length})`);
        if(state.documentWidth>width||state.brokenImages)throw new Error(`Layout failed ${screen}/${width}: ${JSON.stringify(state)}`);
        if([1440,390].includes(width)){
          const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});
          await writeFile(join(output,`${screen}-${width}.png`),Buffer.from(screenshot.data,'base64'));
        }
        results.push({screen,width,overflow:false,title:state.title});
      }
    }
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await call('Page.navigate',{url:url+'#studio'});await pause(180);
    await evaluate("document.querySelector('[data-sheet=inspector]').click();document.activeElement?.blur()");
    let detailShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    await writeFile(join(output,'studio-design-sheet-390.png'),Buffer.from(detailShot.data,'base64'));
    await evaluate("document.querySelector('.mobile-sheet').close()");
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate("document.querySelector('[data-view=pieces]').click();document.querySelector('[data-piece=sleeve]').click();document.activeElement?.blur()");await pause(550);
    detailShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});
    await writeFile(join(output,'studio-pieces-1440.png'),Buffer.from(detailShot.data,'base64'));
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await call('Page.navigate',{url:url+'#studio'});await pause(180);
    const interaction=await evaluate(`(()=>{
      document.querySelector('[data-sheet="inspector"]').click();
      const sheet=document.querySelector('.mobile-sheet').open && document.querySelector('.mobile-sheet #length')!==null;
      document.querySelector('.mobile-sheet').close();
      document.querySelector('[data-view="pieces"]').click();
      const exploded=document.querySelector('.garment-stage').classList.contains('exploded');
      document.querySelector('[data-piece="sleeve"]').click();
      const piece=document.querySelector('[data-piece="sleeve"]').getAttribute('aria-pressed')==='true';
      document.querySelector('[data-pocket="false"]').click();
      const pocketRemoved=!document.querySelector('#studio-art .piece-pocket');
      const range=document.getElementById('length');range.value='9';range.dispatchEvent(new Event('input',{bubbles:true}));
      const length=document.getElementById('length-value').value==='+9 cm';
      document.querySelector('[data-side="back"]').click();
      const back=Boolean(document.querySelector('#studio-art .back-view'));
      document.getElementById('assistant-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      const scripted=document.getElementById('assistant-copy').textContent.startsWith('Sample proposal:')&&Boolean(document.querySelector('#studio-art .piece-pocket'));
      document.getElementById('keep-design').click();
      const honestSave=document.getElementById('notice').textContent.includes('no design was saved');
      return {sheet,exploded,piece,pocketRemoved,length,back,scripted,honestSave};
    })()`);
    if(Object.values(interaction).some(v=>!v))throw new Error('Interaction failed '+JSON.stringify(interaction));
    await call('Page.navigate',{url:url+'#collection'});await pause(180);
    const filtering=await evaluate(`(()=>{document.querySelector('[data-filter="skirt"]').click();return document.querySelectorAll('.garment-card').length===3})()`);
    await call('Page.navigate',{url:url+'#make'});await pause(180);
    const stepping=await evaluate(`(()=>{document.getElementById('next-step').click();return document.querySelector('main h1').textContent==='Place it before you close it.'})()`);
    await call('Page.navigate',{url:url+'#inspiration'});await pause(180);
    const matches=await evaluate(`(()=>{document.getElementById('sample-match').click();return !document.getElementById('matches').hidden})()`);
    if(!filtering||!stepping||!matches)throw new Error('Secondary interaction failed');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    const reducedMotion=await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.button')).transitionDuration === '0s'`);
    const outsideRequests=network.filter(x=>!x.startsWith(url)&&!x.startsWith('data:')&&!x.startsWith('blob:'));
    if(errors.length||outsideRequests.length||!reducedMotion)throw new Error(JSON.stringify({errors,outsideRequests,reducedMotion}));
    const report={kind:'design-reference-only',checkedAt:new Date().toISOString(),viewports:results,interactions:{...interaction,filtering,stepping,matches,reducedMotion},runtimeErrors:errors,externalRequests:outsideRequests,screenshots:'14 actual browser captures; sample reference, not production app',notVerified:['3D rendering','pattern geometry','live Gemini or Sanity','physical cutting or sewing','full keyboard/screen-reader audit']};
    await writeFile(join(root,'design','verification.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally {socket?.close();chrome.kill();server.close();}
}
