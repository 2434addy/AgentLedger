# AgentLedger Design Tokens

All tokens for the AgentLedger design system. Use these as the single source of truth for every component and page.

---

## Colors

### Base Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg-primary` | `#0A0A0F` | Page background, root container |
| `--color-bg-secondary` | `#12121A` | Sidebar background, inset panels |
| `--color-bg-tertiary` | `#1A1A26` | Hover states on dark surfaces |

### Glass Surfaces

| Token | Value | Usage |
|---|---|---|
| `--glass-surface` | `rgba(255, 255, 255, 0.06)` | Default glass card fill |
| `--glass-surface-elevated` | `rgba(255, 255, 255, 0.09)` | Elevated glass card (modals, dropdowns) |
| `--glass-surface-interactive` | `rgba(255, 255, 255, 0.04)` | Interactive glass card default state |
| `--glass-surface-interactive-hover` | `rgba(255, 255, 255, 0.08)` | Interactive glass card hover |
| `--glass-surface-interactive-active` | `rgba(255, 255, 255, 0.12)` | Interactive glass card pressed |
| `--glass-border` | `rgba(255, 255, 255, 0.10)` | Default border for glass surfaces |
| `--glass-border-hover` | `rgba(255, 255, 255, 0.18)` | Hovered border for glass surfaces |
| `--glass-border-focus` | `rgba(124, 58, 237, 0.50)` | Focused border (violet glow) |

### Brand Colors

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--color-primary` | `#7C3AED` | `violet-600` | Primary actions, active states, links |
| `--color-primary-hover` | `#6D28D9` | `violet-700` | Primary button hover |
| `--color-primary-light` | `rgba(124, 58, 237, 0.15)` | — | Primary tint backgrounds |
| `--color-primary-glow` | `rgba(124, 58, 237, 0.40)` | — | Glow/shadow for primary elements |
| `--color-secondary` | `#06B6D4` | `cyan-500` | Secondary accent, tool invocations |
| `--color-secondary-hover` | `#0891B2` | `cyan-600` | Secondary button hover |
| `--color-secondary-light` | `rgba(6, 182, 212, 0.15)` | — | Secondary tint backgrounds |

### Event Type Colors

| Token | Value | Tailwind | Event Category |
|---|---|---|---|
| `--event-llm-call` | `#7C3AED` | `violet-600` | LLM call events |
| `--event-tool-invocation` | `#06B6D4` | `cyan-500` | Tool invocation events |
| `--event-agent-lifecycle` | `#10B981` | `emerald-500` | Agent lifecycle events |
| `--event-user-action` | `#F59E0B` | `amber-500` | User action events |
| `--event-system` | `#64748B` | `slate-500` | System events |
| `--event-security` | `#EF4444` | `red-500` | Security events |
| `--event-guardrail` | `#F97316` | `orange-500` | Guardrail trigger events |

### Semantic Colors

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--color-success` | `#10B981` | `emerald-500` | Success states, pass indicators |
| `--color-warning` | `#F59E0B` | `amber-500` | Warning states |
| `--color-error` | `#EF4444` | `red-500` | Error states, danger actions |
| `--color-info` | `#3B82F6` | `blue-500` | Info states, neutral highlights |

### Text Colors

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--text-primary` | `#F8FAFC` | `slate-50` | Headings, primary text |
| `--text-secondary` | `#94A3B8` | `slate-400` | Body text, descriptions |
| `--text-tertiary` | `#64748B` | `slate-500` | Muted labels, placeholders |
| `--text-disabled` | `#475569` | `slate-600` | Disabled text |
| `--text-inverse` | `#0A0A0F` | — | Text on light backgrounds |

---

## Typography

### Font Families

| Token | Value | Usage |
|---|---|---|
| `--font-body` | `'Inter', system-ui, -apple-system, sans-serif` | All body text, labels, headings |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | Code blocks, data values, JSON, API keys, metric numbers |

### Type Scale

| Token | Size | Line Height | Weight | Tailwind | Usage |
|---|---|---|---|---|---|
| `--text-display` | `48px` | `1.1` | `700` | `text-5xl font-bold` | Landing page hero headline |
| `--text-h1` | `30px` | `1.2` | `600` | `text-3xl font-semibold` | Page titles |
| `--text-h2` | `24px` | `1.3` | `600` | `text-2xl font-semibold` | Section headings |
| `--text-h3` | `20px` | `1.4` | `600` | `text-xl font-semibold` | Card titles |
| `--text-h4` | `16px` | `1.4` | `600` | `text-base font-semibold` | Subsection headings |
| `--text-body` | `14px` | `1.5` | `400` | `text-sm` | Default body text |
| `--text-body-lg` | `16px` | `1.5` | `400` | `text-base` | Larger body text (landing page) |
| `--text-caption` | `12px` | `1.4` | `400` | `text-xs` | Captions, timestamps, badges |
| `--text-overline` | `11px` | `1.4` | `600` | `text-[11px] font-semibold uppercase tracking-wider` | Overline labels |
| `--text-metric` | `36px` | `1.1` | `700` | `text-4xl font-bold font-mono` | Large metric values |
| `--text-metric-sm` | `24px` | `1.2` | `600` | `text-2xl font-semibold font-mono` | Smaller metric values |

### Font Weight Scale

| Token | Value | Tailwind |
|---|---|---|
| `--font-regular` | `400` | `font-normal` |
| `--font-medium` | `500` | `font-medium` |
| `--font-semibold` | `600` | `font-semibold` |
| `--font-bold` | `700` | `font-bold` |

---

## Spacing Scale

Based on a 4px base unit. Use consistently for padding, margin, and gap.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--space-0` | `0px` | `0` | — |
| `--space-1` | `4px` | `1` | Tight inner spacing, icon-to-text gap |
| `--space-2` | `8px` | `2` | Badge padding, small gaps |
| `--space-3` | `12px` | `3` | Input padding-x, small card padding |
| `--space-4` | `16px` | `4` | Default card padding, list item gap |
| `--space-5` | `20px` | `5` | Section padding on mobile |
| `--space-6` | `24px` | `6` | Card padding, gap between cards |
| `--space-8` | `32px` | `8` | Section spacing, large card padding |
| `--space-10` | `40px` | `10` | Page padding top on desktop |
| `--space-12` | `48px` | `12` | Section gap, large section padding |
| `--space-16` | `64px` | `16` | Landing page section gap |
| `--space-20` | `80px` | `20` | Hero section vertical padding |
| `--space-24` | `96px` | `24` | Landing page section vertical spacing |

---

## Border Radius

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--radius-sm` | `6px` | `rounded-md` | Badges, small inputs |
| `--radius-md` | `8px` | `rounded-lg` | Buttons, input fields |
| `--radius-lg` | `12px` | `rounded-xl` | Cards, dropdowns |
| `--radius-xl` | `16px` | `rounded-2xl` | Modals, large panels |
| `--radius-2xl` | `24px` | `rounded-3xl` | Hero cards, landing page feature cards |
| `--radius-full` | `9999px` | `rounded-full` | Avatars, pill badges, circular buttons |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-glass` | `0 4px 24px rgba(0, 0, 0, 0.25)` | Default glass card shadow |
| `--shadow-glass-elevated` | `0 8px 40px rgba(0, 0, 0, 0.40)` | Elevated glass surfaces (modals, dropdowns) |
| `--shadow-glow-primary` | `0 0 20px rgba(124, 58, 237, 0.30)` | Primary button glow on hover |
| `--shadow-glow-secondary` | `0 0 20px rgba(6, 182, 212, 0.30)` | Secondary element glow on hover |
| `--shadow-glow-error` | `0 0 20px rgba(239, 68, 68, 0.30)` | Error/danger glow |
| `--shadow-inset` | `inset 0 1px 2px rgba(0, 0, 0, 0.30)` | Input fields inner shadow |

---

## Backdrop Blur

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--blur-sm` | `8px` | `backdrop-blur-sm` | Subtle blur (topbar) |
| `--blur-md` | `12px` | `backdrop-blur-md` | Medium blur (sidebar) |
| `--blur-lg` | `20px` | `backdrop-blur-lg` | Standard glass card blur |
| `--blur-xl` | `40px` | `backdrop-blur-xl` | Modal overlay blur |

---

## Breakpoints

| Token | Value | Tailwind Prefix | Notes |
|---|---|---|---|
| `--bp-sm` | `640px` | `sm:` | Mobile landscape |
| `--bp-md` | `768px` | `md:` | Tablet portrait |
| `--bp-lg` | `1024px` | `lg:` | Tablet landscape / small desktop |
| `--bp-xl` | `1280px` | `xl:` | Standard desktop |
| `--bp-2xl` | `1536px` | `2xl:` | Large desktop |

### Layout Widths

| Token | Value | Usage |
|---|---|---|
| `--sidebar-width-expanded` | `256px` | Sidebar open |
| `--sidebar-width-collapsed` | `72px` | Sidebar collapsed (icon-only) |
| `--topbar-height` | `64px` | Top bar height |
| `--content-max-width` | `1440px` | Max content width |
| `--landing-max-width` | `1200px` | Landing page max content width |

---

## Animation

### Durations

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | `100ms` | Micro-interactions (color changes, opacity) |
| `--duration-fast` | `150ms` | Button state changes, badge transitions |
| `--duration-normal` | `250ms` | Card hover, sidebar toggle, dropdown open |
| `--duration-slow` | `400ms` | Page transitions, modal open/close |
| `--duration-slower` | `600ms` | Staggered list animations, chart drawing |
| `--duration-slowest` | `1000ms` | Landing page hero entrance |

### Easings

| Token | Value | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default ease-out for entering elements |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Smooth transitions (sidebar toggle) |
| `--ease-spring` | `type: "spring", stiffness: 300, damping: 30` | Framer Motion spring for interactive elements |
| `--ease-bounce` | `type: "spring", stiffness: 400, damping: 15` | Framer Motion bounce for playful elements |

### Framer Motion Presets

```js
// Fade in from bottom — used for cards, sections
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
};

// Fade in — used for overlays, subtle entrances
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
};

// Scale in — used for modals, toasts
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
};

// Stagger children — used for lists, grids
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
};

// Slide in from left — used for sidebar
export const slideInLeft = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
};

// Slide in from right — used for panels, drawers
export const slideInRight = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
};

// Shimmer — used for loading skeletons
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: { duration: 1.5, repeat: Infinity, ease: 'linear' }
};
```

---

## Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `--z-base` | `0` | Default content |
| `--z-card` | `10` | Elevated cards |
| `--z-sidebar` | `40` | Sidebar |
| `--z-topbar` | `50` | Top navigation bar |
| `--z-dropdown` | `60` | Dropdowns, selects |
| `--z-modal-backdrop` | `70` | Modal backdrop overlay |
| `--z-modal` | `80` | Modal content |
| `--z-toast` | `90` | Toast notifications |
| `--z-tooltip` | `100` | Tooltips |

---

## Gradient Orbs (Decorative)

Used as background decorative elements on the landing page and auth pages.

```css
/* Violet orb — top-right area */
.orb-violet {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

/* Cyan orb — bottom-left area */
.orb-cyan {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.10) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
```
