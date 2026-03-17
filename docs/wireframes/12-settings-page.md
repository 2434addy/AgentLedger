# 12 - Settings Page

Route: `/dashboard/settings`
Sidebar active item: `settings`

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Settings                                                        │
│  Manage your organization, API keys, and profile                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Organization                                             │   │
│  │                                                           │   │
│  │  Organization Name         Organization ID                │   │
│  │  [Acme Corp_________]      org_a1b2c3d4 (read-only)      │   │
│  │                                                           │   │
│  │                                          [Save Changes]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Keys                               [Generate Key]   │   │
│  │                                                           │   │
│  │  Key               │ Created    │ Last Used │ Actions     │   │
│  │  sk-••••••••ab3f   │ Mar 1      │ 2m ago    │ [Revoke]   │   │
│  │  sk-••••••••c7d8   │ Mar 10     │ Never     │ [Revoke]   │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Profile                                                  │   │
│  │                                                           │   │
│  │  Display Name              Email                          │   │
│  │  [John Doe__________]     john@acme.com (read-only)       │   │
│  │                                                           │   │
│  │  Change Password                                          │   │
│  │  Current Password  [___________________]                  │   │
│  │  New Password      [___________________]                  │   │
│  │  Confirm Password  [___________________]                  │   │
│  │                                                           │   │
│  │                              [Update Profile] [Change PW] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page Header

- Title: "Settings" — `text-3xl font-semibold text-slate-50`
- Subtitle: "Manage your organization, API keys, and profile" — `text-sm text-slate-400 mt-1`
- `mb-6`

---

## Organization Section

Component: `GlassCard default` with `padding="lg"`, `mb-6`.

### Section Title
"Organization" — `text-lg font-semibold text-slate-100 mb-6`

### Fields

Layout: `grid grid-cols-1 md:grid-cols-2 gap-6`

#### Organization Name (editable)
- Component: `GlassInput text`
- Label: "Organization Name"
- Value: Current org name (pre-filled)
- Editable

#### Organization ID (read-only)
- Label: "Organization ID" — `text-xs font-medium text-slate-400 mb-1.5`
- Value container: `flex items-center gap-2`
  - ID text: `font-mono text-sm text-slate-400 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]` — displayed like a disabled input but explicitly read-only
  - Copy button: clipboard icon (14px), `text-slate-500 hover:text-slate-300 cursor-pointer`

### Save Button

Right-aligned: `flex justify-end mt-6`
- `GlassButton primary md` — "Save Changes"
- Disabled until org name is changed from current value
- On click: loading state, then `Toast success` — "Organization updated successfully"

---

## API Keys Section

Component: `GlassCard default` with `padding="none"`, `mb-6`.

### Header

`px-6 pt-6 pb-4 flex items-center justify-between`:
- Title: "API Keys" — `text-lg font-semibold text-slate-100`
- Action: `GlassButton primary sm` — "Generate New Key" with `Plus` icon

### API Keys Table

Component: `DataTable` (not paginated — typically under 10 keys).

#### Columns

| Column | Key | Width | Sortable | Renderer |
|---|---|---|---|---|
| Key | `maskedKey` | `flex (min 200px)` | No | `font-mono text-sm text-slate-300` — format: `sk-••••••••{last4}` |
| Name | `name` | `140px` | No | `text-sm text-slate-400` — optional user-set label, or "—" |
| Created | `createdAt` | `120px` | No | Date format: "Mar 1, 2026" — `text-xs text-slate-500` |
| Last Used | `lastUsed` | `120px` | No | Relative time or "Never" — `text-xs text-slate-500` |
| Actions | — | `100px` | No | `GlassButton danger sm` — "Revoke" |

### Revoke Key Flow

1. Click "Revoke" button
2. `Modal` opens:
   - Title: "Revoke API Key"
   - Body: "Are you sure you want to revoke the key ending in **{last4}**? Any applications using this key will immediately lose access. This action cannot be undone."
   - Footer: `GlassButton secondary md` — "Cancel" + `GlassButton danger md` — "Revoke Key"
3. On confirm: button enters loading state, key is revoked, modal closes
4. `Toast success` — "API key revoked successfully"
5. Key row animates out of the table

### Generate New Key Flow

1. Click "Generate New Key" button
2. Optional: prompt for key name via `Modal`:
   - Title: "Generate New API Key"
   - Body: `GlassInput text` with label "Key Name (optional)" and placeholder "e.g., Production Server"
   - Footer: `GlassButton secondary md` — "Cancel" + `GlassButton primary md` — "Generate"
3. On generate: button loading state, API call creates key
4. **New Key Display Modal** opens:
   - Title: "Your New API Key"
   - Body:
     ```
     ┌─────────────────────────────────────────────────┐
     │                                                  │
     │  ⚠ Copy this key now. It won't be shown again.  │
     │                                                  │
     │  ┌──────────────────────────────────────────┐   │
     │  │  sk-proj-a1b2c3d4e5f6g7h8i9j0k1l2m3n4   │   │
     │  │                                  [Copy]  │   │
     │  └──────────────────────────────────────────┘   │
     │                                                  │
     │  Key Name: Production Server                     │
     │  Created: Mar 17, 2026                           │
     │                                                  │
     └─────────────────────────────────────────────────┘
     ```
   - **Warning message**: `flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4`
     - Icon: `AlertTriangle` (18px, `text-amber-400`)
     - Text: "Copy this key now. It won't be shown again." — `text-sm text-amber-300`
   - **Key display box**: `p-4 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between`
     - Key text: `font-mono text-sm text-slate-100 break-all` — shows the FULL key
     - Copy button: `GlassButton ghost sm` with clipboard icon. On click: copies to clipboard, shows checkmark + "Copied!" for 1.5s
   - **Metadata**: `mt-3`
     - "Key Name: {name}" — `text-xs text-slate-400`
     - "Created: {date}" — `text-xs text-slate-400`
   - Footer: `GlassButton primary md` — "Done" (closes modal)
   - Modal does NOT close on backdrop click (prevents accidental dismissal before copying)
   - `onClose` prop is disabled — only the "Done" button closes it

5. After modal closes, new key appears in the table (masked, like all other keys)

---

## Profile Section

Component: `GlassCard default` with `padding="lg"`.

### Section Title
"Profile" — `text-lg font-semibold text-slate-100 mb-6`

### User Info Fields

Layout: `grid grid-cols-1 md:grid-cols-2 gap-6 mb-8`

#### Display Name (editable)
- Component: `GlassInput text`
- Label: "Display Name"
- Value: Current name (pre-filled)

#### Email (read-only)
- Label: "Email" — `text-xs font-medium text-slate-400 mb-1.5`
- Value: `text-sm text-slate-400 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]` — read-only display

### Update Profile Button

`flex justify-end mb-8`
- `GlassButton primary md` — "Update Profile"
- Disabled until display name changes
- On success: `Toast success` — "Profile updated"

### Change Password Subsection

Divider: `border-t border-white/[0.06] pt-8`

Title: "Change Password" — `text-base font-semibold text-slate-100 mb-4`

Layout: `max-w-md` (single column, capped width for readability)

Fields (stacked with `gap-4`):

1. **Current Password**: `GlassInput password` — label "Current Password"
2. **New Password**: `GlassInput password` — label "New Password", placeholder "Min. 8 characters"
3. **Confirm New Password**: `GlassInput password` — label "Confirm New Password"

### Password Validation

- Current password: required
- New password: required, min 8 characters
- Confirm password: required, must match new password
- If new password < 8 chars: error "Password must be at least 8 characters"
- If confirm does not match: error "Passwords do not match"

### Change Password Button

`flex justify-end mt-6`
- `GlassButton primary md` — "Change Password"
- Disabled until all 3 fields are filled and valid
- On success:
  - `Toast success` — "Password changed successfully"
  - All password fields cleared
- On error (wrong current password):
  - `Toast error` — "Current password is incorrect"
  - Current password field shows error state

---

## Loading State

Each section card shows shimmer skeleton bars matching the field layout:
- Organization: 2 skeleton bars (label + input shape)
- API Keys: `LoadingState variant="table"` with 2 rows
- Profile: 2 skeleton bars for info fields, 3 for password fields

---

## Empty State

### No API Keys

Table body replaced with:
- Centered text: "No API keys created yet" — `text-sm text-slate-500 py-8 text-center`
- `GlassButton primary sm` — "Generate Your First Key"

---

## Error State

- Save/update failures: `Toast error` with the error message from API
- Load failure: `Toast error` + content area retry `EmptyState`

---

## Responsive Behavior

| Breakpoint | Organization | API Keys | Profile |
|---|---|---|---|
| `< 768px` | Single column, Org ID below Org Name | Table horizontal scroll if needed; Revoke button text may shorten to icon-only | Single column for all fields. Password section full width. |
| `768px+` | 2 columns | Full table | 2 columns for name/email, password section stays `max-w-md` |

---

## Framer Motion

```js
// Section cards stagger in
staggerContainer with staggerChildren: 0.1

// Each section card
variants: fadeInUp

// API key row deletion
exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}

// New key row insertion
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}

// New Key Modal appearance
// Uses standard Modal animation from components.md
// Additional: the key text has a typewriter-like reveal:
initial={{ width: 0 }}
animate={{ width: '100%' }}
transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}

// Warning badge pulse
animate={{ opacity: [1, 0.7, 1] }}
transition={{ duration: 2, repeat: Infinity }}

// Save/Update button success feedback
// Brief scale pop: scale 1 → 1.05 → 1 over 300ms
```

---

## Security Notes

- API key generation: the full key is only available in the generation response. The backend stores only a hash.
- The "New Key" modal explicitly prevents accidental closure. Users must click "Done".
- Password change requires the current password for verification.
- Org ID and email are immutable from the UI (backend-enforced).
- All settings mutations should use CSRF protection and require a valid session.
