# American Hairline

> AI-powered hair consultation platform. Upload your portrait — get personalized hairstyle recommendations powered by Gemini AI, rendered in an obsidian luxury interface.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Pure CSS-in-JS (no Tailwind, no libraries) |
| Backend | Vercel Serverless Functions |
| Analysis AI | `google/gemini-2.0-flash-001` via OpenRouter |
| Image Gen AI | `google/gemini-2.0-flash-exp` (Banana Pro) via OpenRouter |
| PDF | Native browser print API |
| Deployment | Vercel |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--black` | `#000000` | Base background |
| `--parchment` | `#F5F0E8` | Primary text, buttons |
| `--sapphire` | `#1540E0` | Primary accent, scan beam |
| `--gold` | `#B8972A` | Hairline dividers, HUD corners |
| `--silver` | `#9BA8B4` | Body text, secondary labels |
| `--font-serif` | Playfair Display | Headlines, display copy |
| `--font-sans` | Josefin Sans | Labels, buttons, UI text |
| `--font-mono` | IBM Plex Mono | Terminal, data, coordinates |

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenRouter API key:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your key at [openrouter.ai/keys](https://openrouter.ai/keys)

### 3. Run the dev server

```bash
npm run dev
```

> **Note:** The `/api/*` routes are Vercel serverless functions. For local testing, use the [Vercel CLI](https://vercel.com/cli):
>
> ```bash
> npm i -g vercel
> vercel dev
> ```
> This runs both the Vite frontend and the serverless functions on `localhost:3000`.

---

## Deployment

### Deploy to Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

During first deploy, Vercel will ask you to set environment variables. Add:
- `OPENROUTER_API_KEY` → your OpenRouter API key

Or set it in the [Vercel Dashboard](https://vercel.com/dashboard) → Project → Settings → Environment Variables.

### Manual deploy steps

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add env var: `OPENROUTER_API_KEY`
7. Deploy ✓

---

## AI Models

### Analysis: `google/gemini-2.0-flash-001`
- Analyzes facial geometry (68 landmark points)
- Detects face shape, hair texture, density, curl pattern
- Returns structured consultation report with 3 scenario recommendations

### Image Generation: `google/gemini-2.0-flash-exp` (Banana Pro)
- Multimodal output: generates images alongside text
- Produces a 3×3 grid of the user with 9 different hairstyles
- Identity-preserving: maintains exact facial features

**To use the full Banana Pro tier:**
Edit `api/generate.js` and change the model to:
```js
const primaryModel = 'google/gemini-3-pro-image-preview';
```
(Requires appropriate OpenRouter account tier)

---

## Project Structure

```
american-hairline/
├── src/
│   ├── App.jsx          ← Entire React application (single file)
│   └── main.jsx         ← React DOM entry point
├── api/
│   ├── analyze.js       ← Serverless: face analysis (Gemini Flash)
│   └── generate.js      ← Serverless: image generation (Banana Pro)
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── .env.example
└── .gitignore
```

---

## Features

- **Custom cursor** — sapphire dot with ring, `mix-blend-mode: difference`
- **Hero section** — ghost "AH" letters, animated grid, Manhattan coordinates HUD
- **Marquee bar** — sapphire ticker with service names
- **Upload** — drag & drop, file picker, live camera with canvas mirroring
- **Sci-fi scanner** — grayscale glitch, scan beam, terminal with traffic-light dots
- **Parallel API calls** — analysis + image generation run simultaneously via `Promise.allSettled`
- **Before / After** — asymmetric clipped-corner frames, gold diamond divider
- **Analysis cards** — tile grid with gold hairline borders, hover state
- **PDF export** — full dark-theme HTML report opened in new tab → print dialog
- **Scroll reveals** — `IntersectionObserver` on all major sections
- **Responsive** — works on mobile (cursor hidden on touch)

---

## PDF Report

The PDF is generated client-side as a styled HTML document:

1. Click **↓ Download PDF** in the Stylist Report section
2. A new tab opens with the full dark-themed report
3. `Ctrl+P` / `Cmd+P` → Save as PDF

The report includes:
- American Hairline branding (Playfair Display headline)
- Before / after photo comparison
- All analysis sections in a tile grid
- Gold hairline dividers
- IBM Plex Mono metadata

---

## License

Private. All rights reserved — American Hairline.
