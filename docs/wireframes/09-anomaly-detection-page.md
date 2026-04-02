# 09 - Anomaly Detection Page

Route: `/dashboard/anomaly-detection`
Sidebar active item: `anomaly-detection`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Anomaly Detection                            [Status filter]   │
│  Automated monitoring for unusual agent behavior                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Active   │ │ Critical │ │ Resolved │ │ Avg Time │           │
│  │Anomalies │ │ Alerts   │ │ Today    │ │ to Ack   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Anomaly Trend (Line Chart — last 30 days)                │   │
│  │  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Active Anomalies                                         │   │
│  │                                                           │   │
│  │  ┌─ Anomaly Card ──────────────────────────────────────┐ │   │
│  │  │  CRITICAL  Cost Spike             agent: bot-1      │ │   │
│  │  │  Cost increased 340% vs baseline  15 min ago        │ │   │
│  │  │  [Acknowledge]  [Resolve]  [View Agent]             │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  ┌─ Anomaly Card ──────────────────────────────────────┐ │   │
│  │  │  HIGH  Latency Spike              agent: bot-2      │ │   │
│  │  │  P95 latency 4.2s vs 800ms avg    1 hr ago          │ │   │
│  │  │  [Acknowledge]  [Resolve]  [View Agent]             │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  ┌─ Anomaly Card ──────────────────────────────────────┐ │   │
│  │  │  ...                                                │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Anomaly Detection" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Automated monitoring for unusual agent behavior" — `text-sm text-slate-400 mt-1`
- Right actions:
  - Status filter pills: "All", "Open", "Acknowledged", "Resolved"
  - Same pill toggle style as date range selectors
  - Default: "Open"
- `mb-6`

---

## Metric Cards Row

Layout: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6`

### Card 1: Active Anomalies

| Prop | Value |
|---|---|
| `icon` | `AlertTriangle` |
| `iconColor` | `text-red-400` |
| `label` | "Active Anomalies" |
| `value` | Count of open + acknowledged anomalies |
| `trend` | Change vs previous period |

### Card 2: Critical Alerts

| Prop | Value |
|---|---|
| `icon` | `AlertOctagon` |
| `iconColor` | `text-red-500` |
| `label` | "Critical Alerts" |
| `value` | Count of critical-severity open anomalies |
| `trend` | — |

### Card 3: Resolved Today

| Prop | Value |
|---|---|
| `icon` | `CheckCircle` |
| `iconColor` | `text-emerald-400` |
| `label` | "Resolved Today" |
| `value` | Count resolved in last 24h |
| `trend` | — |

### Card 4: Avg Time to Acknowledge

| Prop | Value |
|---|---|
| `icon` | `Clock` |
| `iconColor` | `text-amber-400` |
| `label` | "Avg Time to Ack" |
| `value` | Formatted duration (e.g., "12m") |
| `trend` | Change vs previous period (lower = better = green) |

---

## Anomaly Trend Chart

Component: `ChartContainer`, full width, `mb-6`

| Prop | Value |
|---|---|
| `title` | "Anomaly Trend" |
| `subtitle` | "Anomalies detected over the last 30 days" |
| `height` | `260` |
| `controls` | Date range: "7d", "30d", "90d" |

### Chart Spec

- **Type**: Stacked area chart
- **X-axis**: Dates
- **Y-axis**: Anomaly count
- **Areas** (one per anomaly type, stacked):
  - `latency_spike`: `#F59E0B` (amber)
  - `error_burst`: `#EF4444` (red)
  - `cost_spike`: `#10B981` (emerald)
  - `loop_detected`: `#7C3AED` (violet)
- Each area has 10% opacity fill, 2px stroke
- **Legend**: Below chart, horizontal, using colored dots + labels
- **Tooltip**: Glass-styled, shows date + count per type

---

## Active Anomalies List

Component: `GlassCard default` with custom content (not DataTable).

### Header
`px-6 pt-6 pb-4`:
- Title: "Active Anomalies" — `text-base font-semibold text-slate-100`
- Right: Sort by dropdown: "Newest First", "Severity (High to Low)", "Agent Name" — `GlassSelect` width `w-48`

### Anomaly Card

Each anomaly is rendered as a card within the list, with `gap-3` between cards. Padding `px-6 pb-6`.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Severity Badge]  [Type Name]                    [Agent Badge]  │
│                                                    [Timestamp]   │
│  Description text explaining the anomaly detection.              │
│                                                                  │
│  [Acknowledge]  [Resolve]  [View Agent]                          │
└──────────────────────────────────────────────────────────────────┘
```

#### Card Container

```
p-4 rounded-xl border transition-all duration-150
```

Border color by severity:
- `critical`: `border-red-500/30 bg-red-500/5`
- `high`: `border-orange-500/30 bg-orange-500/5`
- `medium`: `border-amber-500/30 bg-amber-500/5`
- `low`: `border-slate-500/30 bg-white/[0.02]`

#### Row 1: Header

Layout: `flex items-center justify-between`

**Left side** (`flex items-center gap-2`):
- Severity badge: `px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider`
  - critical: `bg-red-500/20 text-red-400`
  - high: `bg-orange-500/20 text-orange-400`
  - medium: `bg-amber-500/20 text-amber-400`
  - low: `bg-slate-500/20 text-slate-400`
- Type name: `text-sm font-semibold text-slate-100`
  - `latency_spike` displays as "Latency Spike"
  - `error_burst` displays as "Error Burst"
  - `cost_spike` displays as "Cost Spike"
  - `loop_detected` displays as "Loop Detected"

**Right side** (`flex flex-col items-end gap-0.5`):
- Agent name: `text-xs text-slate-400` — "Agent: {name}"
- Timestamp: `text-xs text-slate-500` — "Detected {relative time}"

#### Row 2: Description

`text-sm text-slate-400 mt-2 leading-relaxed`

Example descriptions:
- Cost Spike: "Cost increased 340% compared to the 24-hour rolling baseline. Total cost in the last hour: $18.42 vs average $4.12."
- Latency Spike: "P95 latency reached 4,200ms compared to the rolling average of 800ms over the last 2 hours."
- Error Burst: "12 errors detected in the last 5 minutes across 3 sessions. Error rate: 45% vs baseline 2%."
- Loop Detected: "Agent executed the same tool call sequence 8 times in session a1b2c3d4. Possible infinite loop."

#### Row 3: Status Indicator (for acknowledged anomalies)

If status is `acknowledged`:
- `mt-2 flex items-center gap-1.5`
- Eye icon (14px, `text-amber-400`)
- Text: "Acknowledged by {user} at {time}" — `text-xs text-amber-400/70`

#### Row 4: Actions

`flex items-center gap-2 mt-3`

- **Acknowledge**: `GlassButton ghost sm` — visible only when status is `open`. Label: "Acknowledge". On click: sets status to `acknowledged`.
- **Resolve**: `GlassButton ghost sm` — visible when status is `open` or `acknowledged`. Label: "Resolve". On click: opens confirmation dialog, then sets status to `resolved`.
- **View Agent**: `GlassButton ghost sm` — always visible. Label: "View Agent". Navigates to agent detail page.

### Resolved Anomalies

When the status filter is set to "Resolved", anomaly cards look the same but:
- Border: `border-slate-500/10 bg-white/[0.01]` (muted)
- Actions replaced with: "Resolved by {user} at {time}" — `text-xs text-emerald-400/60` with checkmark icon
- Overall `opacity-80`

---

## Loading State

- Metric cards: `LoadingState variant="metric"` x4
- Chart: `ChartContainer loading`
- Anomaly list: 3x skeleton cards (rounded rect with 3 shimmer bars each)

---

## Empty State

### No Anomalies (with "Open" filter)

Replace anomaly list content with `EmptyState`:
- Icon: `Shield` (48px, emerald-400)
- Title: "No active anomalies"
- Description: "All agents are operating within normal parameters. Anomalies will appear here when unusual behavior is detected."

### No Anomalies (with "All" filter — brand new account)

`EmptyState`:
- Icon: `AlertTriangle` (48px, violet-400)
- Title: "Anomaly detection is active"
- Description: "The system is monitoring your agents. Anomalies will be detected automatically once enough baseline data is collected."

---

## Error State

API failure: `Toast error` + retry `EmptyState`.

---

## Responsive Behavior

| Breakpoint | Metrics | Chart | Anomaly List |
|---|---|---|---|
| `< 640px` | 1 column | Height 180px | Full-width cards, actions stack vertically |
| `640-1279px` | 2 columns | Height 220px | Full-width cards |
| `1280px+` | 4 columns | Height 260px | Full-width cards |

On mobile, the anomaly card header stacks: severity badge + type on top, agent + timestamp below (instead of side by side).

---

## Framer Motion

```js
// Anomaly cards stagger in
staggerContainer with staggerChildren: 0.06

// Each card
variants={{
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
}}

// Critical severity cards have a subtle pulse on the border:
animate={{ borderColor: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.5)', 'rgba(239,68,68,0.3)'] }}
transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}

// When acknowledging/resolving, card animates out:
exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
// Then re-enters in the appropriate filter list
```

---

## Real-time Updates

- New anomalies push in via WebSocket or 15-second polling
- When a new anomaly arrives:
  1. `Toast warning` or `Toast error` (for critical) with anomaly summary
  2. The anomaly card slides in at the top of the list with animation
  3. Sidebar badge count updates
  4. Metric card values update with spring animation
