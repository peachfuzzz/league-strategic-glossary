# DESIGN.md — League Strategic Glossary

Constraints for visual work on this repo. Read before touching any component.
Tailwind v4, Next.js App Router, TypeScript.

The site is a **reference work**, not a dashboard. Every choice below follows from
that. If a change would look at home in a SaaS admin panel, it is wrong here.

---

## 0. Hard constraints

These are checkable. A change that violates one is a bug.

1. **No raw Tailwind palette colors in components.** No `slate-*`, `blue-*`,
   `gray-*`, `zinc-*`. Only semantic tokens (§1). Enforced by clearing the color
   namespace — see §1.
2. **No bordered/elevated cards for glossary entries.** No `border rounded-lg` box
   per term. Entries are separated by whitespace and hairline rules only.
3. **No pill/badge components.** Category labels are uppercase mono text, not chips.
4. **Body measure capped at 68–72 characters.** Use `max-w-[68ch]`, not full-width.
5. **No icons on text buttons.** Icons only where there is no text (graph controls).
6. **Search is a visible input**, not a button that opens a modal. No `⌘K` badge.
7. **Every color and font decision derives from the token block.** If a value is
   needed that isn't a token, add a token — don't inline a hex.

---

## 1. Tokens (Tailwind v4)

All tokens live in `app/globals.css` inside `@theme`. There is no
`tailwind.config.ts` color config in v4 — do not create one.

```css
@import "tailwindcss";

@theme {
  /* Clear the default palette so `bg-slate-900` fails to compile.
     NOTE: this also removes `black` and `white`, so `text-white` and
     `bg-black` stop resolving — they render as nothing rather than
     erroring. Convert those to ink/paper tokens in the same pass.
     Re-add the two keywords Tailwind needs internally. */
  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;

  /* Surfaces */
  --color-paper:      #F7F5F0;  /* page */
  --color-paper-2:    #FFFDF9;  /* raised: search field, active states */
  --color-rule:       #DDD8CE;  /* hairlines */

  /* Ink */
  --color-ink:        #171614;  /* headwords, primary text */
  --color-ink-2:      #4A4740;  /* definitions */
  --color-ink-3:      #75706A;  /* metadata, category labels — 4.50:1 on paper */

  /* Signal — used sparingly, small areas only */
  --color-signal:     #B0261F;  /* cross-references, headword marks */
  --color-signal-2:   #7A1A15;  /* hover/active */

  /* Type — loaded via next/font/google in layout.tsx, .variable classNames
     on <html>. A token pointing at an unloaded font variable invalidates the
     whole declaration and falls back to Tailwind's sans stack, not to the
     serif listed here. If text goes unexpectedly sans-serif, that's the cause. */
  --font-display: var(--font-newsreader), Georgia, serif;
  --font-body:    var(--font-spectral), Georgia, serif;
  --font-ui:      var(--font-spectral), Georgia, serif;
  --font-mono:    var(--font-jetbrains-mono), ui-monospace, monospace;

  /* Rhythm */
  --spacing-entry: 3rem;   /* between glossary entries */
  --measure: 68ch;
}
```

Usage: `bg-paper text-ink font-body max-w-[--measure]`.

### Why this palette

Red headwords are the oldest convention in printed reference work — the word
"rubric" comes from it. It gives the site a signal color that means exactly one
thing (this is a term you can follow) at very small area, against paper.

**Palettes to avoid**, because they are the current generative defaults and will
undo the whole point of this exercise:

- Dark navy/slate with a blue accent (what the site has now).
- Cream `#F4F1EA` + high-contrast serif + terracotta/clay `#D97757` accent.
- Near-black with a single acid-green or bright-vermilion accent.
- Purple or blue gradients, anywhere, for any reason.

If a palette change is proposed, check it against this list first.

---

## 2. Typography

| Role | Face | Size | Treatment |
|---|---|---|---|
| Headword | display (Newsreader) | 1.5rem | `--color-ink`, weight 600, tight tracking |
| Also-known-as | body (Spectral) | 0.8125rem | `--color-ink-3`, italic |
| Category | mono | 0.6875rem | `--color-ink-3`, uppercase, tracking-wide |
| Definition | body (Spectral) | 1.0625rem | `--color-ink-2`, line-height 1.65 |
| Cross-reference | inherits body | — | `--color-signal`, `decoration-1`, 40% opacity |
| See-also list | ui (Spectral) | 0.875rem | label uppercase + tracking, terms in signal |

Underline cross-references at `decoration-1` (1px). Browsers derive `auto`
thickness from the font, which at 17px lands near 2px and turns a
cross-reference-dense paragraph into stripes.

Both discovered and undiscovered terms are underlined and clickable — following
an undiscovered link is how discovery works, so hiding the affordance would hide
the mechanic. Color carries the distinction: signal for discovered, ink-3 for
undiscovered, each with its underline at matching opacity.

### Also-known-as is italic

Deliberate. Print reference works set alternate forms and variant names in
italic, and this design is a book rather than a UI — uppercase-with-tracking is a
web convention that would sit oddly here.

Two conditions make it work: it stays `--color-ink-3` (the color does the
receding, not the slant), and the **category label never uses italic**. Category
is a classification, not a variant name; it stays mono uppercase so the two are
never confused.

### No synthesized small caps

Neither Newsreader nor Spectral ships the `smcp` OpenType feature, so
`font-variant-caps: small-caps` gets **synthesized** — the browser scales down
full capitals, which thins the strokes and reads flat and squat. Never use it
with these faces.

Where this document says "mono uppercase" (category label, `last_revised`,
see-also label), that means literal uppercase with tracking, not
`font-variant-caps`:

```
uppercase tracking-[0.08em] text-[0.6875rem] font-medium
```

If real small caps become a requirement later, EB Garamond and Cormorant ship
`smcp` on Google Fonts and would need `font-feature-settings: "smcp" 1`.

Spectral is **not a variable font** — only the weights enumerated in its
`next/font` import exist. Any other weight is browser-faked and looks soft.
Newsreader is variable; Spectral is not.

---

## 3. The entry

Delete `EntryCard` (or equivalent). Rebuild as a semantic unit:

```
BLINDSPOT                                          GAME MECHANICS
also known as: fog gap

  The region of the map an actor cannot observe given current ward
  coverage and vision score. Blindspots are where tempo is spent...

  SEE ALSO   crash · freeze · slow push
```

- Headword flush left. Category flush right, same baseline, mono uppercase.
- Also-known-as sits inside the `<dt>`, flush left with the headword — not
  indented with the definition.
- Definition indented from the headword by `1.5rem`, capped at `--measure`.
- Cross-references inside the definition are inline links in signal color, 1px
  underline at 40% opacity. Both discovered and undiscovered terms are
  underlined and clickable; only the color differs (signal vs. `--color-ink-3`).
  They are not extracted into a separate list; the whole point is that the prose
  is the graph.
- "See also" is a genuinely different relation (§5) and stays a trailing list.
  It keeps the same discovered/undiscovered color distinction as inline
  cross-references.
- Entries separated by `--spacing-entry` and a single hairline rule at
  `--color-rule`. No box, no shadow, no radius.

The list view becomes one continuous column, not a stack of objects.

### Implementation constraints

These are places the obvious implementation is silently wrong.

**Measure.** `ch` resolves against the font size of the element carrying the
rule, so `--measure` must sit on the definition itself (1.0625rem), not on a
wrapper. Put indentation on the wrapper instead — the two must not share an
element.

**Tailwind v4 custom property syntax.** `max-w-(--measure)` compiles to
`var(--measure)`. `max-w-[--measure]` compiles to the bare token `--measure`,
which browsers drop silently: no error, no effect, no visible failure. Use the
paren form. This applies to every arbitrary custom-property reference, not just
`max-w`.

**Entry spacing.** `space-y` and margin are one-sided — v4 applies them to
`:not(:last-child)` on the bottom edge only — so they cannot center the hairline
in the gap. The rule ends up flush against one entry with the whole gap on the
other side. Use `divide-y` for the rule and split the gap across both sides of
the border with per-entry padding instead:

```
py-[calc(var(--spacing-entry)/2)] first:pt-0 last:pb-0
```

Do not combine this with `space-y` on the parent. Padding *instead of* `space-y`
is correct; padding *in addition to* it doubles the gap.

**`<dl>` content model.** With `<div>` wrappers, each wrapper is strictly
`dt+ dd+`. Nothing else may sit between them. Also-known-as belongs inside the
`<dt>`.

**Unlayered CSS wins.** A rule in `globals.css` outside any `@layer` beats every
Tailwind utility regardless of specificity. That makes conflicts invisible
rather than loud — a wrong utility class appears to work because the unlayered
rule is quietly overriding it. Keep one source of truth per property: if
`.also-known-as` sets size and color, no utility class should also set them.

**Multiple tags.** Show only the first tag as the category label. Joining them
recreates the pill row the entry is meant to remove.

### The category label vs. the tagColors carve-out

These conflict, and this section wins. The category label on an entry becomes
`--color-ink-3` mono uppercase — which means it stops reading `tagColors`, even
though tag color removal is otherwise deferred to Pass 4.

The carve-out narrows accordingly. From Pass 2 onward it covers only the
**filter and search UI** — `TagSidebar`, `TagFilterDropdown`, and the colored dots
in `SearchOverlay`. Entry-level category display is Pass 2's job.

Rationale: an entry cannot be "one continuous column with no boxes" while its
category is still a colored pill. The two constraints are the same change.

---

## 4. Chrome

The header should be a wordmark and a search field. That's close to all of it.

- **Search:** always-visible input, `bg-paper-2`, 1px `--color-rule` border,
  no radius above 2px. Placeholder: `Search terms`. It is the primary action of a
  glossary and should be the largest interactive element on the page.

  It lives in `Header.tsx`, but renders only on `/`, `/term/*`, and the glossary
  views. Omit it on `/about` and `/credits` — those are prose pages about the
  project, and a search field there implies it will find text on the page rather
  than glossary terms.

  Because the header sits above the page tree, search state cannot live in
  `GlossaryGraph.tsx`. On routes where no glossary view is mounted, selecting a
  result navigates to `/term/{slug}`.

  Keep the ⌘K shortcut; remove the badge that advertises it.
- **Two controls, not one.** Mode (Explore / View All) and presentation
  (List / Graph) are orthogonal axes — all four combinations are meaningful — and
  must not be collapsed into a single segmented control. The current UI renders
  `View All | List | Graph` as one row, which is the bug.

  **View switcher:** two text labels, `List` and `Graph`. No icons. Active state
  is ink weight plus a 2px signal underline, not a filled pill.

  **Mode toggle:** `Explore` / `View All`, separate control, inactive side in
  `--color-ink-3`. The discovery count belongs here and nowhere else.

  Both live in the glossary toolbar, not the header. The header is a wordmark and
  a search field; adding four controls to it defeats the point.
- **Graph controls** (zoom, fit, fullscreen) move into the graph view itself,
  bottom-right, and only render there.
- Delete the help `?` icon button; put a one-line instruction under the graph.

---

## 5. The graph

This is a hand-rolled HTML5 Canvas force simulation in `GraphView.tsx`, not a
library. Every node currently renders at the same radius, so a six-edge hub and an
isolated term look identical — the visualization encodes no information. Fix in
order.

1. **Size nodes by degree.** Radius scales with `links.length + autoLinks.length`.
   Hubs should be visibly hubs.
2. **Two edge types, visually distinct.**
   - *Definitional* — the `autoLinks` field: terms written in backticks inside
     another term's definition. **Directional.** Thin arrow, `--color-ink-3`.
   - *Associative* — the `links` field: curated "Also see" references from
     frontmatter. **Undirected.** Dotted line, lighter.

   Both fields already exist on `GlossaryTerm` and the build script already
   populates them. Do not invent a new schema; read what's there.
3. **Layered layout mode.** This is the signature element of the site and the
   thing worth spending effort on.

   The definitional edges form a near-DAG. Primitives (`actor`, `object`, `value`,
   `threat`) sit at the bottom; composites (`pressure`, `tension`, `kill pressure`)
   sit above them. Compute depth from the definitional subgraph and lay out by
   depth rather than force.

   Cycles will exist. Do not error on them — collapse each strongly-connected
   component into a single layer and note it in the UI. Mutually-defined terms are
   an interesting finding about the vocabulary, not a data bug.

   Ship force-directed and layered as two toggleable modes. Layered is the default.

   **Persist the computed depth on each term.** It is not only a layout coordinate.
   Depth is a prerequisite ordering: a reader cannot hold `pressure` before
   `threat`, or `threat` before `object` and `value`. Expose it as a field so other
   features can read it — Explore mode ordering, a "start here" set (depth 0), and
   a per-term "you should know these first" list all fall out of the same number.

### Explore mode

Explore mode adds a third node state (undiscovered) and a third edge state
(trailing off to an undiscovered term). Encode both with *value*, not hue:

- Discovered node: `--color-ink`, filled.
- Undiscovered node: `--color-rule`, outline only, no label.
- Trail edge: existing dashed treatment, `--color-rule`.

This keeps the two-color rule intact. Do not introduce a "discovered" accent color.

Explore's default starting term should be a depth-0 primitive, not `last-hit`.
Walking up the dependency graph from a primitive is a coherent path through the
vocabulary; walking outward from an arbitrary term is a random walk.

### Node color

`--color-ink` default, `--color-signal` on hover/selection. Two colors total.
**Do not color-code nodes by tag** — that reintroduces a legend and a twelve-color
palette, and it is the single biggest contributor to the current look. Tag identity
moves to the mono uppercase label on the entry (§2).

---

## 6. Conflicts with existing docs

`REWORK_PLAN.md` predates this file and contradicts it in four places. This file
wins; those entries should be struck from the plan.

| REWORK_PLAN says | This file says |
|---|---|
| Phase 1: "Search trigger (Cmd+K indicator)" | §4 — visible input, no ⌘K badge |
| Phase 4: node icons per category, pie-chart coloring for multi-tag nodes | §5 — two colors, size by degree, no category color |
| Phase 5: "League-inspired decorative elements (hextech patterns)" | Direction is neutral; no League visual borrowing |
| Phase 5 marked Complete: Cinzel display font, gold accent variables | Superseded — Cinzel and the gold accent are the thing being replaced |

`TAG_MANAGEMENT.md` recommends tag colors `#3b82f6 / #10b981 / #a855f7 / #f59e0b /
#ef4444 / #6366f1`. That is the Tailwind default palette, and it is the origin of
the look this file exists to remove. Tag colors stop driving anything visual; keep
the `color` field in `tags.config.ts` only if something still reads it.

---

## 7. The landing page

`/` is a front door, not a view switcher. Neither List nor Graph works as one:
List is a lookup surface that assumes you know what you want, Graph is
orientation that assumes you already have terms.

Structure, top to bottom:

1. **Two or three sentences** on what the glossary is. Not the About essay — a
   compressed version, with a link to the full one.
2. **One featured entry, rendered in full** using the §3 entry treatment. Not a
   card, not a teaser — the actual entry, so a visitor sees what the material
   looks like and the cross-references inside it become their first clicks.
3. **A quiet line** into List and Graph.

The featured term is drawn from a **curated set**, not chosen at random and not
computed from depth. Depth 0 mixes true primitives (`actor`, `object`) with terms
that are merely lexically isolated (`hook`, `squishy`), so it is not a
"start here" filter. The set should favor terms whose definitions are dense with
cross-references — an entry with four live links is a better doorway than a
precise one with none.

Store the set explicitly (`src/config/featured.config.ts` or frontmatter flag).
Deterministic daily rotation is fine; random per-load is not, since it breaks
sharing and makes the page feel unstable.

---

## 8. Explore mode non-goals

Explore mode is a lens over the reference tool, never a gate on it. These are
out of scope permanently, not deferred:

- **No content gating.** Every term is readable at every moment, in every mode.
  Undiscovered terms are styled differently; they are never withheld.
- **No prompts, nudges, or interruptions.** No "you haven't met X yet," no
  prerequisite warnings, no milestone popups. If a reader is missing a
  prerequisite, the word is already in front of them, underlined, one click
  away. The design solves this; a notification would only interrupt reading.
- **No forced ordering.** Readers enter wherever they like and follow whatever
  interests them.

Depth may inform **passive** surfaces — the layered graph, a coverage figure
someone goes looking for. It must never initiate.

Rationale: following a cross-reference *is* a walk down the dependency graph,
since a definition invokes its prerequisites. Free exploration and depth ordering
are the same motion. Nothing needs to enforce it.

These signal authorship and maintenance, which is most of what credibility is.

- Stable slug per term; `/term/{slug}` permalinks; anchor links on headwords.
- `last_revised` in frontmatter, rendered in mono uppercase at the entry foot.
- Inbound reference count per term ("referenced by 7 terms"), computed from the
  definitional graph, linking to the referrers.
- An A–Z index rail on the list view.
- A `revision` or edition number for the glossary as a whole.

---

## 9. Reference-work furniture

These signal authorship and maintenance, which is most of what credibility is.

- Stable slug per term; `/term/{slug}` permalinks; anchor links on headwords.
- `last_revised` in frontmatter, rendered in mono uppercase at the entry foot.
- Inbound reference count per term ("referenced by 7 terms"), computed from the
  definitional graph, linking to the referrers.
- An A–Z index rail on the list view.
- A `revision` or edition number for the glossary as a whole.

---

## 10. Sequencing

Do these as separate passes. Do not attempt more than one per session.

| Pass | Scope | Done when |
|---|---|---|
| 1 | Tokens. Add `@theme`, clear palette, migrate every component to tokens. | `check-design.sh 1` clean. Site looks unstyled-but-correct. |
| 2 | Typography + entry rebuild. Fonts loaded via `next/font`. Cards deleted. | No `rounded` or `border` on any entry. Measure capped. Visual diff reviewed. |
| 3 | Chrome. Search field, text-label switcher, control relocation. | Header contains a wordmark and an input. |
| 4 | Graph: node sizing + edge types. | Hubs visibly larger; two edge styles render. |
| 5 | Graph: layered mode + cycle handling. | Layered is default; SCCs collapse without error. |
| 6 | List navigation (§10.2). | Clicking a cross-reference scrolls to and focuses the target, in both modes. |
| 7 | Landing page (§7). | `/` renders preface, featured entry, and links out. |
| 8 | Furniture (§9). | Permalinks resolve; inbound counts render. |

Pass 1 is the one that makes the rest cheap. Do not skip ahead to the graph.

### 10.2 List navigation

The list currently renders every term and leaves position to the user, so
following a cross-reference means scrolling to find where the target landed.
In View All, cross-references do nothing at all. Both are the same gap: the list
has no notion of navigating *to* a term.

This is the primary interaction in a Wikipedia-style reference and it does not
work. Fix in Pass 6:

- Clicking a cross-reference scrolls the target into view and focuses it, in
  both Explore and View All.
- Newly discovered terms are scrolled to, not merely inserted.
- Focus is visible (§11) and announced for screen readers.
- Back/forward should return the reader to where they were.

### 10.1 Verification

Checks live in `scripts/check-design.sh`, not in this document. Duplicating them
here guarantees the two copies drift.

```bash
./scripts/check-design.sh 1    # checks required by Pass 1; later ones show PENDING
./scripts/check-design.sh      # everything
```

Exit code is the number of failures. Run it before invoking `design-reviewer` and
before every commit.

Two things it exists to catch that the obvious grep does not. An unmatched Tailwind
utility in v4 produces no CSS rather than an error, so a stale `bg-emerald-500`
renders as nothing and the build still passes. And the canvas draws with
`fillStyle`/`strokeStyle` string literals, which no class-based check can reach.

Canvas colors must resolve from tokens, cached on mount — never per frame:

```ts
const css = getComputedStyle(document.documentElement);
const ink = hexToRgb(css.getPropertyValue("--color-ink"));   // "23, 22, 20"
ctx.fillStyle = `rgba(${ink}, 0.06)`;
```

Store RGB triples rather than hex so alpha composes at the call site, and seed the
cache with real fallback values — an empty string assigned to `fillStyle` is a
silent no-op, so a missing token would otherwise produce a mystery-colored graph
instead of an obviously broken one.

`tags.config.ts` and `glossaryData.ts` are the expected color exceptions; their
values are removed in Pass 4.

---

## 11. Quality floor

Not worth stating in a commit message, just do it: responsive to 375px, visible
keyboard focus rings (signal color, 2px offset), `prefers-reduced-motion`
respected, real `<dl>`/`<dt>`/`<dd>` semantics for the entry list.

**Contrast.** Measured against `--color-paper`: `--color-ink` 16.6:1,
`--color-ink-2` 8.5:1, `--color-signal` 6.1:1. All clear AA comfortably.

`--color-ink-3` was `#85807A` at **3.59:1**, which fails AA for normal text — and
it is used at 11px and 13px, well below the large-text exemption. §1 now
specifies `#75706A` (4.50:1). Darken rather than enlarge; the small sizes are
load-bearing.

Non-text UI (hairline rules, undiscovered node outlines) needs only 3:1 and is
exempt.
