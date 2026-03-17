# 01 - Landing Page

Public marketing page. No authentication required.

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Sticky Nav Bar]                                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        [Hero Section]                                │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                      [Features Section]                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                      [Pricing Section]                               │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                          [Footer]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Background: `--color-bg-primary` (`#0A0A0F`) with two decorative gradient orbs:
- **Violet orb**: positioned top-right, 600px diameter, `rgba(124,58,237,0.15)` radial gradient, blurred 80px
- **Cyan orb**: positioned bottom-left, 500px diameter, `rgba(6,182,212,0.10)` radial gradient, blurred 80px

Both orbs use `pointer-events: none; position: absolute;` and slowly drift using Framer Motion:
```js
animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
```

---

## Sticky Navigation Bar

Fixed at top, `h-16`, full width, `z-50`.

```
┌──────────────────────────────────────────────────────────────────────┐
│  AgentLedger                    Features  Pricing     [Login] [CTA] │
└──────────────────────────────────────────────────────────────────────┘
```

### Layout
- **Left**: Logo text "AgentLedger" — `text-lg font-bold text-slate-50`, "Agent" in white, "Ledger" in `text-violet-400`
- **Right**: Navigation links "Features", "Pricing" — `text-sm text-slate-400 hover:text-slate-100 transition-colors duration-150`, gap `--space-8` (32px)
- **Right actions**: "Login" as `GlassButton ghost sm`, "Start Free" as `GlassButton primary sm`

### Styling
```
bg-[#0A0A0F]/80 backdrop-blur-sm border-b border-white/[0.06]
px-6 max-w-[1200px] mx-auto
flex items-center justify-between
```

### Responsive
- `lg+`: Full layout as described
- `md-`: Hamburger menu icon (right), clicking opens a glass panel sliding from right with nav links stacked vertically

---

## Hero Section

Centered, max-width `800px`, padding `96px` top, `80px` bottom.

### Layout
```
                 [Overline badge]
          The Black Box Recorder
              for AI Agents

   Complete observability for autonomous AI systems.
   Record every decision. Replay any session. Control costs.

           [Start Free]   [View Demo]
```

### Elements

1. **Overline badge**: Pill shape, `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/15 border border-violet-600/30 text-violet-300 text-xs font-medium`. Text: "AI Agent Observability Platform". Subtle shimmer border animation.

2. **Headline**: "The Black Box Recorder for AI Agents"
   - `--text-display` (48px, font-bold, text-slate-50)
   - `text-center max-w-[700px]`
   - "AI Agents" highlighted in `text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400`

3. **Subheadline**: "Complete observability for autonomous AI systems. Record every decision. Replay any session. Control costs."
   - `--text-body-lg` (16px), `text-slate-400`, `text-center max-w-[560px] mt-6`

4. **CTA buttons**: Row, centered, `gap-4 mt-10`
   - "Start Free" — `GlassButton primary lg` with liquid refraction (scale="5" for more pronounced effect)
   - "View Demo" — `GlassButton secondary lg`

### Framer Motion

```js
// Staggered entrance — container uses staggerChildren: 0.12
// Overline: fadeInUp, delay 0
// Headline: fadeInUp, delay 0.12
// Subheadline: fadeInUp, delay 0.24
// CTA buttons: fadeInUp, delay 0.36
// Total entrance duration: ~1s
```

---

## Features Section

Padding: `96px` top and bottom. Max-width `1200px`, centered.

### Section Header
- Overline: `text-[11px] font-semibold uppercase tracking-wider text-violet-400 text-center` — "FEATURES"
- Title: `text-3xl font-semibold text-slate-50 text-center mt-3` — "Everything you need to understand your AI agents"
- Subtitle: `text-base text-slate-400 text-center mt-3 max-w-[520px] mx-auto` — "From real-time event capture to session replay and cost analytics."

### Feature Cards Grid

6 cards in a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12`.

Each card is a `GlassCard interactive` with `padding="lg"` and `rounded-2xl`.

Card layout:
```
┌──────────────────────────┐
│  [Icon in colored circle] │
│                           │
│  Feature Title            │
│  Description text that    │
│  wraps to two lines max.  │
└──────────────────────────┘
```

- **Icon container**: `w-12 h-12 rounded-xl flex items-center justify-center mb-4` with category-tinted background
- **Title**: `text-lg font-semibold text-slate-100 mb-2`
- **Description**: `text-sm text-slate-400 leading-relaxed`

### The 6 Feature Cards

| # | Title | Icon | Icon BG | Description |
|---|---|---|---|---|
| 1 | Session Replay | Play | `bg-violet-500/15` | Step through every event in an agent session. See LLM calls, tool invocations, and decisions in chronological order. |
| 2 | Cost Analytics | DollarSign | `bg-cyan-500/15` | Track token usage and costs per model, agent, and session. Set budgets and get alerts before costs spiral. |
| 3 | Anomaly Detection | AlertTriangle | `bg-amber-500/15` | Automatic detection of latency spikes, error bursts, cost anomalies, and infinite loops across all agents. |
| 4 | Multi-Agent Map | Network | `bg-emerald-500/15` | Visualize agent-to-agent communication, delegation chains, and coordinator patterns in real time. |
| 5 | Compliance Engine | Shield | `bg-red-500/15` | Built-in safety checks, audit logging, and exportable compliance reports for regulated industries. |
| 6 | Real-time Events | Zap | `bg-orange-500/15` | Stream events as they happen. Filter by category, agent, or session. Full JSON payloads always available. |

### Framer Motion

```js
// Cards enter with staggerChildren: 0.08 on the grid container
// Each card uses fadeInUp
// Cards have whileHover={{ y: -4 }} with spring transition
```

---

## Pricing Section

Padding: `96px` top and bottom. Max-width `1000px`, centered.

### Section Header
- Overline: `text-[11px] font-semibold uppercase tracking-wider text-violet-400 text-center` — "PRICING"
- Title: `text-3xl font-semibold text-slate-50 text-center mt-3` — "Simple, transparent pricing"
- Subtitle: `text-base text-slate-400 text-center mt-3` — "Start free. Scale as you grow."

### Pricing Cards

3 cards in a `grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 items-start`.

Card layout:
```
┌────────────────────────┐
│  Plan Name              │
│  $XX/mo                 │
│  Short description      │
│                         │
│  ─────────────────────  │
│  ✓ Feature 1            │
│  ✓ Feature 2            │
│  ✓ Feature 3            │
│  ✓ Feature 4            │
│                         │
│  [CTA Button]           │
└────────────────────────┘
```

#### Free Plan
- `GlassCard default`, `padding="lg"`
- Plan name: "Free" — `text-lg font-semibold text-slate-100`
- Price: "$0" — `text-4xl font-bold font-mono text-slate-50` + "/month" `text-sm text-slate-500`
- Description: "For testing and small projects" — `text-sm text-slate-400 mt-2`
- Divider: `border-t border-white/[0.06] my-6`
- Features (check icon `text-slate-500 w-4 h-4` + `text-sm text-slate-400`):
  - 1,000 events per month
  - 1 agent
  - 7-day data retention
  - Community support
- CTA: `GlassButton secondary md fullWidth` — "Get Started"

#### Pro Plan (highlighted)
- `GlassCard default` with added `ring-1 ring-violet-500/30` and a `shadow-[0_0_30px_rgba(124,58,237,0.15)]`
- "Most Popular" badge: absolute positioned top-right, `px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold -mt-3 -mr-1`
- Plan name: "Pro" — `text-lg font-semibold text-violet-400`
- Price: "$29" — `text-4xl font-bold font-mono text-slate-50` + "/month" `text-sm text-slate-500`
- Description: "For teams running production agents" — `text-sm text-slate-400 mt-2`
- Features (check icon `text-violet-400 w-4 h-4` + `text-sm text-slate-300`):
  - 100,000 events per month
  - Unlimited agents
  - Session replay
  - Cost analytics
  - Anomaly detection
  - 90-day data retention
  - Email support
- CTA: `GlassButton primary md fullWidth` — "Start Free Trial"

#### Enterprise Plan
- `GlassCard default`, `padding="lg"`
- Plan name: "Enterprise" — `text-lg font-semibold text-slate-100`
- Price: "Custom" — `text-4xl font-bold font-mono text-slate-50`
- Description: "For organizations with advanced needs" — `text-sm text-slate-400 mt-2`
- Features (check icon `text-slate-500 w-4 h-4` + `text-sm text-slate-400`):
  - Unlimited events
  - Unlimited agents
  - All Pro features
  - Compliance engine
  - SSO / SAML
  - Dedicated support
  - Custom data retention
  - SLA guarantee
- CTA: `GlassButton secondary md fullWidth` — "Contact Sales"

### Framer Motion

```js
// Cards stagger in: staggerChildren: 0.1
// Each card: fadeInUp
// Pro card has a subtle float:
animate={{ y: [0, -4, 0] }}
transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
```

---

## Footer

Padding: `48px` top, `32px` bottom. Max-width `1200px`, centered. Top border: `border-t border-white/[0.06]`.

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  AgentLedger          Product      Company       Legal              │
│  Observability for    Features     About         Privacy Policy     │
│  AI agents.           Pricing      Blog          Terms of Service   │
│                       Docs         Careers       Security           │
│                       Changelog    Contact                          │
├──────────────────────────────────────────────────────────────────────┤
│  (c) 2026 AgentLedger. All rights reserved.                         │
└──────────────────────────────────────────────────────────────────────┘
```

- **Left column**: Logo + tagline, `max-w-[240px]`
- **Link columns**: 3 columns, each with heading (`text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3`) and links (`text-sm text-slate-500 hover:text-slate-300 transition-colors duration-150`, stacked with `gap-2`)
- **Bottom row**: `mt-8 pt-6 border-t border-white/[0.06]`, copyright text `text-xs text-slate-600 text-center`

### Responsive
- `lg+`: 4-column layout (logo + 3 link groups)
- `md`: 2x2 grid
- `sm-`: Single column, stacked

---

## Responsive Behavior Summary

| Breakpoint | Navigation | Hero | Features Grid | Pricing Grid | Footer |
|---|---|---|---|---|---|
| `< 768px` | Hamburger menu | Smaller headline (36px), stacked CTAs | 1 column | 1 column | Single column |
| `768-1023px` | Full nav | Full headline | 2 columns | 3 columns (cards compress) | 2x2 grid |
| `1024px+` | Full nav | Full headline | 3 columns | 3 columns | 4 columns |

---

## Loading State

The landing page is statically rendered (SSR/SSG), so no loading state is needed. All content is immediately available.

---

## Error State

If the page fails to load (network error), the browser default error page is acceptable since this is a static page.

---

## Accessibility Notes

- All interactive elements have visible focus rings (`ring-2 ring-violet-500/50 ring-offset-2 ring-offset-[#0A0A0F]`)
- Heading hierarchy: h1 for hero headline, h2 for section titles, h3 for card titles
- CTAs have descriptive `aria-label` attributes
- Color contrast meets WCAG AA against the dark background (slate-400 on #0A0A0F passes at 16px)
- Reduced motion: wrap Framer Motion animations in `useReducedMotion()` check; disable orb drift and card hover float
