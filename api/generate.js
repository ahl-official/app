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
      lock: 'The camera looks straight down at the top of the person\'s head. Output MUST show the top/crown of the head from above.',
      task: 'Add hair across the entire crown as seen from above. Show natural parting and full scalp coverage.',
      notes: top_notes || '',
    },
  };

  const a = angleMap[angle];

  return `PHOTO RETOUCHING TASK

You are editing the photo provided. The photo is a ${a.view}. ${a.lock}

Add a natural, realistic hairstyle to this person's bald/bare head.

HAIRSTYLE DETAILS:
- Name: ${hairstyle_name}
- Style: ${description}
- Length: ${length}
- Hair colour: Match this person's beard and eyebrow colour exactly
- ${a.task}
${a.notes ? `- Notes: ${a.notes}` : ''}

STRICT RULES:
1. OUTPUT ANGLE: The output photo must be from the EXACT same angle as the input — ${a.view}. Do not change the person's pose, direction, or framing.
2. HAIR ONLY: Change nothing except the hair. Face, skin, beard, eyes, ears, expression, neck, clothing, background — identical to input.
3. PHOTOREALISM: Hair must look like real hair — natural strands, proper shadows, correct lighting. No painterly or cartoon look. Please keep the colour of the hair across all 4 images the same. Do not change the colour of hair between the 4 images
4. FULL COVERAGE: No bald scalp visible anywhere. Natural full coverage. Hide the front hairline but dont hide the entire forehead. 
5. NO FACE CHANGES: Do not alter face shape, skin tone, age, or any facial feature. Dont add amything extra like beard or moustache, piercings or glasses.
6. SAME FRAME: Same crop, same background, same lighting as the input.`;
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
      method: 'POST', signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': site,
        'X-Title': 'American Hairline',
      },
      body: JSON.stringify({
        model: MODEL,
        modalities: ['image', 'text'],
        messages: [{ role: 'user', content }],
        max_tokens: 1024,
        image_config: { aspect_ratio: '3:4', image_size: '1K' },
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { front, back, side, top, analysis } = req.body || {};
  if (!front || !back || !side || !top) return res.status(400).json({ error: 'Missing angle photos' });
  if (!analysis?.hairstyle_name) return res.status(400).json({ error: 'Missing analysis' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  const SITE = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const KEY = process.env.OPENROUTER_API_KEY;

  console.log(`[gen] "${analysis.hairstyle_name}" — all 4 angles in parallel`);
  const t0 = Date.now();

  // All 4 in parallel — no cross-referencing to avoid angle confusion
  const results = await Promise.all([
    generateOne('front', front, analysis, KEY, SITE),
    generateOne('back', back, analysis, KEY, SITE),
    generateOne('side', side, analysis, KEY, SITE),
    generateOne('top', top, analysis, KEY, SITE),
  ]);

  console.log(`[gen] done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${results.filter(r => r.url).length}/4 ok`);
  return res.status(200).json({ results, hairstyle: analysis.hairstyle_name });
}