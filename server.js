// ─── Local Dev API Server ──────────────────────────────────────────────────
// Mimics Vercel serverless functions for local development.
// Runs on :3001 — Vite proxies /api/* to this server.
//
// Usage:  node server.js
// Or via npm run dev (starts both this + Vite concurrently)

import http from 'http';
import { readFileSync } from 'fs';

// Load .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const f of files) {
    try {
      const lines = readFileSync(f, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!(key in process.env)) process.env[key] = val;
      }
      console.log(`[api-server] Loaded env from ${f}`);
      break;
    } catch {
      // file doesn't exist, try next
    }
  }
}

loadEnv();

// Import handler modules dynamically
async function getHandler(name) {
  const mod = await import(`./api/${name}.js`);
  return mod.default;
}

// Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

// Fake Vercel res object
function makeRes(res) {
  let statusCode = 200;
  const headers = { 'Content-Type': 'application/json' };

  return {
    status(code) { statusCode = code; return this; },
    setHeader(k, v) { headers[k] = v; return this; },
    json(data) {
      res.writeHead(statusCode, headers);
      res.end(JSON.stringify(data));
    },
    end() {
      res.writeHead(statusCode, headers);
      res.end();
    },
  };
}

const server = http.createServer(async (req, res) => {
  // CORS for Vite dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url?.split('?')[0];
  console.log(`[api-server] ${req.method} ${url}`);

  // Route /api/analyze and /api/generate
  const match = url?.match(/^\/api\/(\w+)$/);
  if (match) {
    const name = match[1];
    try {
      const handler = await getHandler(name);
      const body = await parseBody(req);
      const fakeReq = { method: req.method, body, headers: req.headers };
      const fakeRes = makeRes(res);
      await handler(fakeReq, fakeRes);
    } catch (err) {
      console.error(`[api-server] Error in /api/${name}:`, err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[api-server] Running on http://localhost:${PORT}`);
  console.log(`[api-server] API key: ${process.env.OPENROUTER_API_KEY ? '✓ loaded' : '✗ MISSING — add to .env.local'}`);
});
