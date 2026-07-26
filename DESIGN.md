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
3. **No pill/badge components.** Category labels are small-caps text, not chips.
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
  --color-ink-3:      #85807A;  /* metadata, category labels */

  /* Signal — used sparingly, small areas only */
  --color-signal:     #B0261F;  /* cross-references, headword marks */
  --color-signal-2:   #7A1A15;  /* hover/active */

  /* Type */
  --font-display: "Newsreader", Georgia, serif;
  --font-body:    "Source Serif 4", Georgia, serif;
  --font-ui:      "Inter", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

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
| Headword | display | 1.5rem | `--color-ink`, weight 600, tight tracking |
| Also-known-as | ui | 0.8125rem | `--color-ink-3`, small caps, not italic |
| Category | mono | 0.6875rem | `--color-ink-3`, uppercase, tracking-wide |
| Definition | body | 1.0625rem | `--color-ink-2`, line-height 1.65 |
| Cross-reference | inherits body | — | `--color-signal`, 1px underline at 40% opacity |
| See-also list | ui | 0.875rem | label in mono small caps, terms in signal |

Small caps: use `font-variant-caps: small-caps` where the face supports real small
caps; otherwise uppercase at reduced size with positive tracking. Do not fake it
with `text-xs uppercase` alone — that reads as a UI label, which is the thing being
avoided.

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

- Headword flush left. Category flush right, same baseline, mono small caps.
- Definition indented from the headword by one step, capped at `--measure`.
- Cross-references inside the definition are inline links in signal color. They
  are not extracted into a separate list — the whole point is that the prose is
  the graph.
- "See also" is a genuinely different relation (§5) and stays a trailing list.
- Entries separated by `--spacing-entry` and a single hairline rule at
  `--color-rule`. No box, no shadow, no radius.

The list view becomes one continuous column, not a stack of objects.

---

## 4. Chrome

The header should be a wordmark and a search field. That's close to all of it.

- **Search:** always-visible input, `bg-paper-2`, 1px `--color-rule` border,
  no radius above 2px. Placeholder: `Search terms`. It is the primary action of a
  glossary and should be the largest interactive element on the page.
- **View switcher:** three text labels (`All` / `List` / `Graph`). No icons. Active
  state is ink weight + a 2px signal underline, not a filled pill.
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
moves to the mono small-caps label on the entry (§2).

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

## 7. Reference-work furniture

These signal authorship and maintenance, which is most of what credibility is.

- Stable slug per term; `/term/{slug}` permalinks; anchor links on headwords.
- `last_revised` in frontmatter, rendered in mono small caps at the entry foot.
- Inbound reference count per term ("referenced by 7 terms"), computed from the
  definitional graph, linking to the referrers.
- An A–Z index rail on the list view.
- A `revision` or edition number for the glossary as a whole.

---

## 8. Sequencing

Do these as separate passes. Do not attempt more than one per session.

| Pass | Scope | Done when |
|---|---|---|
| 1 | Tokens. Add `@theme`, clear palette, migrate every component to tokens. | Both checks in §8.1 come back clean. Site looks unstyled-but-correct. |
| 2 | Typography + entry rebuild. Fonts loaded via `next/font`. Cards deleted. | No `rounded` or `border` on any entry. Measure capped. Visual diff reviewed. |
| 3 | Chrome. Search field, text-label switcher, control relocation. | Header contains a wordmark and an input. |
| 4 | Graph: node sizing + edge types. | Hubs visibly larger; two edge styles render. |
| 5 | Graph: layered mode + cycle handling. | Layered is default; SCCs collapse without error. |
| 6 | Furniture. | Permalinks resolve; inbound counts render. |

Pass 1 is the one that makes the rest cheap. Do not skip ahead to the graph.

### 8.1 Verification

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

## 9. Quality floor

Not worth stating in a commit message, just do it: responsive to 375px, visible
keyboard focus rings (signal color, 2px offset), `prefers-reduced-motion`
respected, real `<dl>`/`<dt>`/`<dd>` semantics for the entry list, contrast
verified at AA for `--color-ink-2` on `--color-paper`.
