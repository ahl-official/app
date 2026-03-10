// api/generate.js
// Generates all 4 angles sequentially — front first, then uses front result
// as a style reference for back/side/top to ensure hairstyle consistency.

const MODEL = 'google/gemini-2.5-flash-image';

function buildPrompt(angle, hairstyleName, analysis, hasFrontRef) {
  const styleSpec = [
    `Hairstyle: "${hairstyleName}"`,
    `Description: ${analysis.description}`,
    `Length: ${analysis.length}`,
    `Colour: match the person's natural hair colour exactly`,
    `Front hairline: hair must fully drape over the forehead — NO bare hairline visible`,
  ].join('\n');

  const angleNote = {
    front: `VIEW: Front face. ${analysis.front_notes || ''} Hair must cover the forehead hairline completely.`,
    back: `VIEW: Back of head. ${analysis.back_notes || ''} Show the nape and back volume.`,
    side: `VIEW: Side profile. ${analysis.side_notes || ''} No exposed temple hairline.`,
    top: `VIEW: Top-down crown. ${analysis.top_notes || ''} Show parting and crown shape.`,
  }[angle];

  const refNote = hasFrontRef
    ? `IMPORTANT: A reference image of the SAME hairstyle from the front is included. Match that EXACT hairstyle — same length, texture, shape, and colour. The hairstyle must look identical, just seen from a different angle.`
    : '';

  return `You are a professional photo retoucher. Add the hairstyle below to this person's photo.

HAIRSTYLE SPEC:
${styleSpec}

${angleNote}
${refNote}

RULES:
1. Keep face, skin, features, expression, clothing, background 100% identical — only add hair.
2. Match the hairstyle spec EXACTLY — same style as described${hasFrontRef ? ' and shown in the reference' : ''}.
3. Photorealistic result with natural lighting matching the original photo.
4. Do NOT generate a different person.`;
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

async function generateOne(id, sourceImage, analysis, apiKey, site, frontResultUrl) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 150_000);

  // Build content array — include front result as style reference for other angles
  const hasFrontRef = !!frontResultUrl && id !== 'front';
  const content = [];

  // Always include the source photo first
  content.push({ type: 'image_url', image_url: { url: sourceImage } });

  // For non-front angles, include the generated front as style reference
  if (hasFrontRef) {
    content.push({ type: 'text', text: 'SOURCE PHOTO (person to edit) shown above. REFERENCE HAIRSTYLE (match this exact style) shown below:' });
    content.push({ type: 'image_url', image_url: { url: frontResultUrl } });
  }

  content.push({ type: 'text', text: buildPrompt(id, analysis.hairstyle_name, analysis, hasFrontRef) });

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
  const sources = { front, back, side, top };

  console.log(`[gen] Rendering "${analysis.hairstyle_name}" — front first, then referencing it for other angles`);
  const t0 = Date.now();

  // Step 1: generate front first
  const frontResult = await generateOne('front', sources.front, analysis, KEY, SITE, null);
  console.log(`[gen] Front done — ${frontResult.url ? 'using as style reference' : 'no reference available'}`);

  // Step 2: generate back/side/top in parallel, passing front result as style reference
  const [backResult, sideResult, topResult] = await Promise.all([
    generateOne('back', sources.back, analysis, KEY, SITE, frontResult.url),
    generateOne('side', sources.side, analysis, KEY, SITE, frontResult.url),
    generateOne('top', sources.top, analysis, KEY, SITE, frontResult.url),
  ]);

  const results = [frontResult, backResult, sideResult, topResult];
  const ok = results.filter(r => r.url).length;
  console.log(`[gen] Done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${ok}/4 succeeded`);

  return res.status(200).json({ results, hairstyle: analysis.hairstyle_name });
}