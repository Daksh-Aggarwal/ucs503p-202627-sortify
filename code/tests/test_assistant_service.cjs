const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

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

// 1. Test stripEmojis
assert.equal(typeof stripEmojis, 'function', 'stripEmojis should be exported');
const dirty = 'Here is a caution: ⚠️ and recycle: ♻️ and check: ✅ and thumbs up: 👍';
const cleaned = stripEmojis(dirty);
assert.equal(cleaned.includes('⚠️'), false);
assert.equal(cleaned.includes('♻️'), false);
assert.equal(cleaned.includes('✅'), false);
assert.equal(cleaned.includes('👍'), false);
console.log('PASS: stripEmojis successfully strips all emojis and symbols');

// 2. Test local client RAG (when API is offline)
(async () => {
  const bottleRes = await askAssistant('How do I dispose of a plastic bottle?');
  assert.ok(bottleRes.reply.length > 0, 'Reply must not be empty');
  assert.equal(bottleRes.reply.includes('•'), true, 'Reply must contain bullet points');
  assert.equal(bottleRes.reply.includes('⚠️'), false, 'Reply must not contain emoji ⚠️');
  assert.equal(bottleRes.itemId, 'bottle', 'Must identify bottle item');
  console.log('PASS: askAssistant localClientRag for plastic bottle returned bulleted, emoji-free response');

  const batteryRes = await askAssistant('What should I do with lithium batteries?');
  assert.ok(batteryRes.reply.length > 0);
  assert.equal(batteryRes.reply.includes('•'), true);
  assert.equal(batteryRes.reply.includes('⚠️'), false);
  assert.equal(batteryRes.itemId, 'battery');
  console.log('PASS: askAssistant localClientRag for batteries returned bulleted, emoji-free response');

  console.log('\nALL ASSISTANT SERVICE TESTS PASSED!');
})();
