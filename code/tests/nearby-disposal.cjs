const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/services/nearby-disposal.ts', 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
let requests = [];
let replies = [];
const context = {
  exports: exportsObject,
  require: () => ({
    getForegroundPermissionsAsync: async () => ({ granted: true }),
    getCurrentPositionAsync: async () => ({ coords: { latitude: 30, longitude: 76 } }),
    Accuracy: { Balanced: 3 },
  }),
  fetch: async (url, options) => {
    requests.push({ url, options });
    const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return reply;
  },
  AbortController,
  setTimeout,
  clearTimeout,
  __DEV__: true,
  console: { log() {} },
};
vm.runInNewContext(js, context);
const ok = (elements) => ({ ok: true, json: async () => ({ elements }) });
(async () => {
  replies = [
    { ok: false, status: 503, text: async () => 'service unavailable' },
    ok([{ type: 'node', id: 1, lat: 30, lon: 76, tags: { name: 'Battery point' } }]),
  ];
  const result = await exportsObject.findNearby('battery', { latitude: 30, longitude: 76 });
  assert.equal(requests.length, 2);
  assert.match(decodeURIComponent(requests[0].options.body), /recycling:batteries/);
  assert.equal(result[0].name, 'Battery point');
  assert.equal(result[0].distance, 0);
  requests = [];
  replies = [ok([])];
  assert.equal(
    (await exportsObject.findNearby('battery', { latitude: 30, longitude: 76 })).length,
    0,
  );
  assert.equal(requests.length, 1, 'an empty successful result should not retry');
  requests = [];
  replies = [
    new Error('offline'),
    { ok: false, status: 503, text: async () => 'service unavailable' },
  ];
  await assert.rejects(
    exportsObject.findNearby('battery', { latitude: 30, longitude: 76 }),
    /map services are unavailable/,
  );
  assert.equal(requests.length, 2);
  console.log('Nearby disposal service checks passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
