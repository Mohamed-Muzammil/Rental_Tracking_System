# FleetLoop — Smart Rental Tracking System

> **Prototype demo** — a fully client-side React SPA that simulates an equipment-rental management platform for a construction / mining fleet. No backend, no database; all data is seeded at startup and mutated in memory via Zustand.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Data Model](#data-model)
6. [Business Rules & Logic](#business-rules--logic)
7. [State Management (Zustand)](#state-management-zustand)
8. [Routing & Layouts](#routing--layouts)
9. [Pages (Admin)](#pages-admin)
10. [Pages (Client)](#pages-client)
11. [UI Components](#ui-components)
12. [Dashboard Widgets](#dashboard-widgets)
13. [Design System & Theming](#design-system--theming)
14. [How to Extend](#how-to-extend)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

The app opens at `http://localhost:5173` (default Vite port).

---

## Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Framework      | **React 19** (JSX, hooks only — no class components) |
| Routing        | **React Router DOM v7** (BrowserRouter)          |
| State          | **Zustand v5** (single global store)             |
| Styling        | **Tailwind CSS v4** (via `@tailwindcss/vite`)    |
| Charts         | **Recharts v3** (LineChart, BarChart)             |
| Date utilities | **date-fns v4**                                  |
| Build tool     | **Vite v8** + `@vitejs/plugin-react`             |
| Linter         | **OxLint**                                       |

---

## Project Structure

```
Rental_Tracking_System/
├── index.html                  # HTML shell — loads /src/main.jsx
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite + React + Tailwind plugins
├── public/
│   └── favicon.svg             # App icon
└── src/
    ├── main.jsx                # React root — BrowserRouter + StrictMode
    ├── App.jsx                 # Route definitions
    ├── index.css               # Global CSS — design tokens + dark mode
    │
    ├── store/
    │   └── appStore.js         # Zustand store (single source of truth)
    │
    ├── data/                   # Seed data (static JS arrays / objects)
    │   ├── index.js            # Barrel export
    │   ├── equipment.js        # 40 units — active, completed, maintenance
    │   ├── catalog.js          # 14 catalog items (type × tier) with daily costs
    │   ├── clients.js          # 8 renting companies
    │   ├── sites.js            # 12 job sites
    │   ├── usageLogs.js        # Generated daily logs for every active rental
    │   └── demandHistory.js    # 7-month rental counts per equipment type
    │
    ├── lib/                    # Pure logic — no React, no JSX
    │   ├── clock.js            # SIM_TODAY — frozen simulated date (2026-08-05)
    │   ├── genLogs.js          # Deterministic daily usage generator
    │   ├── rules.js            # Business rules: utilization, return status, alerts, rightsizing
    │   ├── fleet.js            # Fleet aggregation: category summary, utilization ranking
    │   ├── forecast.js         # Smoothed-trend demand projection
    │   └── reports.js          # Usage-per-site aggregation, total hours
    │
    ├── components/
    │   ├── ui/                 # Reusable, generic presentational components
    │   │   ├── Button.jsx      # primary / secondary / ghost variants
    │   │   ├── Card.jsx        # Container with optional title + action slot
    │   │   ├── Icon.jsx        # Inline SVG icons from path data
    │   │   ├── StatTile.jsx    # KPI tile with label, big number, severity stripe
    │   │   ├── StatusChip.jsx  # Colored pill (good/warning/serious/critical/info)
    │   │   ├── UtilizationBar.jsx   # Engine vs idle split bar
    │   │   ├── ToastStack.jsx  # Fixed-position notification stack
    │   │   ├── ForecastChart.jsx    # Recharts line chart (actual vs forecast)
    │   │   ├── UsageHistoryChart.jsx # Recharts bar chart (engine + idle)
    │   │   └── ComingSoon.jsx  # Placeholder for unbuilt pages
    │   │
    │   ├── layout/
    │   │   ├── AdminLayout.jsx  # Sidebar nav + header + Outlet
    │   │   └── ClientLayout.jsx # Header-only layout + Outlet
    │   │
    │   └── dashboard/          # Dashboard-specific composite widgets
    │       ├── AiInsights.jsx          # 3-card insights strip (demand, idle, relocation)
    │       ├── CategoryAvailability.jsx # Table with stacked bar per equipment type
    │       └── UtilizationLeaderboard.jsx # Top-5 / Bottom-5 utilization bars
    │
    └── pages/
        ├── RoleSelect.jsx      # Landing page — choose Admin or Client
        ├── admin/
        │   ├── Dashboard.jsx   # Fleet Overview — KPIs, alerts, rentals, leaderboard
        │   ├── Companies.jsx   # Client cards + expandable equipment table
        │   ├── Equipment.jsx   # Full fleet roster with detail panel
        │   ├── CheckInOut.jsx  # Simulated QR/RFID — check-out form + check-in list
        │   ├── UsageLogging.jsx # Log daily hours + usage-per-site reports
        │   ├── AlertsCenter.jsx # Overdue, anomaly, and recommendation alerts
        │   └── Forecasting.jsx  # Demand forecasting by equipment type
        └── client/
            └── ClientDashboard.jsx  # Placeholder (Coming Soon)
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (SPA)                             │
│                                                                 │
│  index.html → main.jsx → <BrowserRouter>                       │
│                              └── <App />                        │
│                                   ├── / → RoleSelect            │
│                                   ├── /admin → AdminLayout      │
│                                   │      ├── Dashboard          │
│                                   │      ├── Companies          │
│                                   │      ├── Equipment          │
│                                   │      ├── CheckInOut         │
│                                   │      ├── UsageLogging       │
│                                   │      ├── AlertsCenter       │
│                                   │      └── Forecasting        │
│                                   └── /client → ClientLayout    │
│                                          └── ClientDashboard    │
│                                                                 │
│  State: Zustand store (appStore.js)                             │
│    ├── equipment[] ← seed from data/equipment.js                │
│    ├── usageLogs[] ← generated by lib/genLogs.js                │
│    ├── today       ← SIM_TODAY from lib/clock.js                │
│    ├── toasts[]    ← ephemeral notifications                    │
│    └── role, dismissedAlertIds, activeClientId                  │
│                                                                 │
│  Logic: lib/ (pure functions, no side effects)                  │
│    rules.js  → utilization, health, alerts, recommendations     │
│    fleet.js  → category rollup, rankings                        │
│    forecast.js → moving-average trend projection                │
│    reports.js  → usage-per-site aggregation                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **No backend** — everything runs client-side. Data is seeded once and mutated in the Zustand store.
- **Simulated clock** — `SIM_TODAY` (`2026-08-05`) is baked into the seed data so overdue / due-soon / idle states are all realistic on first load. The "Advance day" button in the admin header moves the clock forward by 1 day in the store.
- **Deterministic log generation** — `genDailyLogs()` uses `Math.sin()` instead of `Math.random()` so charts never jitter between reloads.
- **Rule-based "AI"** — The AI Insights panel is labeled as "Simulated — rule-based on historical usage data." There is no ML model; it applies threshold comparisons and moving-average projections.

---

## Data Model

### Equipment (`data/equipment.js`)

40 units across 7 categories, in three lifecycle states:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique ID like `EQX-2001` |
| `type` | `string` | Equipment category: Excavator, Crane, Bulldozer, Grader, Forklift, Loader, Roller |
| `tier` | `string` | Size / class variant: Heavy, Compact, Mobile Standard, Mini, etc. |
| `catalogId` | `string` | Links to a catalog item for pricing |
| `status` | `'active' \| 'completed' \| 'maintenance'` | Rental lifecycle state |
| `siteId` | `string?` | Current job site (null when in yard / maintenance) |
| `clientId` | `string?` | Renting company |
| `operatorId` | `string?` | Assigned operator (null = "unassigned" anomaly) |
| `checkIn` | `string` | ISO date when rental started |
| `expectedReturn` | `string?` | ISO date when due back (active only) |
| `checkOut` | `string?` | ISO date when actually returned (completed only) |
| `avgEngineHoursPerDay` | `number` | Current/historical engine hours |
| `avgIdleHoursPerDay` | `number` | Current/historical idle hours |
| `maintenanceNote` | `string?` | Reason in workshop (maintenance only) |
| `expectedBackOn` | `string?` | When maintenance finishes |

### Catalog (`data/catalog.js`)

14 entries (7 types × 2 tiers each). Every type has a **heavier/more expensive** tier and a **lighter/cheaper** tier — this is what powers the rightsizing recommendation engine.

| Field | Description |
|---|---|
| `id` | e.g. `CAT-EXC-H` (Excavator Heavy) |
| `type` | Equipment type |
| `tier` | Size class |
| `dailyCost` | Dollar cost per day |
| `minUsageHrs` / `maxUsageHrs` | Expected engine-hour range for this tier |

### Clients (`data/clients.js`)

8 construction / mining companies, each with a name, contact person, and assigned site IDs.

### Sites (`data/sites.js`)

12 job sites with name and region.

### Usage Logs (`data/usageLogs.js`)

Generated at startup by `lib/genLogs.js` for every active rental. Each log entry contains:
`equipmentId`, `operatorId`, `date`, `engineHours`, `idleHours`, `fuelUsageL`

Fuel usage is derived as `engineHours × 4.2` L/hr.

### Demand History (`data/demandHistory.js`)

7-month (Jan–Jul 2026) per-type rental counts used by the forecasting module. Each type has a deliberately different trend (climbing, flat, declining, seasonal bump).

---

## Business Rules & Logic

All rules live in `src/lib/rules.js`. They are **pure functions** with no side effects.

### Utilization

```
utilizationOf(eq) = engineHoursPerDay / (engineHoursPerDay + idleHoursPerDay)
```

- **Under-utilized threshold**: `< 30%` → flagged as idle / under-used
- **Critical utilization**: `< 10%` → severe anomaly

### Return Status

```
returnStatus(eq, today):
  - overdue    → expected return is in the past
  - due-soon   → within 5 days of expected return
  - on-track   → more than 5 days until return
```

### Health Assessment

`healthOf(eq, today)` returns one of `critical | serious | warning | good`:

1. **Critical** — overdue past return date
2. **Serious** — no operator assigned OR utilization < 10%
3. **Warning** — due soon OR utilization < 30%
4. **Good** — everything normal

### Alert Generation

`buildAlerts(equipmentList, today)` scans all **active** equipment and generates alerts:

| Alert Type | Trigger | Severity |
|---|---|---|
| `overdue` | Past expected return | `serious` (with operator) / `critical` (no operator) |
| `due-soon` | Within 5 days of return | `warning` |
| `anomaly` (unassigned) | No operator ID | `serious` |
| `anomaly` (underutilized) | Utilization < 30% | `warning` (or `critical` if < 10%) |
| `recommendation` | Under-utilized + cheaper tier exists | `info` |

### Rightsizing Recommendations

`recommendationFor(eq)` finds a **cheaper catalog tier** of the same equipment type whose `maxUsageHrs` still covers the unit's actual engine hours. Returns the daily cost savings.

### Forecasting

`forecastSeries(type, history, monthsAhead, windowSize)` in `lib/forecast.js`:

- Takes monthly rental counts for a given equipment type
- Uses a **smoothed-trend projection** (not an ML model)
- Projects from the last actual value + averaged slope over a 3-month window
- Returns both historical (`actual`) and projected (`forecast`) points for charting

---

## State Management (Zustand)

**Single store** in `src/store/appStore.js`. Key state slices and actions:

| State | Type | Purpose |
|---|---|---|
| `role` | `'admin' \| 'client' \| null` | Current user role |
| `activeClientId` | `string` | Which client the client portal is viewing |
| `today` | `Date` | Simulated current date |
| `equipment` | `array` | Mutable copy of seed equipment |
| `usageLogs` | `array` | All usage log entries |
| `dismissedAlertIds` | `array` | IDs of dismissed alerts |
| `toasts` | `array` | Active toast notifications |

| Action | Description |
|---|---|
| `setRole(role)` | Sets admin or client role |
| `advanceDay()` | Moves `today` forward by 1 day |
| `pushToast(message, tone)` | Shows a toast (auto-dismisses after 3.5s) |
| `dismissToast(id)` | Manually dismiss a toast |
| `dismissAlert(alertId)` | Dismiss an alert from the alerts center |
| `sendReminder(equipmentId)` | Simulates sending a reminder (shows toast) |
| `checkOutEquipment({...})` | Moves a unit from `completed` → `active` |
| `checkInEquipment(equipmentId)` | Moves a unit from `active` → `completed` |
| `logUsage({...})` | Adds a usage log entry + updates equipment averages |
| `acceptRecommendation(equipmentId, rec)` | Swaps a unit's catalog tier (rightsizing) |

---

## Routing & Layouts

Defined in `App.jsx`:

| Route | Page | Layout |
|---|---|---|
| `/` | `RoleSelect` | None (full-screen) |
| `/admin` | `Dashboard` | `AdminLayout` |
| `/admin/companies` | `Companies` | `AdminLayout` |
| `/admin/equipment` | `Equipment` | `AdminLayout` |
| `/admin/checkin` | `CheckInOut` | `AdminLayout` |
| `/admin/usage` | `UsageLogging` | `AdminLayout` |
| `/admin/alerts` | `AlertsCenter` | `AdminLayout` |
| `/admin/forecasting` | `Forecasting` | `AdminLayout` |
| `/client` | `ClientDashboard` | `ClientLayout` |

### AdminLayout

- **Left sidebar** (56 × full height) with navigation links and an alert badge count
- **Top header** showing the simulated date + "Advance day" button
- **Main content area** renders the active route via `<Outlet />`
- **ToastStack** overlay at bottom-right

### ClientLayout

- **Minimal header** with FleetLoop branding + "Client Portal" label
- **Content area** via `<Outlet />`
- Client dashboard is a **placeholder** (Coming Soon)

---

## Pages (Admin)

### Dashboard (`/admin`)

The main fleet overview, split into seven visual sections:

1. **KPI hero row** — 5 `StatTile` cards: Fleet Utilization %, Currently Rented, Available Now, Overdue, Idle/Under-utilized
2. **Context strip** — Total Equipment, Under Maintenance, Active Customers, Active Sites
3. **AI Insights** — 3 insight cards: demand forecast, idle equipment detection, relocation recommendation
4. **Category Availability table** — per-type breakdown with stacked availability bar
5. **Alerts sidebar** — top 7 most severe open alerts with dismiss/remind actions
6. **Active Rentals table** — top 8 rentals sorted by urgency (nearest return first) with utilization bars and action buttons
7. **Utilization Leaderboard** — top 5 and bottom 5 units by utilization %

### Companies (`/admin/companies`)

- Grid of **client cards** showing company name, contact, utilization bar, unit count, daily spend, and at-risk count
- Clicking a card expands an **equipment detail table** below with unit-level data

### Equipment (`/admin/equipment`)

- **Full fleet roster** table with search, status filter (All/Active/Available/Maintenance), and type filter
- Clicking a row opens a **detail panel** on the right with: daily rate, site, client, operator, dates, utilization %, engine/idle hours
- Action button to navigate to Check-in/Check-out

### Check-in / Check-out (`/admin/checkin`)

- **Tabbed interface**: Check Out | Check In
- **Check Out form**: select available equipment, destination site, client, optional operator, expected return date → confirms check-out via Zustand
- **Check In list**: shows all active rentals with a "Check in" button each

### Usage Logging (`/admin/usage`)

- **Tabbed interface**: Log Usage | Reports
- **Log Usage tab**: form to select an active unit and enter engine/idle hours (fuel is auto-calculated at 4.2 L/hr). Shows a `UsageHistoryChart` (bar chart) of the last 10 days for the selected unit
- **Reports tab**: KPI tiles (Total Rented Hours, Total Downtime, Fleet Efficiency %) + usage-per-site table

### Alerts Center (`/admin/alerts`)

- Filter bar: All, Overdue, Due Soon, Anomaly, Recommendation
- List of open alerts sorted by severity (critical → info)
- Actions per alert:
  - **Overdue** → "Send reminder" button
  - **Recommendation** → "Accept swap" button (performs rightsizing)
  - All → "Dismiss" button

### Forecasting (`/admin/forecasting`)

- **Type selector cards** (7 equipment types) showing forecasted rental count and trend direction
- **Forecast chart** (Recharts LineChart) with solid line for actuals and dashed line for 2-month projection
- Disclaimer: "a simple statistical baseline, not a trained model"

---

## Pages (Client)

### Client Dashboard (`/client`)

Currently a **Coming Soon placeholder**. Planned to show: rented equipment, usage, upcoming returns, and cost-saving recommendations for the logged-in client.

---

## UI Components

All in `src/components/ui/`:

| Component | Props | Description |
|---|---|---|
| `Button` | `variant` (`primary`/`secondary`/`ghost`), standard button props | Styled button with hover/focus/disabled states |
| `Card` | `title`, `action`, `className`, `bodyClassName` | Container with optional header (title + action slot) |
| `Icon` | `name`, `size`, `strokeWidth` | Inline SVG from a path lookup table — 17 icons available |
| `StatTile` | `label`, `value`, `unit`, `hint`, `severity` | KPI metric card with colored left stripe |
| `StatusChip` | `severity`, `icon`, `children` | Color-coded pill (good=green, warning=amber, serious=orange, critical=red, info=accent) |
| `UtilizationBar` | `engineHours`, `idleHours`, `width` | Split progress bar with percentage label |
| `ToastStack` | (reads from store) | Fixed-position notification stack at bottom-right |
| `ForecastChart` | `data`, `height` | Recharts LineChart — actual (solid) vs forecast (dashed) |
| `UsageHistoryChart` | `data`, `height` | Recharts BarChart — engine hours vs idle hours |
| `ComingSoon` | `title` | Placeholder card for unbuilt sections |

### Available Icons

`alertTriangle`, `clock`, `checkCircle`, `bulb`, `x`, `chevronRight`, `mapPin`, `gauge`, `truck`, `bell`, `wifiOff`, `wifi`, `swap`, `search`, `plus`, `building`

---

## Dashboard Widgets

In `src/components/dashboard/`:

| Widget | Used In | Description |
|---|---|---|
| `AiInsights` | Dashboard | 3-card insights strip: demand forecast trend, worst-idle equipment with recoverable $, relocation suggestion |
| `CategoryAvailability` | Dashboard | Table showing per-type fleet distribution with inline stacked bars (rented / maintenance / available) |
| `UtilizationLeaderboard` | Dashboard | Top-5 best and bottom-5 worst units by utilization % with bar visualization |

---

## Design System & Theming

### CSS Custom Properties (`index.css`)

The entire color scheme is defined via CSS custom properties on `:root`, with full **light / dark mode** support:

| Token | Purpose |
|---|---|
| `--bg-page` | Page background |
| `--bg-surface` | Card / sidebar background |
| `--bg-surface-raised` | Elevated surface (inputs, toasts) |
| `--ink-primary` | Primary text |
| `--ink-secondary` | Secondary text |
| `--ink-muted` | De-emphasized text / labels |
| `--border` / `--border-strong` | Border colors |
| `--accent` | Brand color (warm orange) |
| `--accent-ink` | Text on accent background |
| `--accent-wash` | Light accent background |
| `--series-engine` / `--series-idle` | Chart series colors |
| `--good` / `--warning` / `--serious` / `--critical` | Status colors |
| `--*-wash` | Light tinted backgrounds for status chips |
| `--shadow-card` | Card elevation shadow |

### Dark Mode

- Activates automatically via `prefers-color-scheme: dark`
- Can be forced with `data-theme="dark"` or `data-theme="light"` on `<html>`
- All component styles use CSS variables, so theming is seamless

### Typography

- **Display font** (`--font-display`): Bahnschrift → Barlow Semi Condensed → Arial Narrow (used for headings, labels, branding)
- **Body font** (`--font-body`): system-ui stack (body text, paragraphs)
- **Data font** (`--font-data`): monospace stack (numbers, stats, tabular data)

---

## How to Extend

### Adding a new admin page

1. Create `src/pages/admin/NewPage.jsx`
2. Add a `<Route>` in `App.jsx` under the `/admin` layout:
   ```jsx
   <Route path="newpage" element={<NewPage />} />
   ```
3. Add a nav entry in `AdminLayout.jsx`'s `NAV` array:
   ```js
   { to: '/admin/newpage', icon: 'iconName', label: 'New Page' }
   ```

### Adding a new equipment type

1. Add catalog entries (two tiers) in `data/catalog.js`
2. Add the type string to `equipmentTypes` in `data/demandHistory.js`
3. Add demand history data for the new type
4. Create equipment seed records in `data/equipment.js`

### Adding a new icon

Add a path entry to the `PATHS` object in `components/ui/Icon.jsx`. All icons use a 24×24 viewBox with stroke-based SVG paths.

### Adding new alert rules

Add detection logic inside `buildAlerts()` in `lib/rules.js`. Push a new alert object with `{ id, equipmentId, type, severity, message }`.

### Building the Client Dashboard

Replace the `ComingSoon` placeholder in `pages/client/ClientDashboard.jsx`. The store already has `activeClientId` — filter `equipment` by `clientId` to show the client's rented units.

---

## License

Prototype / demo — no license specified.
