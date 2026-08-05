# FleetLoop — Smart Rental Tracking System

A hackathon prototype for tracking rented construction and mining equipment: where it is, who's using it, when it's due back, and which units are quietly wasting money.

Built for the **rental provider (dealer/admin)** — the company that owns the fleet and rents it out to construction firms.

> **Prototype scope.** No database, no backend, no authentication, no real IoT/QR/RFID hardware, no external APIs. All data is realistic dummy data held in local JS modules and mutated in memory. State resets on page reload — that's intentional.

---

## Quick start

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 and pick **Rental Provider** on the landing screen.

---

## The problem being solved

Construction and mining companies rent machinery through dealers, but tracking those rentals is still manual/spreadsheet-based. That causes:

- Equipment lost or unaccounted for
- Downtime from misallocation
- Unexpected rental extensions and cost overruns

### Required outcomes → where they live

| # | Required outcome | Implemented in |
|---|---|---|
| 1 | **Asset Dashboard** — all rented equipment with live status | Dashboard → KPI hero + Active Rentals table |
| 2 | **Check-in / Check-out** — QR/RFID simulation or user entry | `/admin/checkin` |
| 3 | **Usage Logging** — runtime, fuel, location, idle hours + summary of total hours, usage per site, downtime | `/admin/usage` (Log tab + Reports tab) |
| 4 | **Overdue alerts & notification** | Alerts Center + dashboard Overdue rows, with *Send reminder* |
| 5 | **Demand Forecasting** — pre-position equipment by site/time | `/admin/forecasting` + AI insight card |
| 6 | **Anomaly Detection** — long idle hours, unassigned equipment | Idle lists, utilization rules, `NULL` operator flags |

Plus, from the Challenge section ("flag under-utilized assets and optimize rentals"): a **rightsizing recommendation engine** that suggests a cheaper equipment tier when a unit is being under-used.

---

## What's built

### Screens

| Route | Screen | What it does |
|---|---|---|
| `/` | Role selector | Pick Rental Provider or Client. No real auth. |
| `/admin` | **Dashboard** | KPI hero, context strip, AI insights, category availability, alerts, active rentals, utilization leaderboard |
| `/admin/companies` | **Companies** | Grid of renting companies; click a card to expand its equipment |
| `/admin/equipment` | **Equipment** | Full 40-unit roster, searchable/filterable by status and category, with a detail panel |
| `/admin/checkin` | **Check-in / Check-out** | Simulated QR/RFID scan flow, both directions |
| `/admin/usage` | **Usage Logging** | Daily log entry with live history chart + Reports tab (per-site usage, downtime, efficiency) |
| `/admin/alerts` | **Alerts Center** | All alerts, filterable by type, with Send reminder / Accept swap / Dismiss |
| `/admin/forecasting` | **Demand Forecasting** | Historical vs projected demand per category |
| `/client` | Client portal | **Stub only** — not yet built |

### Dashboard layout

```
① KPI HERO         Utilization % · Rented · Available · Overdue · Idle
② CONTEXT STRIP    Total · Maintenance · Active Customers · Active Sites
③ AI INSIGHTS      Demand Forecast · Idle Detection · Relocation
④ CATEGORY AVAILABILITY (2/3)    │  ⑤ ALERTS (1/3)
⑥ ACTIVE RENTALS TABLE
⑦ UTILIZATION LEADERBOARD        Top 5 / Bottom 5
```

---

## The "AI" features (and what they actually are)

Everything labelled AI is **rule-based or simple statistics over the dummy data** — deliberately not a trained model. The UI says so explicitly rather than overclaiming.

| Feature | Method |
|---|---|
| **Demand forecasting** | 3-month smoothed-trend projection: last observed value + slope averaged over the window. (A plain moving average was tried first and rejected — it lagged rising series so badly that clear growth read as "flat".) |
| **Anomaly detection** | Threshold rules on the utilization ratio `engine / (engine + idle)`: under 30% is under-utilized, under 10% is critical. Plus a null-operator check. |
| **Rightsizing recommendation** | Matches a flagged unit against cheaper catalog tiers of the same type whose usage range still covers actual usage; ranks by daily saving. |
| **Relocation recommendation** | Cross-references idle units against the category with the lowest yard availability. Only asserts the link when the idle unit genuinely matches the scarce category. |

---

## Data model

All in `src/data/` — plain JS arrays, no persistence.

| File | Contents |
|---|---|
| `equipment.js` | **40 units** across 7 categories in 3 states: `active` (24), `completed`/available (12), `maintenance` (4) |
| `catalog.js` | 7 types × 2 tiers with daily rates and suited usage ranges — powers the rightsizing engine |
| `clients.js` | 8 renting companies |
| `sites.js` | 12 construction sites |
| `usageLogs.js` | Daily engine/idle/fuel logs, generated deterministically per active rental |
| `demandHistory.js` | 7 months of monthly rental counts per category |

**Categories:** Excavator, Bulldozer, Crane, Grader, Forklift, Loader, Roller.

The `EQX-10xx` block is the **original problem-statement sample table kept verbatim** (2025 dates) as rental history — including its deliberate edge cases (`NULL` operators, 0 engine hours, extreme idle). Everything dated 2026 is live against the simulated date so overdue, due-soon, idle, and unassigned states are all true on first load.

### Simulated clock

The whole app runs against `SIM_TODAY = 2026-08-05` (`src/lib/clock.js`). The **Advance day** button in the header steps this forward, so overdue alerts can be demoed firing live rather than waiting on real dates.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 with CSS custom properties for theming (light + dark) |
| Charts | Recharts |
| State | Zustand (in-memory only) |
| Routing | React Router |
| Dates | date-fns |

No backend, ORM, or auth library — by design.

---

## Project structure

```
src/
├── data/           Dummy data: equipment, catalog, clients, sites, usage logs, demand history
├── lib/            Business logic
│   ├── rules.js      utilization, return status, anomaly + alert generation, recommendations
│   ├── fleet.js      category rollups, fleet utilization, leaderboard ranking
│   ├── forecast.js   smoothed-trend demand projection
│   ├── reports.js    per-site usage and downtime aggregates
│   └── clock.js      simulated "today"
├── store/          Zustand store — check-in/out, usage logging, alerts, toasts, clock
├── components/
│   ├── ui/           Card, StatTile, StatusChip, Button, Icon, charts, toasts
│   ├── dashboard/    CategoryAvailability, UtilizationLeaderboard, AiInsights
│   └── layout/       AdminLayout, ClientLayout
└── pages/
    ├── admin/        Dashboard, Companies, Equipment, CheckInOut, UsageLogging, AlertsCenter, Forecasting
    └── client/       ClientDashboard (stub)
```

---

## Demo path

1. Land on `/`, choose **Rental Provider**.
2. **Dashboard** — 62% fleet utilization, 3 overdue, 6 idle units. Point at the AI insights band.
3. **Category availability** — Forklift down to 17% available, flagged.
4. **Alerts Center** — hit **Accept swap** on a rightsizing suggestion; the unit's tier changes and both related alerts clear.
5. **Advance day** a few times — watch due-soon rentals tip into overdue live.
6. **Usage Logging → Reports** — per-site usage and downtime rollup.
7. **Forecasting** — Excavator demand projected up 17%.

---

## Not built yet

- **Client portal** (`/client`) — end-customer view: my equipment, usage, reminders, cost-saving suggestions. Currently a stub.
- Final polish pass — responsive sweep and demo rehearsal.

## Deliberately out of scope

Real database, authentication, IoT/RFID/QR hardware, SMS/email delivery, trained ML models, billing/invoicing/payments, and multi-tenant dealer separation. This is a prototype for demonstrating the product idea and user flow.
