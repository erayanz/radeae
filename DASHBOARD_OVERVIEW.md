# رادع (RADEI/RADEAE) Dashboard — Full State Description

**Purpose of this file**: a complete, current snapshot of the dashboard project, written as insurance against losing conversation context (e.g. a Claude Code session restart). If you're reading this after a session loss, this file plus `CLAUDE.md` (same directory, has dev commands) should let you reconstruct full context without re-deriving anything from scratch. Written 2026-07-31.

---

## 1. What this is

نظام رادع (Radeae/RADEI) is a security-monitoring **Command & Control Dashboard** — the operator-facing layer of the RADEI/RADEA product stack, which classifies seismic events from geophone sensors and turns them into actionable security decisions. Per the product's investor materials, real prospective clients include: Ministry of Interior, Border Guard, Aramco site security, National Center for Wildlife, Royal Commission for AlUla. Design intent: dense information, low-latency updates, high-contrast legibility for control-room use — not consumer/marketing polish.

The codebase started as a mock/demo (single hardcoded reserve, in-memory data, no auth) and has been incrementally rebuilt into a real product over the course of this session's work. **Everything described below reflects the CURRENT state**, not the original mock.

Brand: RADEI navy (#14143C) / deep-navy (#0A0A28) / gold (#DCB43C) palette, Orbitron (display) + Rajdhani (EN body) + a custom Arabic font "TheYearOfHandicrafts" fonts, Arabic RTL throughout. Brand source assets (fonts, logo pack, brand guideline PDF) live in `D:\RADE_Project\` (one level up from this repo) — not duplicated here except what's actually wired into the frontend (`Rade3-FrontEnd/public/fonts/`, `Rade3-FrontEnd/public/logo/`).

## 2. Repo location and structure

**Working copy: `D:\RADE_Project\RadeaeDashboard`** (moved here from `H:\RadeaeDashboard` mid-session at the user's request, to work on a local drive instead of an external/removable one that kept disconnecting). The H: drive copy is stale/pre-migration — do not treat it as current.

Three independent Node/TypeScript services, run together via the root `package.json`'s `npm run dev` (uses `concurrently`):

```
Rade3-backend/            Express + TypeScript, port 5000
Rade3-FrontEnd/           React 18 + Vite + TypeScript, port 3000
Rade3-sensor-simulator/   Express + TypeScript, port 5001
```

Each has its own `package.json`/`node_modules`, installed independently. See `CLAUDE.md` in this same directory for exact dev commands, build commands, env var setup — not repeated here.

## 3. Backend (`Rade3-backend/`)

### 3.1 Persistence
SQLite via **`sql.js`** (pure WASM SQLite) — **not `better-sqlite3`**, which failed to compile natively on this Windows dev machine (no Visual Studio Build Tools available). This is a load-bearing constraint: `sql.js` is synchronous, single-process, in-memory-with-disk-persist (the whole DB is loaded into memory, mutated, then `db.export()` → written to `Rade3-backend/data/radeae.db` after every write via a `persist()` call). No `PRAGMA foreign_keys` is ever enabled, so `REFERENCES` clauses in the schema are documentation-only, not enforced.

`Rade3-backend/src/db/database.ts` establishes an idempotent migration pattern used throughout: `columnExists(table, column)` (via `PRAGMA table_info`) + `ALTER TABLE ... ADD COLUMN` for adding a column to an **already-existing** table with real data (safe to re-run every boot). Brand-new tables just use bare `CREATE TABLE IF NOT EXISTS` (also idempotent, no migration function needed). This pattern was established for the event-status feature and reused for every subsequent schema change (multi-site `siteId` column, etc.) — **follow this exact pattern for any future schema change to an existing table.**

### 3.2 Schema (current, all tables)
- **`events`** — `id, timestamp, sensorId, eventType (human|vehicle|animal|noise), riskLevel (low|medium|high), latitude, longitude, zone, suggestedAction, description, status (new|acknowledged|resolved), acknowledgedBy, acknowledgedAt, resolvedBy, resolvedAt, assignedTo, siteId`. `sensorId`/`zone` are free-text strings, **not** FKs into `sensors`/`zones` (deliberate: the ingestion endpoint does no validation on them, and adding enforcement was out of scope when multi-site was built — see §3.5).
- **`users`** — `id, username, passwordHash, role (operator|admin), createdAt`.
- **`user_sites`** — join table `(userId, siteId)`, composite PK. Access-control convention: **`role='admin'` AND zero rows in `user_sites` = global admin** (sees every site). Any user — admin or operator — **with** rows in `user_sites` is restricted to exactly those sites. The single seeded admin account has zero rows, so it's a global admin with no explicit setup needed.
- **`sites`** — `id, name, nameAr, centerLatitude, centerLongitude, boundaryPolygon (JSON string of {lat,lng}[], nullable), protectionRadiusMeters (nullable), createdAt`.
- **`sensors`** — `id, siteId (FK), sensorLabel (e.g. "SENSOR_001"), name, latitude, longitude, status (active|inactive), createdAt`. Unique index on `(siteId, sensorLabel)`.
- **`zones`** — `id, siteId (FK), name, createdAt`. Unique index on `(siteId, name)`.

### 3.3 Seeded data
On first boot against an empty DB, in this order: `seedSitesIfEmpty()` → `seedSensorsIfEmpty()` → `seedZonesIfEmpty()` → `seedIfEmpty()` (events) → `seedDefaultAdmin()`.
- One site, fixed id **`site-reserve-kaa`** ("King Abdulaziz Royal Reserve" / محمية الملك عبدالعزيز الملكية), boundary polygon copied verbatim from the frontend's original hardcoded reserve boundary (~18 lat/lng points), `protectionRadiusMeters: 50000`.
- 8 sensors (`SENSOR_001`–`SENSOR_008`) at that site, matching the original mock's sensor layout.
- 6 zones at that site (بوابة الدخول الشمالية، بوابة الدخول الجنوبية، روضة التنهات، روضة الخفس، الزاوية الشمالية الغربية، الزاوية الشمالية الشرقية).
- ~18 demo events (later grew via simulator activity during dev/testing — don't assume an exact count, check live).
- Default admin: username/password from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars (current dev values: `admin` / `radeae-dev-2026` — **see `.env`, don't hardcode this elsewhere**, it's here only for session-recovery convenience).

### 3.4 Auth (`src/middleware/auth.ts`, `src/controllers/authController.ts`)
JWT-based, 12h expiry. `AuthPayload = {userId, username, role, siteIds}`. Login (`POST /api/v1/auth/login`) returns `{token, user: {username, role, siteIds}}`.
- **`requireAuth`** — `Authorization: Bearer <jwt>` header. Defensively defaults `siteIds: decoded.siteIds ?? []` for backward compat with pre-multi-site tokens.
- **`requireAuthSSE`** — same but also accepts the token via `?token=` query param, since browser `EventSource` can't set custom headers. Same `siteIds` default.
- **`requireRole(role)`** — passes if `req.user.role === role` OR `req.user.role === 'admin'` (i.e. admin always passes any role check).
- **`canAccessSite`** — reads `req.params.siteId`, allows if global admin (see §3.2) or `req.user.siteIds.includes(siteId)`, else 403. **Special case**: if `req.user` is `undefined` (meaning the request was authenticated via `requireApiKeyOrAuth`'s API-key branch, which sets no `req.user`), it calls `next()` — this is intentionally scoped to the two routes below, verified safe by an independent review (every other route using `canAccessSite` is preceded by `requireAuth`/`requireAuthSSE`, which always either sets `req.user` or 401s first, so the skip branch can't be reached elsewhere).
- **`requireApiKey`** — `x-api-key` header must equal `SENSOR_API_KEY` env var. Used for the simulator's event-ingestion POST (no per-user identity).
- **`requireApiKeyOrAuth`** — tries API key first, falls through to `requireAuth`. Used ONLY on `GET /api/v1/sites/:siteId/sensors` and `GET /api/v1/sites/:siteId/zones` (the two read endpoints the simulator needs to fetch real sensor/zone data without being a logged-in user).

### 3.5 API surface (all mounted under `/api/v1/`)
```
POST   /auth/login
GET    /auth/me                                    (requireAuth)

GET    /users                                       (requireAuth) — {id, username, role} only, NO siteIds (deliberately excluded — see below)
POST   /users                                        (requireAuth + requireRole('admin')) — create user, optional siteIds[]

GET    /sites                                        (requireAuth) — returns ALL sites, no filtering by caller's siteIds (known simplification, only 1 site exists today)
POST   /sites                                        (requireAuth + requireRole('admin'))
GET    /sites/:siteId                                (requireAuth + canAccessSite)
PATCH  /sites/:siteId                                 (requireAuth + canAccessSite + requireRole('admin'))
DELETE /sites/:siteId                                 (requireAuth + canAccessSite + requireRole('admin'))

GET    /sites/:siteId/sensors                         (requireApiKeyOrAuth + canAccessSite)
POST   /sites/:siteId/sensors                         (requireAuth + canAccessSite + requireRole('admin'))
PATCH  /sites/:siteId/sensors/:sensorId               (requireAuth + canAccessSite + requireRole('admin'))
DELETE /sites/:siteId/sensors/:sensorId               (requireAuth + canAccessSite + requireRole('admin'))

GET    /sites/:siteId/zones                           (requireApiKeyOrAuth + canAccessSite)
POST   /sites/:siteId/zones                           (requireAuth + canAccessSite + requireRole('admin'))
PATCH  /sites/:siteId/zones/:zoneId                   (requireAuth + canAccessSite + requireRole('admin'))
DELETE /sites/:siteId/zones/:zoneId                   (requireAuth + canAccessSite + requireRole('admin'))

GET    /sites/:siteId/events                          (requireAuth + canAccessSite) — query params: eventType, riskLevel, timeRange, limit, offset
GET    /sites/:siteId/events/stats                    (requireAuth + canAccessSite)
GET    /sites/:siteId/events/stream                   (requireAuthSSE + canAccessSite) — SSE, see §3.6
GET    /sites/:siteId/events/:id                       (requireAuth + canAccessSite)
PATCH  /sites/:siteId/events/:id/status                (requireAuth + canAccessSite) — body {status: 'acknowledged'|'resolved', assignedTo?} — see §3.7
POST   /sites/:siteId/events                           (requireApiKey ONLY, no canAccessSite — simulator ingestion; controller 404s if siteId doesn't exist, guarding against a typo'd site)
DELETE /sites/:siteId/events/clear                     (requireAuth + canAccessSite + requireRole('admin'))
```
**There is no flat `/api/v1/events` anymore** — it was fully removed when multi-site shipped. Any code/docs referencing the old flat path are stale.

`GET /users` deliberately does NOT return `siteIds` (fixed after a review finding: any logged-in operator could otherwise enumerate every other user's exact site access — a real info-disclosure risk). If you need a user's `siteIds`, that's only ever read internally via `getSiteIdsForUser()` (login, `canAccessSite`), never serialized to a general list response.

### 3.6 Real-time (SSE) — `src/services/sseBroadcaster.ts`
Clients tracked as `{res: Response, siteId: string}` (not a flat `Set<Response>` — site-filtered). `broadcastEvent(event)` / `broadcastStatusChange(event)` both route through a shared `send(siteId, envelope)` that only writes to clients whose tracked `siteId` matches `event.siteId`. Envelope shape: `{type: 'created'|'statusChanged', event: Event}`. A 30s heartbeat writes `: heartbeat\n\n` to ALL clients regardless of site (keep-alive only, not data). `safeWrite` catches write errors on stale/closed connections so one dead client can't crash the broadcast loop or the whole process (this was a real bug caught and fixed by review — missing `res.on('error', ...)` handler could otherwise crash the entire Node process).

### 3.7 Event status/assignment workflow
3-state model: `new → acknowledged → resolved` (enforced server-side via a `VALID_TRANSITIONS` map in `eventsController.ts`; `new→resolved` direct transition is explicitly allowed — an operator handling something on the spot isn't forced to assign it to themselves first, a deliberate product decision, not a gap).
- **"إسناد" (assign)**, not a plain self-acknowledge: entering `acknowledged` requires a valid `assignedTo` (a real username, validated via `findByUsername`), picked from a dropdown populated by `GET /users`. This replaced an earlier "إقرار" (self-acknowledge) design mid-session at the user's request.
- **"حل" (resolve)**: no assignment required, works from either `new` or `acknowledged`.
- `acknowledgedBy`/`acknowledgedAt` record the **actor** who performed the acknowledge/assign action (not the assignee) — this is pre-existing, unchanged semantics. `assignedTo` is the new, separate "who is this assigned to" field. If an event is resolved directly without ever being assigned, `acknowledgedBy`/`acknowledgedAt` backfill to the resolver via `COALESCE` in the SQL, so the audit trail is never left null on a resolved event.
- Status changes broadcast live via SSE (`broadcastStatusChange`) so multiple operators watching the same site see acknowledgments/resolutions update in real time.

## 4. Frontend (`Rade3-FrontEnd/`)

React 18 + Vite + TypeScript, Arabic RTL, dark navy/gold theme. **Not a router** — `App.tsx` holds `currentPage` state and conditionally renders `HomePage`/`EventsPage`/`StatisticsPage` (full unmount/remount on switch, no URL routing).

### 4.1 Auth & Site context
- `src/context/AuthContext.tsx` — holds `{username, role, siteIds}`, JWT in `localStorage`. `src/pages/LoginPage.tsx` is shown when logged out.
- `src/context/SiteContext.tsx` — fetches `GET /sites` once logged in, tracks `currentSite`, persists the chosen site id to `localStorage` (`radeae_site_id`), falls back to `sites[0]` if the persisted id is stale/gone. A site switcher `<select>` lives in `Header.tsx` but **only renders when `sites.length > 1`** — invisible today since there's only one seeded site.
- Every event-related hook/API call takes `siteId` as an explicit parameter now (no implicit "current site" baked into the API layer) — see `eventsApi.ts`, `eventsStream.ts`, `useEventsFeed.ts`, `useEventStatusHandler.ts`.
- `useEventsFeed(siteId, filters?)` **guards against firing with an empty `siteId`** (a real, confirmed-reachable race existed on every login before `currentSite` loads — pages call hooks before their own loading-guard can return early, since React hooks can't follow a conditional return; fixed by an internal `if (!siteId) return;` early-out in both the fetch and the SSE-subscribe effects).

### 4.2 Pages
- **`HomePage.tsx`** — main dashboard: `SimulatorControl`, connection-status indicator (green only when both the REST fetch succeeded AND the SSE connection is live), `StatsPanel` (risk-level counts, now correctly excluding `resolved` events from "active" counts — a same-screen-contradiction bug fixed by review), `GoogleMapView`, a "معلومات سريعة" quick-info panel, an "أحداث تتطلب انتباه" (needs-attention) panel showing high-risk non-resolved events with assignee info, and the main `EventsList`.
- **`EventsPage.tsx`** — filterable/searchable full events table, CSV export, clear-all (admin only, backend-enforced).
- **`StatisticsPage.tsx`** — Recharts line/pie/bar charts + KPIs, chart-to-clipboard copy via html2canvas.

### 4.3 Map (`GoogleMapView.tsx`)
Requires a `site: Site` prop (no more hardcoded reserve constants — removed entirely). Derives map center/boundary/protection-circle from the site object; `boundaryPolygon` is `JSON.parse`'d from the backend's stored JSON string. **As of the most recent change, the three floating overlay panels (المفتاح/legend, the info panel showing the reserve name, and الإحصائيات/stats) were removed at the user's request** — only the map itself (boundary polygon, protection circle, sensor/event markers, click-to-view info window) remains. The `showLegend`/`showInfo`/`showStats` state and reopen buttons that used to control those panels are gone too.

**Dead code removed**: `src/components/MapView.tsx` (a Leaflet-based alternative map, never actually rendered anywhere) and the `leaflet`/`react-leaflet`/`@types/leaflet` npm dependencies were deleted as housekeeping — `GoogleMapView.tsx` is the only map component now.

### 4.4 Event actions UI (`EventsList.tsx`)
Both the desktop `<table>` and mobile card layout show a status badge (جديد/تم الإسناد/تم الحل) and action controls: a user-select dropdown + "إسناد" button (only when `status==='new'`), and a "حل" button (unless already `resolved`). Has an in-flight guard (`pendingIds`) so double-clicking can't fire duplicate requests. `assignableUsers` comes from `useAssignableUsers()` (wraps `GET /users`).

## 5. Sensor simulator (`Rade3-sensor-simulator/`)

**Only `src/server.ts` matters** — it's the sole file actually run (`npm run dev` executes it directly). `src/routes/simulatorRoutes.ts`, `src/services/simulationService.ts`, `src/utils/eventGenerator.ts` were **dead code (a disconnected parallel implementation, never wired into `server.ts`) and were deleted** during housekeeping.

Reads `SITE_ID` (required, fail-fast `process.exit(1)` if unset — currently `site-reserve-kaa`) and `SENSOR_API_KEY` from `.env`. On startup, calls `loadSiteData()` (with a 5s timeout on each request — added after review flagged a hang risk) to fetch real sensor labels/zone names from `GET /sites/:SITE_ID/sensors` and `/zones` via the API key, caching them in memory (`cachedSensorLabels`/`cachedZoneNames`). `generateEvent()` picks randomly from these real cached values (not hardcoded arrays anymore) and returns `null` if either cache is empty (caller skips rather than crashing). Posts fake events to `POST /sites/:SITE_ID/events`. Manual `/api/simulator/start`/`/stop`/`/trigger-event` HTTP endpoints on port 5001 control it; auto-starts its interval loop if `NODE_ENV==='production'`.

**Known bug, fixed**: `addEvent()` in the backend used to return the raw input object instead of re-reading what was actually persisted — since the simulator's payload never includes a `status` field, this meant new events (and their live SSE broadcast) shipped with `status: undefined` instead of `'new'`. The status badge's `?? 'new'` fallback masked this visually, but the assign button's strict `=== 'new'` check didn't match `undefined`, so "إسناد" silently never appeared on newly-created events. Fixed by having `addEvent` re-fetch via `getEventById` after insert.

## 6. Known recurring operational gotcha

**Nodemon on Windows in this environment repeatedly leaves orphaned processes holding ports 5000/5001/3000** after a background job is stopped/restarted, causing `EADDRINUSE` crash loops that look alarming in logs but are usually harmless — the actual server instance from before the "crash" is often still alive and healthy underneath. Standard recovery: `Get-NetTCPConnection -LocalPort <port> -State Listen` (PowerShell) to find the real PID, `Stop-Process -Id <pid> -Force`, then either let nodemon retry or restart `npm run dev` fresh. **Always verify with a real health-check request (`curl http://localhost:PORT/...`) rather than trusting log noise** — several "crashed" states during this project's development turned out to be a live, working server underneath stale log spam from a zombie process that already died.

## 7. What's NOT done yet (as of this writing)

- **Real IoT Gateway integration**: still fully simulated. No real hardware/API spec has been provided — this is explicitly blocked on external input, not something to guess at.
- **AI classification model integration** (in progress as of this file being written — see §8 below).
- Multi-site is architecturally complete (backend fully site-scoped, frontend site-switcher wired) but **only exercised with one real site** — untested at 2+ sites in a real deployment sense (was verified end-to-end with a manually-created second test site during development, then that test site was deleted again).
- No site-membership filtering on `GET /sites` (returns all sites to any authenticated user) — acceptable today since there's exactly one site, flagged as a known simplification if multi-tenant deployment becomes real.
- No UI for site/sensor/zone CRUD or user creation with site-scoping — those are API-only (curl/Postman), by design, since building admin UI for them wasn't requested.

## 8. AI Model integration — IN PROGRESS, this is the current active work thread

A **separate, parallel effort** to add seismic event classification (human/vehicle/ambient, "shots" — ambiguous, see below) is underway, living in a **separate directory outside this repo**: `D:\RADE_Project\RadeaeAIModel\`. Raw data: `D:\RADE_Project\GeophoneData\` (24 hourly `.mat` files, `Data_hrs_1.mat`...`Data_hrs_24.mat`).

### 8.1 Ground rules given by the user (do not re-litigate, execute)
1. **No hallucinated specs/formats/metrics.** Every technical claim must trace to a file actually opened or a number actually computed. If unsure, say so and search/ask — never guess plausibly.
2. **No ground-truth labels exist.** Do not proceed as if labels exist anywhere without checking first. A weak-labeling pipeline must be built from raw timing metadata.
3. **Serving = server-side Python API.** The dashboard (this repo) calls it; the model does not run in-browser.
4. **Framework (PyTorch vs TensorFlow) is the model-trainer agent's call**, justified in writing against (a) serving this API today and (b) future quantized edge/embedded deployment onto the geophone nodes themselves (TFLite/LiteRT vs ONNX Runtime/ExecuTorch maturity is a real factor).
5. Concise responses, no restating known context. **When editing existing dashboard code, give diffs/surgical edits, not full-file rewrites.**
6. **STOP and ask the user directly** whenever something isn't resolvable from data/docs alone — especially:
   - (a) **"shots" ambiguity**: the field operator's account mentions "multiple shots throughout the day" during the 07:00–16:00 crew-active window. This could mean **gunfire test signatures** (a genuinely valuable target class for a border/security product) OR **geophysical survey source shots** (weight-drop/explosive/vibroseis for subsurface imaging — a different signal type, possibly needs exclusion from the human/vehicle/ambient classifier entirely). **Unresolved — needs the team member who ran the survey, not a guess.**
   - (b) anything ambiguous in `RADEI_Signatures.pptx` (a team member's proposed classification concept, to be evaluated not assumed correct)
   - (c) anything about this dashboard's data flow that isn't obvious from the actual code

### 8.2 Field context (verbatim from the data-collecting operator — UNVERIFIED, must be checked against actual files, not trusted as ground truth)
> "I've done the recording while driving my car between approximately 4:00 PM and 6:00 PM... Before that, from around 7:00 AM until nearly 4:00 PM, the crew was active in the area, moving on foot and generating various sources of noise and activity. We also conducted multiple shots throughout the day... What's been after these time period mentioned is a quiet time... consider it as noise. The survey area was Wadi Al Asfar in Al Ahsa. We deployed 124 geophones, although two of them were not functioning properly. The sampling interval was 5 ms."

Rough timeline to verify against real file timestamps:
- ~07:00–~16:00: crew on foot, general activity + unknown-count "shots" at unknown times
- ~16:00–~18:00: operator's vehicle passing the geophone line
- after ~18:00: quiet/ambient reference period

**None of this has been verified against the actual `.mat` files yet** as of this writing — that's Phase 1's job (see below).

### 8.3 Subagent architecture (files created, NOT yet confirmed working in a running session — see §8.5)
7 custom agent definitions were written to `.claude/agents/` (see §8.5 for the exact path problem encountered):
1. **`seismic-data-explorer`** — inventories `GeophoneData`, verifies format/sample-rate/channel-count, identifies the 2 bad geophones with real evidence, cross-references timestamps against the field timeline, investigates (but does not resolve) the "shots" ambiguity. Outputs `data_inventory_report.md`.
2. **`doc-distiller`** — extracts only genuinely useful content from `Seismic_Data_Analysis_Report_v6.pdf`, critically evaluates `RADEI_Signatures.pptx` (checking DSP soundness against the real 200Hz/Nyquist=100Hz constraint). Outputs `report_and_concept_review.md`.
3. **`dsp-feature-engineer`** — builds a reusable, unit-tested Python feature-extraction module (time+frequency domain features, STA/LTA event detector) under `RadeaeAIModel/src/features/`.
4. **`weak-labeling-architect`** — builds heuristic + clustering-based weak labels since no ground truth exists, produces a human-reviewable sample. Outputs `weak_labels_v1.parquet`/csv + `labeling_QA_report.md`. **Explicitly stops before training** — requires user sign-off first.
5. **`model-trainer`** — trains the classifier once labels are approved, justifies PyTorch-vs-TensorFlow choice in writing, splits by geophone-id/time-block (never randomly), reports honest metrics separating "real skill" from "weak-label leakage." Outputs model + mandatory manifest to `RadeaeAIModel/models/`.
6. **`backend-integration-engineer`** — inspects THIS dashboard's actual stack before touching it, wires the trained model in as a Python inference API (FastAPI microservice pattern if this repo isn't Python — it isn't, it's Node/TS, so expect a separate Python service + REST call pattern), minimal surgical edits only.
7. **`qa-reviewer`** — fabrication-checks every other agent's claims against real artifacts, maintains a running `OPEN_QUESTIONS.md`.

### 8.4 Phase plan (user-specified, checkpoint between every phase — do not run straight through)
- **Phase 1** (current): `seismic-data-explorer` + `doc-distiller` in parallel → report back, wait for user.
- **Phase 2**: `dsp-feature-engineer` → `weak-labeling-architect` → report labeling QA, wait for user sign-off on label quality specifically before proceeding.
- **Phase 3**: `model-trainer` → report metrics/confusion matrix/framework justification, wait for user.
- **Phase 4**: `backend-integration-engineer` → wire into this dashboard.
- **Phase 5**: `qa-reviewer` → consolidated `OPEN_QUESTIONS.md`.

### 8.5 ⚠️ Known blocker as of this writing — READ THIS FIRST if resuming
Custom agent files were written to `D:\RADE_Project\.claude\agents\*.md` (7 files, all present, content verified correct) but the running Claude Code session's actual project root was `D:\RADE_Project\RadeaeDashboard` (one level down), so they weren't discovered (`Agent type 'X' not found. Available agents: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup`). The files were then also copied to `D:\RADE_Project\RadeaeDashboard\.claude\agents\` (confirmed present, correct content) — **still not discovered**, confirming custom agent definitions are only scanned once at Claude Code process startup, not re-scanned mid-session regardless of path. **If you're reading this after a resume/restart**: check whether the 7 custom agents (listed in §8.3) now appear as available `subagent_type` options. If yes, proceed with Phase 1 exactly as specified in §8.4/§8.1. If no, the path may still be wrong, or another restart is needed — do not silently fall back to doing the work without the named agents unless the user explicitly says to.

### 8.6 Files that exist right now, ready for Phase 1
- `D:\RADE_Project\GeophoneData\Data_hrs_1.mat` through `Data_hrs_24.mat` (24 files, one per hour — not yet opened/verified)
- `D:\RADE_Project\RadeaeAIModel\Seismic_Data_Analysis_Report_v6.pdf`
- `D:\RADE_Project\RadeaeAIModel\RADEI_Signatures.pptx` (⚠️ had a `~$RADEI_Signatures.pptx` lock file present at one point, suggesting it may be open in PowerPoint on this machine — check before assuming it's freely readable)
- `D:\RADE_Project\RadeaeAIModel\reports\` (empty, created for agent output)
- `D:\RADE_Project\RadeaeAIModel\src\features\` (empty, created for `dsp-feature-engineer`'s output)
- `D:\RADE_Project\RadeaeAIModel\models\` (empty, created for `model-trainer`'s output)

---

*End of state description. For dev commands (install/run/build), see `CLAUDE.md` in this same directory — not duplicated here.*
