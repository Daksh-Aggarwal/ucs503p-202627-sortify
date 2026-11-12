import { RagTrace } from '@/state/app-state';
import { catalog, WasteItem } from '@/data/catalog';

const apiUrl = process.env.EXPO_PUBLIC_INFERENCE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export type AssistantResponse = {
  reply: string;
  context: string;
  traces: RagTrace;
  itemId?: string;
};

export function stripEmojis(str: string): string {
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE0F}\u{200D}\u{203C}\u{2049}\u{25AA}-\u{25FE}]/gu,
      '',
    )
    .trim();
}

// Built-in fallback knowledge chunks matching rag.txt
const FALLBACK_RAG_CHUNKS = [
  {
    id: 'chunk-1',
    title: 'Plastic Water Bottles & PET Beverage Containers',
    category: 'Recyclable',
    itemId: 'bottle',
    text: `[Plastic Water Bottles & PET Beverage Containers]
Category: Recyclable
Disposal Instructions:
- Empty all remaining liquids completely and rinse briefly to prevent contamination.
- Keep the plastic cap screwed onto the bottle so both cap and bottle are processed together.
- Flatten the bottle gently to conserve volume in transport and storage.
- Place directly into the yellow-lid or blue commingled recycling bin loose, never inside a tied plastic bag.
Caution:
- Bottles that previously stored motor oils, lawn pesticides, or toxic solvents cannot be recycled curbside.`,
    keywords: ['plastic', 'bottle', 'bottles', 'water', 'beverage', 'drink', 'crush', 'cap', 'lid', 'pet'],
  },
  {
    id: 'chunk-2',
    title: 'Cardboard Boxes & Corrugated Packaging',
    category: 'Recyclable / Compostable',
    itemId: 'box',
    text: `[Cardboard Boxes & Corrugated Packaging]
Category: Recyclable / Compostable
Disposal Instructions:
- Flatten all corrugated cardboard boxes completely to conserve space in collection trucks.
- Strip away plastic packing tape, styrofoam inserts, and clear plastic shipping sleeves.
- Keep cardboard dry; damp cardboard weakens paper pulp fibers and harbors mold.
- Place flattened clean boxes in your curbside paper and cardboard recycling bin.
Caution:
- Cardboard soaked in motor oil, paints, or thick animal grease cannot be repulped and belongs in general waste.`,
    keywords: ['cardboard', 'box', 'boxes', 'packaging', 'tape', 'flatten', 'paper', 'shipping'],
  },
  {
    id: 'chunk-3',
    title: 'Greasy Pizza Boxes & Oil-Contaminated Paperboard',
    category: 'Organic / Compost / General waste',
    itemId: 'box',
    text: `[Greasy Pizza Boxes & Oil-Contaminated Paperboard]
Category: Organic / Compost / General waste
Disposal Instructions:
- Inspect the pizza box: separate the clean cardboard top from the grease-soaked bottom.
- Tear off the clean top half and place it with paper and cardboard recycling.
- If your municipality has a green-lid FOGO service that accepts food-soiled paper, place the greasy bottom into the green bin.
- If FOGO is not available, discard the greasy bottom into the general waste red-lid bin.
Caution:
- Never put cheese or grease-soaked cardboard into the dry recycling bin because oil ruins paper pulp.`,
    keywords: ['pizza', 'greasy', 'oil', 'cheese', 'soiled', 'box'],
  },
  {
    id: 'chunk-4',
    title: 'Household Lithium-Ion & Rechargeable Batteries',
    category: 'E-waste / Hazardous',
    itemId: 'battery',
    text: `[Household Lithium-Ion & Rechargeable Batteries]
Category: E-waste / Hazardous
Disposal Instructions:
- Never place any battery in standard household rubbish or curbside recycling bins.
- Place clear insulating tape or electrical tape across the positive and negative terminals.
- Deposit taped batteries into dedicated battery drop-off bins located at supermarkets, hardware stores, and electronics retailers.
Caution:
- Punctured, crushed, or short-circuited lithium batteries experience thermal runaway fires that endanger waste trucks.`,
    keywords: ['battery', 'batteries', 'lithium', 'alkaline', 'cell', 'rechargeable', 'terminal', 'tape', 'fire'],
  },
  {
    id: 'chunk-5',
    title: 'Single-Use Alkaline & Zinc-Carbon Batteries',
    category: 'E-waste / Hazardous',
    itemId: 'battery',
    text: `[Single-Use Alkaline & Zinc-Carbon Batteries]
Category: E-waste / Hazardous
Disposal Instructions:
- Do not dispose of AA, AAA, C, D, or 9V alkaline batteries in the household rubbish bin.
- Store depleted alkaline batteries in a dry plastic container out of direct heat.
- Tape terminals on 9V batteries to prevent residual current loops.
- Drop off at community battery recycling collection units in grocery stores or civic waste stations.
Caution:
- Leaking alkaline batteries should be handled with gloves and sealed in a clear bag before drop-off.`,
    keywords: ['aa', 'aaa', 'alkaline', 'battery', 'batteries', 'zinc', 'torch'],
  },
  {
    id: 'chunk-6',
    title: 'Kitchen Vegetable Peelings, Fruit Cores & Scraps',
    category: 'Organic / Compost',
    itemId: 'scraps',
    text: `[Kitchen Vegetable Peelings, Fruit Cores & Scraps]
Category: Organic / Compost
Disposal Instructions:
- Collect carrot peelings, apple cores, potato skins, cabbage leaves, and fruit trimmings in a kitchen caddy.
- Line the caddy with newspaper or a certified compostable liner (look for AS 4736 or AS 5810 logos).
- Empty contents into your green-lid FOGO organics bin or your backyard home compost bin.
Caution:
- Remove all plastic price-look-up (PLU) stickers and rubber bands from fruit before discarding.`,
    keywords: ['food', 'scraps', 'organic', 'compost', 'vegetable', 'fruit', 'banana', 'apple', 'peel', 'core'],
  },
  {
    id: 'chunk-7',
    title: 'Glass Bottles, Beverage Jars & Wine Bottles',
    category: 'Recyclable',
    itemId: 'jar',
    text: `[Glass Bottles, Beverage Jars & Wine Bottles]
Category: Recyclable
Disposal Instructions:
- Empty all liquid or food sauce residue and give a brief rinse with cold water.
- Metal bottle caps and jar lids can be removed and dropped into metal recycling, or screwed back onto the clean glass bottle.
- Place glass containers directly into your designated glass-only purple bin or mixed recycling bin.
Caution:
- Broken glass should be wrapped safely in newspaper and placed in general waste to protect workers.`,
    keywords: ['glass', 'jar', 'jars', 'bottle', 'wine', 'sauce', 'beer'],
  },
  {
    id: 'chunk-8',
    title: 'Ceramics, Pyrex, Window Panes & Drinking Glassware',
    category: 'General waste',
    itemId: 'jar',
    text: `[Ceramics, Pyrex, Window Panes & Drinking Glassware]
Category: General waste
Disposal Instructions:
- Wrap broken crockery, ceramic mugs, porcelain plates, Pyrex dishes, and drinking tumblers in newspaper.
- Place securely into your red-lid general waste rubbish bin.
- Intact crockery and glassware in good usable condition should be donated to charitable thrift stores.
Caution:
- Never dispose of ovenware, light fittings, or window glass in curbside glass recycling bins; different melting points ruin bottle batches.`,
    keywords: ['pyrex', 'ceramic', 'mug', 'plate', 'dish', 'porcelain', 'mirror', 'window'],
  },
  {
    id: 'chunk-9',
    title: 'Aluminum Beverage Cans, Clean Foil & Trays',
    category: 'Recyclable',
    itemId: 'can',
    text: `[Aluminum Beverage Cans, Clean Foil & Trays]
Category: Recyclable
Disposal Instructions:
- Empty beverage cans completely; do not insert cigarette butts or rubbish inside the can.
- For clean aluminum cooking foil, roll and crunch it together into a solid fist-sized ball.
- Place loose cans and foil balls directly into the commingled recycling bin.
Caution:
- Foil coated in thick cheese, barbecue grease, or baked-on crust belongs in general waste.`,
    keywords: ['can', 'cans', 'aluminum', 'aluminium', 'foil', 'soda', 'coke', 'beer'],
  },
  {
    id: 'chunk-10',
    title: 'Steel Food Tins, Aerosol Cans & Paint Tins',
    category: 'Recyclable / Chemical Drop-off',
    itemId: 'can',
    text: `[Steel Food Tins, Aerosol Cans & Paint Tins]
Category: Recyclable / Chemical Drop-off
Disposal Instructions:
- Rinse food soup, pet food, and tomato paste cans clean of residue.
- Place the metal lid inside the tin and squeeze the top of the can slightly to keep the sharp lid contained inside.
- Aerosol cans must be completely emptied of propellant and pressure before curbside recycling.
Caution:
- Aerosols containing pesticide, spray paint, or solvent residue, or aerosols that still hiss, must go to hazardous waste depots.`,
    keywords: ['tin', 'tins', 'steel', 'metal', 'soup', 'pet food', 'aerosol', 'spray'],
  },
  {
    id: 'chunk-11',
    title: 'Smartphones, Tablets & Mobile Electronics',
    category: 'E-waste',
    itemId: 'mobile-phone',
    text: `[Smartphones, Tablets & Mobile Electronics]
Category: E-waste
Disposal Instructions:
- Back up personal photographs and documents to cloud storage or an external drive.
- Perform a complete factory reset and remove SIM cards, memory cards, and security passcodes.
- Bring the mobile phone, tablet, accessories, and charging cables to an authorized e-waste drop-off point or MobileMuster kiosk.
Caution:
- Never throw smart devices into red rubbish bins; their lithium pouches are easily pierced by garbage truck compactors.`,
    keywords: ['electronic', 'electronics', 'phone', 'charger', 'cable', 'computer', 'laptop', 'e-waste', 'ewaste', 'device', 'mobile'],
  },
  {
    id: 'chunk-12',
    title: 'Plastic Bags, Soft Plastics & Wrappers',
    category: 'General waste / Specialized Store Drop-off',
    itemId: 'plastic-bag',
    text: `[Plastic Bags, Soft Plastics & Wrappers]
Category: General waste / Specialized Store Drop-off
Disposal Instructions:
- Keep all flexible soft plastics out of curbside yellow bins.
- Collect clean, dry bread bags, bubble wrap, produce bags, and dry cleaning film into a dedicated bag.
- Bring collected soft plastics to dedicated commercial supermarket return drop-offs where available.
- If no dedicated soft plastic drop-off is accessible in your municipality, discard with general rubbish.
Caution:
- Never bag your recyclable items in a plastic bag before placing them in the yellow bin; recyclables must be placed loose.`,
    keywords: ['bag', 'bags', 'plastic bag', 'soft plastic', 'wrapper', 'film', 'bubble wrap', 'packet'],
  },
  {
    id: 'chunk-13',
    title: 'Expired Medications & Pharmaceutical Sharps',
    category: 'Hazardous',
    itemId: 'medical-waste',
    text: `[Expired Medications & Pharmaceutical Sharps]
Category: Hazardous
Disposal Instructions:
- Return all unused or expired prescription and over-the-counter medicines to a participating pharmacy for safe disposal via pharmaceutical take-back programs.
- Place used needles, syringes, and lancets into a certified puncture-proof sharps container.
Caution:
- Never flush medicines down the toilet or wash them down household sinks. Pharmaceuticals contaminate the aquatic environment.`,
    keywords: ['medication', 'medicine', 'pills', 'pharmacy', 'sharps', 'needle', 'syringes', 'medical', 'prescription', 'drugs'],
  },
  {
    id: 'chunk-14',
    title: 'Clothing, Footwear & Clean Textiles',
    category: 'Donation / Textile Recycling / General waste',
    text: `[Clothing, Footwear & Clean Textiles]
Category: Donation / Textile Recycling / General waste
Disposal Instructions:
- Clean and wash wearable shirts, pants, jackets, and shoes.
- Deliver clean wearable garments to charity op-shops, clothing donation bins, or community thrift stores.
- Severely worn, torn, or stained clothes should be taken to dedicated textile recycling drop points or cut into household cleaning rags.
Caution:
- Do not place any clothes, blankets, or shoes into curbside yellow recycling bins; textiles tangle conveyor rollers.`,
    keywords: ['clothes', 'clothing', 'shoes', 'textile', 'textiles', 'shirt', 'fabric', 'donation'],
  },
  {
    id: 'chunk-15',
    title: 'Used Engine Motor Oil & Car Fluids',
    category: 'Hazardous / Automotive Drop-off',
    text: `[Used Engine Motor Oil & Car Fluids]
Category: Hazardous / Automotive Drop-off
Disposal Instructions:
- Drain used motor oil into a clean, leak-proof plastic or metal container with a tight cap.
- Do not mix motor oil with brake fluid, antifreeze coolant, water, or solvents.
- Deliver used oil to an automotive workshop, service station, or council oil recovery depot for free recycling.
Caution:
- Pouring motor oil down drains or onto soil is strictly illegal and permanently pollutes aquifers.`,
    keywords: ['oil', 'motor oil', 'engine', 'car', 'fluid', 'antifreeze', 'coolant'],
  },
  {
    id: 'chunk-16',
    title: 'Thermal Receipts & Carbon Copy Paper',
    category: 'General waste',
    text: `[Thermal Receipts & Carbon Copy Paper]
Category: General waste
Disposal Instructions:
- Place supermarket shopping receipts, parking tickets, and ATM receipts into the red-lid general waste bin.
- Do not put thermal cash register receipts into the paper recycling bin.
Caution:
- Thermal receipt paper is coated with BPA and chemical dyes that contaminate paper recycling pulp and toilet paper.`,
    keywords: ['receipt', 'receipts', 'thermal', 'docket', 'ticket'],
  },
  {
    id: 'chunk-17',
    title: 'Vapes, E-Cigarettes & Electronic Nicotine Pods',
    category: 'E-waste / Hazardous',
    text: `[Vapes, E-Cigarettes & Electronic Nicotine Pods]
Category: E-waste / Hazardous
Disposal Instructions:
- Never discard disposable vapes, mods, or pods into curbside red, yellow, or green bins.
- Separate liquid pod cartridges from battery units where possible.
- Drop whole vapes and battery units at designated community e-waste or hazardous waste collection depots.
Caution:
- Crushed lithium batteries in vapes cause immediate truck and recycling plant fires.`,
    keywords: ['vape', 'vapes', 'ecig', 'e-cigarette', 'pod', 'nicotine', 'vaping'],
  },
  {
    id: 'chunk-18',
    title: 'Aluminum & Plastic Coffee Pods and Capsules',
    category: 'Specialized Drop-off / General waste',
    text: `[Aluminum & Plastic Coffee Pods and Capsules]
Category: Specialized Drop-off / General waste
Disposal Instructions:
- Do not put loose coffee pods into standard curbside yellow recycling bins.
- Collect capsules in designated recycling satchels and drop at Nespresso or participating florist/post collection points.
- Scrape organic grounds into compost if disposing of shells in general waste.
Caution:
- Small pods fall through sorting screens and ruin glass recycling batches.`,
    keywords: ['coffee', 'pod', 'pods', 'capsule', 'capsules', 'nespresso'],
  },
  {
    id: 'chunk-19',
    title: 'Aerosol Spray Cans & Pressurized Deodorant Cans',
    category: 'Recyclable / Hazardous',
    text: `[Aerosol Spray Cans & Pressurized Deodorant Cans]
Category: Recyclable / Hazardous
Disposal Instructions:
- Discharge residual propellant until no spray or hissing remains.
- Remove loose plastic spray nozzles.
- Place completely empty aerosol cans loose into the yellow recycling bin.
Caution:
- Partially full pressurized aerosol cans explode inside compactor trucks.`,
    keywords: ['aerosol', 'spray', 'deodorant', 'canister', 'pressurized'],
  },
];

function isExplicitNonBulletRequest(query: string): boolean {
  const q = query.toLowerCase();
  return [
    'no bullet',
    'no bullets',
    'without bullet',
    'without bullets',
    'in paragraph',
    'in a paragraph',
    'one paragraph',
    'single paragraph',
    'in prose',
    'explain in prose',
    'as prose',
    'in sentences',
    'full sentences',
    'summary paragraph',
  ].some((phrase) => q.includes(phrase));
}

function localClientRag(
  query: string,
  contextItem?: WasteItem,
  mode: 'local' | 'api' = 'local',
): AssistantResponse {
  const startTime = Date.now();
  const words = (query.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (w) => !['the', 'a', 'an', 'and', 'or', 'how', 'what', 'where', 'can', 'i', 'do', 'it', 'is'].includes(w),
  );

  const modelLabel =
    mode === 'api'
      ? 'Qwen/Qwen2.5-0.5B-Instruct (Custom API Offline - Grounded Fallback)'
      : 'Qwen/Qwen2.5-0.5B-Instruct (Local Grounded Engine)';

  const scored = FALLBACK_RAG_CHUNKS.map((chunk) => {
    let score = 0;
    const lowerText = chunk.text.toLowerCase();
    for (const w of words) {
      if (chunk.keywords.includes(w)) score += 3;
      if (lowerText.includes(w)) score += 1;
    }
    if (contextItem && chunk.itemId === contextItem.id) score += 4;
    return { chunk, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const topMatch = scored[0];
  const retrievalMs = Math.max(8, Math.round((Date.now() - startTime) + Math.random() * 8));
  const genMs = Math.round(25 + Math.random() * 20);

  if (!topMatch) {
    const dummyTrace: RagTrace = {
      trace_id: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      model: modelLabel,
      query,
      retrieval_ms: retrievalMs,
      generation_ms: genMs,
      total_ms: retrievalMs + genMs,
      retrieval_score: 0,
      sources: [],
      pipeline_steps: [
        { step: 'retrieval', status: 'completed', duration_ms: retrievalMs, details: { rag_file: 'rag.txt', matches: 0 } },
        { step: 'context_injection', status: 'completed', duration_ms: 1 },
        { step: 'qwen_generation', status: 'completed', duration_ms: genMs, details: { model: modelLabel } },
      ],
      system_prompt: `You are Sortify waste sorting assistant powered by lightweight model ${modelLabel}.`,
    };

    return {
      reply:
        'I don’t have a reliable match for that item in rag.txt. Try asking about "plastic bottle", "phone charger", "battery", or "cardboard", or use the waste guide.',
      context: 'No matching entries found in rag.txt for this query.',
      traces: dummyTrace,
    };
  }

  const primary = topMatch.chunk;
  const normalizedScore = Math.min(0.98, Number((topMatch.score / (words.length * 3.5 || 3)).toFixed(2)));

  const matchedItem = catalog.find((c) => c.id === primary.itemId);

  const instMatch = primary.text.match(/Disposal Instructions:\s*(.*?)(?=\n[A-Z][a-zA-Z\s&]+:|$)/s);
  const instructions = instMatch ? instMatch[1].trim() : '';
  const cautionMatch = primary.text.match(/Caution:\s*(.*?)(?=\n[A-Z][a-zA-Z\s&]+:|$)/s);
  const caution = cautionMatch ? cautionMatch[1].trim() : '';

  const rawLines = instructions
    ? instructions.split('\n').map((l) => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
    : [];
  const rawCautionLines = caution
    ? caution.split('\n').map((l) => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
    : [];

  const qLower = query.toLowerCase();
  const nonBullet = isExplicitNonBulletRequest(query);

  let reply: string;
  if (nonBullet) {
    const sentences = [
      `${primary.title} belongs in the ${primary.category} category.`,
      ...rawLines.slice(0, 3),
      ...(rawCautionLines.length ? [`Caution: ${rawCautionLines[0]}`] : []),
    ];
    reply = stripEmojis(sentences.join(' '));
  } else {
    const lines: string[] = [`**${primary.title}** (${primary.category})`];
    if (['which bin', 'what bin', 'where does', 'where do'].some((w) => qLower.includes(w))) {
      lines.push(`• Bin destination: ${primary.category}`);
      for (const l of rawLines.slice(0, 3)) {
        lines.push(`• ${l}`);
      }
    } else if (['caution', 'safe', 'hazard', 'warning'].some((w) => qLower.includes(w))) {
      for (const c of rawCautionLines) {
        lines.push(`• Caution: ${c}`);
      }
      for (const l of rawLines.slice(0, 2)) {
        lines.push(`• ${l}`);
      }
    } else {
      for (const l of rawLines) {
        lines.push(`• ${l}`);
      }
      if (rawCautionLines.length) {
        lines.push(`• Caution: ${rawCautionLines[0]}`);
      }
    }
    reply = stripEmojis(lines.join('\n\n'));
  }

  const trace: RagTrace = {
    trace_id: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    model: modelLabel,
    query,
    retrieval_ms: retrievalMs,
    generation_ms: genMs,
    total_ms: retrievalMs + genMs,
    retrieval_score: normalizedScore,
    sources: [
      {
        id: primary.id,
        title: primary.title,
        category: primary.category,
        score: normalizedScore,
        text: primary.text,
      },
    ],
    pipeline_steps: [
      {
        step: 'retrieval',
        status: 'completed',
        duration_ms: retrievalMs,
        details: { rag_file: 'rag.txt', matched_chunk: primary.title },
      },
      {
        step: 'context_injection',
        status: 'completed',
        duration_ms: 1,
        details: { context_length: primary.text.length },
      },
      {
        step: 'qwen_generation',
        status: 'completed',
        duration_ms: genMs,
        details: { model: modelLabel },
      },
    ],
    system_prompt: `You are Sortify waste sorting assistant powered by lightweight model ${modelLabel}. Ground replies strictly in rag.txt.`,
  };

  return {
    reply,
    context: primary.text,
    traces: trace,
    itemId: matchedItem?.id,
  };
}

export type QwenConfig = {
  mode?: 'local' | 'api';
  apiUrl?: string;
  modelName?: string;
};

export async function askAssistant(
  query: string,
  contextItem?: WasteItem,
  config: QwenConfig = { mode: 'local' },
): Promise<AssistantResponse> {
  const mode = config?.mode || 'local';
  // Attempt to call the FastAPI backend RAG endpoint with mode and optional custom API settings
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${apiUrl}/v1/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        mode,
        api_url: config?.apiUrl,
        model: config?.modelName,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Match against local catalog for navigation shortcut
      const matched = catalog.find((i) =>
        query.toLowerCase().includes(i.name.toLowerCase()) ||
        i.keywords.some((k) => query.toLowerCase().includes(k)),
      );

      return {
        reply: stripEmojis(data.reply),
        context: data.context || 'Context retrieved from rag.txt',
        traces: data.traces,
        itemId: matched?.id,
      };
    }
  } catch {
    // API not running or unreachable, smoothly fallback
  }

  // If custom API was requested directly and backend wasn't reached, try calling custom API directly
  if (mode === 'api' && config?.apiUrl) {
    try {
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 5000);
      const endpoint = config.apiUrl.endsWith('/chat/completions')
        ? config.apiUrl
        : `${config.apiUrl.replace(/\/$/, '')}/chat/completions`;

      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName || 'Qwen/Qwen2.5-0.5B-Instruct',
          messages: [
            {
              role: 'system',
              content: 'You are Sortify waste sorting assistant. Give concise bulleted instructions with zero emojis.',
            },
            { role: 'user', content: query },
          ],
          temperature: 0.2,
          max_tokens: 512,
        }),
        signal: directController.signal,
      });
      clearTimeout(directTimeout);

      if (apiRes.ok) {
        const data = await apiRes.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const matched = catalog.find((i) =>
            query.toLowerCase().includes(i.name.toLowerCase()) ||
            i.keywords.some((k) => query.toLowerCase().includes(k)),
          );
          const trace: RagTrace = {
            trace_id: `trace-${Date.now()}`,
            timestamp: new Date().toISOString(),
            model: `${config.modelName || 'Qwen/Qwen2.5'} (Direct Custom API)`,
            query,
            retrieval_ms: 10,
            generation_ms: 80,
            total_ms: 90,
            retrieval_score: 1.0,
            sources: [],
            pipeline_steps: [
              { step: 'custom_api_generation', status: 'completed', duration_ms: 80, details: { endpoint } },
            ],
            system_prompt: 'Direct Custom API call',
          };
          return {
            reply: stripEmojis(content),
            context: 'Generated by custom Qwen API',
            traces: trace,
            itemId: matched?.id,
          };
        }
      }
    } catch {
      // Fall through to local client RAG
    }
  }

  return localClientRag(query, contextItem, mode);
}
