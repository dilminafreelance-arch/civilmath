# CivilMath

Premium civil engineering workspace for structural load, concrete volumes, BBS schedules, geotechnical bearing, and surveying reports — with interactive visualizations and AI explanations.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS (static SPA)
- **Local backend:** Express (`server.ts`) for local AI proxy
- **Netlify production:** static `dist/` + Netlify Functions under `/api/*`

## Run Locally

**Prerequisites:** Node.js 22+

1. `npm install`
2. Copy `.env.example` to `.env` and set:
   - `OPENROUTER_API_KEY` — required for AI chat / explain
   - `APP_URL` — optional site URL used in OpenRouter headers
3. `npm run dev` → http://localhost:3000

## Production build (Netlify)

```bash
npm run build
```

- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`
- SPA redirects + `/api/*` → Netlify Functions are configured in `netlify.toml` / `public/_redirects`

### Environment variables (Netlify UI or CLI)

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | Yes (for AI) | Server-side OpenRouter key for chat & explain |
| `APP_URL` | Recommended | Public site URL for OpenRouter HTTP-Referer |

Do **not** commit `.env` files. Secrets are injected at runtime on Netlify Functions.

## Backend hosting note

Calculators run entirely in the browser. Only AI features (`/api/chat`, `/api/explain`) need a backend.

- **On Netlify:** already covered by Netlify Functions (no separate host required).
- **Alternative:** deploy `server.ts` to Render / Railway / Fly.io / Cloud Run and point the frontend at that API origin.
