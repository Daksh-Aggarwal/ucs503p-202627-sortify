const assert = require('node:assert/strict');

function stripEmojis(str) {
  return str.replace(
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{25AA}-\u{25FE}]/gu,
    '',
  );
}

function parseBlock(line) {
  line = line.trim();
  if (!line) return null;

  // 1. Header: **Title** (Category) or **Title**: (Category) or **Title** (Category):
  const headerMatch = line.match(/^(?:#{1,4}\s+)?\*\*(.*?)\*\*(?:\s*[:\–\-]\s*|\s+)?(?:\((.*?)\))?\s*:?\s*$/);
  if (headerMatch && (headerMatch[1] || headerMatch[2])) {
    return { type: 'header', title: headerMatch[1].trim(), category: headerMatch[2]?.trim() };
  }

  // 2. Caution / Warning: Caution: ... or **Caution**: ... or • Caution: ...
  const cautionMatch = line.match(/^(?:[•\-*]\s*)?(?:\*\*(?:Caution|Warning)\*\*|(?:Caution|Warning))(?:[:\s]+\s*)(.*)$/i);
  if (cautionMatch) {
    return { type: 'caution', body: cautionMatch[1].trim() };
  }

  // 3. Note / Related: *Related note on ...*: ... or • Related category (...): ... or Note: ...
  const noteMatch = line.match(
    /^(?:[•\-*]\s*)?(?:\*?(Related\s+(?:note|category)|Material\s+note|Regional\s+note|Note)(?:\s+(?:on|for)\s+([^*:]+)|\s*\(([^)]+)\))?\*?)(?:[:\s]+\s*)(.*)$/i,
  );
  if (noteMatch) {
    const kind = noteMatch[1].trim();
    const topic = (noteMatch[2] || noteMatch[3] || '').trim();
    return { type: 'note', kind, topic, body: noteMatch[4].trim() };
  }

  // 4. Bullet points: • or - or *
  const bulletMatch = line.match(/^(?:•|\-|\*(?!\*))\s+(.*)$/);
  if (bulletMatch) {
    return { type: 'bullet', body: bulletMatch[1].trim() };
  }

  // 5. Numbered list: 1. or 1)
  const numMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
  if (numMatch) {
    return { type: 'numbered', num: numMatch[1], body: numMatch[2].trim() };
  }

  // 6. Section labels like Disposal Instructions: ...
  const sectionMatch = line.match(/^(?:Disposal\s+Instructions|Instructions|Overview):\s*(.*)$/i);
  if (sectionMatch && sectionMatch[1]) {
    return { type: 'instructions', body: sectionMatch[1].trim() };
  }

  // 7. General multi-sentence paragraph:
  const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((s) => s.trim().length > 0);
  if (sentences.length > 1 && !line.startsWith('I ') && !line.startsWith('You ')) {
    return { type: 'multi-sentence-bullets', sentences };
  }

  return { type: 'paragraph', body: line };
}

module.exports = { stripEmojis, parseBlock };

// Run assertions on screenshot text
const rawScreenshotText = [
  '**Lithium-ion & Household Batteries** (E-waste / Hazardous):',
  'Never place any battery in standard household rubbish or curbside recycling bins. Tape the contact terminals of lithium, 9V, and button-cell batteries with clear non conductive tape (electrical or packing tape) to prevent short circuits. Take them to designated battery drop-off bins at supermarkets, electronics stores, or local council collection points.',
  '',
  '\u26A0\uFE0F **Caution**: Punctured, damaged, or compressed lithium batteries cause dangerous thermal runaways and fires in recycling trucks and facilities.',
  '',
  '*Related note on Glass Bottles & Food Jars*: Category: Recyclable',
  'Disposal Instructions: Empty contents and rinse clean of food sauces and residue. Metal lids and jar caps can be removed and recycled with metals or left loose...',
].join('\n');

const clean = stripEmojis(rawScreenshotText);
const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const parsed = lines.map(parseBlock);

assert.equal(parsed[0].type, 'header');
assert.equal(parsed[0].title, 'Lithium-ion & Household Batteries');
assert.equal(parsed[0].category, 'E-waste / Hazardous');

assert.equal(parsed[1].type, 'multi-sentence-bullets');
assert.equal(parsed[1].sentences.length, 3);

assert.equal(parsed[2].type, 'caution');
assert.ok(parsed[2].body.includes('thermal runaways'));

assert.equal(parsed[3].type, 'note');
assert.equal(parsed[3].topic, 'Glass Bottles & Food Jars');

assert.equal(parsed[4].type, 'instructions');

// Also verify real server RAG lines:
const serverRagLines = [
  '**Single-Use Alkaline & Zinc-Carbon Batteries** (E-waste / Hazardous)',
  '• Do not dispose of AA, AAA, C, D, or 9V alkaline batteries in the household rubbish bin.',
  '• Material note: Alkaline batteries contain zinc and steel.',
  '• Caution: Leaking alkaline batteries should be handled with gloves.',
  '• Regional note: Free drop-off bins are hosted in major grocery chains.',
  '• Related category (Household Lithium-Ion & Rechargeable Batteries): E-waste / Hazardous'
];

const parsedServer = serverRagLines.map(parseBlock);
assert.equal(parsedServer[0].type, 'header');
assert.equal(parsedServer[1].type, 'bullet');
assert.equal(parsedServer[2].type, 'note');
assert.equal(parsedServer[3].type, 'caution');
assert.equal(parsedServer[4].type, 'note');
assert.equal(parsedServer[5].type, 'note');

console.log('ALL PARSING CHECKS (SCREENSHOT + SERVER RAG) PASSED!');
