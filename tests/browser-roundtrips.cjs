// Run against a dedicated Chrome debugging profile with dist loaded unpacked.
// Requires Node 22+ (fetch and WebSocket); uses real popup mouse events.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const endpoint = process.env.CDP_URL || 'http://127.0.0.1:9227';
const origin = 'https://bikerouter.de/#map=13/46.6478/12.1939/standard,mapterhorn-hillshading&profile=hiking-beta';
const expected = [46.6478, 12.1939, 13];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function targets() {
  const response = await fetch(`${endpoint}/json/list`);
  if (!response.ok) throw Error(`CDP endpoint returned ${response.status}`);
  return response.json();
}
async function connect(target) {
  assert.ok(target, 'Required Chrome target is missing');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
  });
  return {
    async call(method, params = {}) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { pending.delete(id); reject(Error(`Timed out: ${method}`)); }, 15000);
        pending.set(id, message => {
          clearTimeout(timeout);
          pending.delete(id);
          if (message.error) reject(Error(JSON.stringify(message.error)));
          else resolve(message.result);
        });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    async evaluate(expression) {
      const response = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
      return response.result.value;
    },
    close() { socket.close(); },
  };
}
async function waitFor(find, message) {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    const result = await find();
    if (result) return result;
    await delay(250);
  }
  throw Error(message);
}
function coordinates(url, map) {
  const decoded = decodeURIComponent(url);
  const match = map === 'Google Maps'
    ? decoded.match(/\/maps\/.*@(-?[\d.]+),(-?[\d.]+),([\d.]+)z/)
    : decoded.match(map === 'Bikerouter'
      ? /#map=([\d.]+)\/(-?[\d.]+)\/(-?[\d.]+)/
      : /#([\d.]+)\/(-?[\d.]+)\/(-?[\d.]+)/);
  assert.ok(match, `${map} did not retain a readable map URL: ${url}`);
  return (map === 'Google Maps' ? [match[1], match[2], match[3]] : [match[2], match[3], match[1]]).map(Number);
}
async function main() {
  const workerTarget = (await targets()).find(t => t.type === 'service_worker' &&
    (process.env.EXTENSION_ID ? t.url.includes(process.env.EXTENSION_ID) : t.url.endsWith('/background.js') && t.url.startsWith('chrome-extension:')));
  assert.ok(workerTarget, 'Open the extension once to start its service worker, or set EXTENSION_ID');
  const worker = await connect(workerTarget);
  const browser = await connect(await fetch(`${endpoint}/json/version`).then(r => r.json()));
  const extensionId = new URL(workerTarget.url).hostname;
  const popupUrl = new URL('popup.html', workerTarget.url).href;
  const results = [];
  try {
    for (const route of [['Google Maps', 'Bikerouter'], ['CamperMap', 'Bikerouter'], ['Google Maps', 'CamperMap', 'Bikerouter']]) {
      const result = { route: ['Bikerouter', ...route], hops: [] };
      let tab;
      try {
        // Use one temporary tab per case; never navigate or close the user's tabs.
        const marker = `about:blank#openswitchmaps-test-${Date.now()}`;
        tab = await worker.evaluate(`chrome.tabs.create({url:${JSON.stringify(marker)},active:true})`);
        const pageTarget = await waitFor(async () => {
          const response = await browser.call('Target.getTargets', {filter:[{type:'tab',exclude:false},{exclude:true}]});
          return response.targetInfos.find(t => t.url === marker);
        }, 'Test tab did not open');
        await worker.evaluate(`chrome.tabs.update(${tab.id},{url:${JSON.stringify(origin)}})`);
        for (const name of route) {
          await worker.evaluate(`chrome.tabs.update(${tab.id},{active:true})`);
          await worker.evaluate(`chrome.windows.update(${tab.windowId},{focused:true})`);
          await waitFor(async () => (await worker.evaluate(`chrome.tabs.get(${tab.id})`)).status === 'complete', 'Map did not finish loading');
          await delay(2000); // Allow map applications to normalize their URL.
          await browser.call('Extensions.triggerAction', { id: extensionId, targetId: pageTarget.targetId });
          const popupTarget = await waitFor(async () => (await targets()).find(t => t.url === popupUrl), 'Popup did not open');
          const popup = await connect(popupTarget);
          try {
            await waitFor(() => popup.evaluate('document.readyState === "complete" && document.querySelectorAll(".column").length > 0'), 'Popup did not render');
            const position = await popup.evaluate(`(() => {
              const row=[...document.querySelectorAll('.column')].find(e=>e.querySelector('.maplabel > .tooltip:last-child')?.firstChild.textContent.trim()===${JSON.stringify(name)});
              if(!row) throw Error('Map is not enabled: '+${JSON.stringify(name)});
              row.scrollIntoView({block:'center'});const r=row.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
            })()`);
            await popup.call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'middle', buttons: 4, clickCount: 1, ...position });
            await popup.call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'middle', buttons: 0, clickCount: 1, ...position });
          } finally { popup.close(); }
          const host = name === 'Google Maps' ? 'google.' : name === 'CamperMap' ? 'umap.openstreetmap.fr' : 'bikerouter.de';
          await waitFor(async () => {
            const t = await worker.evaluate(`chrome.tabs.get(${tab.id})`);
            return t.status === 'complete' && new URL(t.url).hostname.includes(host) ? t : null;
          }, `${name} navigation failed (tab ${tab.id})`);
          await delay(2000);
          const settled = await worker.evaluate(`chrome.tabs.get(${tab.id})`);
          result.hops.push({ map: name, url: settled.url });
          assert.deepEqual(coordinates(settled.url, name), expected, `${name} changed latitude, longitude or zoom`);
        }
        result.status = 'PASS';
      } catch (error) {
        result.status = 'FAIL'; result.error = error.message; process.exitCode = 1;
        if (tab) result.lastTab = await worker.evaluate(`chrome.tabs.get(${tab.id}).then(t=>({url:t.url,status:t.status}))`);
      } finally {
        if (tab) await worker.evaluate(`chrome.tabs.remove(${tab.id})`);
      }
      results.push(result);
      console.log(JSON.stringify(result, null, 2));
    }
  } finally { worker.close(); browser.close(); }
  if (process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE, JSON.stringify(results, null, 2) + '\n');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
