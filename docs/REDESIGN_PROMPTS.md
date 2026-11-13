# SplitItt — Monochrome Redesign: Phased Prompts

Paste one phase at a time into your code editor's agent. Finish, verify and commit each phase before starting the next.
Phase 1 creates `docs/DESIGN.md`. Every later phase treats that file as the source of truth.

---

## What the audit found (why the phases are ordered this way)

These are facts from the current codebase. The plan is built around them.

1. **There is no design system, only hardcoded hex values.** About 1,700 literal hex values across `.tsx` files (`#0a0a0a` ×374, `#f0ede5` ×328, `#4a4940` ×137, `#a09880` ×128, `#b9f542` ×122, …), plus about 90 arbitrary offset shadows (`shadow-[3px_3px_0_#0a0a0a]`). Every component repeats the `dark:` pair by hand. So changing the theme means editing every file. **Tokens have to come first**, or the redesign becomes find-and-replace that drifts.
2. **The `@theme` "indigo" alias (lime) in `index.css` is never used.** It's dead config.
3. **`src/App.css` is leftover Vite boilerplate** (`.hero`, `#next-steps`, `.counter`). It's dead code.
4. **No shared primitives beyond `Button`.** There are 23 raw `<input>`/`<select>`/`<textarea>` elements, 5 hand-written modal overlays (`fixed inset-0`), and tabs and chips built inline.
5. **Accessibility gaps:** no modal has `role="dialog"`, `aria-modal`, a focus trap or focus return. The tabs have no `role="tablist"`.
6. **Real bug:** `GroupPage` TopBar actions hardcode `text-[#f0ede5]`/`text-[#b9f542]`, which makes them nearly invisible in light mode.
7. **Colour carries meaning in several places**, and black and white alone can't carry it:
   - Balances use green for settled/owed, amber for pending and `#ff5c3d` for danger.
   - Category emojis (🍔✈️🏨) and per-member avatar colours (`member.color`, which is persisted in user data).
   - Recharts uses 8 category colours plus a lime bar.
   - The UPI modal uses green states.
8. **Brand lives outside `src/` too:** `index.html` (theme-color, mask-icon `#b9f542`, Google Fonts link), `vite.config.ts` manifest colours, `public/theme-init.js`, `public/icon.svg`/`favicon.svg`, `scripts/gen-icons.mjs`, `android/twa-manifest.json`, `android/.../colors.xml`, `store-assets/*`, the README "Design system" section, and the CSP in `vercel.json`, which allows `fonts.googleapis.com`.
9. **Biggest screens:** `AddExpensePage.tsx` (844 lines), `GroupSettingsPage.tsx` (570), `BalancesTab.tsx` (424), `UpiQrModal.tsx` (357).

---

## Design direction (the decisions, with reasons)

**Name:** *Monochrome*. The interface stays quiet so the content stands out: amounts, names and who owes whom.

**What to take from each reference, and what to leave:**

| Reference | Take | Leave |
|---|---|---|
| **Notion** | Typography-led hierarchy, hairline borders instead of shadows, generous whitespace, sentence case, quiet hover states, inline editing feel | The doc/page metaphor and its density on mobile |
| **Zomato** | Bold display headings, a strong hero number per screen, card lists with a clear left-content / right-value rhythm, section headers with "See all" | Red brand, promotional noise, image-heavy cards |
| **Blinkit** | Speed-first mobile UX: sticky bottom CTA bar, pill filter chips that scroll horizontally, big tap targets, a one-glance summary strip, a bottom-sheet for every secondary action | Yellow/green brand, aggressive badges |

**Core decisions:**

- **"Two colours" means one neutral ramp, not two literal values.** Pure `#000`/`#fff` alone can't express hierarchy: disabled states, borders, muted text and surfaces all need in-between steps. Use one achromatic grey ramp. No hue, no tint (the current warm cream `#f0ede5` goes).
- **Semantic tokens from day one, even though they map to grey today.** Define `--positive`, `--negative`, `--warning` and `--accent` now and point them at neutral values. Adding colour later is then a one-line token change, not another full redesign. This is the most important architectural decision in the plan.
- **Meaning never comes from colour alone.** This is also a WCAG 1.4.1 requirement. Owe vs. owed uses a sign (`+ / −`), a word ("gets back" / "owes"), an arrow icon and font weight. When colour arrives later it adds to these cues, never replaces them.
- **Neo-brutalism goes completely:** no offset shadows, no 2px black borders, no uppercase tracking, no `font-black`.
- **Font: Inter (variable), self-hosted.** It has excellent tabular numerals for money (`font-variant-numeric: tabular-nums`), a real ₹ glyph and good small-size legibility. Self-hosting through `@fontsource-variable/inter` removes the Google Fonts request: faster first paint, truly offline in the PWA, and the CSP can drop the Google domains. Drop DM Mono. Numbers use Inter with `tnum`, not a mono face.
- **Emojis go, monochrome icons come in.** Category and group-type emojis are full-colour glyphs that break a monochrome system and render differently on each OS. Replace them with Lucide icons in a neutral tile.
- **Member colours are kept in data, ignored in UI (for now).** `member.color` is persisted in users' localStorage. Don't migrate or delete it. Avatars become monochrome initials. A later "colour" phase can bring it back.

---
---

# PHASE 1 — Foundation: tokens, typography, primitives

> Paste everything between the lines.

---

You are a senior frontend architect and product designer working in the SplitItt repo (React 19 + TypeScript + Vite 8 + Tailwind CSS v4 CSS-first config, app in `frontend/`). We are replacing the current neo-brutalist lime design with a professional, minimal **monochrome** design language. Inspiration: Notion (typographic hierarchy, hairlines, whitespace, sentence case), Zomato (bold headings, strong hero numbers, clean card lists), Blinkit (fast mobile UX, sticky bottom CTAs, pill chips, bottom sheets).

This is **Phase 1 of 4: foundation only.** Build the token system, typography and shared primitives. Do **not** restyle pages yet, except where a primitive replaces itself (e.g. `Button` keeps its API, so pages pick up the new look automatically).

### Hard constraints
- **No behaviour changes.** Don't touch `lib/calculations.ts`, `lib/storage.ts`, `lib/upi.ts`, `lib/export.ts`, `hooks/useStore.ts`, `types/`, the routes or the localStorage keys (including `splititt-theme`). `npm test` must still pass.
- Keep class-based dark mode (`.dark` on `<html>`, set by `public/theme-init.js` and `store/theme.ts`).
- Keep the existing `Button` props API (`variant: primary | secondary | ghost | danger`, `size: sm | md | lg`, `loading`) so call sites don't break.
- No new UI library. Small dependency additions are OK only for the font (`@fontsource-variable/inter`).
- Mobile-first; must not overflow at 360px width.

### 1. Create `docs/DESIGN.md` (source of truth for later phases)
Document: principles, token table (light and dark values), type scale, spacing, radius, elevation, motion, iconography, the component inventory and the rules below. Keep it short and specific. Write it first, then implement it.

**Principles to write down:**
1. Content over chrome: amounts and names are the loudest things on screen.
2. One neutral ramp; hierarchy comes from weight, size and spacing, not colour.
3. Meaning never relies on colour alone (sign + word + icon).
4. Hairlines over shadows; shadow only for floating layers (sheet, modal, toast, popover).
5. Sentence case everywhere. No uppercase UI text except at most a 11px section overline, and preferably none.
6. Every interactive target is at least 44×44px on touch.

### 2. Tokens in `src/index.css`
Rewrite `index.css`. Delete the unused `--color-indigo-*` alias, the offset `--shadow-*` values, the lime selection and focus colours, and the `avatar-pulse`/`avatar-float` keyframes if they're no longer used (grep first).

Define **raw semantic CSS variables** on `:root` and `.dark`, then expose them to Tailwind via `@theme inline` so utilities like `bg-surface`, `text-fg-muted` and `border-border` work and switch with the theme automatically. That removes the need for `dark:` variants in components.

Suggested values (you may tune them, but check contrast: body text ≥ 7:1, muted text ≥ 4.5:1, borders ≥ 3:1 only where the border is the only boundary of an input):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0A0A` | App background |
| `--surface` | `#FFFFFF` | `#111111` | Cards, sheets |
| `--surface-subtle` | `#F7F7F7` | `#171717` | Inset areas, input fills, hover |
| `--surface-muted` | `#EFEFEF` | `#1F1F1F` | Pressed, selected chip bg, skeletons |
| `--fg` | `#0A0A0A` | `#F5F5F5` | Primary text, primary button bg |
| `--fg-muted` | `#5C5C5C` | `#A3A3A3` | Secondary text |
| `--fg-subtle` | `#8A8A8A` | `#737373` | Placeholder, meta, disabled (never essential info) |
| `--border` | `#EBEBEB` | `#232323` | Hairlines, card borders, dividers |
| `--border-strong` | `#D4D4D4` | `#333333` | Input borders, focused-adjacent |
| `--inverse-bg` / `--inverse-fg` | `#0A0A0A` / `#FFFFFF` | `#F5F5F5` / `#0A0A0A` | Primary CTA, active tab pill, toasts |
| `--focus` | `#0A0A0A` | `#F5F5F5` | Focus ring |
| `--overlay` | `rgb(0 0 0 / 0.4)` | `rgb(0 0 0 / 0.6)` | Modal scrim |
| `--positive` | = `--fg` | = `--fg` | "Gets back"/settled. Placeholder for future colour |
| `--negative` | = `--fg` | = `--fg` | "Owes"/destructive. Placeholder for future colour |
| `--warning` | = `--fg-muted` | = `--fg-muted` | Pending. Placeholder |
| `--accent` | = `--fg` | = `--fg` | Future brand colour hook |

Also:
- **Radius:** `--radius-sm: 6px`, `--radius-md: 10px` (inputs, buttons), `--radius-lg: 14px` (cards), `--radius-xl: 20px` (sheets, modals), `full` for pills and avatars.
- **Elevation:** `--shadow-float: 0 8px 24px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.04)` (light) with a darker equivalent plus a 1px `--border` in dark mode, because shadows barely show on black. Nothing else gets a shadow.
- **Motion:** `--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)`, durations 120ms (press/hover), 200ms (sheet/modal), 280ms (page). Keep the existing `prefers-reduced-motion` block.
- **Focus:** `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`
- **Selection:** `background: var(--fg); color: var(--bg);`
- Body: `background: var(--bg); color: var(--fg); font-feature-settings: "cv11", "ss01";` (Inter's single-storey a and open digits; verify these look right, drop them if not).
- Add a `.tabular` / use Tailwind `tabular-nums` for every money value.
- Keep the existing utilities (`scrollbar-none`, `pb-safe`, `pt-safe`, `pb-nav-safe`), the number-spinner reset and the overscroll rules.

### 3. Typography
- `npm i @fontsource-variable/inter`, import it in `main.tsx`, set `--font-sans: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`. Remove `--font-mono` usage from the theme (leave `ui-monospace` as the fallback if anything still needs it, e.g. UPI IDs).
- Remove the Google Fonts `<link>`/preconnects from `index.html` and the Google Fonts runtime-caching rule in `vite.config.ts`. Make sure `woff2` stays in `globPatterns` so the font is precached for offline use.
- Tighten the CSP in `vercel.json`: drop `https://fonts.googleapis.com` and `https://fonts.gstatic.com` from `style-src`, `font-src` and `connect-src`.
- Verify the **₹ glyph** renders in Inter (it should). Check `€ £ ¥` as well, since `lib/currency.ts` supports 9 currencies.
- **Type scale** (document it in DESIGN.md, implement as Tailwind theme tokens or a small set of utility classes):
  - `display` 32/38 semibold, tracking -0.02em (hero amount)
  - `title-lg` 24/30 semibold, -0.015em (page title)
  - `title` 18/24 semibold (section/card title)
  - `body` 15/22 regular (default)
  - `body-sm` 13/18 regular (meta)
  - `caption` 12/16 medium (labels, chips)
  - Weights used: 400, 500, 600. **No 700/800/900.**

### 4. Shared primitives in `src/components/ui/`
Build these with the tokens only (no hex, no `dark:` variants unless genuinely needed). Use `cn` from `lib/utils` and `class-variance-authority`, which is already installed. Each should be small, typed and accessible.

- **`Button`**: move it here (re-export from the old `components/common/Button.tsx` path so imports keep working).
  - `primary` = `bg-inverse-bg text-inverse-fg`
  - `secondary` = `bg-surface border border-border-strong text-fg`
  - `ghost` = transparent with `hover:bg-surface-subtle`
  - `danger` = **monochrome for now**: same as `secondary`, with `text-negative` and a trash/alert icon slot. Destructive actions are always behind `ConfirmModal`, so the icon, wording and confirmation carry the meaning instead of colour.
  - Sizes 36/44/52px tall. Press state: `active:scale-[0.98]`; no translate/shadow tricks. Add an `icon` (square) size and `fullWidth`.
- **`IconButton`**: 40×40 visual, 44×44 hit area, required `aria-label`.
- **`Input`, `Textarea`, `Select`, `Field`**: `Field` wraps the label, hint, error message and `aria-describedby` wiring. Inputs are 44px tall, `bg-surface-subtle`, `border-border`, focus is `border-fg` plus a ring. Include a **`MoneyInput`** variant: large tabular digits and a currency prefix slot.
- **`Card`**: `bg-surface border border-border rounded-lg`. Variants: `default`, `interactive` (hover `bg-surface-subtle`, works as `Link`/`button` via an `asChild`-style `as` prop), `inset` (`bg-surface-subtle`, no border).
- **`ListRow`**: the Zomato/Blinkit row. Leading slot (avatar/icon tile), title + subtitle, trailing slot (amount + meta), optional chevron, optional divider. This becomes the backbone of expense, member and settlement lists.
- **`Avatar`**: monochrome initials circle (`bg-surface-muted text-fg`, sizes 20/28/36/48). `AvatarStack` with a `+N` overflow. Accept but **ignore** `color` for now (comment explaining it's reserved for the future colour phase).
- **`IconTile`**: 40×40 rounded-md `bg-surface-subtle` with a Lucide icon at 20px, stroke 1.75. This replaces emojis.
- **`Badge`**: `caption` text, `bg-surface-muted`, rounded-full, height 22.
- **`Chip`**: Blinkit-style filter pill, 36px tall, toggles between selected (`bg-inverse-bg text-inverse-fg`) and unselected (`border-border bg-surface`). Add a horizontally scrollable `ChipGroup` with `scrollbar-none` and `role="group"`.
- **`SegmentedTabs`**: for Expenses / Balances / Stats. Uses `role="tablist"`/`tab`/`tabpanel`, `aria-selected` and arrow-key navigation. The active segment is a sliding `bg-surface` pill on a `bg-surface-subtle` track. Prefer a CSS transition over framer-motion.
- **`Sheet` + `Modal`**: one accessible `Dialog` core with `role="dialog"`, `aria-modal`, `aria-labelledby`, a focus trap, focus return on close, Escape to close, scrim click to close, and body scroll lock. Render through a portal. `Sheet` = bottom sheet on mobile (rounded-t-xl, grab handle, `pb-safe`), centred modal at `sm:` and up. Build it yourself; it's ~80 lines, so don't add a dependency.
- **`StickyActionBar`**: the Blinkit bottom CTA. Fixed to the bottom above the safe area, `bg-bg/90 backdrop-blur border-t border-border`, holds one primary full-width button and optional secondary content (e.g. "Total ₹1,240"). It must account for `BottomNav` height when the nav is present.
- **`Money`**: a component that renders `formatCurrency` output with `tabular-nums`. Props: `tone: 'neutral' | 'positive' | 'negative'` (maps to the tokens), `showSign`, `size`. **Every amount in the app should go through this** in later phases.
- **`SectionHeader`**: title + optional count + optional trailing action ("See all", "Add").
- **`EmptyState`, `Toast`, `ConfirmModal`, `Skeleton`**: restyle the existing ones in `components/common` to the tokens. Toast becomes `bg-inverse-bg text-inverse-fg` with `shadow-float`, a small icon and no coloured left border. `ConfirmModal` is rebuilt on the new `Dialog`. Add a `Skeleton` (`bg-surface-muted animate-pulse rounded`).

### 5. Icon mapping (create `src/lib/icons.ts`)
Export `CATEGORY_ICONS` and `GROUP_TYPE_ICONS` as Lucide component maps. Suggested Lucide names (verify each exists in the installed `lucide-react` version):
- Categories: food → `UtensilsCrossed`, travel → `Plane`, accommodation → `BedDouble`, utilities → `Zap`, entertainment → `Clapperboard`, shopping → `ShoppingBag`, medical → `Pill`, other → `Package`.
- Groups: travel → `Plane`, roommates → `House`, friends → `Users`, dinner → `UtensilsCrossed`, other → `Shapes`.

Don't wire them into the pages yet. Phase 2 does that. Keep the old `CATEGORY_EMOJIS` export until no call site uses it.

### 6. Theme plumbing
- `store/theme.ts` and `public/theme-init.js`: update the `theme-color` meta values to `#FFFFFF` (light) and `#0A0A0A` (dark), so they match `--bg`.
- `index.html`: default `theme-color` stays `#0a0a0a`. Change `mask-icon` to `#0a0a0a`.
- Delete `src/App.css` (confirm it isn't imported anywhere first).
- `App.tsx` `PageLoader`: use tokens (`bg-bg`, spinner `border-fg border-t-transparent`).

### 7. Dev-only kitchen sink
Add a route `/__ui` that is only registered when `import.meta.env.DEV`. It renders every primitive in every variant and state (default, hover hint, disabled, loading, error, selected), with a theme toggle. Use it to verify this phase. It must not ship in the production bundle (check `dist` after build).

### Acceptance criteria
- [ ] `docs/DESIGN.md` exists and matches what was implemented.
- [ ] `npm run build`, `npm run lint` and `npm test` all pass with zero new warnings.
- [ ] `grep -rnE "#[0-9a-fA-F]{3,8}\b" src/components/ui` returns nothing.
- [ ] `/__ui` looks correct in light and dark at 360px and 1280px. All text meets the contrast targets (check with the browser devtools contrast checker).
- [ ] The `Dialog` traps focus, returns focus to the trigger, closes on Escape, and announces correctly (test with keyboard only).
- [ ] Network tab in a production preview shows **no requests to Google Fonts**. Offline reload still renders Inter.
- [ ] Existing pages still work. They'll look half-old/half-new (Button changed). That's expected.

### Out of scope for Phase 1
Page layouts, BottomNav/Sidebar/TopBar, charts, logo/icons/manifest/Android/store assets.

**Commit:** `Add monochrome design tokens, Inter font, and UI primitives`

---
---

# PHASE 2 — App shell and the core loop (Dashboard → Group → Balances)

---

You are continuing the SplitItt monochrome redesign. **Read `docs/DESIGN.md` first and follow it strictly.** Use only the primitives in `src/components/ui/` and the semantic Tailwind tokens. No hex literals, no `dark:` colour pairs, no `uppercase`, no `font-black`/`font-bold`, no offset shadows. If you need something the primitives don't have, extend the primitive (and DESIGN.md) instead of writing one-off styles.

This is **Phase 2 of 4: the shell and the screens users see 90% of the time.** Same hard constraints as Phase 1: no logic, storage, route or data-model changes.

### 1. App shell (`components/layout/`)
- **`AppShell`**: `bg-bg`. Content max width 640px on mobile and tablet. On desktop, a two-column layout with a 248px sidebar.
- **`TopBar` (mobile)**: 56px, `bg-bg/85 backdrop-blur`, a hairline `border-b border-border` that **appears only once the page has scrolled** (IntersectionObserver sentinel; Notion-like). Title 17px semibold, sentence case. Back and theme buttons use `IconButton`. **Fix the existing bug:** `GroupPage` passes actions with hardcoded `text-[#f0ede5]`, which are invisible in light mode. Rebuild them with `IconButton`.
- **Large-title pattern:** on mobile, top-level pages (Dashboard, Group) show a `title-lg` heading in the content area, and the TopBar title fades in only after that heading scrolls out of view (iOS large-title behaviour).
- **`BottomNav`**: 64px + safe area, `bg-bg/90 backdrop-blur border-t border-border`. Inactive icons `text-fg-subtle`, active `text-fg`, with a 2px top indicator or a filled icon variant. Labels 11px medium, sentence case. The centre "+" becomes a 48px `rounded-full bg-inverse-bg text-inverse-fg` button: no lift/offset, just `shadow-float`. Keep the current behaviour: add an expense inside a group, otherwise create a group.
- **`Sidebar` (desktop)**: Notion-style. Logo at the top, then nav items 36px tall, `rounded-md`, `hover:bg-surface-subtle`, active `bg-surface-muted text-fg font-medium`. Under that, a "Groups" section header, the group list with `IconTile`-small (24px) group-type icons and a member count in `text-fg-subtle`, and a "New group" ghost row. Theme toggle at the bottom. Border `border-r border-border`.

### 2. Dashboard (`pages/dashboard/DashboardPage.tsx`)
Restructure it in a Zomato/Blinkit style:
1. **Header:** "Groups" (`title-lg`) plus a subtitle like "3 groups". Desktop actions: `Import` (secondary) and `New group` (primary).
2. **Summary strip (new, presentation only):** if groups exist, show a horizontally laid-out `Card variant="inset"` with 2–3 stats computed from **existing** helpers only (e.g. total groups, total spent across groups *only if every group shares one currency*; otherwise show the count of groups with pending settlements). Don't add new calculation logic to `lib/`. If a stat needs new logic, leave it out and note it in the commit message.
3. **Group list:** each group is a `Card variant="interactive"` containing:
   - left: a `GroupType` `IconTile`;
   - middle: the name (`title`, 1 line, truncate) and "4 members · ₹12,400 spent" (`body-sm text-fg-muted`, amount through `Money`);
   - right: a chevron;
   - below: an `AvatarStack` of members (max 5, `+N`).
   Remove the "N expenses" bordered badge. It's noise; the count can go in the subtitle.
4. **Empty state:** a centred illustration-free state with a Lucide `Users` icon in a large `IconTile`, the headline "Split your first expense", one line of copy, a primary "Create a group" button and a ghost "Restore from backup" button.
5. Keep the stagger animation if it costs nothing, but cut it to opacity + 8px translate at 200ms. Remove it entirely if you can replace framer-motion here with CSS.

### 3. Group page (`pages/groups/GroupPage.tsx`)
1. **Hero (Zomato "hero number"):** group name (`title-lg`), meta line "4 members · INR". Under it, a `display`-size **total spent** through `Money`, plus a one-line caption: "Total spent".
2. **Members row:** `AvatarStack` plus an "Add" ghost chip that goes to settings. No bordered box.
3. **`SegmentedTabs`:** Expenses / Balances / Stats, sticky under the TopBar on scroll.
4. **Expenses tab:**
   - A search `Input` with a leading `Search` icon and a clear button.
   - Below it, a **`ChipGroup`** (Blinkit-style): "All", each category (icon + label) and a "Paid by" chip that opens a `Sheet` with member options. This replaces the current filters toggle panel. Keep the existing filter state logic; change only the presentation.
   - **Group expenses by date** (Today / Yesterday / "12 Nov") with a small `SectionHeader`. This is a presentation-level grouping over the already-filtered array.
   - Each expense is a `ListRow`: `IconTile` (category icon), the title, "Paid by Riya · Equally" and a receipt icon if one is attached; on the right, `Money` and the split label in `caption`.
   - Filtered-empty state: "No expenses match", with a "Clear filters" button.
5. **Mobile primary action:** a `StickyActionBar` with "Add expense" (full width), sitting above the BottomNav, *or* rely on the BottomNav "+" — **pick one, not both**, and justify the choice in the commit message. Recommendation: keep the BottomNav "+" and don't add the sticky bar here, so there is only one primary action on screen.
6. Update **`components/expenses/ExpenseCard.tsx`** to render through `ListRow` (keep the file and its props so other call sites keep working). Switch from emojis to `CATEGORY_ICONS`.

### 4. Balances tab (`components/groups/BalancesTab.tsx`)
This is where monochrome needs the most care, because it currently relies on green, amber and red.
- **Summary:** three inset stat cells (Total / Settled / Pending) with `caption` labels and `Money` values. No coloured text.
- **Net balance per member:** a `ListRow` per member with an `Avatar`, the name, and on the right `Money showSign` plus a **word**: "gets back ₹500" / "owes ₹500" / "settled up". Use `ArrowDownLeft` / `ArrowUpRight` / `Check` icons. Weight: owes = 600, gets back = 500, settled = 400 `text-fg-muted`. A thin horizontal bar (share of the largest absolute balance) in `bg-fg` on a `bg-surface-muted` track may be added; it's colour-free and scannable.
- **Suggested settlements:** each debt is a `Card` reading "Aman → Riya", with `Money` large on the right, a primary "Settle" button and a secondary "Pay via UPI" action (only where it exists today). The row must not overflow at **360px** (a fix for this went into commit `0c00bc7`; don't regress it). Let the buttons wrap below the names on narrow screens.
- **All-settled state:** a `Check` icon in an `IconTile` with "Everyone's settled up". No green.
- **Payment history:** `ListRow`s with "Aman paid Riya", the date and `Money`.
- Use `Money tone="positive|negative"` semantically even though both currently render as `--fg`. That's the hook for the future colour phase.

### Acceptance criteria
- [ ] `grep -rnE "#[0-9a-fA-F]{6}" src/components/layout src/pages/dashboard src/pages/groups/GroupPage.tsx src/components/groups/BalancesTab.tsx src/components/expenses` returns nothing.
- [ ] `grep -rn "uppercase\|font-black\|shadow-\[" ` on the same paths returns nothing.
- [ ] No emoji in these screens.
- [ ] Owe vs. owed is understandable **in a greyscale screenshot**. Ask yourself: could a colour-blind user tell who pays whom? (They should, from words and arrows alone.)
- [ ] Screenshots in light and dark at 360, 390, 768 and 1280px: Dashboard (empty plus populated), Group (each tab), with search and filters active. No horizontal scroll.
- [ ] Keyboard: the tabs work with arrow keys; every IconButton has an aria-label.
- [ ] `npm run build && npm run lint && npm test` pass.

**Commit (one per screen is fine):** `Redesign app shell in monochrome`, `Redesign dashboard`, `Redesign group page and balances`

---
---

# PHASE 3 — Forms and flows (Add expense, Expense detail, Settings, Modals)

---

You are continuing the SplitItt monochrome redesign. **Read `docs/DESIGN.md` first.** Same rules as before: primitives and tokens only, no hex, no uppercase, no logic changes. This phase covers the most complex UI in the app. Prioritise **speed of entry** (the Blinkit lesson: the fastest path to "done" wins).

### 1. Add expense (`pages/expenses/AddExpensePage.tsx`, 844 lines)
**First, refactor for structure without changing behaviour.** Split the file into presentational sub-components in `src/components/expenses/add/` (e.g. `AmountHero`, `PaidByPicker`, `CategoryPicker`, `SplitModeSelector`, `SplitEditor` with one editor per mode, `ItemizedEditor`, `ReceiptPicker`, `MoreOptions`). Keep all state and react-hook-form/zod logic in the page or a `useAddExpenseForm` hook. Diff-check: the submitted `Expense` object must be identical for the same inputs, so test every split mode manually before and after.

**Then redesign:**
1. **Amount hero** at the top: a huge `MoneyInput` (40px+, tabular, centred), auto-focused, with a currency selector chip next to it. The exchange-rate field appears inline only when the currency differs.
2. The **title** input directly below ("What was it for?").
3. **Paid by:** a horizontal row of selectable `Avatar` + name chips. The selected one gets `bg-inverse-bg text-inverse-fg`.
4. **Category:** a `ChipGroup` with icon + label (no emojis).
5. **Split:** `SegmentedTabs`-style selector (Equally / Shares / % / Exact / Items), then the editor:
   - Each member row is a `ListRow` with a checkbox or stepper and a right-aligned `Money`.
   - A **live validation line** ("₹240 left to assign" / "100% assigned ✓"), shown as text plus an icon, never colour alone.
6. **More options** (date, notes, receipt, tags, save as template) is collapsed into a disclosure section ("More details"), so the default form is short.
7. **`StickyActionBar`** with the summary "₹1,240 · split 4 ways" and a primary "Save expense" button, disabled until valid, with the reason shown on tap. BottomNav is already hidden on this route; keep that.
8. Templates: if templates exist, show them as a `ChipGroup` above the amount ("Quick add: Rent, Groceries…").
9. All inputs use `Field` with proper labels and errors via `aria-describedby`. Numeric inputs use `inputMode="decimal"`.

### 2. Expense detail (`pages/expenses/ExpenseDetailPage.tsx`)
- Hero: category `IconTile`, the title (`title-lg`), `display`-size `Money`, "Paid by Riya · 12 Nov 2026".
- "Split" section: `ListRow` per member with their share. Itemized expenses show items as nested groups.
- Receipt: a thumbnail `Card` that opens a full-screen viewer (this page has its own overlay; rebuild it on `Dialog`).
- Notes, as body text in an inset card.
- Actions: Edit (secondary) and Delete (`danger` → `ConfirmModal`). On mobile these go in a TopBar overflow or a bottom action row, not in a floating stack.

### 3. Group settings (`pages/groups/GroupSettingsPage.tsx`, 570 lines)
Notion-settings style: grouped sections with `SectionHeader`s and hairline-divided rows inside a single `Card` per section.
- **General:** name, description, type (chips with icons), currency, budget.
- **Members:** `ListRow` per member (Avatar, name, UPI ID in `body-sm text-fg-muted`), with edit/remove `IconButton`s and an "Add member" row at the end. Keep the current member-removal guard logic exactly.
- **Templates:** list with delete.
- **Data:** Export CSV, Download backup (JSON). Secondary buttons with icons.
- **Danger zone:** a separate section with the heading "Delete group" and a `danger` button plus `ConfirmModal`. In monochrome, the separation, heading and confirmation carry the weight.
- Split the file into section components if it helps readability (same no-behaviour-change rule).

### 4. Modals → `Sheet`
Rebuild each of these on the Phase 1 `Sheet`/`Dialog` (mobile bottom sheet, desktop centred), keeping their props and behaviour:
- `components/groups/CreateGroupModal.tsx`: name, type chips, currency and the member list with add/remove. Primary CTA pinned to the bottom of the sheet.
- `components/groups/RecordPaymentModal.tsx`: from → to (avatar pickers), a large `MoneyInput`, note and date.
- `components/upi/UpiQrModal.tsx`: QR code on a pure white tile with padding, **in both themes** (scanners need contrast; never invert the QR). Replace the green "copied/paid" states with a `Check` icon and text, plus a toast.
- `components/common/ConfirmModal.tsx` (if not already done in Phase 1).
- `components/common/InstallPrompt.tsx` and `UpdateBanner.tsx`: a compact `bg-inverse-bg` bar or card with `shadow-float`, consistent with Toast.

### Acceptance criteria
- [ ] Every split mode (equal, shares, %, exact, itemized), multi-currency with an exchange rate, and receipt attach/remove behave exactly as before. Write down the before/after manual test results in the commit message.
- [ ] `npm test` (calculation checks) still passes.
- [ ] All modals: focus trap, Escape, focus return, `aria-modal`, body scroll lock, `pb-safe` on mobile.
- [ ] No hex, uppercase, `font-bold`/`font-black` or emoji in any touched file.
- [ ] 360px: Add expense with 8 members in the "Exact" mode does not overflow; the sticky bar never covers the last input (add bottom padding equal to the bar height).
- [ ] On-screen keyboard (test in Chrome device mode or a real phone): the sticky bar stays usable and doesn't jump over focused inputs.
- [ ] `npm run build && npm run lint && npm test` pass.

**Commits:** `Refactor add-expense into components (no behaviour change)`, `Redesign add-expense flow`, `Redesign expense detail and group settings`, `Rebuild modals on shared sheet`

---
---

# PHASE 4 — Data viz, remaining pages, brand assets, cleanup and QA

---

You are finishing the SplitItt monochrome redesign. **Read `docs/DESIGN.md` first.** Same rules as before.

### 1. Analytics (`components/groups/AnalyticsTab.tsx`)
Monochrome charts must stay readable without hue:
- **Replace the category pie/donut with a ranked horizontal bar list** (Zomato/Notion style): category icon, label, amount (`Money`) and % share, with a bar (`bg-fg` on a `bg-surface-muted` track). A sorted bar list is more readable than an 8-slice pie in any colour scheme, and in monochrome it's the only honest option.
- **Monthly trend bar chart (Recharts):** bars `var(--fg)` at full opacity for the current month and ~35% for others; axis ticks `var(--fg-subtle)` at 12px; gridlines `var(--border)` horizontal only; no axis lines. A tooltip built from `Card` + `shadow-float`. Read colours from CSS variables via `getComputedStyle` (or pass `currentColor` and set `className` text colour), so the chart follows the theme toggle without a re-mount bug.
- **"Who paid most":** a ranked `ListRow` list with a bar, as above.
- Delete `CATEGORY_COLORS`. Leave a comment pointing to the `--accent`/future data-palette tokens in DESIGN.md.
- Empty state for groups with fewer than 2 expenses: "Add a few expenses to see insights".

### 2. Remaining pages
- `pages/about/AboutPage.tsx` (route `/privacy`): Notion-doc styling. Max width 640px, `title-lg`, body 15/24, section headings `title`, `fg-muted` for secondary copy, links underlined with `underline-offset-4`.
- `pages/NotFoundPage.tsx`: a centred large "404" (`display`), one line of copy and a primary "Go home" button.
- `components/common/PageTransition.tsx`: opacity + 6px translate, 200ms, `--ease-out`. Consider replacing it with a CSS animation; if framer-motion is then only used in a couple of places, list them and estimate the gzipped saving from removing it (`npx vite-bundle-visualizer` or the build output). **Report the number but don't remove the dependency** unless every usage is replaced cleanly.

### 3. Brand and logo
- **`components/common/Logo.tsx`:** redesign the mark in monochrome. Keep the concept (₹ cut by a diagonal slash = "split"), drawn as **paths, not `<text>`** (a `<text>` element depends on the font being loaded, so the icon renders differently per device). `currentColor` only. Wordmark: "SplitItt" in Inter 600, tracking -0.02em, sentence case, no two-tone colour.
- **`public/icon.svg`, `public/favicon.svg`:** the new mark, white on `#0A0A0A` (app icon) and a favicon that works on both light and dark browser tabs (use `prefers-color-scheme` inside the SVG, or a dark rounded square).
- Run `node scripts/gen-icons.mjs` to regenerate `public/icons/*` (192, 512, maskable-512 with safe-zone padding, apple-touch-icon). Check the maskable icon at https://maskable.app.
- **`vite.config.ts` manifest:** `theme_color: '#0A0A0A'`, `background_color: '#0A0A0A'` (or `#FFFFFF`; pick one, match the splash and justify it).
- **Android TWA:** `android/twa-manifest.json` colours already use `#0A0A0A`; confirm they still match. Update `colors.xml` `shortcut_background` if needed. **Don't change the package ID or signing config.** Note in the commit that the launcher icons and splash in `android/app/src/main/res/` need regenerating with Bubblewrap (`bubblewrap update`) and a new Play release. Don't run a release.
- **`store-assets/`:** update `feature-graphic.html` to the new style. List which screenshots need retaking. Don't overwrite the PNGs unless you regenerate them from the new UI.
- **README.md:** replace the "Design system" section (it still says "Neo-brutalist, electric lime") with a short summary linking to `docs/DESIGN.md`.

### 4. Cleanup sweep (whole `frontend/src`)
Run each of these and get the result to zero, or to a short, justified allowlist written into DESIGN.md:
```
grep -rnE "#[0-9a-fA-F]{3,8}\b" src --include=*.tsx --include=*.ts
grep -rnE "\b(uppercase|font-black|font-bold|font-extrabold|tracking-\[)" src
grep -rnE "shadow-\[" src
grep -rnE "dark:(bg|text|border)-\[" src
grep -rnP "[\x{1F300}-\x{1FAFF}]" src
```
Allowed exceptions, if any: the QR tile's pure white background, and `lib/` colour constants that are persisted data (`MEMBER_COLORS` in `CreateGroupModal`, which is user data and stays).
- Remove now-unused exports (`CATEGORY_EMOJIS`, `GROUP_ICONS` duplicates in `Sidebar`/`Dashboard`), unused keyframes and unused imports.

### 5. QA pass (record the results in the final commit message or a `docs/REDESIGN_QA.md`)
- **Viewports:** 320, 360, 390, 768, 1024, 1440. Light and dark. Every route, including the empty, populated and long-name states (a 40-character group name and a 9-digit amount).
- **Lighthouse on the production build** (`npm run build && npm run preview`): Accessibility 100, Best Practices ≥ 95, Performance ≥ 90 mobile. Compare the JS/CSS bundle size and LCP before and after; report both.
- **Keyboard-only** walk through create group → add expense → settle up.
- **Screen reader** spot check (VoiceOver or TalkBack): balances read as "Aman owes Riya ₹500", not just "₹500".
- **Greyscale test:** enable OS greyscale or use a CSS `filter: grayscale(1)`. Nothing should lose meaning (it shouldn't, since there's no colour, but this protects the future colour phase).
- **Offline:** install the PWA, go offline, hard reload. Fonts and icons must load.
- **CSP:** no console CSP violations in production preview.

### Acceptance criteria
- [ ] All the grep checks are clean (or allowlisted in DESIGN.md).
- [ ] The Lighthouse targets are met and the numbers are recorded.
- [ ] New icons are generated and the manifest is valid (Chrome DevTools → Application → Manifest shows no warnings).
- [ ] DESIGN.md is updated with anything that changed during Phases 2–4, plus a **"Phase 5: introducing colour"** section explaining exactly which tokens to change (`--accent`, `--positive`, `--negative`, `--warning`, a chart palette) and the rule that colour only *adds to* the existing sign/word/icon cues.

**Commits:** `Redesign analytics with monochrome charts`, `Redesign about and 404`, `New monochrome logo and app icons`, `Remove legacy design tokens and run QA`

---

## Notes on running this

- **One phase per branch or PR.** Phase 1 can merge safely on its own: the app will look half old and half new, but nothing breaks. Don't deploy between phases 1 and 2 if you care about the live app looking inconsistent; finish Phase 2 first and deploy then, because Phase 2 covers about 90% of what users see.
- **Review the agent's output against `DESIGN.md`, not against the prompt.** If the agent invents a one-off style, that's a primitive missing. Make it extend the primitive.
- **Biggest risk:** the `AddExpensePage` refactor in Phase 3. That's why it's a separate, behaviour-neutral commit before the redesign commit. If something breaks in the split logic, you can bisect it to one of the two.
- **Play Store:** web changes go live in the TWA immediately. Only the launcher icon and splash (Phase 4) need a new Android release.
