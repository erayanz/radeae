# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

نظام رادع (Radeae) is a security monitoring dashboard for a wildlife reserve (محمية الملك عبدالعزيز الملكية). It is a monorepo with three independent Node/TypeScript projects that talk to each other over HTTP:

- **`Rade3-FrontEnd/`** — React 18 + Vite + TypeScript dashboard (RTL, Arabic UI, dark theme). Polls the backend for events/stats and renders them on a Google Maps view, an events table, and charts (Recharts).
- **`Rade3-backend/`** — Express + TypeScript REST API. Stores events **in-memory only** (`src/data/mockData.ts`) — no database. State resets on server restart.
- **`Rade3-sensor-simulator/`** — Express + TypeScript service that generates fake sensor events and POSTs them to the backend's `/api/v1/events` endpoint on an interval, simulating the physical sensor network.

Data flows one way: simulator → backend (in-memory store) → frontend (polls REST API, auto-refreshes every 5s).

## Commands

Run from the repo root (uses `concurrently` to run all three services):
```bash
npm install               # only installs root deps (concurrently); each subproject needs its own install
npm run dev                # runs backend + frontend + simulator together
npm run dev:backend        # backend only (nodemon + ts-node, port 5000)
npm run dev:frontend       # frontend only (vite, configured for port 3000 in vite.config.ts, README says 5173)
npm run dev:simulator      # simulator only (nodemon + ts-node, port 5001)
npm run build               # builds frontend then backend
npm run build:frontend      # tsc && vite build
npm run build:backend       # tsc
```

Each subproject also has its own `package.json`/`node_modules` and must be installed independently the first time:
```bash
cd Rade3-FrontEnd && npm install
cd Rade3-backend && npm install
cd Rade3-sensor-simulator && npm install
```

There are no lint or test scripts configured in any of the three `package.json` files — do not assume `npm test`/`npm run lint` exist.

### Frontend-only commands (from `Rade3-FrontEnd/`)
```bash
npm run dev       # vite dev server
npm run build      # tsc && vite build
npm run preview    # preview production build
```

### Backend / simulator (from `Rade3-backend/` or `Rade3-sensor-simulator/`)
```bash
npm run dev     # nodemon --exec ts-node src/server.ts
npm run build    # tsc -> dist/
npm start        # node dist/server.js (run build first)
```

## Environment variables

Frontend needs a `.env` in `Rade3-FrontEnd/` (not committed):
```
VITE_API_URL=http://localhost:5000/api/v1          # or the deployed backend URL
VITE_GOOGLE_MAPS_API_KEY=<your key>
```

Backend/simulator read `PORT`, `NODE_ENV`, and (simulator only) `BACKEND_URL` from `.env` via `dotenv`. If unset, both default to hardcoded production URLs (`https://radeae-production.up.railway.app/...`), so a missing `.env` locally will silently point dev clients at production — always create the `.env` files when developing locally.

See `GOOGLE_MAPS_SETUP.md` for full Google Maps API key setup/restriction steps and map customization pointers (reserve center coordinates, boundary polygons, protection radius).

## Architecture notes

- **Backend data layer**: `Rade3-backend/src/data/mockData.ts` is the single in-memory source of truth, accessed via `getEvents()`, `addEvent()`, `resetEvents()`. All controller logic in `src/controllers/eventsController.ts` derives statistics (risk-level counts, per-type counts, today's events) by filtering this in-memory array on every request — there's no persistence or caching layer.
- **Shared `Event`/`ApiResponse`/`Statistics` types are duplicated**, not shared: `Rade3-backend/src/types/index.ts` and `Rade3-FrontEnd/src/types/index.ts` independently define the same `Event` shape. When changing the event schema, update both.
- **Sensor simulator has two parallel implementations**: `src/server.ts` contains its own inline `generateEvent`/`sendEvent`/start-stop logic and is what's actually wired up and run (`npm run dev` executes `src/server.ts` directly). `src/routes/simulatorRoutes.ts` + `src/services/simulationService.ts` implement an equivalent but separate `SimulationService` class that is **not mounted anywhere** in `server.ts` — it's dead/unused code. Be aware of this when modifying simulator behavior: check `server.ts` first, since edits to `simulationService.ts` alone will have no effect on the running simulator.
- **CORS allowlists are hardcoded** in both `Rade3-backend/src/server.ts` and `Rade3-sensor-simulator/src/server.ts` (`https://radeae.vercel.app`, `http://localhost:3000`, `http://localhost:5173`). Adding a new frontend origin requires updating both files.
- **Frontend routing** is not a router library — `App.tsx` holds `currentPage` state and conditionally renders `HomePage` / `EventsPage` / `StatisticsPage` based on `Sidebar` navigation clicks.
- **i18n**: `react-i18next` is wired up (`src/i18n/config.ts`, `src/i18n/locales/ar.json`) but the app is hardcoded to Arabic (`lng: 'ar'`, `dir="rtl"` in `App.tsx`) with no language switcher — only Arabic strings exist in the locale file.
- **Maps**: there are two map components — `GoogleMapView.tsx` (primary, uses `@react-google-maps/api`, requires `VITE_GOOGLE_MAPS_API_KEY`) and `MapView.tsx` (Leaflet-based, uses `react-leaflet`). Check which one `HomePage.tsx` actually renders before assuming either is active.
- **Production deployment topology** (from README): frontend on Vercel, backend + simulator on Railway. Simulator auto-starts its event-generation loop when `NODE_ENV === 'production'`.

## Domain context

The system monitors a reserve with 8 fixed sensors (`SENSOR_001`–`SENSOR_008`) across two named zones (روضة التنهات، روضة الخفس) with high/medium protection radii. Events carry `eventType` (`human`/`vehicle`/`animal`/`noise`) and `riskLevel` (`low`/`medium`/`high`), each mapped to a `suggestedAction`. This domain model is duplicated across the simulator's hardcoded event generator, the backend types, and the frontend types — keep them consistent when adding new event/sensor fields.
