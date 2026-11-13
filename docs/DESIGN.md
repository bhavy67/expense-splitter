# SplitItt design system — Monochrome

Source of truth for the redesign. Token **values** live in `frontend/src/index.css`; if this file and the CSS disagree, the CSS wins and this file gets fixed.

## Principles

1. Content over chrome: amounts and names are the loudest things on screen.
2. One neutral ramp. Hierarchy comes from size, weight and spacing first; the two text greys are a secondary cue.
3. Meaning never relies on colour alone: sign + word + icon (WCAG 1.4.1).
4. Hairlines over shadows. Shadow only on floating layers (sheet, modal, toast, popover).
5. Sentence case everywhere. No `uppercase`, no `tracking-[…]` overlines.
6. Every interactive target is at least 44×44px on touch.

## Rules for components

- Use semantic utilities only (`bg-surface`, `text-fg-muted`, `border-border`). No hex literals, no `dark:` colour pairs — tokens switch with `.dark` on `<html>`.
- Weights 400, 500, 600 only. No `font-bold`/`font-black`.
- No offset shadows, no 2px black borders, no translate-on-press. Press = `active:scale-[0.98]`.
- Every amount goes through `<Money>` (tabular numerals).
- Missing a style? Extend the primitive in `src/components/ui/` and this file. No one-off styles in pages.

## Colour tokens

| Token (utility) | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#0A0A0A` | App background |
| `surface` | `#FFFFFF` | `#111111` | Cards, sheets |
| `surface-subtle` | `#F7F7F7` | `#171717` | Input fills, inset areas, hover |
| `surface-muted` | `#EFEFEF` | `#1F1F1F` | Pressed, avatars, badges, skeletons |
| `fg` | `#0A0A0A` | `#F5F5F5` | Primary text |
| `fg-muted` | `#4D4D4D` | `#A3A3A3` | Secondary text |
| `fg-subtle` | `#707070` | `#808080` | Placeholder, meta. Never essential info |
| `border` | `#EBEBEB` | `#232323` | Hairlines, card borders, dividers, chips |
| `border-strong` | `#D4D4D4` | `#333333` | Secondary button outline |
| `border-input` | `#8F8F8F` | `#6B6B6B` | Input/select/textarea borders only (≥3:1, WCAG 1.4.11) |
| `inverse-bg` / `inverse-fg` | `#0A0A0A` / `#FFFFFF` | `#F5F5F5` / `#0A0A0A` | Primary CTA, selected chip, toast |
| `focus` | `#0A0A0A` | `#F5F5F5` | Focus ring |
| `overlay` | `rgb(0 0 0 / .4)` | `rgb(0 0 0 / .6)` | Modal scrim |
| `positive`, `negative`, `accent` | = `fg` | = `fg` | Colour hooks, grey today |
| `warning` | = `fg-muted` | = `fg-muted` | Colour hook, grey today |

### Measured contrast (bg / surface / surface-subtle / surface-muted)

| | Light | Dark |
|---|---|---|
| `fg` | 19.80 / 19.80 / 18.48 / 17.22 | 18.16 / 17.32 / 16.44 / 15.12 |
| `fg-muted` | 8.45 / 8.45 / 7.89 / 7.35 | 7.85 / 7.49 / 7.11 / 6.53 |
| `fg-subtle` | 4.95 / 4.95 / 4.62 / **4.31** | 5.01 / 4.78 / 4.54 / **4.17** |
| `border-input` vs bg | 3.23 | 3.72 |
| `inverse-fg` on `inverse-bg` | 19.80 | 18.16 |

**Never put `fg-subtle` text on `surface-muted`** (fails 4.5:1). Use `fg-muted` there.

## Type

Inter Variable, self-hosted (latin + latin-ext subsets only, `@font-face` in `index.css`; ₹ U+20B9 is in latin-ext). `font-feature-settings: "cv11"` (single-storey a). Numbers use Inter with `tabular-nums`; no mono face. `font-mono` falls back to the system mono stack (UPI IDs only).

| Utility | Size/line | Weight | Tracking | Use |
|---|---|---|---|---|
| `text-display` | 32/38 | 600 | -0.02em | Hero amount |
| `text-title-lg` | 24/30 | 600 | -0.015em | Page title |
| `text-title` | 18/24 | 600 | — | Section/card title |
| `text-body` | 15/22 | 400 | — | Default |
| `text-body-sm` | 13/18 | 400 | — | Meta |
| `text-caption` | 12/16 | 500 | — | Labels, chips, badges |

Weights override with `font-medium`/`font-semibold` where needed. These sizes are registered in `cn()` (tailwind-merge) so `cn('text-title', 'text-fg')` keeps both.

## Spacing, radius, elevation, motion

- **Spacing:** Tailwind's 4px scale. Page gutter 16px (`px-4`), card padding 16px, list rows ≥ 56px tall.
- **Radius:** `rounded-sm` 6px · `rounded-md` 10px (inputs, buttons, icon tiles) · `rounded-lg` 14px (cards) · `rounded-xl` 20px (sheets, modals) · `rounded-full` (pills, avatars).
- **Elevation:** one shadow, `shadow-float`, for floating layers only. Dark mode adds a 1px `border` ring into the same token because shadows don't read on black.
- **Motion:** `ease-out` = `cubic-bezier(0.2, 0.8, 0.2, 1)`. 120ms press/hover · 200ms sheet/modal · 280ms page. `prefers-reduced-motion` disables all of it.
- **Focus:** `:focus-visible` → 2px `focus` outline, 2px offset.

## Iconography

Lucide only, `strokeWidth` 1.75, 20px in tiles, 16px inline. Emojis are being removed; the maps live in `src/lib/icons.ts` (`CATEGORY_ICONS`, `GROUP_TYPE_ICONS`). `member.color` stays in data but the UI ignores it (avatars are monochrome initials) until a colour phase.

## Component inventory (`src/components/ui/`)

| Component | Notes |
|---|---|
| `Button` | `variant`: primary (inverse) · secondary (surface + `border-strong`) · ghost · danger (secondary look + `text-negative`; destructive actions always sit behind `ConfirmModal`). `size`: sm 36 · md 44 · lg 52 · icon 44². `loading`, `fullWidth`. Icons go in `children`. Old path `components/common/Button` re-exports it. |
| `IconButton` | 40px visual inside a 44px hit area, `aria-label` required by the type. |
| `Field` | Label + control + hint/error, wires `id`, `aria-describedby`, `aria-invalid` into its child. |
| `Input`, `Textarea`, `Select` | 44px, `bg-surface-subtle`, `border-border-input`, focus `border-fg`. |
| `MoneyInput` | Large tabular digits, currency `prefix` slot, `inputMode="decimal"`. |
| `Card` | `default` · `interactive` (hover `surface-subtle`, `as={Link}` / `as="button"`) · `inset`. |
| `ListRow` | leading · title/subtitle · trailing · optional chevron · optional divider. |
| `Avatar`, `AvatarStack` | Initials on `surface-muted`, sizes 20/28/36/48, `+N` overflow. `color` accepted and ignored. |
| `IconTile` | 40² `rounded-md` `surface-subtle`, Lucide icon 20px. |
| `Badge` | 22px pill, `caption`, `surface-muted`. |
| `Chip`, `ChipGroup` | 36px pill toggle (`aria-pressed`); selected = inverse. Group scrolls horizontally, `role="group"`. |
| `SegmentedTabs` | **Panel switching only** (Expenses / Balances / Stats): `tablist`/`tab`/`tabpanel`, arrow/Home/End keys, equal-width segments with a sliding pill. |
| `SegmentedControl` | Same look, for **picking a value** (split mode): `radiogroup`/`radio` + `aria-checked`. Both live in `SegmentedTabs.tsx` and share one implementation. |
| `Dialog`, `Modal`, `Sheet` | Native `<dialog>` + `showModal()`: browser handles inert background, Escape, focus return, top layer. `Sheet` = bottom sheet on mobile, centred at `sm:`. Backdrop click closes. `footer` pins a CTA below the scroll area (with safe-area padding); point it at the form with `form="…"`. Put `data-autofocus` on the field that should get initial focus (React's `autoFocus` loses to `showModal()`). |
| `StickyActionBar` | Fixed bottom CTA bar. Pads its content by `calc(var(--bottom-nav-h) + safe-area)` and starts at `var(--sidebar-w)`; `AppShell` owns both variables (0 when the nav / sidebar is hidden). The bar never imports `BottomNav` or `Sidebar`. Pages that use it add bottom padding ≥ the bar height. |
| `Money` | `formatCurrency` + `tabular-nums`; `tone` neutral/positive/negative, `showSign`, `size`. |
| `SectionHeader` | Title, optional count, optional trailing action. |
| `Skeleton` | `surface-muted` pulse block. |
| `common/Toast` | Inverse bar + `shadow-float` + icon. Rendered in a `popover="manual"` container so it sits above an open modal. |
| `common/ConfirmModal`, `common/EmptyState` | Restyled on tokens; `ConfirmModal` is built on `Modal`. |

### Patterns

- **Disabled-looking but tappable submit:** on long forms the primary CTA gets `aria-disabled` + `opacity-50` until the form is ready, but stays clickable so validation can explain what's missing (toast). Never rely on a truly `disabled` button to communicate a reason.
- **Validation status lines** use text + icon (`Check` / `CircleAlert`), e.g. "₹240.00 left to assign" / "100% assigned".
- **Disclosure:** secondary form fields go in a native `<details>` ("More details"), open by default when editing or when they already hold data.

### Hex allowlist

Only these may contain hex literals: `lib/memberColors.ts` (persisted `member.color` user data) and the QR code's `bgColor`/`fgColor` in `UpiQrModal` (always black-on-white so scanners work in both themes).

## Dev kitchen sink

`/__ui` renders every primitive in every state with a theme toggle. Registered only when `import.meta.env.DEV`, so it is not in the production bundle.
