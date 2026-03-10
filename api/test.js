// api/test.js — Diagnostic endpoint
// Hit GET http://localhost:3001/api/test in your browser to see what's wrong
//
// Checks:
//   1. Is OPENROUTER_API_KEY set?
//   2. Can we reach OpenRouter at all?
//   3. Does the account have access to gemini-2.5-flash-image-preview?
//   4. Does a minimal image-gen call work?

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const key = process.env.OPENROUTER_API_KEY;
  const report = {
    timestamp: new Date().toISOString(),
    key_set: !!key,
    key_prefix: key ? key.slice(0, 14) + '...' : null,
    model: 'google/gemini-2.5-flash-image-preview',
    steps: {},
  };

  // ── Step 1: Check key is present ─────────────────────────────────────────
  if (!key) {
    report.steps.key_check = { ok: false, error: 'OPENROUTER_API_KEY not set in environment' };
    return res.status(200).json(report);
  }
  report.steps.key_check = { ok: true };

  // ── Step 2: Fetch available models from OpenRouter ────────────────────────
  try {
    const modelsRes = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    const modelsData = await modelsRes.json();
    const allIds = modelsData?.data?.map(m => m.id) || [];
    const hasModel = allIds.includes('google/gemini-2.5-flash-image-preview');
    report.steps.model_available = {
      ok: hasModel,
      found_in_models_list: hasModel,
      total_models: allIds.length,
      note: hasModel ? 'Model found in your account' : 'Model NOT in list — may need credits or different plan',
    };
  } catch (e) {
    report.steps.model_available = { ok: false, error: e.message };
  }

  // ── Step 3: Minimal test call with a 1×1 white pixel PNG ─────────────────
  // A tiny base64 image so we don't need the user's photo
  const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

  try {
    const genRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'American Hairline Test',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        modalities: ['image', 'text'],
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: TINY_PNG } },
            { type: 'text', text: 'Add a red dot to this image.' },
          ],
        }],
        max_tokens: 512,
        image_config: { aspect_ratio: '1:1', image_size: '1K' },
      }),
    });

    const status = genRes.status;
    let body;
    try { body = await genRes.json(); } catch { body = { raw: await genRes.text() }; }

    const msg = body?.choices?.[0]?.message;
    const gotImage = !!(
      (Array.isArray(msg?.images) && msg.images.length > 0) ||
      (typeof msg?.content === 'string' && (msg.content.startsWith('data:image') || msg.content.startsWith('http')))
    );

    report.steps.test_generation = {
      ok: genRes.ok && gotImage,
      http_status: status,
      got_image: gotImage,
      error: body?.error || null,
      message_keys: msg ? Object.keys(msg) : null,
      images_count: msg?.images?.length ?? 0,
      // Truncate content so the response isn't huge
      content_preview: typeof msg?.content === 'string' ? msg.content.slice(0, 80) : null,
      raw_error: !genRes.ok ? body : null,
    };
  } catch (e) {
    report.steps.test_generation = { ok: false, error: e.message };
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  report.verdict = Object.values(report.steps).every(s => s.ok)
    ? '✅ Everything looks good — image generation should work'
    : '❌ Something is wrong — see steps above for details';

  return res.status(200).json(report);
}
