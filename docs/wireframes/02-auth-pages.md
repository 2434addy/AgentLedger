# 02 - Authentication Pages

Signup and Login pages. No sidebar or topbar — standalone centered layouts.

---

## Shared Layout

Both pages share the same container layout:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                         [Gradient Orb]                               │
│                                                                      │
│                   ┌─────────────────────┐                           │
│                   │                     │                           │
│                   │     [Auth Card]     │                           │
│                   │                     │                           │
│                   └─────────────────────┘                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Background
- Full viewport: `min-h-screen bg-[#0A0A0F]`
- Single decorative orb centered behind the card: `w-[500px] h-[500px]` radial gradient `rgba(124,58,237,0.12)`, blurred 100px, positioned absolute at `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`. Subtle drift animation:
  ```js
  animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.18, 0.12] }}
  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  ```

### Container
```
min-h-screen flex flex-col items-center justify-center px-4
```

### Logo
Positioned above the card: "AgentLedger" text, same style as landing nav logo. `mb-8`.

### Auth Card
`GlassCard elevated` with `padding="lg"`, `max-w-[420px] w-full`.

---

## Signup Page

Route: `/signup`

### Card Content

```
┌─────────────────────────────────┐
│                                 │
│  Create your account            │
│  Start monitoring your agents   │
│                                 │
│  Display Name                   │
│  [________________________]     │
│                                 │
│  Email                          │
│  [________________________]     │
│                                 │
│  Password                       │
│  [________________________] 👁  │
│                                 │
│  Organization Name              │
│  [________________________]     │
│                                 │
│  [   Create Account        ]    │
│                                 │
│  Already have an account? Login │
│                                 │
└─────────────────────────────────┘
```

### Elements (top to bottom)

1. **Title**: "Create your account" — `text-xl font-semibold text-slate-50`
2. **Subtitle**: "Start monitoring your AI agents in minutes" — `text-sm text-slate-400 mt-1 mb-6`
3. **Display Name field**: `GlassInput text` — label "Display Name", placeholder "John Doe"
4. **Email field**: `GlassInput text` — label "Email", placeholder "john@company.com", type email
5. **Password field**: `GlassInput password` — label "Password", placeholder "Min. 8 characters"
6. **Organization Name field**: `GlassInput text` — label "Organization Name", placeholder "Acme Inc."
7. **Spacing**: `mt-6`
8. **Submit button**: `GlassButton primary md fullWidth` — "Create Account"
9. **Footer link**: `text-sm text-slate-400 text-center mt-4` — "Already have an account? " + `<a>Log in</a>` in `text-violet-400 hover:text-violet-300`

### Field Spacing
Each field is wrapped in a `div` with `mb-4` (16px gap between fields).

### Validation

- **Display Name**: Required. Min 2 characters. Error: "Display name is required"
- **Email**: Required. Must be valid email format. Error: "Please enter a valid email"
- **Password**: Required. Min 8 characters. Error: "Password must be at least 8 characters"
- **Organization Name**: Required. Min 2 characters. Error: "Organization name is required"

Errors show below the respective `GlassInput` using the input's `error` prop (red border + error text).

### Submit Behavior
- Button shows loading spinner while request is in progress
- On success: redirect to `/dashboard` (overview page)
- On error (e.g. email already exists): show `Toast error` with message from API

---

## Login Page

Route: `/login`

### Card Content

```
┌─────────────────────────────────┐
│                                 │
│  Welcome back                   │
│  Sign in to your account        │
│                                 │
│  Email                          │
│  [________________________]     │
│                                 │
│  Password                       │
│  [________________________] 👁  │
│                                 │
│              Forgot password?   │
│                                 │
│  [   Sign In               ]    │
│                                 │
│  Don't have an account? Sign up │
│                                 │
└─────────────────────────────────┘
```

### Elements (top to bottom)

1. **Title**: "Welcome back" — `text-xl font-semibold text-slate-50`
2. **Subtitle**: "Sign in to your account" — `text-sm text-slate-400 mt-1 mb-6`
3. **Email field**: `GlassInput text` — label "Email", placeholder "john@company.com", type email
4. **Password field**: `GlassInput password` — label "Password", placeholder "Enter your password"
5. **Forgot password link**: Right-aligned, `text-xs text-violet-400 hover:text-violet-300 mt-1 text-right block` — "Forgot password?"
6. **Spacing**: `mt-6`
7. **Submit button**: `GlassButton primary md fullWidth` — "Sign In"
8. **Footer link**: `text-sm text-slate-400 text-center mt-4` — "Don't have an account? " + `<a>Sign up</a>` in `text-violet-400 hover:text-violet-300`

### Field Spacing
`mb-4` between fields.

### Validation

- **Email**: Required, valid format
- **Password**: Required

### Submit Behavior
- Button shows loading spinner
- On success: redirect to `/dashboard`
- On error (invalid credentials): show `Toast error` — "Invalid email or password"

---

## Framer Motion Animations

### Page Entrance (both pages)

```js
// Logo
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}

// Card
initial={{ opacity: 0, y: 20, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}

// Form fields stagger inside card
staggerChildren: 0.05, delayChildren: 0.2
// Each field: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
```

### Page Transition (switching between login/signup)

```js
// Exiting card
exit={{ opacity: 0, scale: 0.98, y: -10 }}
transition={{ duration: 0.2 }}

// Entering card
initial={{ opacity: 0, scale: 0.98, y: 10 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ duration: 0.3, delay: 0.1 }}
```

---

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `< 640px` | Card goes full-width with `mx-4`, padding reduces to `p-6` |
| `640px+` | Card is `max-w-[420px]`, centered |

On very small screens (< 375px), card padding reduces to `p-4`.

---

## Loading State

While the page JS bundle loads, the background and orb render immediately (CSS-only). The card appears once React hydrates (the Framer Motion entrance handles this gracefully).

---

## Error State

Network errors during form submission are caught and displayed via `Toast error`. The form remains filled so the user can retry.

---

## Accessibility

- Form inputs have associated `<label>` elements (via the GlassInput `label` prop)
- Submit on Enter key works (native form behavior)
- Password toggle button has `aria-label="Show password"` / `"Hide password"`
- Focus trap is not needed (single-card layout)
- Tab order follows visual order top-to-bottom
