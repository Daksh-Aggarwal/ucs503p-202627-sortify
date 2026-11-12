const assert = require('assert');

// Mock scan items data matching the user's scan
const initialDetectedItems = [
  { id: 'scraps', confidence: 62, displayName: 'Organic Waste', category: 'Organic' },
  { id: 'scraps', confidence: 51, displayName: 'Organic Waste', category: 'Organic' },
  { id: 'scraps', confidence: 38, displayName: 'Organic Waste', category: 'Organic' },
  { id: 'scraps', confidence: 36, displayName: 'Organic Waste', category: 'Organic' },
];

function filterDetections(items, thresholdPercent) {
  const filtered = items.filter((d) => d.confidence >= thresholdPercent);
  if (filtered.length > 0) {
    return { items: filtered, status: 'filtered' };
  }
  return { items: [items[0]], status: 'fallback_highest' };
}

// 1. Test Low threshold (35%)
const lowResult = filterDetections(initialDetectedItems, 35);
assert.equal(lowResult.items.length, 4, 'Low (35%) threshold should retain all 4 items');
console.log('PASS: Low threshold (35%) retains all 4 items');

// 2. Test Medium threshold (50%)
const medResult = filterDetections(initialDetectedItems, 50);
assert.equal(medResult.items.length, 2, 'Medium (50%) threshold should retain 2 items (62% and 51%)');
assert.equal(medResult.items[0].confidence, 62);
assert.equal(medResult.items[1].confidence, 51);
console.log('PASS: Medium threshold (50%) retains 2 items (62% and 51%)');

// 3. Test High threshold (70%)
const highResult = filterDetections(initialDetectedItems, 70);
assert.equal(highResult.items.length, 1, 'High (70%) threshold should retain top match without empty crash');
assert.equal(highResult.status, 'fallback_highest');
assert.equal(highResult.items[0].confidence, 62);
console.log('PASS: High threshold (70%) safely retains top match');

// 4. Test re-evaluating back to Low (35%) from High
const lowRestored = filterDetections(initialDetectedItems, 35);
assert.equal(lowRestored.items.length, 4, 'Restoring Low threshold from initialDetectedItems should recover all 4 items');
console.log('PASS: Restoring Low threshold recovers all 4 original items without data loss');

console.log('\nALL DETECTION THRESHOLD TESTS PASSED!');
