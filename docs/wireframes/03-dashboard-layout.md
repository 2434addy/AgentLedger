# 03 - Dashboard Layout

The shell layout wrapping all authenticated pages. Contains the sidebar, topbar, and main content area.

---

## Page Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│  [TopBar — full width, fixed top, h-16, z-50]                         │
├──────────┬─────────────────────────────────────────────────────────────┤
│          │                                                             │
│          │                                                             │
│ Sidebar  │              Main Content Area                              │
│ 256px /  │              (page-specific content)                        │
│ 72px     │                                                             │
│ fixed    │              max-w-[1440px] mx-auto                         │
│ left     │              px-6 py-6                                      │
│          │                                                             │
│          │                                                             │
│          │                                                             │
│          │                                                             │
└──────────┴─────────────────────────────────────────────────────────────┘
```

---

## TopBar

Component: `TopBar` (see components.md)

### Layout Detail

```
┌────────────────────────────────────────────────────────────────────────┐
│  AL · Acme Corp                       API Key: sk-••••ab3f [📋]  [AJ]│
└────────────────────────────────────────────────────────────────────────┘
```

- **Position**: `fixed top-0 left-0 right-0 h-16 z-50`
- **Background**: `bg-[#0A0A0F]/80 backdrop-blur-sm border-b border-white/[0.06]`
- **Padding**: `px-6`
- **Left section** (`flex items-center gap-2`):
  - "AL" logo mark: `text-base font-bold text-violet-400`
  - Dot separator: `w-1 h-1 rounded-full bg-slate-600`
  - Org name: `text-sm text-slate-300 font-medium`
- **Center-right section** (`flex items-center gap-2`):
  - Label: `text-xs text-slate-500` — "API Key"
  - Masked key: `font-mono text-xs text-slate-400` — shows `sk-` + first 4 visible + `••••` + last 4 (e.g., `sk-test••••ab3f`)
  - Copy button: `GlassButton ghost sm` with clipboard icon (16px). On click: copies full key to clipboard, icon briefly changes to checkmark for 1.5s, and/or shows inline "Copied!" text
- **Right section** (`flex items-center gap-3`):
  - User avatar: `w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-semibold text-white` showing user initials
  - Click avatar opens dropdown (see TopBar component spec)

---

## Sidebar

Component: `GlassSidebar` (see components.md)

### Position and Dimensions
- `fixed left-0 top-16 bottom-0` (below topbar)
- Width: `256px` expanded, `72px` collapsed
- Background: `bg-[#12121A]`
- Right border: `border-r border-white/[0.06]`
- Padding: `p-3`
- `z-40`

### Navigation Items

| Key | Label | Icon (Lucide) | Badge |
|---|---|---|---|
| `overview` | Overview | `LayoutDashboard` | — |
| `agents` | Agents | `Bot` | — |
| `sessions` | Sessions | `ScrollText` | — |
| `events` | Events | `Zap` | — |
| `cost-analytics` | Cost Analytics | `DollarSign` | — |
| `anomaly-detection` | Anomaly Detection | `AlertTriangle` | Active anomaly count (if > 0) |
| `session-replay` | Session Replay | `Play` | — |
| `compliance` | Compliance | `Shield` | — |
| `settings` | Settings | `Settings` | — |

### Active State

The currently active nav item has:
- Background: `bg-violet-600/15`
- Text: `text-violet-400` (instead of default `text-slate-400`)
- Left accent: `border-l-2 border-violet-500`
- Shared layout animation via Framer Motion `layoutId="sidebar-active"` for smooth sliding between items

### Collapse Toggle

At the bottom of the sidebar:
- Expanded: Left-pointing chevron icon + text "Collapse" — `text-xs text-slate-500`
- Collapsed: Right-pointing chevron icon only, centered
- `GlassButton ghost sm`
- Clicking toggles `collapsed` state, which is persisted in localStorage

### Sidebar Framer Motion

```js
// Width transition
<motion.aside
  animate={{ width: collapsed ? 72 : 256 }}
  transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
>

// Labels fade
<motion.span
  animate={{ opacity: collapsed ? 0 : 1 }}
  transition={{ duration: 0.15 }}
>

// Active indicator slides between items
<motion.div
  layoutId="sidebar-active-bg"
  className="absolute inset-0 bg-violet-600/15 rounded-lg"
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

---

## Main Content Area

### Position and Dimensions
- Offset from sidebar and topbar:
  ```
  margin-left: 256px (or 72px when collapsed)
  margin-top: 64px (topbar height)
  transition: margin-left 250ms ease-[cubic-bezier(0.65,0,0.35,1)]
  ```
- Inner padding: `px-6 py-6`
- Max width: `max-w-[1440px]`
- Centered: `mx-auto`
- Min-height: `calc(100vh - 64px)`
- Background: `--color-bg-primary` (`#0A0A0F`)

### Page Title Area (consistent across all pages)

Each page starts with:
```
┌──────────────────────────────────────────────────────────────────┐
│  Page Title                                        [Action Btn] │
│  Optional subtitle text                                         │
└──────────────────────────────────────────────────────────────────┘
```

- Title: `--text-h1` (30px, font-semibold, text-slate-50)
- Subtitle: `text-sm text-slate-400 mt-1`
- Action button(s): right-aligned, using `GlassButton`
- Bottom margin: `mb-6`

### Content Loading Transition

When navigating between pages, content area animates:
```js
// Exiting page
exit={{ opacity: 0, y: 8 }}
transition={{ duration: 0.15 }}

// Entering page
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
```

---

## Responsive Behavior

### Desktop (1024px+)
- Sidebar visible, toggleable between expanded/collapsed
- TopBar shows all sections

### Tablet (768px - 1023px)
- Sidebar auto-collapses to 72px icon mode
- Main content uses full remaining width

### Mobile (< 768px)
- Sidebar hidden by default
- Hamburger menu icon appears in TopBar left section (before logo)
- Tapping hamburger opens sidebar as an overlay:
  - Sidebar slides in from left with backdrop `bg-black/40 backdrop-blur-sm`
  - Sidebar is expanded (256px) as overlay, z-60
  - Tapping backdrop or any nav item closes sidebar
- TopBar: API key section hidden, only logo + hamburger + avatar visible
- Main content: `px-4 py-4` (reduced padding)

### Framer Motion for Mobile Sidebar

```js
// Backdrop
<AnimatePresence>
  {mobileOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      onClick={closeSidebar}
    />
  )}
</AnimatePresence>

// Sidebar panel
<motion.aside
  initial={{ x: -256 }}
  animate={{ x: 0 }}
  exit={{ x: -256 }}
  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  className="fixed left-0 top-0 bottom-0 w-64 z-60"
/>
```

---

## Error Boundary

If a page component throws an error, the main content area shows:
- `EmptyState` component with:
  - Icon: `AlertTriangle` (48px, `text-red-400`)
  - Title: "Something went wrong"
  - Description: "An unexpected error occurred. Please try refreshing the page."
  - Action: `{ label: "Refresh Page", onClick: () => window.location.reload() }`

---

## Sidebar Collapsed State Persistence

The collapsed/expanded preference is stored in `localStorage` under key `agentledger:sidebar-collapsed` (boolean). On initial load, read this value. Default: `false` (expanded).
