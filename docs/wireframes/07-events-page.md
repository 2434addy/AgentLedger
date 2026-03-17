# 07 - Events Page

Route: `/dashboard/events`
Sidebar active item: `events`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Events                                                          │
│  Full event log across all agents and sessions                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Search]  [Category] [Level] [Agent] [Session] [Dates]  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Type │ Event     │ Agent │ Session │ Level │ Timestamp  │   │
│  │───────┼───────────┼───────┼─────────┼───────┼────────────│   │
│  │  🟣   │ GPT-4 ... │ bot-1 │ a1b2..  │ info  │ 14:32:01  │   │
│  │  ▼ Expanded: JSON payload viewer                          │   │
│  │  🔵   │ search..  │ bot-1 │ a1b2..  │ info  │ 14:32:02  │   │
│  │  🟢   │ Agent s.. │ bot-2 │ e5f6..  │ info  │ 14:32:03  │   │
│  │  🔴   │ Guardr..  │ bot-1 │ a1b2..  │ warn  │ 14:32:04  │   │
│  │                        ...                                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Showing 1-50 of 12,847          [◀] [1] [2] ... [▶]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Events" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Full event log across all agents and sessions" — `text-sm text-slate-400 mt-1`
- Right action: `GlassButton secondary sm` — "Export CSV" (with Download icon)
- `mb-6`

---

## Filters Bar

Inside `GlassCard`, `px-6 pt-6 pb-4`.

Layout: `flex items-center gap-3 flex-wrap`

### Search Input
- Component: `GlassInput search`
- Placeholder: "Search events..."
- Width: `w-56`
- Searches event title, summary text

### Category Filter
- Component: `GlassSelect`
- Options: "All Categories", LLM Call, Tool Invocation, Agent Lifecycle, User Action, System, Security, Guardrail
- Width: `w-44`
- Each option has a colored dot matching the event category color

### Level Filter
- Component: `GlassSelect`
- Options: All Levels, Debug, Info, Warning, Error, Critical
- Width: `w-36`

### Agent Filter
- Component: `GlassSelect searchable`
- Options: "All Agents" + dynamically populated
- Width: `w-44`

### Session Filter
- Component: `GlassSelect searchable`
- Options: "All Sessions" + dynamically populated (shows session ID prefix)
- Width: `w-44`

### Date Range
- Component: `GlassSelect` with presets: "Last hour", "Last 24h", "Last 7 days", "Last 30 days", "Custom"
- Width: `w-40`
- "Custom" opens a date range picker popover

### Active Filters Display

When any filter is active (not "All"), show active filter pills below the filter bar:
```
// Active filter pill
inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-600/10 border border-violet-600/20
text-xs text-violet-300

// Remove button (X icon) on each pill
w-3 h-3 text-violet-400 hover:text-violet-200 cursor-pointer

// "Clear all" link after pills
text-xs text-slate-500 hover:text-slate-300 ml-2
```

---

## Events Table

Component: `DataTable` inside `GlassCard default` with `padding="none"`, `expandable={true}`.

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Type | `category` | `120px` | Yes | Category badge pill (see EventCard component). Color-coded by category. |
| Event | `title` | `flex (min 200px)` | No | `text-sm text-slate-200`, truncated with ellipsis if needed |
| Agent | `agentName` | `120px` | Yes | `text-sm text-slate-400` |
| Session | `sessionId` | `100px` | No | `font-mono text-xs text-slate-500`, first 8 chars, clickable (navigates to session replay) |
| Level | `level` | `80px` | Yes | Level badge: info=`text-blue-400 bg-blue-400/10`, warning=`text-amber-400 bg-amber-400/10`, error=`text-red-400 bg-red-400/10`, debug=`text-slate-500 bg-slate-500/10`, critical=`text-red-500 bg-red-500/15 font-semibold`. Badge is `px-2 py-0.5 rounded text-[11px] uppercase` |
| Timestamp | `timestamp` | `140px` | Yes (default desc) | Full timestamp: "14:32:01.234" — `font-mono text-xs text-slate-500` |

### Row Expansion

Clicking a row expands it to reveal the full event payload. The expanded area sits below the row, spanning all columns.

```
┌──────────────────────────────────────────────────────┐
│  🟣 LLM Call │ GPT-4 completion │ bot-1 │ a1b2 │ ...│
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  Event Details                                 │  │
│  │                                                │  │
│  │  Category: llm_call                            │  │
│  │  Level: info                                   │  │
│  │  Agent: summarizer-v2                          │  │
│  │  Session: a1b2c3d4-e5f6-g7h8                   │  │
│  │  Timestamp: 2026-03-17T14:32:01.234Z           │  │
│  │                                                │  │
│  │  Payload:                                      │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │ {                                        │  │  │
│  │  │   "model": "gpt-4",                      │  │  │
│  │  │   "tokens_in": 1240,                     │  │  │
│  │  │   "tokens_out": 380,                     │  │  │
│  │  │   "cost": 0.0248,                        │  │  │
│  │  │   "latency_ms": 1523,                    │  │  │
│  │  │   "prompt": "Summarize the following..."  │  │  │
│  │  │ }                                        │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  │                                                │  │
│  │  [Copy JSON]  [View in Session Replay]         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Expanded Row Content

Container: `px-6 py-4 bg-white/[0.02] border-b border-white/[0.06]`

**Metadata grid**: 2-column grid (`grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 mb-4`), each item:
- Label: `text-xs text-slate-500`
- Value: `text-sm text-slate-300`

**JSON Payload Viewer**:
- Container: `p-4 rounded-lg bg-black/30 font-mono text-xs text-slate-300 overflow-x-auto max-h-[400px] overflow-y-auto`
- Syntax highlighted:
  - Keys: `text-cyan-400`
  - Strings: `text-emerald-400`
  - Numbers: `text-amber-400`
  - Booleans: `text-violet-400`
  - Null: `text-slate-500`
  - Brackets/braces: `text-slate-500`
- JSON is pretty-printed with 2-space indentation
- Line numbers: optional, `text-slate-600 select-none pr-4 text-right`

**Action buttons**: `flex items-center gap-3 mt-3`
- "Copy JSON" — `GlassButton ghost sm` with clipboard icon. On click: copies full JSON to clipboard, shows "Copied!" feedback
- "View in Session Replay" — `GlassButton ghost sm` with play icon. Navigates to session replay filtered to this event

### Expand/Collapse Animation

```js
<AnimatePresence>
  {expanded && (
    <motion.tr>
      <motion.td colSpan={6}>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.td>
    </motion.tr>
  )}
</AnimatePresence>
```

### Sorting
Default: `timestamp` descending (newest first)

### Pagination
- `pageSize: 50` (events can be high-volume, show more per page)
- Standard pagination bar

---

## Loading State

- Filters: skeleton bars
- Table: `LoadingState variant="table"` with 15 rows

---

## Empty State

### No Events
`EmptyState`:
- Icon: `Zap` (48px, violet-400)
- Title: "No events recorded"
- Description: "Events will appear here once your agents start sending data via the SDK."
- Action: `{ label: "View Setup Guide", onClick: navigateToSettings }`

### No Filter Results
Inline empty: "No events match your filters" with "Clear Filters" button.

---

## Error State

API failure: `Toast error` + retry `EmptyState`.

---

## Responsive Behavior

| Breakpoint | Filters | Table |
|---|---|---|
| `< 768px` | Stacked vertically, full-width. Show only Search + Category + Level; rest in a "More Filters" collapsible | Horizontal scroll, Session column hidden |
| `768-1023px` | Wrap to 2 rows | Full table, narrower widths |
| `1024px+` | Single row (may wrap) | Full table |

On mobile, the expanded JSON payload viewer has `max-h-[300px]` and uses horizontal scroll for wide JSON.

---

## Framer Motion

```js
// Page entrance
fadeInUp on card

// Table rows stagger
staggerChildren: 0.015 (faster since there are 50 rows)

// Category badges have a subtle entrance scale
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
```
