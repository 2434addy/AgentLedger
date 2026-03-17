# 08 - Cost Analytics Page

Route: `/dashboard/cost-analytics`
Sidebar active item: `cost-analytics`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Cost Analytics                                    [Date Range] │
│  Track and optimize your AI spending                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Total    │ │ Avg Cost │ │ Total    │ │ Most     │           │
│  │ Cost     │ │ /Session │ │ Tokens   │ │ Expensive│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cost Over Time (Line Chart)                              │   │
│  │  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────┐ ┌────────────────────────────┐      │
│  │  Cost by Model         │ │  Cost by Agent              │     │
│  │  (Bar Chart)           │ │  (Bar Chart)                │     │
│  │  ████████              │ │  ████████                   │     │
│  └────────────────────────┘ └────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Token Usage Breakdown (Table)                            │   │
│  │  Model │ Requests │ Tokens In │ Tokens Out │ Cost        │   │
│  │  ...   │ ...      │ ...       │ ...        │ ...         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Cost Analytics" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Track and optimize your AI spending" — `text-sm text-slate-400 mt-1`
- Right action: Date range selector (pill toggles)
- `mb-6`

### Date Range Selector

Same pill toggle component as Overview page chart controls, but page-level (affects all charts and metrics):

Options: "24h", "7d", "30d", "90d"

```
inline-flex items-center gap-1 bg-white/[0.04] rounded-lg p-1
// Each pill: px-3 py-1.5 text-xs font-medium rounded-md
// Active: bg-violet-600/20 text-violet-300
// Inactive: text-slate-400 hover:text-slate-200
```

Default: "7d"

---

## Metric Cards Row

Layout: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6`

### Card 1: Total Cost

| Prop | Value |
|---|---|
| `icon` | `DollarSign` |
| `iconColor` | `text-emerald-400` |
| `label` | "Total Cost" |
| `value` | `$XXX.XX` (font-mono) |
| `trend` | % change vs previous equivalent period |

### Card 2: Avg Cost / Session

| Prop | Value |
|---|---|
| `icon` | `TrendingUp` |
| `iconColor` | `text-cyan-400` |
| `label` | "Avg Cost / Session" |
| `value` | `$X.XX` |
| `trend` | % change |

### Card 3: Total Tokens

| Prop | Value |
|---|---|
| `icon` | `Hash` |
| `iconColor` | `text-violet-400` |
| `label` | "Total Tokens" |
| `value` | Formatted large number (e.g., "2.4M") |
| `trend` | % change |

### Card 4: Most Expensive Model

| Prop | Value |
|---|---|
| `icon` | `Crown` |
| `iconColor` | `text-amber-400` |
| `label` | "Most Expensive Model" |
| `value` | Model name (e.g., "gpt-4o") — `text-2xl font-semibold` (not metric size, since it's text) |
| `trend` | — (no trend for this card) |

---

## Cost Over Time Chart

Component: `ChartContainer`, full width, `mb-6`

| Prop | Value |
|---|---|
| `title` | "Cost Over Time" |
| `subtitle` | "Daily cost breakdown" |
| `height` | `320` |
| `controls` | — (uses page-level date range) |

### Chart Spec

- **Type**: Area chart with optional stacked mode (toggle: "Stacked by model" checkbox)
- **X-axis**: Date labels, format depends on range: "24h" = hourly, "7d"/"30d" = daily, "90d" = weekly
- **Y-axis**: Dollar amount, `font-mono text-[11px]`, format "$X.XX"
- **Default (non-stacked)**: Single line/area:
  - Stroke: gradient `#7C3AED` to `#06B6D4`, stroke-width 2
  - Fill: gradient from `rgba(124,58,237,0.12)` to `transparent`
- **Stacked mode**: One area per model, using colors:
  - Model 1: `#7C3AED` (violet)
  - Model 2: `#06B6D4` (cyan)
  - Model 3: `#10B981` (emerald)
  - Model 4: `#F59E0B` (amber)
  - Additional models cycle through palette
- **Tooltip**: Glass-styled, shows date + total cost + per-model breakdown if stacked
- **Grid**: Horizontal lines only, `rgba(255,255,255,0.04)`

### Stacked Toggle

In the ChartContainer controls slot:
```
// Toggle
flex items-center gap-2
// Checkbox: w-4 h-4 rounded bg-white/[0.04] border border-white/10
//   Checked: bg-violet-600 border-violet-600 with checkmark
// Label: text-xs text-slate-400
```

---

## Cost by Model / Cost by Agent Charts

Layout: `grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6`

### Cost by Model (Left)

Component: `ChartContainer`

| Prop | Value |
|---|---|
| `title` | "Cost by Model" |
| `subtitle` | "Total spend per model" |
| `height` | `280` |

- **Type**: Horizontal bar chart
- **Y-axis**: Model names (`font-mono text-xs text-slate-400`)
- **X-axis**: Dollar amount
- **Bars**: Gradient fills using the model color palette above, with `rounded-r-md` end caps
- **Bar labels**: Value at end of bar, `font-mono text-xs text-slate-300`, format "$XX.XX"
- **Sorted**: Descending by cost (most expensive model at top)
- **Tooltip**: Model name + cost + percentage of total

### Cost by Agent (Right)

Component: `ChartContainer`

| Prop | Value |
|---|---|
| `title` | "Cost by Agent" |
| `subtitle` | "Total spend per agent" |
| `height` | `280` |

- Same chart type and styling as Cost by Model
- **Y-axis**: Agent names (`text-xs text-slate-400`)
- **Bars**: Use a different but complementary gradient palette:
  - Agent 1: `#818CF8` (indigo-400)
  - Agent 2: `#34D399` (emerald-400)
  - Agent 3: `#FBBF24` (amber-400)
  - Agent 4: `#F87171` (red-400)
- **Sorted**: Descending by cost
- **Max visible**: Top 10 agents, with "Others" aggregated if more than 10

---

## Token Usage Breakdown Table

Component: `DataTable` inside `GlassCard default` with `padding="none"`.

### Header (inside card)
`px-6 pt-6 pb-4`:
- Title: "Token Usage Breakdown" — `text-base font-semibold text-slate-100`
- Subtitle: "Detailed token consumption and costs per model" — `text-xs text-slate-500 mt-0.5`

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Model | `model` | `flex (min 140px)` | Yes | `font-mono text-sm text-slate-200` |
| Requests | `requestCount` | `100px` | Yes | `font-mono text-sm text-slate-300`, comma-formatted |
| Tokens In | `tokensIn` | `120px` | Yes | `font-mono text-sm text-slate-300`, formatted (e.g., "1.2M") |
| Tokens Out | `tokensOut` | `120px` | Yes | `font-mono text-sm text-slate-300` |
| Avg Latency | `avgLatency` | `100px` | Yes | `font-mono text-sm text-slate-400`, format "XXXms" |
| Cost | `totalCost` | `100px` | Yes (default desc) | `font-mono text-sm font-medium text-slate-100`, format "$XX.XX" |
| % of Total | `percentOfTotal` | `100px` | Yes | Progress bar: `h-1.5 rounded-full bg-violet-500/30` with filled portion `bg-violet-500`, + percentage text `text-xs text-slate-400` |

### Footer Row (Totals)

Bottom row is a totals row with `font-semibold bg-white/[0.03]`:
- Model: "Total"
- Sum of all numeric columns
- No percentage (100%)

---

## Loading State

- Metric cards: `LoadingState variant="metric"` x4
- Charts: Each `ChartContainer` with `loading={true}`
- Table: `LoadingState variant="table"`

---

## Empty State

No cost data:
`EmptyState`:
- Icon: `DollarSign` (48px, emerald-400)
- Title: "No cost data yet"
- Description: "Cost analytics will populate once your agents start making LLM calls."
- Action: `{ label: "View Setup Guide", onClick: navigateToSettings }`

---

## Error State

API failure: `Toast error` + charts/tables individually show error states (retry within each `ChartContainer`).

---

## Responsive Behavior

| Breakpoint | Metrics | Cost Over Time | Model/Agent Charts | Table |
|---|---|---|---|---|
| `< 640px` | 1 column | Height 200px | Stacked 1 column | Horizontal scroll |
| `640-1279px` | 2 columns | Height 260px | Stacked 1 column | Full |
| `1280px+` | 4 columns | Height 320px | 2 columns | Full |

---

## Framer Motion

```js
// Page sections stagger in
staggerContainer with staggerChildren: 0.1

// Each section: fadeInUp

// Chart bars animate width from 0 to final value
initial={{ width: 0 }}
animate={{ width: finalWidth }}
transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}

// Line chart: SVG path draws from left to right using pathLength
initial={{ pathLength: 0 }}
animate={{ pathLength: 1 }}
transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
```
