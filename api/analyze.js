// api/analyze.js
// Accepts 4 angle photos → returns recommended hairstyle as structured JSON

const VISION_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.2-11b-vision-instruct',
  'qwen/qwen-2.5-vl-72b-instruct',
];

const SYSTEM_PROMPT = `You are a world-class master barber with 20+ years of experience. 
You analyse head shape, hair texture, density, hairline, and facial structure across multiple angles.
You always recommend hairstyles that:
- Fully cover the front hairline — no exposed hairline above the forehead
- Are medium length (not buzz cuts, not excessively long)
- Suit the person's specific head shape and hair type
Respond ONLY with valid JSON. No markdown, no backticks, no explanation outside the JSON.`;

const USER_PROMPT = `Analyse these 4 photos of the same person (front, back, side, top). 
Recommend the single most suitable hairstyle considering their head shape, hair texture, and hairline.

STRICT REQUIREMENTS:
- The hairstyle MUST fully cover the front hairline — no hairline exposure above the forehead
- NOT a buzz cut or very short style (nothing that exposes the scalp)
- Medium length is ideal
- Must suit their actual hair texture and head shape

Respond in this exact JSON format only:
{
  "hairstyle_name": "Name of the hairstyle",
  "length": "Short / Medium-short / Medium / Medium-long",
  "description": "2-3 sentences on the style and why it suits this person's features",
  "front_notes": "How the front looks — emphasise full hairline coverage, forehead framing",
  "back_notes": "How the back and nape area should look",
  "side_notes": "How the sides and temples should look",
  "top_notes": "How the crown and top look from above",
  "styling_tip": "One practical tip for maintaining and styling this look"
}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { front, back, side, top } = req.body || {};
  if (!front || !back || !side || !top)
    return res.status(400).json({ error: 'All 4 angle photos are required (front, back, side, top)' });
  if (!process.env.OPENROUTER_API_KEY)
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  const SITE = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const errors = [];

  for (const model of VISION_MODELS) {
    console.log(`[analyze] Trying ${model}...`);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': SITE,
          'X-Title': 'American Hairline',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: USER_PROMPT },
                { type: 'text', text: '--- PHOTO 1: FRONT VIEW ---' },
                { type: 'image_url', image_url: { url: front } },
                { type: 'text', text: '--- PHOTO 2: BACK VIEW ---' },
                { type: 'image_url', image_url: { url: back } },
                { type: 'text', text: '--- PHOTO 3: SIDE VIEW ---' },
                { type: 'image_url', image_url: { url: side } },
                { type: 'text', text: '--- PHOTO 4: TOP VIEW ---' },
                { type: 'image_url', image_url: { url: top } },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || `HTTP ${response.status}`;
        console.warn(`[analyze] ${model} rejected: ${msg}`);
        errors.push(`${model}: ${msg}`);
        continue;
      }

      const data = await response.json();
      let raw = data?.choices?.[0]?.message?.content || '';
      if (!raw) { errors.push(`${model}: empty response`); continue; }

      // Strip markdown fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let parsed = null;
      try { parsed = JSON.parse(cleaned); } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch { } }
      }

      if (!parsed?.hairstyle_name) {
        errors.push(`${model}: could not parse valid JSON`);
        continue;
      }

      console.log(`[analyze] ✓ ${model} → "${parsed.hairstyle_name}"`);
      return res.status(200).json({ analysis: parsed });

    } catch (e) {
      console.warn(`[analyze] ${model} threw: ${e.message}`);
      errors.push(`${model}: ${e.message}`);
    }
  }

  return res.status(500).json({ error: `Vision analysis failed:\n${errors.join('\n')}` });
}