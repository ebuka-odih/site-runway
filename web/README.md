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
- Frontend API client uses `VITE_API_BASE_URL` (default: `/api/v1`).
- In local dev, Vite proxies `/api/*` to Laravel (`VITE_BACKEND_ORIGIN`, default `http://127.0.0.1:8000`).

Optional `.env.local` values:

```bash
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_ORIGIN=http://127.0.0.1:8000
```
