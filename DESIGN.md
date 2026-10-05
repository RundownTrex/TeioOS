# TeioOS Design System
**The Examination Register** — a visual identity grounded in what this software actually is: the official system of record for a formal, invigilated exam (hall tickets, admit cards, answer sheets, official seals) — not another blue-and-slate SaaS dashboard.

> **For the coding agent reading this file:** this replaces ad-hoc styling, not the component architecture — `Card.jsx`, `Button.jsx`, the loading skeletons, empty/error states, and the ARIA-grid `QuestionPalette.jsx` keyboard navigation are already good and should not be rebuilt. Work token-first: update `server/admin/src/styles/tokens.css` and `server/exam-client/src/styles/tokens.css` (keep them identical for shared tokens — they've drifted, see §7), then sweep component files for hardcoded values that bypass the tokens, using the search patterns in §9 to find every instance rather than guessing. After each pass, check the result against §8 before moving on. Do not do a full rewrite in one shot — land tokens, review, then sweep components.

---

## 0. Why the current UI reads as generic

The rules in §2–§6 exist for these five reasons — understanding them matters more than memorizing the values, because the same judgment needs to apply to screens and components not explicitly named below:

1. **Default Tailwind admin-template palette.** `--color-navy-primary: #1e3a8a` is stock `blue-900`; `--color-bg-subtle: #f1f5f9` is stock `slate-100` — unchanged from what a huge share of scaffolded dashboards ship with.
2. **"SaaS-card kit" pattern**: identical rounded cards with the same soft shadow regardless of what they contain, so nothing on the page signals which element actually matters.
3. **Template chrome regardless of subject matter**: ALL-CAPS tracked-out labels as the *default* heading treatment, applied everywhere instead of at one deliberate point — one of the most recognizable signs of unstyled/generated UI.
4. **No point of view.** Swap the copy and these screens would look identical wrapping a CRM. Nothing borrows from what real exam paperwork actually looks like.
5. **Radius and shadow values are arbitrary and inconsistent** across files — nobody decided this, it accumulated.

---

## 1. The concept

Real exam paperwork — hall tickets, OMR sheets, admit cards, mark sheets — is dense but precise, ruled, stamped/sealed for verification, serif for the institutional parts and a clean grotesk for the working parts, ink-on-paper color, zero decorative flourish, because nothing on a real exam form is there to look nice — it's there to be correct.

That's the design: **quiet, precise, document-like, with exactly one deliberate ceremonial moment** (the submission seal, §6). Everything else stays disciplined.

---

## 2. Color

```css
--teio-paper:        #F2F3EE;  /* page background — cool, muted paper, not warm cream */
--teio-paper-raised:  #FFFFFF; /* card/surface background */
--teio-ink:           #14181C; /* primary text — ink-blue, not pure black or navy-900 */
--teio-ink-muted:     #565B54;
--teio-rule:          #D8D6CB; /* borders, hairlines — "ruled paper" lines */
--teio-rule-strong:   #B5B2A3;

--teio-seal:          #7C2D2D; /* the ONE accent — stamp/seal red. Primary actions, active states, the submission seal. */
--teio-seal-hover:    #641F1F;
--teio-seal-tint:     rgba(124, 45, 45, 0.08); /* selected-row/active-nav backgrounds */
--teio-focus:         #7C2D2D; /* 3px focus outline, see §5 — same color as --teio-seal so focus reads as part of the same system, not a bolted-on browser default */

--teio-ledger:        #3D5A5B; /* secondary structural color for exam-specific chrome (question numbers, secondary accents) so it doesn't compete with seal red */
```

Desaturate the existing status colors so they sit with the paper/ink palette instead of reading as stock Tailwind:
```css
--color-status-success: #3F7A4F;  /* was #15803d */
--color-status-warning: #A66A1E;  /* was #b45309 */
--color-status-danger:  #A13B34;  /* was #b91c1c */
--color-status-info:    #3D5A80;  /* was #1d4ed8 */
```

**Rule: `--teio-seal` is the only saturated color in the interface**, reserved for the single primary action per screen and the submission moment. Two red things competing on one screen means one of them is wrong.

**Dark mode** — flip paper/ink, brighten seal slightly for contrast:
```css
--teio-paper: #17191C; --teio-paper-raised: #1F2225;
--teio-ink: #EDEBE3; --teio-ink-muted: #A6A69C;
--teio-rule: #33362F; --teio-seal: #C1544C;
```

**High-contrast mode** — leave untouched. It's a functional accessibility surface, not a branding one. Keep the existing pure black/white/yellow scheme in both `tokens.css` files exactly as-is.

---

## 3. Typography

One family, three roles — chosen because IBM Plex was designed for institutional/technical documents, not grabbed for display-font personality:

| Role | Typeface | Where |
|---|---|---|
| Institutional heading | **IBM Plex Serif**, 500–600 | Page titles, login card title, exam paper title/instructions |
| UI / working text | **IBM Plex Sans**, 400–500 | Everything else — buttons, nav, body, form labels |
| Tabular / identifying data | **IBM Plex Mono**, 500 | Roll numbers, timer, exam codes, question numbers |

```css
--text-display: 1.75rem/2.25rem;   /* 28px — rare, top-level titles only */
--text-h1: 1.375rem/1.875rem;      /* 22px */
--text-h2: 1.125rem/1.625rem;      /* 18px */
--text-body: 0.9375rem/1.5rem;     /* 15px */
--text-caption: 0.8125rem/1.25rem; /* 13px */
```

**Remove wherever found, no exceptions:**
- Uppercase + tracking as a default heading/label style. The only legitimate use is a real exam-paper convention (e.g. "SECTION A" inside an actual question paper) — never UI chrome like a sidebar group or card header.
- Middot/em-dash metadata strings ("Draft · Updated 2h ago") — write as prose ("Draft, updated 2 hours ago").
- An arrow (`→`) appended to button/link text. Gradient text or gradient background washes.

---

## 4. Layout, radius, elevation

- **Radius: `4px` everywhere, no exceptions.** Not today's mix of 4/6/8/16/24px, and not zero (zero-radius-plus-hairlines is its own cliché).
- **No drop shadows on cards.** Paper doesn't float. Replace card shadows with `1px solid var(--teio-rule)`. Reserve real elevation shadow for things genuinely floating above the page — modals, dropdowns, toasts only.
- **Ruled dividers, used deliberately.** One hairline (`1px solid var(--teio-rule)`) per genuine section division in a form or question list — not a dense broadsheet grid everywhere.
- Sidebar width, page margins, breakpoints stay as currently structured — not part of the generic-UI problem.

---

## 5. Interaction discipline (calibrated against GOV.UK Design System)

GOV.UK's design system is the reference worth studying here — not to copy its look, but because it solves the exact problem this product has: formal, high-stakes, must-be-legible-to-everyone, with zero SaaS clutter. Three of its disciplines port directly:

- **One primary (`Button` primary variant) action per screen, enforced.** If a view has two buttons both styled as primary, demote one to secondary. This matters more than any color choice for making a screen feel deliberate instead of templated.
- **Focus states are a real design decision, not a browser default.** A 3px solid outline in `--teio-focus`, offset 2px from the element, on every interactive element — visible enough to feel intentional. This is the same move GOV.UK makes with its yellow focus state: loud on purpose, because this product's accessibility goals depend on it being unmissable.
- **Validation errors are summarized, not just inline.** On any multi-field form (exam creation, student registration, login), list errors in plain language at the top of the form, each linking to its field, in addition to the inline message at the field itself. Check for an existing form-level error summary component before building a new one.

---

## 6. The one deliberate moment: the submission seal

Spend the product's visual boldness here, once. When a student submits an exam, replace the generic toast/modal with a **stamp-seal confirmation**: a circular mark in `--teio-seal`, ~96px, animating in with one press-down motion (scale 1.15 → 1.0 with slight overshoot, ~280ms, `ease-out`) — like a physical stamp landing. This is the single non-user-triggered animation in the product. Cut it to an instant fade under `prefers-reduced-motion`.

Do not add hover-lift/fade-slide-up entrance animation to cards, list items, or nav — the codebase mostly avoids this already; keep it that way. Motion elsewhere should only ever answer a user's action, never play on its own.

---

## 7. Fix the drift between the two apps

- Admin has the full semantic status set (`success/warning/danger/info/neutral`, each with `-bg`/`-border` variants); exam-client is missing it. Port it over.
- Exam-client has `data-font-scale`, `data-line-height`, `data-letter-spacing`, `data-dyslexic-font` support; **admin has none**, meaning the admin dashboard currently has no font-scaling despite that being a stated accessibility goal. Port it over and wire up the equivalent control in admin's settings UI.
- Reconcile `--dim-sidebar-width` (280px admin vs 350px exam-client) — either there's a real reason, and it gets a comment saying so, or it's accidental drift and should match.
- Apply every token in §2–§4 identically to both files for the shared subset.

---

## 8. Self-critique checklist (run after each pass)

- [ ] More than one saturated/bright color competing for attention on this screen? All but one need to go quiet.
- [ ] More than one `Button` primary on this screen? Demote all but one.
- [ ] Any ALL-CAPS tracked label that isn't a genuine exam-paper convention? Remove it.
- [ ] Every card using the identical radius/border regardless of content? Differentiate by weight (primary action panel vs. metadata aside), not by copy-pasting the same shell.
- [ ] Would this screen look different from a generic CRM/billing dashboard if the copy were swapped? If not, something here isn't earning its place.
- [ ] Is the only real animation in the flow a response to something the user just did?
- [ ] Focus states visible and consistent (§5), `prefers-reduced-motion` respected, high-contrast mode untouched, WCAG AA contrast on all text pairings.

---

## 9. Finding every instance — don't rely on a fixed file list

Repo structure shifts as work continues, so sweep with search rather than a static list of files. Run these from the repo root and fix every result, not just the ones that happen to match something mentioned above:

```bash
# Inconsistent/oversized radius
rg "rounded-xl|rounded-2xl|rounded-3xl" server/

# ALL-CAPS tracking used as a default label style
rg "tracking-wide|tracking-wider|tracking-widest" server/

# Drop-shadow-on-card pattern
rg "shadow-sm|shadow-md|shadow-lg" server/*/src/components

# Leftover default Tailwind navy/slate values
rg "#1e3a8a|#1e40af|blue-900|slate-100" server/

# Arrow-suffixed button/link text
rg "→|-&gt;" server/*/src --glob '*.jsx'

# Gradient usage
rg "bg-gradient|from-.*to-" server/*/src
```

After the token pass (§2–§4) and before the submission-seal work (§6), also do a one-time audit:
- Every screen: check for more than one primary button (§5, §8).
- Every form: confirm a field-level error has a corresponding entry in the top-of-form summary (§5).
- `server/admin` vs `server/exam-client`: diff both `tokens.css` files directly to confirm §7 is fully applied, not just the items listed there.