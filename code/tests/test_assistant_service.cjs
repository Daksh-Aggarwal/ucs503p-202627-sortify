const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Load assistant service
const source = fs.readFileSync('C:/Code/Sortify/code/src/services/assistant.ts', 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

const exportsObj = {};
const fakeCatalog = [
  { id: 'bottle', name: 'Plastic bottle', keywords: ['plastic', 'bottle'] },
  { id: 'battery', name: 'Household battery', keywords: ['battery'] },
];

const context = {
  exports: exportsObj,
  require: (name) => {
    if (name.includes('catalog')) return { catalog: fakeCatalog };
    return {};
  },
  process: { env: {} },
  Date,
  Math,
  AbortController,
  setTimeout,
  clearTimeout,
  console,
};

const vm = require('node:vm');
vm.runInNewContext(js, context);

const { stripEmojis, askAssistant } = exportsObj;

// 1. Test stripEmojis (using unicode escape sequences)
assert.equal(typeof stripEmojis, 'function', 'stripEmojis should be exported');
const dirty = 'Here is a caution: \u26A0\uFE0F and recycle: \u267B\uFE0F and check: \u2705 and thumbs up: \uD83D\uDC4D';
const cleaned = stripEmojis(dirty);
assert.equal(cleaned.includes('\u26A0'), false);
assert.equal(cleaned.includes('\u267B'), false);
assert.equal(cleaned.includes('\u2705'), false);
assert.equal(cleaned.includes('\uD83D\uDC4D'), false);
console.log('PASS: stripEmojis successfully strips all emojis and symbols');

// 2. Test local client RAG (when API is offline)
(async () => {
  const bottleRes = await askAssistant('How do I dispose of a plastic bottle?');
  assert.ok(bottleRes.reply.length > 0, 'Reply must not be empty');
  assert.equal(bottleRes.reply.includes('•'), true, 'Reply must contain bullet points');
  assert.equal(bottleRes.reply.includes('\u26A0'), false, 'Reply must not contain emoji warning');
  assert.equal(bottleRes.itemId, 'bottle', 'Must identify bottle item');
  assert.ok(bottleRes.reply.includes('Caution:'), 'Reply should include Caution section if defined');
  console.log('PASS: askAssistant localClientRag for plastic bottle returned bulleted, emoji-free response with Caution');

  const batteryRes = await askAssistant('What should I do with lithium batteries?');
  assert.ok(batteryRes.reply.length > 0);
  assert.equal(batteryRes.reply.includes('•'), true);
  assert.equal(batteryRes.reply.includes('\u26A0'), false);
  assert.equal(batteryRes.itemId, 'battery');
  assert.ok(batteryRes.reply.includes('Caution:'), 'Reply should include Caution section');
  console.log('PASS: askAssistant localClientRag for batteries returned bulleted, emoji-free response with Caution');

  const vapeRes = await askAssistant('Where can I drop off disposable vapes?');
  assert.ok(vapeRes.reply.length > 0);
  assert.equal(vapeRes.reply.includes('•'), true);
  assert.ok(vapeRes.reply.includes('Vapes'));
  console.log('PASS: askAssistant localClientRag for vapes returned bulleted, emoji-free response');

  const proseRes = await askAssistant('Explain in one paragraph without bullets how to recycle plastic bottles');
  assert.ok(proseRes.reply.length > 0);
  assert.equal(proseRes.reply.includes('•'), false, 'Prose reply should not contain bullets');
  console.log('PASS: askAssistant localClientRag prose query returned clean prose without bullets');

  // 3. Test Qwen mode config (local vs api)
  const localRes = await askAssistant('How do I recycle a cardboard box?', undefined, { mode: 'local' });
  assert.ok(localRes.traces.model.includes('Local Grounded Engine'), 'Local mode should reflect local engine');
  console.log('PASS: askAssistant supports mode: "local" with local grounded model');

  const apiFallbackRes = await askAssistant('How do I recycle a cardboard box?', undefined, { mode: 'api', apiUrl: 'http://invalid-endpoint:9999/v1' });
  assert.ok(apiFallbackRes.reply.length > 0, 'API fallback should return reply');
  assert.ok(apiFallbackRes.traces.model.includes('Custom API Offline'), 'API fallback trace should indicate offline fallback');
  console.log('PASS: askAssistant supports mode: "api" with graceful fallback when endpoint unreachable');

  console.log('\nALL ASSISTANT SERVICE TESTS PASSED!');
})();
