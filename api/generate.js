// api/generate.js — consistent hairstyle across all 4 angle renders

const MODEL = 'google/gemini-2.5-flash-image';

// CRITICAL: All 4 prompts describe the EXACT same hairstyle with identical specs
// so the output looks consistent across angles
function buildPrompt(angle, hairstyleName, analysis) {
  const styleSpec = `"${hairstyleName}" — ${analysis.description}
Hair colour: match the person's natural hair colour exactly.
Hair length: ${analysis.length}.
Front coverage: hair must fully drape over the forehead — NO bare hairline visible.
The exact same hairstyle must appear in all 4 photos of this person.`;

  const angleNote = {
    front: `VIEW: Front face. ${analysis.front_notes || ''}`,
    back:  `VIEW: Back of head. ${analysis.back_notes || ''}`,
    side:  `VIEW: Side profile. ${analysis.side_notes || ''} No exposed temple hairline.`,
    top:   `VIEW: Top-down crown. ${analysis.top_notes || ''}`,
  }[angle];

  return `You are a professional photo retoucher. Your task is to add the hairstyle described below to this person's photo.

HAIRSTYLE SPEC:
${styleSpec}

${angleNote}

STRICT RULES:
1. Keep the person's face, skin, features, expression, clothing, and background 100% identical — only change the hair.
2. The hairstyle must match the spec above EXACTLY — same length, texture, colour, and style as described.
3. Result must be photorealistic, natural lighting consistent with the original photo.
4. Do NOT generate a different person. Edit this person only.`;
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

async function generateAngle(id, sourceImage, analysis, apiKey, site) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 140_000);
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
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: sourceImage } },
            { type: 'text', text: buildPrompt(id, analysis.hairstyle_name, analysis) },
          ],
        }],
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
    const msg = e.name === 'AbortError' ? 'Timed out' : e.message;
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
  console.log(`[gen] Rendering "${analysis.hairstyle_name}" on 4 angles…`);
  const t0 = Date.now();

  const results = await Promise.all(
    ['front','back','side','top'].map(id =>
      generateAngle(id, { front, back, side, top }[id], analysis, KEY, SITE)
    )
  );

  console.log(`[gen] Done ${((Date.now()-t0)/1000).toFixed(1)}s — ${results.filter(r=>r.url).length}/4 ok`);
  return res.status(200).json({ results, hairstyle: analysis.hairstyle_name });
}
