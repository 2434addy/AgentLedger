# 05 - Agents Page

Route: `/dashboard/agents`
Sidebar active item: `agents`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Agents                                                          │
│  Manage and monitor all registered agents                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Search input]          [Status filter]  [Model filter] │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Name   │ Model  │ Status │ Last Seen │ Events │ Cost │ ▸ │  │
│  │─────────┼────────┼────────┼───────────┼────────┼──────┼───│  │
│  │  agent1 │ gpt-4  │ 🟢    │ 2m ago    │ 1,204  │$12.4 │ ▸ │  │
│  │  agent2 │ claude │ 🟢    │ 5m ago    │  842   │ $8.2 │ ▸ │  │
│  │  agent3 │ gpt-4  │ ⚪    │ 2h ago    │  312   │ $3.1 │ ▸ │  │
│  │  agent4 │ gpt-3.5│ 🔴    │ 1d ago    │   47   │ $0.4 │ ▸ │  │
│  │                          ...                              │  │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Showing 1-20 of 42              [◀] [1] [2] [3] [▶]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Agents" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Manage and monitor all registered agents" — `text-sm text-slate-400 mt-1`
- No action buttons (agents are auto-registered via SDK)
- `mb-6`

---

## Filters Bar

Positioned above the table inside the `GlassCard`, `px-6 pt-6 pb-4`.

Layout: `flex items-center gap-3 flex-wrap`

### Search Input
- Component: `GlassInput search`
- Placeholder: "Search agents by name..."
- Width: `w-64` (fixed), `flex-shrink-0`
- Filters the table client-side by agent name (debounced 300ms)

### Status Filter
- Component: `GlassSelect`
- Options: All Statuses, Active, Idle, Error
- Width: `w-40`
- Default: "All Statuses"

### Model Filter
- Component: `GlassSelect`
- Options: All Models, + dynamically populated from available models
- Width: `w-40`
- Default: "All Models"

---

## Agent Table

Component: `DataTable` inside `GlassCard default` with `padding="none"`.

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Name | `name` | `flex (min 160px)` | Yes | `text-sm font-medium text-slate-100` |
| Model | `model` | `120px` | Yes | `font-mono text-xs text-slate-400 px-2 py-0.5 rounded bg-white/[0.04]` |
| Status | `status` | `100px` | Yes | `StatusBadge` component |
| Last Seen | `lastSeen` | `120px` | Yes | Relative time, `font-mono text-xs text-slate-500` |
| Total Events | `totalEvents` | `100px` | Yes (default desc) | `font-mono text-sm text-slate-300`, comma-formatted |
| Total Cost | `totalCost` | `100px` | Yes | `font-mono text-sm text-slate-300`, formatted as `$XX.XX` |
| Actions | — | `48px` | No | Chevron-right icon (`w-4 h-4 text-slate-500`), indicating row is clickable |

### Sorting
- Default sort: `totalEvents` descending (most active agents first)
- Clickable column headers toggle ascending/descending
- Active sort column header: `text-slate-200` with sort direction arrow icon (12px)

### Row Click
Clicking a row navigates to the Agent Detail View (see below). Row has `cursor-pointer` and hover style.

### Pagination
- `pageSize: 20`
- Pagination bar at bottom of table
- "Showing {start}-{end} of {total}" left side
- Page number buttons right side, using `GlassButton ghost sm`

---

## Agent Detail View

Route: `/dashboard/agents/:agentId`

Accessed by clicking a row in the agents table. Back button returns to agents list.

### Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Back] agent-name                             [Status Badge] │
│  Model: gpt-4o · Last seen: 2 minutes ago                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Total    │ │ Total    │ │ Total    │ │ Avg      │           │
│  │ Sessions │ │ Events   │ │ Cost     │ │ Latency  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────────────────────┐ ┌─────────────────────────────┐   │
│  │  Recent Sessions         │ │  Event Timeline             │   │
│  │  (table)                 │ │  (last 50 events)           │   │
│  │                          │ │                             │   │
│  │                          │ │                             │   │
│  └──────────────────────────┘ └─────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Header

- **Back button**: `GlassButton ghost sm` with `ArrowLeft` icon + "Back" label, navigates to `/dashboard/agents`
- **Agent name**: `text-3xl font-semibold text-slate-50` — inline with back button row
- **Status badge**: `StatusBadge` right-aligned, same row as agent name
- **Metadata line**: `text-sm text-slate-400 mt-1` — "Model: {model} · Last seen: {relative time}"
- `mb-6`

### Metric Cards

Layout: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6`

| Card | Icon | Color | Label | Value |
|---|---|---|---|---|
| 1 | `ScrollText` | `text-violet-400` | "Total Sessions" | Count |
| 2 | `Zap` | `text-cyan-400` | "Total Events" | Formatted count |
| 3 | `DollarSign` | `text-emerald-400` | "Total Cost" | `$XX.XX` |
| 4 | `Clock` | `text-amber-400` | "Avg Latency" | `XXXms` |

### Recent Sessions Table

Component: `GlassCard default` with `DataTable`, takes `lg:col-span-1` in a `grid grid-cols-1 lg:grid-cols-2 gap-6`.

Columns:

| Column | Key | Width | Renderer |
|---|---|---|---|
| Session ID | `sessionId` | flex | `font-mono text-xs text-slate-300`, truncated to first 8 chars |
| Start Time | `startTime` | `140px` | Formatted datetime, `text-xs text-slate-400` |
| Duration | `duration` | `80px` | Formatted (e.g., "2m 34s"), `font-mono text-xs text-slate-400` |
| Events | `eventCount` | `60px` | `font-mono text-sm text-slate-300` |
| Status | `status` | `80px` | `StatusBadge` |

- Click row navigates to Session Replay page for that session
- Shows last 10 sessions, no pagination, "View All" link to Sessions page

### Event Timeline

Component: `GlassCard default` with `Timeline` component inside, takes `lg:col-span-1`.

- Shows last 50 events for this agent in chronological order (newest first)
- Each event is a `TimelineEvent` rendered as described in components.md
- Scrollable within the card: `max-h-[500px] overflow-y-auto`
- Header: "Recent Events" title + count badge

---

## Loading State

- Page header: Agent name skeleton bar `h-8 w-48`, metadata skeleton bar `h-4 w-64`
- Metric cards: `LoadingState variant="metric"` x4
- Sessions table: `LoadingState variant="table"`
- Event timeline: `LoadingState variant="timeline"`

---

## Empty State

### Agent List (no agents registered)
Replace table with `EmptyState`:
- Icon: `Bot` (48px, violet-400)
- Title: "No agents registered yet"
- Description: "Agents are automatically registered when they send their first event via the SDK."
- Action: `{ label: "View Setup Guide", onClick: navigateToSettings }`

### Agent Detail (no sessions yet)
Sessions table shows inline empty: "No sessions recorded yet" centered, `text-sm text-slate-500`.
Timeline shows inline empty: "No events recorded yet".

---

## Error State

API failure: `Toast error` + content replaced with retry `EmptyState`.

---

## Responsive Behavior

| Breakpoint | Filters | Table | Agent Detail |
|---|---|---|---|
| `< 768px` | Stack vertically, inputs go full-width | Horizontal scroll enabled | Metric cards 1-col, bottom section stacked |
| `768-1023px` | Inline row, may wrap | Full table visible | Metric cards 2-col, bottom section stacked |
| `1024px+` | Inline row | Full table visible | Metric cards 4-col, bottom section 2-col grid |

---

## Framer Motion

```js
// Table rows stagger in
staggerContainer with staggerChildren: 0.03

// Each row
variants={{
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
}}

// Page transition between list and detail view
// Uses shared layout animation on the agent name if feasible,
// otherwise standard page transition (see dashboard-layout.md)
```
