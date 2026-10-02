import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const base=process.env.STITCHES_BASE_URL??'http://127.0.0.1:3100';
const profile=await mkdtemp(join(tmpdir(),'stitches-restore-probe-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],
  {windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(done=>setTimeout(done,ms)); let socket;
try {
  let port;
  for(let i=0;i<600;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await pause(100);}}
  if(!port)throw Error('Disposable Chrome did not start');
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((done,reject)=>{socket.addEventListener('open',done,{once:true});socket.addEventListener('error',reject,{once:true});});
  let seq=0;const pending=new Map(),consoleErrors=[];
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);
    if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error') consoleErrors.push(m.params.args.map(a=>String(a.value??a.description)).join(' ').slice(0,1000));
    const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.done(m.result);}});
  const call=(method,params={})=>new Promise((done,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},60000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async expression=>{for(let i=0;i<240;i++){if(await evaluate(expression))return;await pause(250);}throw Error('Page did not settle: '+expression);};
  const inspect=()=>evaluate(`({url:location.href,bodyCount:document.querySelectorAll('body').length,roots:[...document.querySelectorAll('.companion-app')].map(x=>({visible:x.checkVisibility(),style:x.getAttribute('style'),heading:x.querySelector('h1')?.textContent,children:[...x.children].map(c=>c.className)})),bodyChildren:[...document.body.childNodes].map(x=>({type:x.nodeType,tag:x.nodeName,style:x.nodeType===1?x.getAttribute('style'):null,text:x.nodeType===8?x.textContent:null})),styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>({href:x.href,loaded:!!x.sheet}))})`);
  await call('Runtime.enable');await call('Page.enable');
  const prime=process.env.STITCHES_RESTORE_PRIME==='true';
  if(prime)for(const width of [1440,1024,768,390,320]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
    await evaluate('window.__primeMarker=true');await call('Page.navigate',{url:base+'/'});
    await wait("window.__primeMarker===undefined&&document.readyState==='complete'&&document.querySelectorAll('.catalog-evidence-grid article').length===2");
    await evaluate('window.scrollTo(0,document.body.scrollHeight/2)');await pause(350);
    await evaluate('window.scrollTo(0,document.body.scrollHeight)');await pause(350);
    await evaluate('window.scrollTo(0,0)');
    await wait("[...document.images].every(x=>x.complete&&x.naturalWidth)");
    if(width===1440||width===390)await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate('window.__primeMarker=true');await call('Page.navigate',{url:base+'/'});await wait("window.__primeMarker===undefined&&!!document.querySelector('.companion-projects')&&!document.querySelector('.companion-projects').textContent.includes('Loading projects')");
  const initial=await inspect();
  const ui=process.env.STITCHES_RESTORE_UI==='true',candidate=process.env.STITCHES_RESTORE_CANDIDATE==='true',study=process.env.STITCHES_RESTORE_STUDY==='true'; let id;
  if(ui){
    await evaluate(`document.querySelectorAll('.collection-card button')[${candidate?0:2}].click()`);
    await wait("!!document.querySelector('#new-project-title')");
    await evaluate("(()=>{const el=document.querySelector('#new-project-title');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'Synthetic restore probe');el.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await evaluate("document.querySelector('.new-project-dialog button[type=submit]').click()");
    await wait("document.querySelector('.project-head h1')?.textContent==='Synthetic restore probe'");
    id=await evaluate("new URLSearchParams(location.search).get('project')");
  }else id=await evaluate(`(async()=>{const r=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Synthetic restore probe',brief:'No provider inference.',source:${candidate?"{kind:'candidate',designId:'sandy'}":"{kind:'own_idea'}"},idempotencyKey:crypto.randomUUID()})});const d=await r.json();if(!r.ok)throw Error(d.message);return d.project.id;})()`);
  const url=base+'/?project='+id;
  const serverRootCount=await evaluate(`(async()=>{const html=await(await fetch(${JSON.stringify(url)})).text();return (html.match(/class="companion-app"/g)||[]).length;})()`);
  if(!ui)await call('Page.navigate',{url});await wait("document.querySelector('.project-head h1')?.textContent==='Synthetic restore probe'");await pause(1000);
  if(study){
    await wait("!!document.querySelector('.diagnostic-choices')");
    await evaluate("document.querySelectorAll('input[name=skirt-construction]')[1].click();document.querySelectorAll('input[name=waistband-shape]')[1].click()");
    await evaluate("document.querySelectorAll('.diagnostic-choices button')[1].click();document.querySelectorAll('.diagnostic-choices button')[2].click();document.querySelector('.diagnostic-study-foot button').click()");
    await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});
    await evaluate("document.querySelectorAll('.diagnostic-choices button')[1].click()");
    await evaluate("[...document.querySelectorAll('.diagnostic-actions button')].find(b=>b.textContent.includes('Save scrap')).click()");
    await wait("document.querySelectorAll('.diagnostic-history li').length===1");
    await evaluate("[...document.querySelectorAll('.diagnostic-actions button')].find(b=>b.textContent.includes('Start source-linked')).click()");
    await wait("!!document.querySelector('[aria-label=\"Comparison result\"]')");
    await evaluate("[...document.querySelectorAll('.diagnostic-actions button')].find(b=>b.textContent.includes('No improvement')).click()");
    await wait("document.querySelectorAll('.diagnostic-history li').length===3");
  }
  const opened=await inspect();
  await evaluate('window.__stitchesProbe=true');await call('Page.reload');await wait("window.__stitchesProbe===undefined&&document.readyState==='complete'&&document.querySelector('.project-head h1')?.textContent==='Synthetic restore probe'");await pause(1000);
  const reloaded=await inspect();
  reloaded.historyCount=await evaluate("document.querySelectorAll('.diagnostic-history li').length");
  reloaded.historySections=await evaluate("document.querySelectorAll('.diagnostic-history').length");
  reloaded.historyRoots=await evaluate("[...document.querySelectorAll('.diagnostic-history')].map(x=>({connected:x.isConnected,parent:x.parentElement.className,appRoot:x.parentElement.parentElement.className,appIsQueried:[...document.querySelectorAll('.companion-app')].includes(x.parentElement.parentElement)}))");
  reloaded.atomic=await evaluate("(()=>{const roots=[...document.querySelectorAll('.companion-app')],mains=[...document.querySelectorAll('.companion-project')],history=[...document.querySelectorAll('.diagnostic-history')];return {rootCount:roots.length,mainCount:mains.length,historyCount:history.length,uniqueHistory:new Set(history).size,byClass:document.getElementsByClassName('diagnostic-history').length,queryFunction:String(document.querySelectorAll),sections:history.map(x=>({rootIndex:roots.indexOf(x.parentElement.parentElement),mainIndex:mains.indexOf(x.parentElement),outer:x.outerHTML.slice(0,350)})),rootChildren:roots.map(x=>[...x.children].map(c=>c.className)),mainChildren:mains.map(x=>[...x.children].map(c=>c.className))};})()");
  const verify=process.env.STITCHES_RESTORE_ASSERT==='true';
  if(verify){assert.equal(reloaded.atomic.rootCount,1);assert.equal(reloaded.atomic.mainCount,1);assert.equal(reloaded.atomic.historyCount,1);if(study)assert.equal(reloaded.historyCount,3);assert.equal(consoleErrors.length,0);}
  const report={checkedAt:new Date().toISOString(),verified:verify,candidate,study,prime,entry:ui?'actual-create-controls-native-history':'direct-document-navigation',syntheticPrivateGuest:true,providerRequests:0,serverRootCount,initial,opened,reloaded,consoleErrors};
  await writeFile(resolve(import.meta.dirname,`../evidence/project-restore-probe${candidate?'-sandy':''}${ui?'-ui':''}${study?'-study':''}${prime?'-prime':''}${verify?'-verified':''}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{socket?.close();chrome.kill();}
