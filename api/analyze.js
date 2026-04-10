// api/analyze.js
// Accepts 4 angle photos → returns recommended hairstyle as structured JSON

const VISION_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.2-11b-vision-instruct',
  'qwen/qwen-2.5-vl-72b-instruct',
];

const SYSTEM_PROMPT = `You are a world-class master barber with 20+ years of experience.

You strictly follow user constraints.

If multiple images are provided:
- Treat them as the SAME person
- Enforce identical hairstyle across all views
- Preserve identity and facial features exactly

Respond ONLY with valid JSON. No markdown, no explanation.`;
const USER_PROMPT = `YOU ARE PERFORMING A STRICT HAIR TRANSFORMATION TASK — NOT GENERATION.

You must MODIFY the SAME PERSON in the images, not create a new or different person.

========================
IDENTITY LOCK (ABSOLUTE)
========================
- All 4 images are of the SAME PERSON. You MUST preserve identity perfectly.
- Do NOT change:
  - Face shape
  - Skin tone
  - Eyes, nose, lips
  - Expression
- Do NOT add, remove, or modify:
  - Beard
  - Moustache
  - Facial hair of any kind
  - Piercings or accessories
- If the person is clean-shaven → KEEP clean-shaven
- If the person has facial hair → KEEP it EXACTLY the same

========================
HAIR REALISM CONSTRAINT
========================
- You are NOT allowed to invent completely new hair.
- You MUST work with the person’s EXISTING hair pattern.
- Hair texture MUST remain the same (straight / wavy / curly).
- Hair colour MUST remain EXACTLY the same.

DENSITY RULE (VERY STRICT):
- Hair density must closely match the person's natural density.
- Only a VERY SLIGHT improvement is allowed (maximum +10–15%).
- Do NOT create thick, voluminous, or unrealistic hair.
- If hair is thin or receding → KEEP it natural and realistic.

========================
HAIRSTYLE REQUIREMENTS
========================
- Recommend ONE SINGLE hairstyle only.
- The hairstyle must be MEDIUM length.
- NOT a buzz cut.
- NOT extremely long.
- NO fades.
- NO undercuts.
- NO exposing scalp.

HAIRLINE RULE:
- The hairstyle MUST cover the front hairline.
- Keep it natural — NOT dense or artificial.

========================
MULTI-VIEW CONSISTENCY (CRITICAL)
========================
- All 4 views MUST show the EXACT SAME hairstyle.
- NO variation in:
  - Length
  - Density
  - Volume
  - Shape
- The haircut must align perfectly across:
  - Front
  - Back
  - Side
  - Top
- Think of it as ONE haircut viewed from 4 angles.

========================
STRICT NEGATIVE RULES
========================
- NEVER add beard or moustache
- NEVER remove existing beard or moustache
- NEVER add piercings
- NEVER change hair colour
- NEVER increase density significantly
- NEVER generate thick or fluffy hair
- NEVER create different hairstyles across views
- NEVER alter identity

========================
TASK
========================
Analyse these 4 photos (front, back, side, top) of the SAME PERSON.

Recommend ONE hairstyle that:
- Matches their natural hair
- Looks realistic
- Respects all constraints above

========================
OUTPUT FORMAT (STRICT JSON ONLY)
========================
{
  "hairstyle_name": "Name of the hairstyle",
  "length": "Short / Medium-short / Medium / Medium-long",
  "description": "2-3 sentences explaining why this style suits the person",
  "front_notes": "Front view — must mention full hairline coverage and natural look",
  "back_notes": "Back and nape structure",
  "side_notes": "Sides and temples — NO fades",
  "top_notes": "Top and crown — natural density, not thick",
  "styling_tip": "One practical tip for styling and maintenance"
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