# Chunk 02 — React Setup
Status: DONE

## Checklist
- [x] Vite 6 + React 18 + TypeScript running (React 19 downgraded — subpath export incompatibility)
- [x] React Router 6 installed
- [x] Axios instance at src/lib/axios.ts (Bearer token + 401 redirect)
- [x] Tailwind CSS v4 via @tailwindcss/vite plugin
- [x] Folder structure created
- [x] npm run build → clean (90 modules, 0 errors)
- [x] npm run dev → http://localhost:5174/ (5173 was in use)

## Packages Installed
### Feature
react-router-dom@6, axios, zustand, @tanstack/react-query,
react-hook-form, zod, @hookform/resolvers, react-signature-canvas,
react-phone-input-2, react-datepicker, moment, moment-timezone,
react-google-places-autocomplete, react-helmet-async, react-hot-toast

### UI
tailwindcss, @tailwindcss/vite, @headlessui/react, @heroicons/react

## Files Created
src/
├── App.tsx               — BrowserRouter + QueryClient + Toaster + HelmetProvider
├── main.tsx              — React 18 root
├── index.css             — @import "tailwindcss" + base styles
├── lib/axios.ts          — Axios instance, Bearer token, 401 redirect
├── types/index.ts        — User, EventType, QuotePlan, Lead, Invoice types
├── stores/authStore.ts   — Zustand auth (persisted to localStorage)
├── stores/quoteStore.ts  — Zustand quote wizard state
├── hooks/useAuth.ts      — Auth helpers + role booleans
├── components/ui/ProtectedRoute.tsx — Route guard by role level
└── routes/index.tsx      — All routes (future ones commented, ready to uncomment)

## Decisions Made
- React 18 chosen over 19 (Vite 6 rollup can't resolve react-dom/client in React 19)
- Vite 6 used instead of 8 (rolldown still unstable for production builds)
- Dev server port: 5174 (5173 in use by prior session)
- Proxy: /api → http://localhost:8000 (so frontend calls /api/... without CORS)

## API Base URL
http://localhost:8000/api  (via Vite proxy in dev)
VITE_API_URL=http://localhost:8000/api in .env.local

## Project Location
C:\wamp64\www\ode-rebuild\ode-frontend

## Notes
- All future routes are pre-commented in src/routes/index.tsx — just uncomment per chunk
- Run: cd C:\wamp64\www\ode-rebuild\ode-frontend && npm run dev
