# 06 - Sessions Page

Route: `/dashboard/sessions`
Sidebar active item: `sessions`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Sessions                                                        │
│  Browse and search all agent sessions                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Search]  [Agent filter]  [Status filter]  [Date range] │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Session ID │ Agent  │ Start Time │ Duration │ Events │ S │  │
│  │─────────────┼────────┼────────────┼──────────┼────────┼───│  │
│  │  a1b2c3d4   │ bot-1  │ Mar 17 ... │ 2m 34s   │ 42     │ ✓ │  │
│  │  e5f6g7h8   │ bot-2  │ Mar 17 ... │ 1m 12s   │ 18     │ ✓ │  │
│  │  i9j0k1l2   │ bot-1  │ Mar 16 ... │ 5m 07s   │ 87     │ ⚠ │  │
│  │                        ...                                │  │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Showing 1-20 of 312             [◀] [1] [2] ... [▶]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Sessions" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Browse and search all agent sessions" — `text-sm text-slate-400 mt-1`
- No action buttons
- `mb-6`

---

## Filters Bar

Inside `GlassCard`, `px-6 pt-6 pb-4`.

Layout: `flex items-center gap-3 flex-wrap`

### Search Input
- Component: `GlassInput search`
- Placeholder: "Search by session ID..."
- Width: `w-56`
- Searches by session ID prefix match

### Agent Filter
- Component: `GlassSelect`
- Options: "All Agents" + dynamically populated agent names
- Width: `w-44`

### Status Filter
- Component: `GlassSelect`
- Options: All, Completed, In Progress, Error
- Width: `w-40`

### Date Range Filter
- Component: Two `GlassInput text` with `type="date"` (or a custom date range picker)
- Layout: "From" input + "To" input, each `w-36`
- Labels inline: `text-xs text-slate-500`
- Alternative: `GlassSelect` with presets — "Last 24h", "Last 7 days", "Last 30 days", "Custom"

---

## Sessions Table

Component: `DataTable` inside `GlassCard default` with `padding="none"`.

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Session ID | `sessionId` | `140px` | Yes | `font-mono text-xs text-slate-300`, first 8 chars + copy button (clipboard icon, 12px, appears on hover) |
| Agent | `agentName` | `140px` | Yes | `text-sm text-slate-200` |
| Start Time | `startTime` | `160px` | Yes (default desc) | Formatted datetime: "Mar 17, 2026 14:32:01" — `text-xs text-slate-400` |
| Duration | `duration` | `100px` | Yes | Formatted: "2m 34s" — `font-mono text-xs text-slate-400`. In-progress sessions show a live counter in `text-emerald-400` |
| Event Count | `eventCount` | `80px` | Yes | `font-mono text-sm text-slate-300` |
| Status | `status` | `100px` | Yes | `StatusBadge`: completed = `active` (green, "Completed"), in progress = `active` (green, pulsing, "Live"), error = `error` (red, "Error") |

### Row Behavior

- Clicking a row navigates to `/dashboard/session-replay?session={sessionId}`
- Row has `cursor-pointer`
- Hover: `bg-white/[0.03]`

### Sorting
Default: `startTime` descending (newest sessions first)

### Pagination
- `pageSize: 20`
- Standard pagination bar

---

## Loading State

- Filters: skeleton bars matching each filter element
- Table: `LoadingState variant="table"` with 10 rows

---

## Empty State

### No Sessions

Replace table with `EmptyState`:
- Icon: `ScrollText` (48px, violet-400)
- Title: "No sessions recorded"
- Description: "Sessions are created automatically when agents start processing. Install the SDK to begin."
- Action: `{ label: "View Setup Guide", onClick: navigateToSettings }`

### No Results (filters active)

Replace table body with inline empty state:
- `text-sm text-slate-500 text-center py-12` — "No sessions match your filters. Try adjusting your search criteria."
- `GlassButton ghost sm` — "Clear Filters" resets all filters

---

## Error State

API failure: `Toast error` with "Failed to load sessions" + retry `EmptyState` in content area.

---

## Responsive Behavior

| Breakpoint | Filters | Table |
|---|---|---|
| `< 768px` | Stack vertically, all full-width | Horizontal scroll, min-width 700px |
| `768-1023px` | Wrap to 2 rows if needed | Full table |
| `1024px+` | Single row | Full table |

---

## Framer Motion

```js
// Page entrance
fadeInUp on the card container

// Table rows
staggerContainer with staggerChildren: 0.02
// Each row fades in from left
variants={{
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 }
}}

// Status badge for "Live" sessions
// Pulsing dot animation: scale pulse 1.0 → 1.3 → 1.0, duration 2s, infinite
```
