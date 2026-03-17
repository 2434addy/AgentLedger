# 11 - Compliance Page

Route: `/dashboard/compliance`
Sidebar active item: `compliance`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Compliance                                                      │
│  Safety checks, audit logs, and compliance reporting             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐ ┌─────────────────────────────────────┐   │
│  │  Compliance Score │ │  Safety Check Results (Table)       │   │
│  │                   │ │                                     │   │
│  │     92%           │ │  Check    │ Status │ Last Run       │   │
│  │  ████████░░       │ │  ─────────┼────────┼────────────── │   │
│  │  23/25 passing    │ │  PII Scan │ Pass   │ 5m ago         │   │
│  │                   │ │  Token..  │ Warn   │ 5m ago         │   │
│  │                   │ │  ...      │ ...    │ ...            │   │
│  └──────────────────┘ └─────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Audit Log                                     [Export]  │   │
│  │                                                          │   │
│  │  Action    │ User    │ Target     │ Timestamp │ IP       │   │
│  │  ──────────┼─────────┼────────────┼───────────┼───────── │   │
│  │  api_key.. │ john@.. │ key_abc123 │ 14:32:01  │ 192.168  │   │
│  │  login     │ jane@.. │ —          │ 14:28:15  │ 10.0.0   │   │
│  │  ...       │ ...     │ ...        │ ...       │ ...      │   │
│  │                                                          │   │
│  │  Showing 1-20 of 485             [◀] [1] [2] ... [▶]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Compliance" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Safety checks, audit logs, and compliance reporting" — `text-sm text-slate-400 mt-1`
- `mb-6`

---

## Top Section

Layout: `grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6`

- Compliance Score: `lg:col-span-1`
- Safety Check Results: `lg:col-span-2`

---

## Compliance Score Card

Component: `GlassCard default` with `padding="lg"`.

### Layout

```
┌─────────────────────────────┐
│  Compliance Score            │
│                              │
│        ┌──────────┐          │
│        │          │          │
│        │   92%    │          │
│        │          │          │
│        └──────────┘          │
│                              │
│   23 of 25 checks passing    │
│   2 warnings · 0 failures    │
└─────────────────────────────┘
```

### Elements

1. **Title**: "Compliance Score" — `text-base font-semibold text-slate-100 mb-6`

2. **Circular Progress Ring**: Centered, `w-36 h-36`
   - SVG circle with:
     - Background track: `stroke: rgba(255,255,255,0.06)`, stroke-width 8
     - Progress arc: `stroke: {color}`, stroke-width 8, `stroke-linecap: round`
     - Color based on score: 90-100% = emerald-500, 70-89% = amber-500, < 70% = red-500
   - Center text: percentage in `text-4xl font-bold font-mono text-slate-50`
   - Arc animates from 0 to final percentage on load

3. **Summary text**: Centered below the ring
   - Line 1: "{passing} of {total} checks passing" — `text-sm text-slate-300 mt-4`
   - Line 2: "{warnings} warnings · {failures} failures" — `text-xs text-slate-500 mt-1`
     - Warnings count: `text-amber-400` if > 0
     - Failures count: `text-red-400` if > 0

### Framer Motion

```js
// Ring progress animation
initial={{ strokeDashoffset: circumference }}
animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}

// Percentage counter
// Animate number from 0 to score using useSpring
```

---

## Safety Check Results Table

Component: `DataTable` inside `GlassCard default` with `padding="none"`.

### Header
`px-6 pt-6 pb-4`:
- Title: "Safety Checks" — `text-base font-semibold text-slate-100`
- Right: "Run All Checks" — `GlassButton secondary sm` with `RefreshCw` icon

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Check Name | `name` | `flex (min 200px)` | Yes | `text-sm text-slate-200` |
| Description | `description` | `flex (min 160px)` | No | `text-xs text-slate-400`, truncated |
| Status | `status` | `100px` | Yes | Status pill (see below) |
| Last Run | `lastRun` | `120px` | Yes | Relative time, `text-xs text-slate-500` |

### Status Pill

- **Pass**: `bg-emerald-500/15 text-emerald-400 text-xs font-medium px-2.5 py-0.5 rounded-full` + checkmark icon (12px)
- **Fail**: `bg-red-500/15 text-red-400` + x-circle icon (12px)
- **Warning**: `bg-amber-500/15 text-amber-400` + alert-triangle icon (12px)
- **Running**: `bg-blue-500/15 text-blue-400` + spinner (12px, animated)
- **Skipped**: `bg-slate-500/15 text-slate-400` + minus icon (12px)

### Example Safety Checks

| Check Name | Description |
|---|---|
| PII Detection | Scans LLM outputs for personally identifiable information |
| Token Budget | Verifies agents stay within configured token budgets |
| Prompt Injection | Checks for prompt injection patterns in user inputs |
| Output Safety | Validates LLM outputs against content safety policies |
| Rate Limiting | Confirms API call rate limits are not exceeded |
| Data Retention | Verifies data retention policies are applied |
| Access Control | Audits API key usage and permissions |
| Loop Prevention | Checks for circular agent delegation patterns |

No pagination needed — typically under 20 checks. If > 20, paginate at 20.

---

## Audit Log

Component: `DataTable` inside `GlassCard default` with `padding="none"`, full width.

### Header
`px-6 pt-6 pb-4`:
- Title: "Audit Log" — `text-base font-semibold text-slate-100`
- Right: `GlassButton secondary sm` — "Export CSV" with Download icon

### Filters (below title, above table)
`px-6 pb-4 flex items-center gap-3`

- Action filter: `GlassSelect` — "All Actions", login, logout, api_key_created, api_key_revoked, settings_updated, user_invited, etc. Width `w-44`
- User filter: `GlassSelect searchable` — "All Users" + user list. Width `w-44`
- Date range: `GlassSelect` — "Last 24h", "Last 7 days", "Last 30 days", "Last 90 days". Width `w-40`

### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Action | `action` | `160px` | Yes | Action badge: `font-mono text-xs px-2 py-0.5 rounded bg-white/[0.04] text-slate-300` |
| User | `userEmail` | `180px` | Yes | `text-sm text-slate-300`, truncated |
| Target | `target` | `160px` | No | `font-mono text-xs text-slate-400`, or "—" if no target |
| Timestamp | `timestamp` | `160px` | Yes (default desc) | Full datetime: "Mar 17, 2026 14:32:01" — `font-mono text-xs text-slate-500` |
| IP Address | `ipAddress` | `120px` | No | `font-mono text-xs text-slate-500` |

### Row Click
Clicking a row expands it to show the full audit event detail:
- Container: `px-6 py-4 bg-white/[0.02]`
- Shows: Full action details, request metadata, user agent, any additional context as key-value pairs

### Pagination
- `pageSize: 20`
- Standard pagination bar

### Export CSV

On click:
1. Button enters loading state (spinner)
2. Fetches all audit log entries matching current filters (server-side)
3. Generates CSV with columns: Action, User, Target, Timestamp, IP Address
4. Triggers browser download: `agentledger-audit-log-{date}.csv`
5. Shows `Toast success` — "Audit log exported successfully"

---

## Loading State

- Compliance score: GlassCard with circular skeleton (ring outline shimmer) + shimmer bars for summary text
- Safety checks table: `LoadingState variant="table"` with 8 rows
- Audit log: `LoadingState variant="table"` with 10 rows

---

## Empty State

### No Safety Checks (new account)

Safety check table shows `EmptyState`:
- Icon: `Shield` (48px, violet-400)
- Title: "Safety checks not configured"
- Description: "Safety checks will appear once your agents start processing events and the system collects baseline data."

### No Audit Log Entries

Audit log shows `EmptyState`:
- Icon: `ScrollText` (48px, slate-400)
- Title: "No audit log entries"
- Description: "Actions performed in your organization will be recorded here."

---

## Error State

API failure: `Toast error` per section. Each section independently shows error/retry within its card.

---

## Responsive Behavior

| Breakpoint | Top Section | Audit Log |
|---|---|---|
| `< 1024px` | Stacked: Compliance Score full-width, Safety Checks full-width below | Filters stack vertically; table horizontal scroll |
| `1024px+` | 1/3 + 2/3 grid | Full layout |

On mobile (`< 768px`):
- Compliance score card shrinks ring to `w-28 h-28`
- Audit log hides IP Address column
- Filters stack with each full-width

---

## Framer Motion

```js
// Compliance score ring draws on load
// (see ring animation above)

// Safety check table rows stagger
staggerChildren: 0.03

// Pass/fail status badges pop in
initial={{ scale: 0.7, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: "spring", stiffness: 400, damping: 15 }}

// Audit log section fades in with slight delay
fadeInUp with delay: 0.2

// Export button success state
// Checkmark icon scales in replacing download icon
initial={{ scale: 0 }}
animate={{ scale: 1 }}
transition={{ type: "spring", stiffness: 400, damping: 20 }}
```
