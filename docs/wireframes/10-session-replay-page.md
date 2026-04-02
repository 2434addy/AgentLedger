# 10 - Session Replay Page

Route: `/dashboard/session-replay` (with optional `?session={sessionId}` query param)
Sidebar active item: `session-replay`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Session Replay                                                  │
│  Step through agent sessions event by event                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Session: [Dropdown / Search selector]                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────┐ ┌────────────────────────┐  │
│  │  Replay Timeline               │ │  Session Metadata      │  │
│  │                                │ │                        │  │
│  │  12:04:32 ● LLM Call          │ │  Agent: bot-1          │  │
│  │           │  GPT-4 completion  │ │  Model: gpt-4o         │  │
│  │           │                    │ │  Duration: 2m 34s      │  │
│  │  12:04:33 ● Tool Invocation   │ │  Total Tokens: 12,480  │  │
│  │           │  search_docs      │ │  Total Cost: $0.42     │  │
│  │           │                    │ │  Events: 42            │  │
│  │  12:04:34 ● Agent Lifecycle   │ │  Status: Completed     │  │
│  │           │  Reasoning step   │ │                        │  │
│  │           │                    │ │                        │  │
│  │  12:04:35 ● LLM Call          │ │                        │  │
│  │           │  Final response   │ │                        │  │
│  │           │                    │ │                        │  │
│  │  (scrollable)                  │ │                        │  │
│  │                                │ │                        │  │
│  ├────────────────────────────────┤ │                        │  │
│  │  [▶ Play] [1x ▾] ═══○═══════ │ │                        │  │
│  └────────────────────────────────┘ └────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Session Replay" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Step through agent sessions event by event" — `text-sm text-slate-400 mt-1`
- `mb-6`

---

## Session Selector

Component: `GlassCard default` with `padding="sm"`, full width, `mb-6`.

### Layout

`flex items-center gap-4 px-4`

- Label: "Session" — `text-sm text-slate-400 shrink-0`
- Selector: `GlassSelect searchable` — full remaining width (`flex-1`)
  - Options: Sorted by start time (newest first), each showing:
    - `{sessionId (8 chars)} — {agentName} — {startTime} ({eventCount} events)`
  - Searchable by session ID or agent name
  - Width: fills available space
- If URL has `?session=` param, auto-select that session on load

---

## Main Content

Shown only when a session is selected. Layout: `grid grid-cols-1 lg:grid-cols-3 gap-6`.

- Replay Timeline: `lg:col-span-2`
- Session Metadata: `lg:col-span-1`

---

## Replay Timeline

Component: `GlassCard default` with `padding="none"`, contains the Timeline component + playback controls.

### Timeline Header

`px-6 pt-6 pb-3`:
- Title: "Event Timeline" — `text-base font-semibold text-slate-100`
- Right: Event count — `text-xs text-slate-500` — "{N} events"

### Timeline Content

Component: `Timeline` (see components.md)

Container: `px-6 overflow-y-auto` with `max-h-[calc(100vh-340px)]` (fills remaining viewport minus header/controls). Scroll behavior: smooth.

Each event in the timeline renders as:

```
  12:04:32.001  ●── [LLM_CALL] GPT-4 completion
                │   Tokens: 1,240 in / 380 out · $0.024
                │   ─────────────
                │   { expandable payload }
                │
  12:04:33.540  ●── [TOOL] search_documents invoked
                │   Args: { query: "revenue Q4" }
                │
```

- **Timestamp**: `font-mono text-xs text-slate-500`, width `100px`, right-aligned
- **Dot**: Colored by event category (see EventCard color map)
- **Event content**: `EventCard` component
  - Shows category badge, title, and one-line summary by default
  - Clickable to expand and show full JSON payload
  - When expanded, JSON viewer appears below (see EventCard spec)

### Active Event Highlight

During playback or when manually clicking an event:
- The active event card gets a brighter border: `ring-1 ring-{category-color}/30`
- Background brightens: `bg-{category-color}/10`
- The timeline auto-scrolls to keep the active event centered

### Playback Controls

Fixed at the bottom of the timeline card, `border-t border-white/[0.06]`.

```
┌──────────────────────────────────────────────────────────────┐
│  [▶/⏸]  [1x ▾]     ═══════════●══════════════     42/42    │
└──────────────────────────────────────────────────────────────┘
```

Layout: `flex items-center gap-4 px-6 py-3`

#### Play/Pause Button
- `GlassButton ghost sm` with `Play` or `Pause` icon (18px)
- Toggles auto-playback
- During playback: events highlight one by one at the selected speed, timeline auto-scrolls

#### Speed Selector
- `GlassSelect` with options: "1x", "2x", "5x"
- Width: `w-16`
- Controls playback speed

#### Progress Bar
- `flex-1 relative h-1.5 rounded-full bg-white/[0.06] cursor-pointer`
- Filled portion: `h-1.5 rounded-full bg-violet-500`
- Thumb (handle): `w-3 h-3 rounded-full bg-white shadow-md`, positioned at current progress
- Draggable: user can click/drag to seek to any event
- Shows current event index / total events

#### Event Counter
- `font-mono text-xs text-slate-500 shrink-0` — "{current}/{total}"

### Playback Behavior

1. When play is pressed, events highlight one at a time
2. The interval between highlights corresponds to the actual time gap between events, scaled by speed multiplier
3. If time gap > 5s (real time), cap display delay at 2s (at 1x speed) to avoid long waits
4. At 1x speed: real-time-like playback
5. At 2x: half the delays
6. At 5x: one-fifth the delays
7. When reaching the last event, playback stops automatically, play button resets

---

## Session Metadata Panel

Component: `GlassCard default` with `padding="md"`, `lg:col-span-1`.

### Header
Title: "Session Info" — `text-base font-semibold text-slate-100 mb-4`

### Metadata Fields

Vertical list of key-value pairs, `gap-3`:

```
┌──────────────────────────────┐
│  Session Info                │
│                              │
│  Agent                       │
│  summarizer-v2               │
│                              │
│  Model                       │
│  gpt-4o                      │
│                              │
│  Session ID                  │
│  a1b2c3d4-e5f6-... [copy]   │
│                              │
│  Status                      │
│  ● Completed                 │
│                              │
│  Start Time                  │
│  Mar 17, 2026 14:32:01      │
│                              │
│  Duration                    │
│  2m 34s                      │
│                              │
│  Total Events                │
│  42                          │
│                              │
│  Total Tokens                │
│  12,480                      │
│                              │
│  Tokens In                   │
│  9,240                       │
│                              │
│  Tokens Out                  │
│  3,240                       │
│                              │
│  Total Cost                  │
│  $0.42                       │
│                              │
│  ──────────────────          │
│  [View Agent] [View Events]  │
└──────────────────────────────┘
```

Each field:
- Label: `text-xs text-slate-500 mb-0.5`
- Value: `text-sm text-slate-200` (or `font-mono text-sm` for IDs, numbers, costs)

Special fields:
- **Session ID**: Truncated with copy button (clipboard icon, 14px), copies full ID
- **Status**: Uses `StatusBadge` component
- **Total Cost**: `font-mono text-sm font-medium text-emerald-400`

### Action Links

Divider: `border-t border-white/[0.06] mt-4 pt-4`

- "View Agent" — `GlassButton ghost sm`, navigates to agent detail page
- "View Events" — `GlassButton ghost sm`, navigates to events page filtered to this session

---

## State When No Session Selected

When no session is selected (no `?session=` param and nothing chosen in the dropdown):

Replace the main content area (below the session selector) with `EmptyState`:
- Icon: `Play` (48px, violet-400)
- Title: "Select a session to replay"
- Description: "Choose a session from the dropdown above to step through its events."

---

## Loading State

### Session List Loading
Session selector dropdown shows a loading indicator inside (spinner).

### Session Data Loading
After selecting a session, while events load:
- Timeline area: `LoadingState variant="timeline"`
- Metadata panel: Skeleton bars for each field (label + value pairs)

---

## Empty Session (0 events)

If a session has no events:
Timeline area shows `EmptyState`:
- Icon: `ScrollText` (48px, slate-400)
- Title: "No events in this session"
- Description: "This session was recorded but contains no events."

---

## Error State

API failure: `Toast error` + session content area replaced with retry `EmptyState`.

---

## Responsive Behavior

| Breakpoint | Layout |
|---|---|
| `< 1024px` | Single column: metadata panel moves above timeline. Metadata shows as a collapsible horizontal summary bar (agent, duration, cost — click to expand full details). Timeline takes full width. |
| `1024px+` | 2/3 + 1/3 grid as described |

### Mobile Playback Controls

On `< 768px`:
- Speed selector uses smaller `w-14` dropdown
- Progress bar still takes remaining space
- Event counter may hide (show only on hover/tap of progress bar)

---

## Framer Motion

```js
// Session selector card entrance
fadeInUp

// Timeline section entrance (after session selected)
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}

// Timeline events stagger in (initial load)
staggerContainer with staggerChildren: 0.04

// Active event highlight transition
animate={{ backgroundColor: activeBg, boxShadow: activeRing }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}

// During playback, each event highlight has a "pulse" entrance:
animate={{ scale: [0.98, 1], opacity: [0.8, 1] }}
transition={{ duration: 0.15 }}

// Progress bar thumb: spring animation when seeking
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Metadata panel: fadeInUp with 0.1s delay after timeline
```
