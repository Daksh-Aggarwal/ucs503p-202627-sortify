export type Category = 'Recyclable' | 'Organic' | 'General waste' | 'E-waste' | 'Hazardous';
export type WasteItem = {
  id: string;
  name: string;
  category: Category;
  material: string;
  description: string;
  steps: string[];
  caution?: string;
  keywords: string[];
};
export const categories: {
  name: Category;
  color: string;
  background: string;
  icon: string;
  description: string;
}[] = [
  {
    name: 'Recyclable',
    color: '#326C86',
    background: '#E8F1F6',
    icon: 'recycle',
    description: 'Give materials a second life',
  },
  {
    name: 'Organic',
    color: '#477B43',
    background: '#ECF2E4',
    icon: 'sprout',
    description: 'Return goodness to the earth',
  },
  {
    name: 'General waste',
    color: '#8C7765',
    background: '#F2EDE7',
    icon: 'trash',
    description: 'For what cannot be recovered',
  },
  {
    name: 'E-waste',
    color: '#8170A5',
    background: '#F0EBF7',
    icon: 'plug',
    description: 'A better end for electronics',
  },
  {
    name: 'Hazardous',
    color: '#B17D34',
    background: '#FBF1DF',
    icon: 'shield',
    description: 'A little extra care goes a long way',
  },
];
export const catalog: WasteItem[] = [
  {
    id: 'bottle',
    name: 'Plastic bottle',
    category: 'Recyclable',
    material: 'PET · Plastic #1',
    description: 'An everyday bottle with another life ahead of it.',
    steps: [
      'Empty the bottle and give it a quick rinse.',
      'Keep it clean and dry; check whether your collector accepts caps.',
      'Place it in your accepted dry-recycling stream.',
    ],
    keywords: ['water', 'pet', 'plastic', 'bottle'],
  },
  {
    id: 'banana',
    name: 'Banana peel',
    category: 'Organic',
    material: 'Biodegradable food waste',
    description: 'A small scrap that can become something good.',
    steps: [
      'Remove any stickers or packaging.',
      'Keep the peel separate from plastic and other dry waste.',
      'Add it to a suitable compost system or your wet-waste collection.',
    ],
    keywords: ['banana', 'fruit', 'peel'],
  },
  {
    id: 'box',
    name: 'Cardboard box',
    category: 'Recyclable',
    material: 'Corrugated paperboard',
    description: 'Clean cardboard is a valuable recyclable material.',
    steps: [
      'Remove plastic liners and packing materials.',
      'Flatten the box and keep it dry.',
      'Place clean cardboard with accepted paper recycling.',
    ],
    caution: 'Greasy or food-soiled sections may not be accepted with paper recycling.',
    keywords: ['cardboard', 'box', 'parcel', 'paperboard'],
  },
  {
    id: 'battery',
    name: 'Household battery',
    category: 'Hazardous',
    material: 'Mixed metals and electrolytes',
    description: 'Batteries need a dedicated collection route.',
    steps: [
      'Keep the battery separate from household waste.',
      'For intact batteries, protect exposed terminals with non-conductive tape.',
      'Ask your local authority or retailer about an authorized battery collection point.',
    ],
    caution:
      'Do not crush, puncture, burn, or place batteries in mixed recycling. Do not handle a leaking, swollen, or hot battery; seek specialist guidance.',
    keywords: ['battery', 'batteries', 'aa', 'lithium'],
  },
  {
    id: 'jar',
    name: 'Glass jar',
    category: 'Recyclable',
    material: 'Container glass',
    description: 'Reuse it first. Recycle it when you are done.',
    steps: [
      'Empty and rinse the jar.',
      'Separate the lid if required by your collector.',
      'Use an accepted glass collection stream.',
    ],
    caution: 'Broken glass, mirrors, and ceramics need separate guidance.',
    keywords: ['jar', 'glass', 'jam'],
  },
  {
    id: 'can',
    name: 'Aluminium can',
    category: 'Recyclable',
    material: 'Aluminium',
    description: 'A lightweight material made to come around again.',
    steps: [
      'Empty the can completely.',
      'Rinse off food or drink residue.',
      'Place it with accepted metal or dry recyclables.',
    ],
    keywords: ['can', 'soda', 'aluminium', 'aluminum', 'metal'],
  },
  {
    id: 'scraps',
    name: 'Vegetable scraps',
    category: 'Organic',
    material: 'Plant-based food waste',
    description: 'Make the most of what is left after cooking.',
    steps: [
      'Remove packaging and produce stickers.',
      'Collect scraps separately in a covered wet-waste container.',
      'Use a suitable compost system or organic-waste collection.',
    ],
    keywords: ['vegetable', 'food', 'scraps', 'compost'],
  },
  {
    id: 'tissue',
    name: 'Used tissue',
    category: 'General waste',
    material: 'Soiled paper fibres',
    description: 'Used tissues do not belong with clean paper recycling.',
    steps: [
      'Keep used tissues out of dry paper recycling.',
      'Contain hygienically with general household waste.',
      'Follow your local collection instructions.',
    ],
    keywords: ['tissue', 'napkin', 'soiled'],
  },
  {
    id: 'wrapper',
    name: 'Snack wrapper',
    category: 'General waste',
    material: 'Multilayer flexible packaging',
    description: 'Mixed layers are difficult to recycle through everyday streams.',
    steps: [
      'Empty any remaining food.',
      'Check for a dedicated flexible-packaging collection scheme.',
      'If none is available, place it in general waste.',
    ],
    keywords: ['wrapper', 'chips', 'packet', 'snack'],
  },
  {
    id: 'charger',
    name: 'Phone charger',
    category: 'E-waste',
    material: 'Plastic, copper and electronics',
    description: 'Recover valuable materials through electronics collection.',
    steps: [
      'Check if it can be repaired or reused safely.',
      'Keep the charger and cable out of household bins.',
      'Use an authorized e-waste recycler or retailer take-back program.',
    ],
    caution: 'Do not dismantle damaged electrical accessories.',
    keywords: ['charger', 'cable', 'phone', 'electronic', 'wire'],
  },
  {
    id: 'headphones',
    name: 'Old headphones',
    category: 'E-waste',
    material: 'Mixed electronic components',
    description: 'Small electronics still deserve the right destination.',
    steps: [
      'Consider repair or donation if they still work.',
      'Keep battery-powered headphones intact.',
      'Take them to an authorized electronics collection point.',
    ],
    keywords: ['headphones', 'earphones', 'earbuds'],
  },
  {
    id: 'medicine',
    name: 'Expired medicine',
    category: 'Hazardous',
    material: 'Pharmaceutical waste',
    description: 'Medicines need an appropriate local disposal pathway.',
    steps: [
      'Keep the medicine in its original packaging where possible.',
      'Store securely away from children and pets.',
      'Ask a pharmacist or local authority about an approved disposal program.',
    ],
    caution: 'Do not flush medicines or empty them into drains.',
    keywords: ['medicine', 'pills', 'tablet', 'pharmaceutical'],
  },
  {
    id: 'paper',
    name: 'Newspaper',
    category: 'Recyclable',
    material: 'Printed paper',
    description: 'Keep paper in circulation, one page at a time.',
    steps: [
      'Separate paper from plastic covers.',
      'Keep it clean and dry.',
      'Bundle for an accepted paper-recycling collection.',
    ],
    keywords: ['newspaper', 'paper', 'magazine'],
  },
  {
    id: 'leaves',
    name: 'Dry leaves',
    category: 'Organic',
    material: 'Garden waste',
    description: 'Nature’s own ingredient for healthy compost.',
    steps: [
      'Remove plastic and other litter.',
      'Shred large leaves if practical.',
      'Add to compost or an accepted garden-waste collection.',
    ],
    keywords: ['leaves', 'garden', 'plant'],
  },
  {
    id: 'ceramic',
    name: 'Broken ceramic mug',
    category: 'General waste',
    material: 'Fired ceramic',
    description: 'Ceramics are different from recyclable container glass.',
    steps: [
      'Avoid direct contact with sharp edges.',
      'Contain safely and label sharp fragments.',
      'Check local guidance for non-recyclable household or bulky waste.',
    ],
    caution: 'Do not put ceramics into glass recycling.',
    keywords: ['ceramic', 'mug', 'plate', 'broken'],
  },
];
export const locations = ['Patiala, Punjab', 'Chandigarh', 'New Delhi', 'Other location'];
export function locationGuidance(location: string, category: Category) {
  const stream =
    category === 'Organic'
      ? 'wet-waste and compost collection'
      : category === 'Recyclable'
        ? 'accepted dry-recycling materials'
        : category === 'E-waste'
          ? 'authorized e-waste take-back services'
          : category === 'Hazardous'
            ? 'specialist collection services'
            : 'general-waste collection';
  return `For ${location}, confirm ${stream} with your local collector${location.startsWith('Patiala') ? ' or campus facilities team' : ''}. Verified local schedules and collection points are not connected in this prototype.`;
}
export const lessons = [
  {
    title: 'Small habits. Lasting change.',
    tag: 'THE SORTING BASICS',
    time: '3 min read',
    icon: 'sprout',
    color: '#E9EEDA',
    intro: 'A better routine begins with two simple spaces: one for wet waste, one for dry.',
    paragraphs: [
      'Keep food scraps separate from dry materials from the moment you finish using them. A small covered container near your preparation area makes this easier.',
      'Empty recyclable packaging, remove food residue, and keep paper and cardboard dry. A contaminated item can make other materials harder to recover.',
      'Set aside batteries and electronics for dedicated collection. Start with one repeatable habit, then build from there.',
    ],
  },
  {
    title: 'The recycling symbols, decoded.',
    tag: 'KNOW YOUR MATERIALS',
    time: '4 min read',
    icon: 'recycle',
    color: '#E6EDF2',
    intro: 'A symbol identifies a material. Your local collection determines where it goes.',
    paragraphs: [
      'Numbers on plastic packaging describe the resin type. They do not guarantee that a local recycler accepts that item.',
      'A clean bottle and a flexible multilayer wrapper can have very different disposal routes. Search for the specific item rather than assuming all plastics go together.',
      'Check the collector’s accepted-material list. When guidance is missing, ask before placing an uncertain material in the recycling stream.',
    ],
  },
  {
    title: 'Give your electronics a good goodbye.',
    tag: 'BEYOND THE BIN',
    time: '3 min read',
    icon: 'plug',
    color: '#EDE8F1',
    intro: 'A drawer full of old cables is a chance to recover useful materials.',
    paragraphs: [
      'Separate working accessories from broken ones. Safe reuse or repair can extend their useful life.',
      'Before handing over a device with personal data, follow its manufacturer’s instructions to back up and erase that data.',
      'Use an authorized recycler or a retailer take-back scheme. Never break electronics apart to remove materials yourself.',
    ],
  },
];
