# TeioOS Design System
**The Examination Register** — a visual identity grounded in what this software actually is: the official system of record for a formal, invigilated exam (hall tickets, admit cards, answer sheets, official seals) — not another blue-and-slate SaaS dashboard.

> **For the coding agent reading this file:** this replaces ad-hoc styling, not the component architecture — `Card.jsx`, `Button.jsx`, the loading skeletons, empty/error states, and the ARIA-grid `QuestionPalette.jsx` keyboard navigation are already good and should not be rebuilt. Work token-first: update `server/admin/src/styles/tokens.css` and `server/exam-client/src/styles/tokens.css` (keep them identical for shared tokens — they've drifted, see §6), then sweep component files for hardcoded values that bypass the tokens. After each pass, take a screenshot of the login page, dashboard, and active-exam view and check them against §7 (self-critique) before moving on. Do not do a full rewrite in one shot — land tokens, review, then sweep components.

---

## 0. Why the current UI reads as generic / AI-slop

Named plainly, so it's obvious what to change:

1. **The palette is the default Tailwind admin-template palette.** `--color-navy-primary: #1e3a8a` is Tailwind's stock `blue-900`; `--color-bg-subtle: #f1f5f9` is stock `slate-100`. This exact pairing is what a huge share of scaffolded dashboards ship with, untouched.
2. **The "SaaS-card kit" pattern**: identical rounded cards (`Card.jsx` hardcodes `rounded-xl`), the same soft grey `shadow-sm`/`md` under all of them, no visual hierarchy between a card that matters and one that doesn't.
3. **Template chrome, regardless of subject matter**: tracked-out ALL-CAPS labels used as the *default* heading treatment — the sidebar group labels, the `LoginPage.jsx` title ("TEIOOS STUDENT EXAMINATION PORTAL"), the `QuestionPalette.jsx` header — all uppercase, all `tracking-wide`/`tracking-widest`. This specific tic, applied everywhere rather than at one deliberate point, is one of the most recognizable signs of unstyled/generated UI.
4. **No point of view.** Nothing about the current UI is *specific* to an exam platform — the same components would look identical wrapping a CRM or a billing dashboard. Nothing borrows from what real exam paperwork, hall tickets, or answer sheets actually look like.
5. **Radius and shadow values are inconsistent and arbitrary** — `Card.jsx` uses `rounded-xl`, `LoginPage.jsx` uses `rounded-2xl`, `tokens.css` defines a completely different `--radius-xl: 8px`. Nobody decided this; it accumulated.

The fix is not "add more design" — it's replacing steps 1–4 with choices that actually come from the subject matter, and enforcing them everywhere instead of `rounded-whatever` on a per-file basis.

---

## 1. The concept

TeioOS runs formal, invigilated examinations. Real exam paperwork — hall tickets, OMR answer sheets, admit cards, mark sheets — has a specific visual vocabulary: dense but precise information, ruled fields, official stamps and seals for verification, serif type for the institutional parts and a clean grotesk for the working parts, ink-on-paper color, and *zero* decorative flourish because nothing on a real exam form is there to look nice — it's there to be correct.

That's the design: **quiet, precise, document-like, with exactly one deliberate ceremonial moment** (the submission seal — see §5). Everything else stays disciplined.

---

## 2. Color

Four named colors plus the two paper/ink neutrals. Use these instead of the current navy/slate:

```css
--teio-paper:      #F2F3EE;  /* page background — cool, muted paper. NOT warm cream. */
--teio-paper-raised: #FFFFFF; /* card/surface background */
--teio-ink:        #14181C;  /* primary text — near-black ink-blue, not pure #000 or navy-900 */
--teio-ink-muted:  #565B54;  /* secondary text */
--teio-rule:       #D8D6CB;  /* borders, hairlines — "ruled paper" lines */
--teio-rule-strong:#B5B2A3;

--teio-seal:       #7C2D2D;  /* the ONE accent — deep stamp/seal red. Primary actions, active states, the submission seal. Used sparingly. */
--teio-seal-hover: #641F1F;
--teio-seal-tint:  rgba(124, 45, 45, 0.08); /* selected-row/active-nav backgrounds */

--teio-ledger:     #3D5A5B; /* secondary structural color — muted ink-teal, for the palette/exam-specific chrome (question numbers, secondary UI accents) so it doesn't compete with the seal red */
```

Keep the existing status colors (`--color-status-success/warning/danger/info`) — green/amber/red/blue for answered/pending/flagged/info is the right convention for exam software and shouldn't be reinvented — but desaturate them slightly so they sit next to the paper/ink palette instead of looking like stock Tailwind greens/reds:

```css
--color-status-success: #3F7A4F;   /* was #15803d */
--color-status-warning: #A66A1E;   /* was #b45309 */
--color-status-danger:  #A13B34;   /* was #b91c1c */
--color-status-info:    #3D5A80;   /* was #1d4ed8 */
```

**Rule: `--teio-seal` is the only saturated color in the interface**, reserved for the single primary action on any given screen and the submission-confirmation moment. If two things on a screen are both trying to be red, one of them is wrong.

### Dark mode
Flip the paper/ink relationship, keep the same seal red brightened slightly for visibility:
```css
--teio-paper: #17191C; --teio-paper-raised: #1F2225;
--teio-ink: #EDEBE3; --teio-ink-muted: #A6A69C;
--teio-rule: #33362F; --teio-seal: #C1544C;
```

### High-contrast mode
Leave this alone — it's a functional accessibility surface, not a branding surface. Keep the existing pure black/white/yellow scheme in both `tokens.css` files exactly as it is.

---

## 3. Typography

One family, three roles — a deliberate, coherent choice (IBM Plex was designed for institutional/technical documents, which is the actual register this software belongs to) rather than grabbing a display serif for personality points:

| Role | Typeface | Where |
|---|---|---|
| Institutional / document headings | **IBM Plex Serif**, weight 500–600 | Page titles, the login card title, exam paper title/instructions — anywhere the text is standing in for an official document heading |
| UI / working text | **IBM Plex Sans**, weight 400–500 | Everything else — buttons, nav, body copy, form labels |
| Tabular / identifying data | **IBM Plex Mono**, weight 500 | Roll numbers, timer, exam codes, question numbers — data that must not visually jitter or be mistaken for prose |

Type scale (rem-based so accessibility font-scaling still works):
```css
--text-display: 1.75rem/2.25rem;  /* 28px — rare, top-level page titles only */
--text-h1: 1.375rem/1.875rem;     /* 22px */
--text-h2: 1.125rem/1.625rem;     /* 18px */
--text-body: 0.9375rem/1.5rem;    /* 15px */
--text-caption: 0.8125rem/1.25rem;/* 13px */
```

**Ban list — remove these wherever found, no exceptions:**
- Uppercase + letter-tracking as a default heading/label style. The *only* legitimate uppercase use in this product is a genuine exam-paper convention — e.g. a real "SECTION A" divider inside an actual question paper — never a UI chrome label like a sidebar group or a card header.
- A spaced em-dash or middot-joined metadata string ("Draft · Updated 2h ago") — write it as normal prose instead ("Draft, updated 2 hours ago").
- An arrow (`→`) appended to button or link text.
- Any gradient text or gradient background wash.

---

## 4. Layout, radius, elevation

- **Radius: `4px` everywhere, no exceptions.** Not the current mix of 4/6/8/16/24px across files, and not zero (zero-radius-plus-hairlines is its own cliché — see the newspaper/broadsheet look). A small, consistent, slightly-cut corner reads as a card or form field with a physical edge, not a soft blob. Fix `Card.jsx`'s hardcoded `rounded-xl` and `LoginPage.jsx`'s hardcoded `rounded-2xl` to this.
- **No drop shadows on cards.** Paper doesn't float. Replace `shadow-sm`/`shadow-md` on `Card.jsx` with a `1px solid var(--teio-rule)` border. Reserve actual elevation shadow for things that are genuinely floating above the page — modals, dropdowns, toasts only.
- **Ruled dividers, used deliberately.** A single hairline (`1px solid var(--teio-rule)`) between sections of a form or a question list is an on-brief structural device (real answer sheets are ruled). Don't turn this into a dense broadsheet grid — one rule per genuine division, not decorative framing everywhere.
- Sidebar, page margins, breakpoints stay as currently structured (280px sidebar, `sm/md/lg/xl` at 640/768/1024/1280) — no need to change what isn't part of the "generic" problem.

---

## 5. The one deliberate moment: the submission seal

Spend all of the product's visual boldness here, once, and keep everything else quiet. When a student submits an exam (`ActiveExamPage.jsx` → confirmation), replace the generic "Exam submitted" toast/modal with a **stamp-seal confirmation**: a circular mark in `--teio-seal`, roughly 96px, with a single ring and the check/text inside it, that animates in with one deliberate press-down motion (scale from 1.15 → 1.0 with a slight overshoot, ~280ms, `ease-out`) — like a physical stamp landing on the page. This is the single non-user-triggered animation in the entire product. Respect `prefers-reduced-motion` by cutting it to an instant fade.

Do **not** add hover-lift/fade-slide-up entrance animations to cards, list items, or nav — the current codebase mostly avoids this already; keep it that way. Motion elsewhere should only ever answer a user's action (a dropdown opening, a row expanding), never play on its own.

---

## 6. Fix the drift between the two apps

`server/admin/src/styles/tokens.css` and `server/exam-client/src/styles/tokens.css` have diverged in ways that matter beyond styling:

- Admin has the full semantic status set (`success/warning/danger/info/neutral`, each with `-bg`/`-border` variants); exam-client is missing it. Port it over.
- Exam-client has `data-font-scale`, `data-line-height`, `data-letter-spacing`, and `data-dyslexic-font` support; **admin has none of this** — meaning the admin dashboard currently has no font-scaling despite that being a stated project accessibility goal. Port it over and wire up the equivalent control in admin's settings UI.
- Reconcile `--dim-sidebar-width` (280px admin vs 350px exam-client) — either there's a real reason the exam client needs more room, in which case leave a comment saying so, or it's accidental drift and should match.

Apply every token in §2–§4 to **both** files identically for the shared subset.

---

## 7. Self-critique checklist (run this after each pass)

Before calling a screen done, check it against these — they're the specific failure modes, not general polish notes:

- [ ] Is there more than one saturated/bright color competing for attention on this screen? If yes, all but one need to go quiet.
- [ ] Is any label in ALL CAPS with letter-tracking that isn't a genuine exam-paper section convention? Remove it.
- [ ] Does every card on this screen have the exact same border-radius and border treatment as every other card, regardless of what it contains? That sameness is the tell — differentiate by content weight (a primary action panel looks different from a metadata aside), not by copy-pasting the same card shell everywhere.
- [ ] Would this screen look different from a generic CRM/billing dashboard if you swapped the copy? If not, something here isn't earning its place in an exam-specific product.
- [ ] Does the only real animation in the flow answer something the user just did?
- [ ] Still true regardless of the above: visible keyboard focus, `prefers-reduced-motion` respected, high-contrast mode untouched, WCAG AA contrast on all text pairings.

---

## 8. Files to touch first

| File | Change |
|---|---|
| `server/admin/src/styles/tokens.css` | Replace color/radius/shadow values per §2–§4; add font-scale/dyslexic-font blocks from exam-client |
| `server/exam-client/src/styles/tokens.css` | Same color/radius/shadow values; add missing semantic status set from admin |
| `server/admin/tailwind.config.js` / exam-client equivalent | Confirm font family entries point at IBM Plex Serif/Sans/Mono |
| `server/admin/src/components/ui/Card.jsx` | `rounded-xl` → `rounded` (4px token); drop shadow, add `border` |
| `server/exam-client/src/pages/LoginPage.jsx` | Drop uppercase/tracking on title; `rounded-2xl` → token; title font → Plex Serif |
| `server/*/src/components/layout/Sidebar.jsx` | Drop tracking-widest on group labels (or justify it as the one legitimate use and leave only this instance) |
| `server/exam-client/src/components/exam/QuestionPalette.jsx` | Drop uppercase header; question numbers → Plex Mono; active/answered fill → new status colors |
| `server/exam-client/src/pages/ActiveExamPage.jsx` (submission flow) | Build the seal confirmation moment described in §5 |
