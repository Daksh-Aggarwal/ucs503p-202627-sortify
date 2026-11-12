const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

// 1. Transpile and load catalog.ts
const catalogPath = fs.existsSync(path.resolve(__dirname, '../src/data/catalog.ts'))
  ? path.resolve(__dirname, '../src/data/catalog.ts')
  : 'C:/Code/Sortify/code/src/data/catalog.ts';
const catalogSource = fs.readFileSync(catalogPath, 'utf8');
const catalogJs = ts.transpileModule(catalogSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const catalogExports = {};
vm.runInNewContext(catalogJs, { exports: catalogExports });
const { catalog, categories, locationGuidance } = catalogExports;

// 2. Transpile and load recognition.ts
const recognitionPath = fs.existsSync(path.resolve(__dirname, '../src/services/recognition.ts'))
  ? path.resolve(__dirname, '../src/services/recognition.ts')
  : 'C:/Code/Sortify/code/src/services/recognition.ts';
const recognitionSource = fs.readFileSync(recognitionPath, 'utf8');
const recognitionJs = ts.transpileModule(recognitionSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const recognitionExports = {};
const fakeFileSystem = { uploadAsync: async () => ({ status: 200, body: '{}' }) };
vm.runInNewContext(recognitionJs, {
  exports: recognitionExports,
  require: (name) => {
    if (name.includes('catalog')) return catalogExports;
    return {};
  },
  process: { env: {} },
  Platform: { OS: 'web' },
  console,
  Math,
  Date,
  Number,
  String,
  Boolean,
  Array,
});
const {
  STREAMLINED_8_CLASS_MAPPING,
  UNIFIED_10_CLASS_MAPPING,
  demoPrediction,
  demoPredictions,
  getAllPredictions,
} = recognitionExports;

// 3. Load nearby-disposal.ts
const nearbyPath = fs.existsSync(path.resolve(__dirname, '../src/services/nearby-disposal.ts'))
  ? path.resolve(__dirname, '../src/services/nearby-disposal.ts')
  : 'C:/Code/Sortify/code/src/services/nearby-disposal.ts';
const nearbySource = fs.readFileSync(nearbyPath, 'utf8');
const nearbyJs = ts.transpileModule(nearbySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const nearbyExports = {};
vm.runInNewContext(nearbyJs, {
  exports: nearbyExports,
  require: (name) => {
    if (name.includes('catalog')) return catalogExports;
    return {};
  },
  console,
  Math,
});
const { disposalKind } = nearbyExports;

// 4. Load sortify_class_mapping.json files
const serverMappingPath = fs.existsSync(path.resolve(__dirname, '../server/models/sortify_class_mapping.json'))
  ? path.resolve(__dirname, '../server/models/sortify_class_mapping.json')
  : 'C:/Code/Sortify/code/server/models/sortify_class_mapping.json';
const serverMapping = JSON.parse(fs.readFileSync(serverMappingPath, 'utf8'));

const mlMappingPath = fs.existsSync('C:/Code/Sortify-ML/YOLOv11/model/sortify_class_mapping.json')
  ? 'C:/Code/Sortify-ML/YOLOv11/model/sortify_class_mapping.json'
  : serverMappingPath;
const mlMapping = JSON.parse(fs.readFileSync(mlMappingPath, 'utf8'));

console.log('=== TEST SUITE: SORTIFY CLASS MAPPING & CATALOG ARCHITECTURE ===\n');

// -------------------------------------------------------------
// Test 1: Category invariants
// -------------------------------------------------------------
const validCategories = new Set(['Recyclable', 'Organic', 'General waste', 'E-waste', 'Hazardous']);
assert.equal(categories.length, 5, 'Must have exactly 5 major categories');
for (const cat of categories) {
  assert.ok(validCategories.has(cat.name), `Unknown category name: ${cat.name}`);
  assert.ok(cat.color && cat.background && cat.icon, `Missing style properties for ${cat.name}`);
}
console.log('PASS: 5 major categories validated with styles and icons.');

// -------------------------------------------------------------
// Test 2: Catalog integrity & no orphan / broken item references
// -------------------------------------------------------------
const catalogItemIds = new Set();
assert.ok(catalog.length >= 30, `Expected at least 30 catalog items, got ${catalog.length}`);

for (const item of catalog) {
  assert.ok(item.id && typeof item.id === 'string', `Invalid item ID: ${item.id}`);
  assert.ok(!catalogItemIds.has(item.id), `Duplicate item ID found in catalog: ${item.id}`);
  catalogItemIds.add(item.id);

  assert.ok(validCategories.has(item.category), `Item ${item.id} has invalid category ${item.category}`);
  assert.ok(item.name && item.name.length > 2, `Item ${item.id} has invalid name`);
  assert.ok(item.material && item.material.length > 2, `Item ${item.id} has invalid material`);
  assert.ok(item.description && item.description.length > 5, `Item ${item.id} has invalid description`);
  assert.ok(Array.isArray(item.steps) && item.steps.length >= 2, `Item ${item.id} must have >= 2 disposal steps`);
  assert.ok(Array.isArray(item.keywords) && item.keywords.length >= 3, `Item ${item.id} must have >= 3 keywords`);

  if (item.subItemIds) {
    assert.ok(Array.isArray(item.subItemIds), `subItemIds for ${item.id} must be an array`);
    assert.ok(item.subItemIds.length > 0, `subItemIds for ${item.id} must not be empty`);
  }
}
console.log(`PASS: Catalog contains ${catalog.length} unique, fully defined items with 0 duplicate IDs.`);

// Verify all subItemIds point to items that exist in the catalog
for (const item of catalog) {
  if (item.subItemIds) {
    for (const subId of item.subItemIds) {
      assert.ok(
        catalogItemIds.has(subId),
        `Broken subItemId link: ${item.id} references '${subId}', which does not exist in catalog!`
      );
    }
  }
}
console.log('PASS: Zero broken sub-item links in catalog.');

// -------------------------------------------------------------
// Test 3: STREAMLINED_8_CLASS_MAPPING consistency
// -------------------------------------------------------------
const expected8Classes = [
  'paper_cardboard',
  'plastic_bottle',
  'metal',
  'flexible_plastic',
  'sanitary_ppe_waste',
  'organic',
  'battery_ewaste',
  'hazardous_medical',
];

assert.equal(Object.keys(STREAMLINED_8_CLASS_MAPPING).length, 8, '8-class mapping must have 8 keys');

for (let id = 0; id < 8; id++) {
  const m = STREAMLINED_8_CLASS_MAPPING[id];
  assert.ok(m, `Missing mapping for class id ${id}`);
  assert.equal(m.className, expected8Classes[id], `Class id ${id} has wrong className`);
  assert.ok(validCategories.has(m.category), `Class id ${id} has invalid category ${m.category}`);
  assert.ok(
    catalogItemIds.has(m.itemId),
    `Class id ${id} (${m.className}) maps to non-existent catalog item '${m.itemId}'!`
  );
}
console.log('PASS: STREAMLINED_8_CLASS_MAPPING completely synchronized with catalog.');

// -------------------------------------------------------------
// Test 4: UNIFIED_10_CLASS_MAPPING consistency
// -------------------------------------------------------------
assert.equal(Object.keys(UNIFIED_10_CLASS_MAPPING).length, 10, '10-class mapping must have 10 keys');

for (let id = 0; id < 10; id++) {
  const m = UNIFIED_10_CLASS_MAPPING[id];
  assert.ok(m, `Missing mapping for 10-class id ${id}`);
  assert.ok(validCategories.has(m.category), `10-class id ${id} has invalid category ${m.category}`);
  assert.ok(
    catalogItemIds.has(m.itemId),
    `10-class id ${id} (${m.className}) maps to non-existent catalog item '${m.itemId}'!`
  );
}
console.log('PASS: UNIFIED_10_CLASS_MAPPING completely synchronized with catalog.');

// -------------------------------------------------------------
// Test 5: sortify_class_mapping.json files consistency
// -------------------------------------------------------------
assert.deepEqual(serverMapping, mlMapping, 'server and Sortify-ML class mappings must be identical!');

for (let id = 0; id < 8; id++) {
  const entry = serverMapping[String(id)];
  assert.ok(entry, `Missing entry for class ${id} in sortify_class_mapping.json`);
  assert.equal(entry.name, expected8Classes[id]);
  assert.ok(validCategories.has(entry.category), `Invalid category in json for class ${id}: ${entry.category}`);
  assert.ok(entry.display_name && entry.display_name.length > 0);
  assert.ok(entry.item_id && catalogItemIds.has(entry.item_id), `json item_id '${entry.item_id}' not in catalog!`);
  assert.ok(entry.guidance && entry.guidance.length > 10);
  assert.ok(Array.isArray(entry.examples) && entry.examples.length >= 3);
  assert.ok(Array.isArray(entry.sub_items) && entry.sub_items.length >= 3, `sub_items for class ${id} must have >= 3 items`);
  for (const subId of entry.sub_items) {
    assert.ok(catalogItemIds.has(subId), `sub_item '${subId}' in sortify_class_mapping.json not found in catalog!`);
  }
}
console.log('PASS: sortify_class_mapping.json verified with sub_items and identical in both repos.');

// -------------------------------------------------------------
// Test 6: demoPrediction and demoPredictions coverage
// -------------------------------------------------------------
const testDemoIds = [
  'paper-cardboard',
  'plastic-bottle',
  'metal',
  'flexible-plastic',
  'sanitary-ppe',
  'organic-waste',
  'battery-ewaste',
  'hazardous-medical',
  'box',
  'bottle',
  'can',
  'banana',
  'battery',
  'wrapper',
  'plastic-bag',
];

for (const id of testDemoIds) {
  const pred = demoPrediction(id, 85);
  assert.ok(pred, `demoPrediction failed for '${id}'`);
  assert.ok(catalogItemIds.has(pred.itemId), `demoPrediction for '${id}' returned non-existent itemId: ${pred.itemId}`);
  assert.ok(validCategories.has(pred.category));
  assert.equal(pred.confidence, 85);
  assert.ok(pred.box && pred.box.width > 0 && pred.box.height > 0);

  const preds = demoPredictions(id, 85);
  assert.ok(Array.isArray(preds) && preds.length >= 1, `demoPredictions failed for '${id}'`);
  for (const p of preds) {
    assert.ok(catalogItemIds.has(p.itemId), `demoPredictions sub-box returned non-existent itemId: ${p.itemId}`);
  }
}
console.log(`PASS: demoPrediction and demoPredictions tested for ${testDemoIds.length} sample items.`);

// -------------------------------------------------------------
// Test 7: Nearby disposal kind routing
// -------------------------------------------------------------
const testKindMappings = [
  { id: 'battery', expected: 'battery' },
  { id: 'battery-ewaste', expected: 'battery' },
  { id: 'mobile-phone', expected: 'electronics' },
  { id: 'charger', expected: 'electronics' },
  { id: 'medicine', expected: 'medicine' },
  { id: 'blister-pack', expected: 'medicine' },
  { id: 'medical-waste', expected: 'medical' },
  { id: 'hazardous-medical', expected: 'medical' },
  { id: 'bottle', expected: null },
  { id: 'box', expected: null },
  { id: 'flexible-plastic', expected: null },
];

for (const { id, expected } of testKindMappings) {
  const item = catalog.find((i) => i.id === id);
  assert.ok(item, `Item ${id} not found for disposalKind test`);
  const kind = disposalKind(item);
  assert.equal(kind, expected, `disposalKind for ${id} expected '${expected}', got '${kind}'`);
}
console.log('PASS: disposalKind accurately routes hazardous and electronic items.');

console.log('\nALL CLASS MAPPING & CATALOG TESTS PASSED!');
