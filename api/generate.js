// api/generate.js — each angle generated independently, no cross-image references

const MODEL = 'google/gemini-2.5-flash-image';

function buildPrompt(angle, analysis) {
  const { hairstyle_name, description, length, front_notes, back_notes, side_notes, top_notes } = analysis;

  const angleMap = {
    front: {
      view: 'FRONT VIEW',
      lock: 'The person faces directly toward the camera. The output MUST show a front-facing person.',
      task: 'Add hair to the top and sides. Hair sweeps down across the forehead fully covering the hairline.',
      notes: front_notes || '',
    },
    back: {
      view: 'BACK OF HEAD VIEW',
      lock: 'The person has their back to the camera. Output MUST show the back of the head — face NOT visible.',
      task: 'Add hair to the back and crown. Show nape taper, back volume, and natural hair length from behind.',
      notes: back_notes || '',
    },
    side: {
      view: 'SIDE PROFILE VIEW',
      lock: 'The person is turned 90 degrees showing their side profile. Output MUST be a side profile — one ear visible, nose seen from the side. This is NOT a front-facing photo. Do not rotate or repose the person.',
      task: 'Add hair along the top of the head and side temple area as seen from the profile angle. Hair follows the natural head shape from the side.',
      notes: side_notes || '',
    },
    top: {
      view: 'TOP-DOWN CROWN VIEW',
      lock: "The camera looks straight down at the top of the person's head. Output MUST show the top/crown of the head from above.",
      task: 'Add hair across the entire crown as seen from above. Show natural parting and full scalp coverage.',
      notes: top_notes || '',
    },
  };

  const a = angleMap[angle];

  return `PHOTO RETOUCHING TASK — STRICT IDENTITY & HAIR CONSISTENCY

You are editing a REAL PERSON'S photo. This is NOT generation — this is a STRICT transformation.

========================
IDENTITY LOCK (ABSOLUTE)
========================
- This is the SAME PERSON. Preserve identity EXACTLY.
- Do NOT change:
  - Face shape
  - Skin tone
  - Eyes, nose, lips
  - Expression

- DO NOT add, remove, or modify:
  - Beard
  - Moustache
  - Any facial hair
  - Piercings or accessories

- If clean-shaven → KEEP clean-shaven  
- If beard exists → KEEP EXACT SAME beard  

========================
ANGLE LOCK (CRITICAL)
========================
The image is a ${a.view}.
${a.lock}

- DO NOT rotate or change angle
- DO NOT reframe or zoom
- Output must match the EXACT same camera angle

========================
HAIR TRANSFORMATION RULE
========================
- ONLY modify hair. NOTHING else.
- Do NOT change identity in any way

HAIR MUST MATCH ORIGINAL:
- Use the person’s REAL hair pattern
- Match natural hair texture exactly
- Match hair colour EXACTLY

DENSITY RULE (VERY STRICT):
- Hair density must be SLIGHTLY LOWER or equal to original
- NEVER increase density significantly
- NO thick, fluffy, or artificial volume
- Keep hair lightweight and natural

========================
HAIRSTYLE RULE (VERY IMPORTANT)
========================
- Apply ONE SINGLE hairstyle
- The hairstyle MUST be IDENTICAL across ALL 4 images
- NO variation in:
  - Length
  - Shape
  - Density
  - Volume

- short length only
- NO fades
- NO undercuts
- NO buzz cuts
- NO exposed scalp

HAIRLINE RULE:
- Hair must naturally cover the front hairline
- Forehead should still be partially visible
- No artificial or heavy coverage

========================
HAIRSTYLE DETAILS
========================
- Hairstyle: ${hairstyle_name}
- Style: ${description}
- Length: ${length}

${a.task}
${a.notes ? `- Notes: ${a.notes}` : ''}

========================
STRICT NEGATIVE RULES
========================
- NEVER add beard or moustache
- NEVER remove existing facial hair
- NEVER add piercings
- NEVER change hair colour
- NEVER create thick or unrealistic hair
- NEVER create different hairstyles across views
- NEVER alter identity
- NEVER modify background or clothing

========================
REALISM REQUIREMENT
========================
- Hair must be 100% photorealistic
- Natural strands, shadows, lighting
- Must look like real human hair

========================
FINAL OUTPUT RULE
========================
- SAME person
- SAME angle
- SAME frame
- ONLY hair changed
`;
}

function extractImageUrl(msg) {
  if (!msg) return null;
  if (Array.isArray(msg.images) && msg.images.length > 0) {
    const i = msg.images[0];
    if (typeof i === 'string') return i;
    if (i?.imageUrl?.url) return i.imageUrl.url;
    if (i?.image_url?.url) return i.image_url.url;
    if (i?.url) return i.url;
  }
  if (Array.isArray(msg.content)) {
    for (const b of msg.content) {
      if (b?.type === 'image_url' && b?.image_url?.url) return b.image_url.url;
      if (b?.type === 'image' && b?.source?.data)
        return `data:${b.source.media_type || 'image/png'};base64,${b.source.data}`;
    }
  }
  if (typeof msg.content === 'string') {
    const c = msg.content.trim();
    if (c.startsWith('data:image') || c.startsWith('http')) return c;
  }
  return null;
}

async function generateOne(id, sourceImage, analysis, apiKey, site) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 160_000);

  const content = [
    { type: 'text', text: `The photo below is a ${id.toUpperCase()} VIEW. Edit this photo by adding hair. Do not change the angle.` },
    { type: 'image_url', image_url: { url: sourceImage } },
    { type: 'text', text: buildPrompt(id, analysis) },
  ];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': site,
        'X-Title': 'American Hairline',
      },
      body: JSON.stringify({
        model: MODEL,
        modalities: ['image', 'text'], // OpenRouter-specific passthrough
        messages: [{ role: 'user', content }],
        max_tokens: 1024,
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${res.status}`;
      console.error(`[gen] ${id} ✗ ${msg}`);
      return { id, url: null, error: msg };
    }

    const data = await res.json();
    const url = extractImageUrl(data?.choices?.[0]?.message);
    console.log(`[gen] ${id} ${url ? '✓' : '✗ no image'}`);
    return { id, url: url || null, error: url ? null : 'No image returned' };

  } catch (e) {
    clearTimeout(timer);
    const msg = e.name === 'AbortError' ? 'Timed out (160s)' : e.message;
    console.error(`[gen] ${id} threw: ${msg}`);
    return { id, url: null, error: msg };
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Safe body parsing
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { /* ignore */ }
  }

  const { front, back, side, top, analysis } = body || {};

  if (!front || !back || !side || !top) return res.status(400).json({ error: 'Missing angle photos' });
  if (!analysis?.hairstyle_name) return res.status(400).json({ error: 'Missing analysis' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  const SITE = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const KEY = process.env.OPENROUTER_API_KEY;

  console.log(`[gen] "${analysis.hairstyle_name}" — all 4 angles in parallel`);
  const t0 = Date.now();

  const results = await Promise.all([
    generateOne('front', front, analysis, KEY, SITE),
    generateOne('back', back, analysis, KEY, SITE),
    generateOne('side', side, analysis, KEY, SITE),
    generateOne('top', top, analysis, KEY, SITE),
  ]);

  console.log(`[gen] done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${results.filter(r => r.url).length}/4 ok`);
  return res.status(200).json({ results, hairstyle: analysis.hairstyle_name });
}