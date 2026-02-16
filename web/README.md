<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RunwayAlgo Dashboard (Vite + React + TypeScript)

## Local development
1. Install dependencies: `npm install`
2. Start backend API (`/Users/gnosis/Herd/runwayalgo/backend`):
   - `php artisan serve` (default: `http://127.0.0.1:8000`)
3. Start dev server: `npm run dev`
4. Build for production: `npm run build`
5. Preview production build: `npm run preview`

## Backend API wiring
- Frontend API client is built from `BACKEND_API_BASE_URL` (fallback: `/api/v1`).
- Recommended default is the deployed API: `https://api.runwayalgo.com/backend/public/api/v1`.
- In local dev, Vite proxies `/api/*` to `BACKEND_API_BASE_URL` when set.
- If `BACKEND_API_BASE_URL` is not set, Vite fallback proxy targets the deployed API (not localhost).
- Optional legacy override is `VITE_BACKEND_ORIGIN`.

Optional `.env.local` values:

```bash
BACKEND_API_BASE_URL=https://api.runwayalgo.com/backend/public/api/v1
# Optional local backend override:
# BACKEND_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Production example (`.env.production`):

```bash
BACKEND_API_BASE_URL=https://api.runwayalgo.com/backend/public/api/v1
```
