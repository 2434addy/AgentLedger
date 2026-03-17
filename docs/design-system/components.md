# AgentLedger Component Specifications

Every reusable component in the AgentLedger design system. Each spec includes variants, props, states, dimensions, and Tailwind classes sufficient for implementation without ambiguity.

Reference `tokens.md` for all color, spacing, and animation values.

---

## GlassCard

A frosted-glass container used to hold content sections throughout the app.

### Variants

| Variant | Description |
|---|---|
| `default` | Standard content container |
| `elevated` | Higher prominence (modals, overlays, popovers) |
| `interactive` | Clickable/hoverable card (links, selectable items) |

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'elevated' \| 'interactive'` | `'default'` | Visual variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `className` | `string` | `''` | Additional classes |
| `children` | `ReactNode` | required | Card content |
| `onClick` | `() => void` | — | Click handler (interactive only) |

### Padding Map

| Size | Value | Tailwind |
|---|---|---|
| `none` | `0` | `p-0` |
| `sm` | `16px` | `p-4` |
| `md` | `24px` | `p-6` |
| `lg` | `32px` | `p-8` |

### Tailwind Classes

```
// default
bg-white/[0.06] backdrop-blur-lg border border-white/10 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]

// elevated
bg-white/[0.09] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.40)]

// interactive — default state
bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)] cursor-pointer
transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]

// interactive — hover
bg-white/[0.08] border-white/[0.18] shadow-[0_0_20px_rgba(124,58,237,0.15)]

// interactive — active/pressed
bg-white/[0.12] border-white/[0.18] scale-[0.99]
```

### Framer Motion

```js
// interactive variant only
whileHover={{ scale: 1.01, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
whileTap={{ scale: 0.99 }}
```

---

## GlassButton

Primary action button with liquid glass refraction effect.

### Variants

| Variant | BG | Border | Text | Glow on Hover |
|---|---|---|---|---|
| `primary` | `#7C3AED` | `rgba(124,58,237,0.5)` | `#F8FAFC` | `0 0 20px rgba(124,58,237,0.30)` |
| `secondary` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.10)` | `#F8FAFC` | `0 0 20px rgba(255,255,255,0.10)` |
| `ghost` | `transparent` | `transparent` | `#94A3B8` | none — text becomes `#F8FAFC` |
| `danger` | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.30)` | `#EF4444` | `0 0 20px rgba(239,68,68,0.30)` |

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `icon` | `ReactNode` | — | Optional leading icon (16px for sm, 18px for md, 20px for lg) |
| `iconRight` | `ReactNode` | — | Optional trailing icon |
| `loading` | `boolean` | `false` | Shows spinner, disables clicks |
| `disabled` | `boolean` | `false` | Disabled state |
| `fullWidth` | `boolean` | `false` | `w-full` |
| `children` | `ReactNode` | required | Button label |
| `onClick` | `() => void` | — | Click handler |

### Size Map

| Size | Height | Padding X | Font Size | Tailwind |
|---|---|---|---|---|
| `sm` | `32px` | `12px` | `12px` | `h-8 px-3 text-xs` |
| `md` | `40px` | `16px` | `14px` | `h-10 px-4 text-sm` |
| `lg` | `48px` | `24px` | `16px` | `h-12 px-6 text-base` |

### States

All variants share these state behaviors:

- **Default**: As specified in variants table
- **Hover**: Background lightens slightly, glow shadow appears, cursor pointer
- **Active/Pressed**: `scale(0.98)` via Framer Motion `whileTap`
- **Disabled**: `opacity-50 cursor-not-allowed pointer-events-none`
- **Loading**: Content replaced by 16px spinner (animated `border-2 border-white/30 border-t-white rounded-full animate-spin`), button is non-interactive

### Liquid Refraction Effect Spec (Primary variant)

The liquid glass effect uses an inline SVG `<feTurbulence>` + `<feDisplacementMap>` filter applied on hover to create a subtle optical distortion.

```html
<!-- SVG filter defined once in the app root or in a hidden SVG block -->
<svg width="0" height="0" style="position:absolute">
  <defs>
    <filter id="liquid-glass">
      <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="2" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>
```

- On **hover**, apply `filter: url(#liquid-glass)` with `transition: filter 250ms`
- The `scale="3"` value produces a subtle ripple. Increase to `5` for more pronounced refraction on the landing page hero CTA.
- Combined with a `background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(124,58,237,0.7))` and a semi-transparent white inner highlight: `box-shadow: inset 0 1px 1px rgba(255,255,255,0.15)`.

### Tailwind Classes (Primary)

```
// default
relative overflow-hidden rounded-lg h-10 px-4 text-sm font-medium
bg-violet-600 text-slate-50 border border-violet-600/50
shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
transition-all duration-150

// hover
bg-violet-700 shadow-[0_0_20px_rgba(124,58,237,0.30),inset_0_1px_1px_rgba(255,255,255,0.15)]

// Framer Motion
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

---

## GlassSidebar

Collapsible vertical navigation sidebar.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `collapsed` | `boolean` | `false` | Collapsed icon-only mode |
| `onToggle` | `() => void` | required | Toggle collapse |
| `navItems` | `NavItem[]` | required | Navigation entries |
| `activeItem` | `string` | required | Currently active route key |

### NavItem Shape

```ts
interface NavItem {
  key: string;         // Route key, e.g. "overview"
  label: string;       // Display label
  icon: ReactNode;     // 20px Lucide icon
  badge?: number;      // Optional count badge (e.g. anomaly count)
}
```

### Dimensions

| State | Width | Transition |
|---|---|---|
| Expanded | `256px` | `width 250ms ease-[cubic-bezier(0.65,0,0.35,1)]` |
| Collapsed | `72px` | same |

### Layout

- Fixed to left edge, full viewport height minus topbar (top: 64px)
- Background: `--color-bg-secondary` (`#12121A`)
- Right border: `1px solid rgba(255,255,255,0.06)`
- Padding: `12px` all sides
- Bottom of sidebar: collapse toggle button (chevron icon)

### Nav Item

```
// item container
flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400
transition-all duration-150

// hover
bg-white/[0.04] text-slate-200

// active
bg-violet-600/15 text-violet-400 border-l-2 border-violet-500
// Active also has a faint glow: box-shadow: inset 2px 0 8px rgba(124,58,237,0.15)
```

- When collapsed, labels are hidden (`opacity-0 w-0 overflow-hidden` with transition), only icons show, items are centered.
- Collapsed items show a tooltip on hover (see Tooltip in `tokens.md` z-index).
- Badge renders as a small pill (`min-w-5 h-5 rounded-full bg-red-500 text-[11px] text-white flex items-center justify-center`) positioned to the right of the label (expanded) or top-right of icon (collapsed).

### Framer Motion

```js
// Sidebar width change
animate={{ width: collapsed ? 72 : 256 }}
transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}

// Label fade
animate={{ opacity: collapsed ? 0 : 1 }}
transition={{ duration: 0.15 }}

// Active indicator uses layoutId for shared layout animation
<motion.div layoutId="sidebar-active" className="absolute inset-0 bg-violet-600/15 rounded-lg" />
```

---

## GlassInput

Text input with glass styling.

### Variants

| Variant | Description |
|---|---|
| `text` | Standard text input |
| `password` | Password with show/hide toggle icon button |
| `search` | Includes leading search icon (magnifying glass) |

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'text' \| 'password' \| 'search'` | `'text'` | Input variant |
| `label` | `string` | — | Label text above input |
| `placeholder` | `string` | — | Placeholder text |
| `value` | `string` | — | Controlled value |
| `onChange` | `(value: string) => void` | — | Change handler |
| `error` | `string` | — | Error message below input |
| `disabled` | `boolean` | `false` | Disabled state |
| `size` | `'sm' \| 'md'` | `'md'` | Input height |

### Size Map

| Size | Height | Font | Tailwind |
|---|---|---|---|
| `sm` | `36px` | `13px` | `h-9 text-[13px]` |
| `md` | `40px` | `14px` | `h-10 text-sm` |

### Tailwind Classes

```
// Label
text-xs font-medium text-slate-400 mb-1.5

// Input container
relative flex items-center

// Input field
w-full h-10 px-3 text-sm text-slate-50 placeholder:text-slate-600
bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-lg
shadow-[inset_0_1px_2px_rgba(0,0,0,0.30)]
outline-none transition-all duration-150

// Focus
border-violet-600/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.30),0_0_0_2px_rgba(124,58,237,0.15)]

// Error
border-red-500/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.30),0_0_0_2px_rgba(239,68,68,0.15)]

// Error message
text-xs text-red-400 mt-1

// Disabled
opacity-50 cursor-not-allowed

// Search icon (leading)
absolute left-3 text-slate-500 w-4 h-4
// With search icon, input gets pl-9

// Password toggle icon (trailing)
absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer w-4 h-4
```

---

## GlassSelect / GlassDropdown

Dropdown select input with glass-styled option list.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Label text |
| `options` | `{ value: string; label: string }[]` | required | Option list |
| `value` | `string` | — | Selected value |
| `onChange` | `(value: string) => void` | — | Change handler |
| `placeholder` | `string` | `'Select...'` | Placeholder when empty |
| `disabled` | `boolean` | `false` | Disabled state |
| `searchable` | `boolean` | `false` | Allow text filtering of options |

### Dimensions

- Trigger: Same styling as `GlassInput` (height 40px), with trailing chevron-down icon (16px, `text-slate-500`)
- Dropdown panel: max-height `240px`, overflow-y auto, width matches trigger width minimum

### Tailwind Classes

```
// Trigger — same as GlassInput plus:
flex items-center justify-between cursor-pointer

// Dropdown panel
absolute top-full mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto
bg-white/[0.09] backdrop-blur-xl border border-white/10 rounded-xl
shadow-[0_8px_40px_rgba(0,0,0,0.40)] z-60 py-1

// Option item
px-3 py-2 text-sm text-slate-300 cursor-pointer rounded-md mx-1
transition-colors duration-100

// Option hover
bg-white/[0.06] text-slate-50

// Option selected
bg-violet-600/15 text-violet-400
```

### Framer Motion

```js
// Dropdown open
initial={{ opacity: 0, y: -4, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -4, scale: 0.98 }}
transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
```

---

## StatusBadge

Small pill badge indicating agent or event status.

### Variants

| Variant | BG | Text | Dot Color |
|---|---|---|---|
| `active` | `rgba(16,185,129,0.15)` | `#10B981` | `#10B981` (pulsing) |
| `idle` | `rgba(100,116,139,0.15)` | `#94A3B8` | `#64748B` |
| `error` | `rgba(239,68,68,0.15)` | `#EF4444` | `#EF4444` |
| `warning` | `rgba(245,158,11,0.15)` | `#F59E0B` | `#F59E0B` |

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `'active' \| 'idle' \| 'error' \| 'warning'` | required | Status type |
| `label` | `string` | — | Override default label (defaults to status name capitalized) |
| `showDot` | `boolean` | `true` | Show leading color dot |

### Tailwind Classes

```
// Container
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium

// Dot
w-1.5 h-1.5 rounded-full

// Active dot pulse animation
animate-pulse (Tailwind built-in) — or custom:
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
animation: pulse-dot 2s ease-in-out infinite
```

Dimensions: height ~24px, width auto.

---

## DataTable

Sortable, filterable, paginated data table with glass styling.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `Column[]` | required | Column definitions |
| `data` | `any[]` | required | Row data array |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `filterable` | `boolean` | `false` | Show filter row |
| `paginated` | `boolean` | `true` | Enable pagination |
| `pageSize` | `number` | `20` | Rows per page |
| `onRowClick` | `(row: any) => void` | — | Row click handler |
| `expandable` | `boolean` | `false` | Rows expand on click to show detail |
| `loading` | `boolean` | `false` | Show skeleton loading state |
| `emptyMessage` | `string` | `'No data found'` | Empty state text |

### Column Shape

```ts
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;          // e.g. "120px", "20%"
  render?: (value: any, row: any) => ReactNode;  // Custom cell renderer
}
```

### Tailwind Classes

```
// Wrapper (placed inside a GlassCard with padding="none")
w-full overflow-x-auto

// Table
w-full border-collapse

// Header row
bg-white/[0.03]

// Header cell
px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider
border-b border-white/[0.06]
// Sortable header has cursor-pointer and hover:text-slate-200
// Active sort column: text-slate-200 with sort arrow icon (chevron-up/down, 12px)

// Body row
border-b border-white/[0.04] transition-colors duration-100

// Body row hover
bg-white/[0.03]

// Body row clickable
cursor-pointer

// Body cell
px-4 py-3 text-sm text-slate-300

// Expanded row content
px-4 py-4 bg-white/[0.02] border-b border-white/[0.06]
// Contains JSON viewer or detail layout

// Pagination bar
flex items-center justify-between px-4 py-3 border-t border-white/[0.06]
// Left: "Showing 1-20 of 150" (text-xs text-slate-500)
// Right: page buttons (GlassButton ghost variant, sm size)
```

### Loading State

Each cell shows a skeleton shimmer bar:
```
h-4 rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]
animate-shimmer
```

Custom keyframes:
```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.animate-shimmer { animation: shimmer 1.5s linear infinite; }
```

### Empty State

When `data` is empty and `loading` is false, table body is replaced by a centered `EmptyState` component.

---

## MetricCard

Displays a single KPI metric with icon, label, value, and trend.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `ReactNode` | required | 20px Lucide icon |
| `iconColor` | `string` | `'text-violet-400'` | Icon color class |
| `label` | `string` | required | Metric label (e.g. "Total Events") |
| `value` | `string \| number` | required | Metric value |
| `trend` | `{ value: number; direction: 'up' \| 'down' }` | — | Optional trend indicator |
| `loading` | `boolean` | `false` | Skeleton loading state |

### Dimensions

- Width: fills grid column (responsive grid, see page wireframes)
- Height: auto, approximately 120px with `p-6`
- Min-width: `200px`

### Layout

```
┌──────────────────────────────┐
│  [Icon]  Label          +12% │
│                               │
│  2,847                        │
│  ▔▔▔▔▔▔▔▔▔▔                 │
└──────────────────────────────┘
```

- Row 1: Icon (in a 36px rounded-lg container with icon's color at 15% opacity bg) + label (text-sm text-slate-400) + trend badge (right-aligned)
- Row 2: Value in `--text-metric` style (`text-4xl font-bold font-mono text-slate-50`), 8px below row 1

### Trend Badge

- Up + positive: `text-emerald-400` with arrow-up-right icon (12px)
- Down + negative: `text-red-400` with arrow-down-right icon (12px)
- Format: `+12.3%` or `-4.2%`
- Container: `text-xs font-medium`

### Tailwind Classes

Uses `GlassCard` variant `default` with padding `md`.

### Loading State

Label → skeleton bar `h-3 w-20 rounded`; Value → skeleton bar `h-8 w-32 rounded`; Trend → skeleton bar `h-3 w-12 rounded`.

### Framer Motion

```js
// Entrance
variants: fadeInUp (see tokens.md)
// Value counter animation: use framer-motion useSpring + useTransform to animate numeric values counting up
```

---

## Timeline

Vertical timeline for session replay events.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `events` | `TimelineEvent[]` | required | Ordered event list |
| `autoScroll` | `boolean` | `false` | Auto-scroll to latest event |
| `speed` | `number` | `1` | Playback speed multiplier |
| `playing` | `boolean` | `false` | Whether auto-play is active |

### TimelineEvent Shape

```ts
interface TimelineEvent {
  id: string;
  timestamp: string;       // ISO 8601
  category: EventCategory; // 'llm_call' | 'tool_invocation' | 'agent_lifecycle' | 'user_action' | 'system' | 'security' | 'guardrail'
  title: string;
  summary?: string;
  payload?: object;        // Full event data, shown when expanded
}
```

### Layout

```
  12:04:32.001  ●── [LLM Call] GPT-4 completion
                │   Tokens: 1,240 in / 380 out
                │
  12:04:33.540  ●── [Tool] search_documents invoked
                │   Args: { query: "revenue Q4" }
                │
  12:04:34.200  ●── [Agent] Reasoning step completed
                │
```

- Left column: timestamp in `font-mono text-xs text-slate-500`, width `100px`, right-aligned
- Center: vertical line `w-px bg-white/10` running full height
- Dot: `w-3 h-3 rounded-full` colored by event category, centered on the line, with a `ring-4 ring-{color}/10`
- Right column: `EventCard` (see below), flex-1

### Tailwind Classes

```
// Container
relative flex flex-col gap-0

// Timeline item row
flex items-start gap-4

// Timestamp
w-[100px] text-right font-mono text-xs text-slate-500 pt-1 shrink-0

// Line + dot container
relative flex flex-col items-center w-6 shrink-0

// Vertical line segment
w-px flex-1 bg-white/10

// Dot
w-3 h-3 rounded-full ring-4
// ring color is event category color at 10% opacity

// Event content
flex-1 pb-6
```

### Framer Motion

```js
// Each timeline item enters with stagger
variants: {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
}
// Parent uses staggerChildren: 0.06
```

---

## EventCard

Color-coded card representing a single event in timelines and event lists.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `category` | `EventCategory` | required | Event type for color coding |
| `title` | `string` | required | Event title |
| `timestamp` | `string` | — | Formatted timestamp |
| `summary` | `string` | — | One-line summary |
| `payload` | `object` | — | Full JSON payload |
| `expandable` | `boolean` | `true` | Can expand to show payload |
| `expanded` | `boolean` | `false` | Controlled expanded state |

### Category Color Map

| Category | Dot/Badge Color | Border Left | BG Tint |
|---|---|---|---|
| `llm_call` | `violet-500` | `border-l-violet-500` | `bg-violet-500/5` |
| `tool_invocation` | `cyan-500` | `border-l-cyan-500` | `bg-cyan-500/5` |
| `agent_lifecycle` | `emerald-500` | `border-l-emerald-500` | `bg-emerald-500/5` |
| `user_action` | `amber-500` | `border-l-amber-500` | `bg-amber-500/5` |
| `system` | `slate-500` | `border-l-slate-500` | `bg-slate-500/5` |
| `security` | `red-500` | `border-l-red-500` | `bg-red-500/5` |
| `guardrail` | `orange-500` | `border-l-orange-500` | `bg-orange-500/5` |

### Tailwind Classes

```
// Container
border-l-2 rounded-r-lg px-4 py-3 bg-{category}/5
transition-all duration-150

// Title row
flex items-center gap-2

// Category badge (pill)
inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider
bg-{category}/15 text-{category}

// Title text
text-sm font-medium text-slate-200

// Summary
text-xs text-slate-400 mt-1

// Expanded payload
mt-3 p-3 rounded-lg bg-black/30 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 overflow-y-auto
// JSON is syntax-highlighted: keys in cyan-400, strings in emerald-400, numbers in amber-400, booleans in violet-400
```

### Framer Motion

```js
// Expand/collapse
<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    />
  )}
</AnimatePresence>
```

---

## TopBar

Horizontal top navigation bar.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `orgName` | `string` | required | Organization display name |
| `apiKey` | `string` | required | API key (will be masked) |
| `user` | `{ name: string; email: string; avatarUrl?: string }` | required | Current user |

### Dimensions

- Height: `64px` (`h-16`)
- Full width, fixed at top
- z-index: `--z-topbar` (50)

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  AgentLedger · {OrgName}              API Key: sk-••••••••ab3f [copy]  [A]│
└────────────────────────────────────────────────────────────────────────────┘
```

- **Left**: Logo mark (simple "AL" text in `font-bold text-violet-400`) + dot separator + org name (`text-sm text-slate-300`)
- **Center-right**: API key display: label `text-xs text-slate-500 "API Key"`, masked value in `font-mono text-xs text-slate-400` showing first 3 and last 4 chars (e.g. `sk-••••••••ab3f`), copy button (clipboard icon, GlassButton ghost sm)
- **Right**: User avatar (32px circle, initials fallback with `bg-violet-600 text-white text-xs font-semibold`), clicking opens dropdown with: Profile, Settings, Sign Out

### Tailwind Classes

```
// Bar
fixed top-0 left-0 right-0 h-16 z-50
flex items-center justify-between px-6
bg-[#0A0A0F]/80 backdrop-blur-sm border-b border-white/[0.06]

// Left section
flex items-center gap-2

// API key section
flex items-center gap-2

// Copy button — on click shows brief "Copied!" toast or inline checkmark for 1.5s
```

### User Dropdown

Uses `GlassSelect`-style dropdown panel, positioned top-right:

```
// Items
[
  { icon: UserIcon, label: "Profile" },
  { icon: SettingsIcon, label: "Settings" },
  { divider: true },
  { icon: LogOutIcon, label: "Sign Out", danger: true }
]
```

---

## Modal

Glass overlay modal dialog.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `false` | Visibility |
| `onClose` | `() => void` | required | Close handler |
| `title` | `string` | — | Modal title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Modal width |
| `children` | `ReactNode` | required | Modal body |
| `footer` | `ReactNode` | — | Footer actions area |

### Size Map

| Size | Max Width | Tailwind |
|---|---|---|
| `sm` | `400px` | `max-w-[400px]` |
| `md` | `560px` | `max-w-[560px]` |
| `lg` | `720px` | `max-w-[720px]` |

### Tailwind Classes

```
// Backdrop
fixed inset-0 z-70 bg-black/60 backdrop-blur-xl flex items-center justify-center

// Modal panel (GlassCard elevated)
relative w-full mx-4 bg-white/[0.09] backdrop-blur-xl border border-white/10 rounded-2xl
shadow-[0_8px_40px_rgba(0,0,0,0.40)] overflow-hidden

// Header
flex items-center justify-between px-6 py-4 border-b border-white/[0.06]
// Title: text-lg font-semibold text-slate-50
// Close button: ghost icon button, X icon (20px)

// Body
px-6 py-4 max-h-[60vh] overflow-y-auto

// Footer
flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]
```

### Framer Motion

```js
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2 }}

// Panel
initial={{ opacity: 0, scale: 0.95, y: 10 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 10 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
```

Click on backdrop closes modal. Escape key closes modal.

---

## Toast

Notification toast message.

### Variants

| Variant | Icon | Border Left | Icon Color |
|---|---|---|---|
| `success` | CheckCircle | `border-l-emerald-500` | `text-emerald-400` |
| `error` | XCircle | `border-l-red-500` | `text-red-400` |
| `warning` | AlertTriangle | `border-l-amber-500` | `text-amber-400` |
| `info` | Info | `border-l-blue-500` | `text-blue-400` |

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Toast type |
| `title` | `string` | required | Toast title |
| `message` | `string` | — | Optional description |
| `duration` | `number` | `4000` | Auto-dismiss time in ms (0 = persistent) |
| `onClose` | `() => void` | — | Close handler |

### Position

Toasts stack in the **top-right** corner, 16px from top and right edges. Multiple toasts stack vertically with 8px gap.

### Tailwind Classes

```
// Container
fixed top-4 right-4 z-90 flex flex-col gap-2 pointer-events-none

// Toast
pointer-events-auto w-[380px] border-l-4 rounded-r-lg px-4 py-3
bg-white/[0.09] backdrop-blur-xl border border-white/10
shadow-[0_8px_40px_rgba(0,0,0,0.40)]
flex items-start gap-3

// Icon
w-5 h-5 shrink-0 mt-0.5

// Content
flex-1
// Title: text-sm font-medium text-slate-100
// Message: text-xs text-slate-400 mt-0.5

// Close button (right side)
text-slate-500 hover:text-slate-300 cursor-pointer w-4 h-4 shrink-0 mt-0.5
```

### Framer Motion

```js
// Enter
initial={{ opacity: 0, x: 40, scale: 0.95 }}
animate={{ opacity: 1, x: 0, scale: 1 }}
exit={{ opacity: 0, x: 40, scale: 0.95 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}

// Auto-dismiss uses a progress bar at bottom:
// h-0.5 bg-{variant-color}/30, width animates from 100% to 0% over duration
```

---

## EmptyState

Placeholder shown when a data view has no content.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `ReactNode` | required | Large illustration icon (48px) |
| `title` | `string` | required | Main message |
| `description` | `string` | — | Supporting text |
| `action` | `{ label: string; onClick: () => void }` | — | Optional CTA button |

### Tailwind Classes

```
// Container
flex flex-col items-center justify-center py-16 text-center

// Icon container
w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4
// Icon: w-8 h-8 text-slate-500

// Title
text-base font-medium text-slate-300 mb-1

// Description
text-sm text-slate-500 max-w-sm

// Action button (GlassButton primary sm, mt-4)
```

### Framer Motion

Uses `fadeInUp` preset from tokens.

---

## LoadingState

Skeleton shimmer placeholder matching glass styling.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'card' \| 'table' \| 'metric' \| 'timeline'` | `'card'` | Which skeleton layout to render |
| `count` | `number` | `1` | Number of skeleton items |

### Shimmer Effect

```css
.skeleton-bar {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 6px;
}
```

### Variant Layouts

- **card**: GlassCard shell with 3 skeleton bars (h-4 w-40%, h-3 w-70%, h-3 w-55%) stacked with 12px gap
- **table**: Table header skeleton + 5 rows of 4 skeleton cells each
- **metric**: MetricCard shell with icon circle skeleton (36px), label bar (h-3 w-24), value bar (h-8 w-32)
- **timeline**: 5 timeline items, each with timestamp bar, dot, and two text bars

---

## ChartContainer

Wrapper component for chart visualizations (line charts, bar charts).

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | required | Chart heading |
| `subtitle` | `string` | — | Optional description |
| `height` | `number` | `300` | Chart area height in px |
| `controls` | `ReactNode` | — | Optional top-right controls (date range, toggles) |
| `loading` | `boolean` | `false` | Show skeleton state |
| `empty` | `boolean` | `false` | Show empty state |
| `children` | `ReactNode` | required | Chart component (Recharts, etc.) |

### Layout

```
┌─────────────────────────────────────────┐
│  Chart Title              [controls]    │
│  Subtitle text                          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │         Chart Area                │  │
│  │         (children)                │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Uses `GlassCard` default with `padding="md"`.

### Tailwind Classes

```
// Header row
flex items-start justify-between mb-4

// Title
text-base font-semibold text-slate-100

// Subtitle
text-xs text-slate-500 mt-0.5

// Chart area
w-full overflow-hidden
// height set via style prop

// Chart axes text: font-mono text-[11px] text-slate-500
// Chart grid lines: stroke rgba(255,255,255,0.04)
// Chart tooltip: bg-white/[0.09] backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-lg
```

### Loading State

Chart area replaced by a skeleton rectangle matching `height`, with shimmer animation.

### Framer Motion

```js
// Chart container entrance
variants: fadeInUp
// Chart lines/bars animate drawing via SVG pathLength or Recharts animationDuration={600}
```
