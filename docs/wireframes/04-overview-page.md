# 04 - Overview Page

Route: `/dashboard` (default authenticated landing page)
Sidebar active item: `overview`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Overview                                                        │
│  Your agent activity at a glance                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Total    │ │ Active   │ │ Total    │ │ Error    │           │
│  │ Events   │ │ Agents   │ │ Cost     │ │ Rate     │           │
│  │ (24h)    │ │          │ │ (24h)    │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Activity Overview (Line Chart — Last 7 Days)            │   │
│  │                                                          │   │
│  │  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────┐ ┌─────────────────────┐   │
│  │  Recent Events                   │ │  Anomaly Alerts     │   │
│  │  (Table — last 20 events)        │ │  (Alert cards)      │   │
│  │                                  │ │                     │   │
│  │                                  │ │                     │   │
│  └──────────────────────────────────┘ └─────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Overview" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Your agent activity at a glance" — `text-sm text-slate-400 mt-1`
- No action buttons on this page
- `mb-6`

---

## Metric Cards Row

Layout: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6`

### Card 1: Total Events (24h)

| Prop | Value |
|---|---|
| `icon` | `Zap` (Lucide) |
| `iconColor` | `text-violet-400` |
| `label` | "Total Events (24h)" |
| `value` | Dynamic number, formatted with commas (e.g., "12,847") |
| `trend` | Percentage change vs previous 24h period |

### Card 2: Active Agents

| Prop | Value |
|---|---|
| `icon` | `Bot` (Lucide) |
| `iconColor` | `text-cyan-400` |
| `label` | "Active Agents" |
| `value` | Dynamic count (e.g., "8") |
| `trend` | Change vs previous period |

### Card 3: Total Cost (24h)

| Prop | Value |
|---|---|
| `icon` | `DollarSign` (Lucide) |
| `iconColor` | `text-emerald-400` |
| `label` | "Total Cost (24h)" |
| `value` | Formatted currency (e.g., "$42.18") using `font-mono` |
| `trend` | Percentage change vs previous 24h |

### Card 4: Error Rate

| Prop | Value |
|---|---|
| `icon` | `AlertTriangle` (Lucide) |
| `iconColor` | `text-red-400` |
| `label` | "Error Rate" |
| `value` | Percentage (e.g., "2.3%") using `font-mono` |
| `trend` | Change vs previous period; up = bad (red), down = good (green) — **inverted** from normal |

### Framer Motion

```js
// Grid container
variants={staggerContainer}
initial="hidden"
animate="visible"

// Each MetricCard
variants={{
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}}

// Numeric values animate counting up from 0 using useSpring
```

---

## Activity Chart

Layout: Full width, `mb-6`

Component: `ChartContainer`

| Prop | Value |
|---|---|
| `title` | "Activity Overview" |
| `subtitle` | "Events over the last 7 days" |
| `height` | `300` |
| `controls` | Date range toggle: "7d", "14d", "30d" — pill-style toggles |

### Chart Specification

- **Type**: Area/line chart (Recharts `AreaChart` or similar)
- **X-axis**: Days (date labels), `font-mono text-[11px] text-slate-500`
- **Y-axis**: Event count, `font-mono text-[11px] text-slate-500`
- **Line**: Gradient stroke from `#7C3AED` to `#06B6D4`, stroke-width 2
- **Area fill**: Linear gradient from `rgba(124,58,237,0.15)` at top to `transparent` at bottom
- **Grid lines**: `stroke: rgba(255,255,255,0.04)`, horizontal only
- **Tooltip**: Glass-styled (see ChartContainer spec), shows date + event count
- **Dots**: Hidden by default, visible on hover (8px, filled with line color)

### Date Range Controls

Row of pill toggles, right-aligned in the ChartContainer header:
```
// Toggle group
inline-flex items-center gap-1 bg-white/[0.04] rounded-lg p-1

// Toggle item
px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150

// Inactive
text-slate-400 hover:text-slate-200

// Active
bg-violet-600/20 text-violet-300
```

---

## Recent Events Table

Layout: `grid grid-cols-1 lg:grid-cols-3 gap-6` — events table takes `lg:col-span-2`, anomaly panel takes `lg:col-span-1`.

Component: `DataTable` inside a `GlassCard default` with `padding="none"`.

### Table Header
Inside the card, above the table: `px-6 pt-6 pb-4`
- Title: "Recent Events" — `text-base font-semibold text-slate-100`
- Subtitle: "Last 20 events across all agents" — `text-xs text-slate-500 mt-0.5`
- Right: "View All" link — `text-xs text-violet-400 hover:text-violet-300` navigates to Events page

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Type | `category` | `100px` | No | `EventCard` category badge (pill) |
| Event | `title` | flex | No | `text-sm text-slate-200` |
| Agent | `agentName` | `120px` | No | `text-sm text-slate-400` |
| Time | `timestamp` | `100px` | No | Relative time (e.g., "2m ago"), `font-mono text-xs text-slate-500` |
| Status | `status` | `80px` | No | `StatusBadge` |

### Row Behavior
- Rows are clickable (`onRowClick` navigates to the event detail or expands the row)
- Hover: `bg-white/[0.03]`

### Pagination
Not paginated — shows exactly the 20 most recent events. "View All" links to the full events page.

---

## Anomaly Alerts Panel

Component: `GlassCard default` with `padding="md"`.

### Header
- Title: "Anomaly Alerts" — `text-base font-semibold text-slate-100`
- Right: Count badge if anomalies exist — `StatusBadge error` showing count

### Content

If anomalies exist, render a vertical list of anomaly summary cards with `gap-3`:

```
┌────────────────────────────────────┐
│  🔴 Cost Spike                     │
│  Agent: summarizer-v2              │
│  Detected 15 min ago               │
│  [View →]                          │
├────────────────────────────────────┤
│  🟡 Latency Spike                  │
│  Agent: research-agent             │
│  Detected 1 hr ago                 │
│  [View →]                          │
└────────────────────────────────────┘
```

Each anomaly card:
- Container: `p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]`
- Row 1: Severity dot (colored circle 8px) + type name (`text-sm font-medium text-slate-200`)
- Row 2: "Agent: {name}" — `text-xs text-slate-400`
- Row 3: "Detected {relative time}" — `text-xs text-slate-500`
- Row 4: "View" link — `text-xs text-violet-400 hover:text-violet-300`

Severity colors:
- `critical`: red-500
- `high`: orange-500
- `medium`: amber-500
- `low`: slate-400

### Empty State

If no active anomalies:
```
EmptyState:
  icon: Shield (in emerald-400)
  title: "No active anomalies"
  description: "All agents are operating normally."
```

---

## Loading State

When the page data is loading:
1. Metric cards row: 4x `LoadingState variant="metric"`
2. Activity chart: `ChartContainer` with `loading={true}` — skeleton rectangle
3. Events table: `LoadingState variant="table"`
4. Anomaly panel: 2x skeleton cards (rounded rect shimmer)

All skeletons animate with the shimmer effect defined in tokens.

---

## Empty State (No Data Yet)

If the organization has no events at all (brand new account):

Replace all content below the page header with a single centered `EmptyState`:
- Icon: `Zap` (48px, violet-400)
- Title: "No events yet"
- Description: "Install the AgentLedger SDK and start sending events to see your dashboard come to life."
- Action: `{ label: "View Setup Guide", onClick: navigateToSettings }`

---

## Error State

If the API fails to load dashboard data:
- Show a `Toast error` with "Failed to load dashboard data"
- Content area shows `EmptyState`:
  - Icon: `AlertTriangle` (red-400)
  - Title: "Failed to load data"
  - Description: "There was a problem loading your dashboard. Please try again."
  - Action: `{ label: "Retry", onClick: refetchData }`

---

## Responsive Behavior

| Breakpoint | Metric Cards | Chart | Bottom Section |
|---|---|---|---|
| `< 640px` | 1 column, stacked | Height 200px | Stacked: table then anomalies, full width |
| `640-1279px` | 2 columns (2x2) | Height 250px | Stacked: table then anomalies, full width |
| `1280px+` | 4 columns | Height 300px | 2/3 + 1/3 grid |

---

## Data Refresh

- Data auto-refreshes every 30 seconds via polling or WebSocket
- On refresh, new data fades in (no flash/jump)
- Metric card values animate from old to new value using `useSpring`
