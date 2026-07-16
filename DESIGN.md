# Gemai Design System

**Quiet Professional SaaS**

A calm, intelligent communication workspace that feels approachable to creators and dependable to professional teams.

---

## Design Positioning

| Requirement     | Design Response                                              |
|-----------------|--------------------------------------------------------------|
| Professional    | Neutral surfaces, precise spacing, restrained colour         |
| Minimal         | Few decorative elements, simple component geometry           |
| Friendly        | Human language, clear avatars, comfortable spacing           |
| Agency-ready    | Dense tables, filters, permissions, status visibility        |
| Strong hierarchy| Clear page titles, sections, panels and actions              |
| Modern          | Fast interactions, command menus, contextual AI              |
| Trustworthy     | Visible delivery status, audit information and confirmations |

### Balance

**Marketing website**  
60% Apple restraint · 25% Linear product presentation · 15% creator warmth

**Product application**  
65% Linear structure · 20% Intercom-style communication patterns · 15% creator warmth

Do not copy either system completely. Apple’s extreme whitespace works for marketing but would make an inbox inefficient. Linear’s compact spacing and surface hierarchy are better suited to operational interfaces.

---

## Colour System

Primary accent is used sparingly — brand mark, primary CTAs, focus rings, and selected states only.

### Brand & Accent

| Token              | Value     | Usage                                      |
|--------------------|-----------|--------------------------------------------|
| `primary`          | `#5B6AF0` | Primary CTA, focus ring, selected states   |
| `primary-hover`    | `#7B88F5` | Hover state of primary                     |
| `primary-focus`    | `#4F5DE0` | Focus ring                                 |
| `primary-soft`     | `rgba(91, 106, 240, 0.12)` | Soft backgrounds, selected rows |
| `primary-soft-hover`| `rgba(91, 106, 240, 0.18)` | Hover on soft backgrounds      |

### Dark Mode Surfaces

| Token             | Value     | Usage                                      |
|-------------------|-----------|--------------------------------------------|
| `canvas`          | `#0B0F19` | Page background                            |
| `surface-1`       | `#12171F` | Cards, panels, sidebar                     |
| `surface-2`       | `#1A212C` | Elevated cards, hovered surfaces, dropdowns|
| `surface-3`       | `#222A38` | Highest elevation, popovers                |
| `hairline`        | `#2A3344` | Default 1px borders                        |
| `hairline-strong` | `#3A4558` | Stronger borders, focused inputs           |

### Light Mode Surfaces

| Token             | Value     | Usage                                      |
|-------------------|-----------|--------------------------------------------|
| `canvas`          | `#FFFFFF` | Page background                            |
| `surface-1`       | `#F8FAFC` | Cards, panels, sidebar                     |
| `surface-2`       | `#F1F5F9` | Elevated cards, hovered surfaces           |
| `surface-3`       | `#E2E8F0` | Highest elevation                          |
| `hairline`        | `#E2E8F0` | Default 1px borders                        |
| `hairline-strong` | `#CBD5E1` | Stronger borders                           |

### Text

| Token          | Dark Mode | Light Mode | Usage                        |
|----------------|-----------|------------|------------------------------|
| `ink`          | `#F1F5F9` | `#0F172A`  | Headlines, primary body      |
| `ink-muted`    | `#94A3B8` | `#475569`  | Secondary text, meta         |
| `ink-subtle`   | `#64748B` | `#64748B`  | Tertiary, placeholders       |
| `ink-tertiary` | `#475569` | `#94A3B8`  | Disabled, fine print         |

### Semantic

| Token     | Value     | Usage                     |
|-----------|-----------|---------------------------|
| `success` | `#22C55E` | Delivered, active, success|
| `warning` | `#F59E0B` | Pending, caution          |
| `error`   | `#EF4444` | Failed, destructive       |
| `info`    | `#5B6AF0` | Informational (uses primary)|

**Rules**
- Primary colour appears only on interactive emphasis elements.
- Never use primary as a large background fill.
- Semantic colours are restrained — prefer soft backgrounds + coloured text over solid fills.

---

## Typography

**Font family**  
`Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

Inter is the closest high-quality open substitute that bridges Linear’s product feel and Apple’s clarity.

### Scale

| Token          | Size  | Weight | Line Height | Tracking   | Usage                          |
|----------------|-------|--------|-------------|------------|--------------------------------|
| `display-xl`   | 48px  | 600    | 1.10        | -0.03em    | Marketing hero headlines       |
| `display-lg`   | 36px  | 600    | 1.15        | -0.025em   | Section headlines              |
| `display-md`   | 28px  | 600    | 1.20        | -0.02em    | Page titles (product)          |
| `headline`     | 20px  | 600    | 1.30        | -0.015em   | Card titles, section headers   |
| `body-lg`      | 16px  | 400    | 1.50        | -0.01em    | Lead paragraphs, marketing     |
| `body`         | 14px  | 400    | 1.50        | 0          | Default product body           |
| `body-medium`  | 14px  | 500    | 1.50        | 0          | Emphasized body, table headers |
| `body-sm`      | 13px  | 400    | 1.45        | 0          | Secondary meta, captions       |
| `caption`      | 12px  | 400    | 1.40        | 0          | Status, fine print             |
| `button`       | 14px  | 500    | 1.20        | 0          | All button labels              |
| `eyebrow`      | 12px  | 500    | 1.30        | 0.04em     | Section labels, overlines      |

**Principles**
- Product UI defaults to 14px body for density.
- Marketing leans toward 16–17px for readability.
- Weight 600 for headlines, 400/500 for body. Avoid 700+.
- Negative tracking only on larger display sizes.

---

## Spacing

Base unit: **4px**

| Token     | Value |
|-----------|-------|
| `xxs`     | 4px   |
| `xs`      | 8px   |
| `sm`      | 12px  |
| `md`      | 16px  |
| `lg`      | 24px  |
| `xl`      | 32px  |
| `xxl`     | 48px  |
| `section` | 80px  |

**Usage guidelines**
- Card interior padding: `lg` (24px) or `md` (16px) for denser product cards
- Button padding: 8px vertical × 14–16px horizontal
- Form input padding: 8px vertical × 12px horizontal
- Section gaps in product: `lg`–`xl`
- Marketing section padding: `section` (80px)

---

## Border Radius

| Token    | Value  | Usage                              |
|----------|--------|------------------------------------|
| `xs`     | 4px    | Status badges, small chips         |
| `sm`     | 6px    | Tags, inline elements              |
| `md`     | 8px    | Buttons, inputs, small cards       |
| `lg`     | 12px   | Cards, panels, modals              |
| `xl`     | 16px   | Larger containers, screenshot frames|
| `pill`   | 9999px | Status pills, avatars              |

Prefer `md` (8px) for interactive elements and `lg` (12px) for containers. Avoid excessive rounding.

---

## Elevation & Depth

Depth is primarily expressed through the **surface ladder + hairline borders**, not heavy shadows.

| Level | Treatment                                      | Usage                          |
|-------|------------------------------------------------|--------------------------------|
| 0     | Canvas background                              | Page base                      |
| 1     | `surface-1` + 1px `hairline`                   | Default cards, sidebar         |
| 2     | `surface-2` + 1px `hairline`                   | Elevated cards, dropdowns      |
| 3     | `surface-3` + subtle shadow                    | Popovers, command menus        |
| Focus | 2px `primary-focus` outline at 40–50% opacity  | Focused inputs and buttons     |

Soft shadow (use sparingly):
```
0 4px 12px rgba(0, 0, 0, 0.15)   /* dark mode */
0 4px 12px rgba(0, 0, 0, 0.06)   /* light mode */
```

**Do not** rely on large drop shadows or atmospheric gradients for hierarchy.

---

## Layout Principles

### Product Dashboard

- **Sidebar**: Collapsible. Icon-rail (64px) when collapsed, expanded (~240–260px) with labels.
- Fixed left, full height, `surface-1` background with right `hairline`.
- Top bar: search, workspace switcher, notifications, user menu. Height 52–56px.
- Content area has clear page title + primary actions aligned to the right.
- Prefer dense but readable tables and lists for operational screens.
- Strong visual hierarchy: Page title → Section → Panel → Actions.

### Marketing Website

- Alternating light and dark full-bleed sections (Apple rhythm).
- Generous whitespace and large product screenshots as the hero of each section.
- Restrained primary CTAs (pill or soft rounded).
- Max content width ~1120–1280px.
- Minimal chrome — the product imagery does the heavy lifting.

### Communication Surfaces (Inbox, Threads)

- Slightly more breathing room than pure Linear density.
- Clear avatars, readable message bubbles, visible status indicators.
- Optimistic UI for sending messages.
- Soft selected / unread states using `primary-soft`.

---

## Components

### Buttons

**Primary**  
Background `primary`, text white, radius `md`, padding 8×14–16px, weight 500.  
Hover → `primary-hover`. Press → scale(0.98).

**Secondary**  
Background `surface-1` or transparent, 1px `hairline` border, text `ink`.  
Hover → `surface-2`.

**Ghost / Tertiary**  
No background, text `ink-muted`. Hover → subtle `surface-2` background.

**Destructive**  
Soft red background + red text, or outline style. Never pure solid red for primary actions.

All buttons use the micro-interaction timings below.

### Cards & Panels

- Background: `surface-1`
- Border: 1px `hairline`
- Radius: `lg` (12px)
- Padding: 16–24px
- No heavy shadows by default

### Inputs

- Background: `surface-1`
- Border: 1px `hairline`
- Focus: 2px `primary-focus` ring (soft)
- Radius: `md`
- Height: 36–40px

### Tables

- Subtle row hover (`surface-2`)
- Selected row: soft primary tint
- Compact but readable (13–14px text)
- Sticky headers where useful
- Quick actions appear on hover

### Status Badges

- Pill shape
- Soft background + coloured text (success, warning, error, neutral)
- Caption size (12px)

### Sidebar Navigation

- Active item: soft primary background + primary text/icon
- Hover: subtle surface lift
- Icon + label when expanded; icon only when collapsed
- Clear visual separation between main nav and utility links (Profile, Help)

---

## Micro-Interactions

Interactions should feel responsive — not entertaining.

### Timing

| Interaction          | Duration     |
|----------------------|--------------|
| Button state         | 100–120ms    |
| Hover transition     | 120–150ms    |
| Dropdown             | 160–180ms    |
| Tooltip              | 120ms        |
| Drawer               | 200–240ms    |
| Dialog               | 180–220ms    |
| Workflow connection  | 180–220ms    |

**Easing**: `cubic-bezier(0.2, 0, 0, 1)`

### Recommended Behaviours

**Buttons**  
- Background darkens slightly on hover  
- Press state scales to 0.98  
- Loading replaces icon/label without resizing the button

**Navigation**  
- Active background fades in  
- Icon colour changes  
- No large sliding indicators

**Tables**  
- Row background changes subtly on hover  
- Checkbox and quick actions appear  
- Selected row receives soft primary tint

**Inbox**  
- Unread badge fades when opened  
- Assignment updates instantly  
- Sent message appears optimistically  
- Delivery status transitions: sending → sent → delivered

**Automation Builder**  
- Connection lines animate briefly when created  
- Selected nodes receive subtle border highlight  
- Invalid nodes show a small status indicator  
- Dragged nodes receive temporary elevation  
- Saving status appears quietly in the header

**AI Replies**  
- Restrained text-generation indicator  
- No glowing borders  
- No continuous sparkle animations  
- Clearly show generated / reviewed / auto-sent states

### Avoid

- Bounce animations  
- Confetti  
- Excessive parallax  
- Animated gradients  
- Pulsing AI buttons  
- Large hover scaling  
- Continuous icon movement  
- Decorative loading sequences  

---

## Do’s and Don’ts

### Do
- Use the surface ladder + hairline borders for hierarchy
- Keep primary colour scarce and intentional
- Prefer quiet status indicators over loud badges
- Make delivery and audit information visible
- Maintain excellent contrast in both light and dark modes
- Use optimistic UI for messaging actions

### Don’t
- Introduce additional chromatic brand colours
- Use heavy glows or atmospheric gradients
- Apply primary as a large card or section background
- Add bounce, confetti, or continuous animations
- Sacrifice readability for extreme density
- Mix decorative and functional visual languages

---

## Responsive Behaviour

| Breakpoint   | Width     | Behaviour                                      |
|--------------|-----------|------------------------------------------------|
| Desktop      | ≥ 1280px  | Full sidebar + content                         |
| Laptop       | 1024px    | Collapsible sidebar preferred                  |
| Tablet       | 768px     | Sidebar becomes drawer / sheet                 |
| Mobile       | < 640px   | Bottom navigation or hamburger + full sheets   |

- Touch targets ≥ 40–44px
- Tables become card lists or horizontal scroll on small screens
- Flow builder shows a clear desktop recommendation on mobile

---

## Implementation Notes

1. All tokens should live in CSS variables (`globals.css`) and be mapped in `tailwind.config.ts`.
2. Prefer semantic class names (`bg-surface-1`, `text-ink-muted`, `border-hairline`) over raw values.
3. Dark and light modes must both be first-class citizens.
4. Component library remains based on shadcn/ui — restyle via tokens rather than rewriting everything.
5. When in doubt, choose the quieter option.

---

## Version

**v1.0** — Quiet Professional  
Primary: `#5B6AF0`  
Created for the complete frontend redesign of Gemai.
