# DESIGN.md — League Strategic Glossary

Constraints for visual work on this repo. Read before touching any component.
Tailwind v4, Next.js App Router, TypeScript.

The site is a **reference work**, not a dashboard. Every choice below follows from
that. If a change would look at home in a SaaS admin panel, it is wrong here.

The **term page is the primary surface**. The graph is a navigation aid. The list is
an index. See `docs/adr/ADR0007-term-page-primary.md`.

---

## 0. Hard constraints

These are checkable. A change that violates one is a bug.

1. **No raw Tailwind palette colors in components.** No `slate-*`, `blue-*`,
   `gray-*`, `zinc-*`. Only semantic tokens (§1). Enforced by clearing the color
   namespace — see §1.
2. **No bordered/elevated cards for glossary entries.** No `border rounded-lg` box
   per term. Entries are separated by whitespace and hairline rules only.
3. **No pill/badge components.** Category labels are uppercase mono text, not chips.
4. **Body measure capped at 68–72 characters.** Use `max-w-(--measure)`, not
   full-width.
5. **No icons on text buttons.** Icons only where there is no text (graph controls).
6. **Search is a visible input**, not a button that opens a modal. No `⌘K` badge.
7. **Every color and font decision derives from the token block.** If a value is
   needed that isn't a token, add a token — don't inline a hex.
8. **Relation type is encoded visually and stated in text.** A reader must be able to
   tell hierarchy from association without hovering anything (§5).

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

Usage: `bg-paper text-ink font-body max-w-(--measure)`.

### Why this palette

Red headwords are the oldest convention in printed reference work — the word
"rubric" comes from it. It gives the site a signal color that means exactly one
thing (this is a term you can follow) at very small area, against paper.

**Palettes to avoid**, because they are the current generative defaults and will
undo the whole point of this exercise:

- Dark navy/slate with a blue accent.
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
| Relation label | ui (Spectral) | 0.875rem | uppercase + tracking, `--color-ink-3` |
| Relation target | ui (Spectral) | 0.875rem | `--color-signal` |
| Stub marker | mono | 0.6875rem | `--color-ink-3`, uppercase |

Underline cross-references at `decoration-1` (1px). Browsers derive `auto`
thickness from the font, which at 17px lands near 2px and turns a
cross-reference-dense paragraph into stripes.

### Also-known-as is italic

Deliberate. Print reference works set alternate forms and variant names in
italic, and this design is a book rather than a UI — uppercase-with-tracking is a
web convention that would sit oddly here.

Two conditions make it work: it stays `--color-ink-3` (the color does the
receding, not the slant), and the **category label never uses italic**. Category
is a classification, not a variant name; it stays mono uppercase so the two are
never confused.

This renders `altLabel`, not `aliases`. `aliases` is Obsidian's field and never
reaches the site.

### No synthesized small caps

Neither Newsreader nor Spectral ships the `smcp` OpenType feature, so
`font-variant-caps: small-caps` gets **synthesized** — the browser scales down
full capitals, which thins the strokes and reads flat and squat. Never use it
with these faces.

Where this document says "mono uppercase," that means literal uppercase with
tracking, not `font-variant-caps`:

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

Two contexts render an entry: the **term page** (full, primary) and the **index**
(compact). They share the headword treatment and diverge below it.

### 3.1 Term page

```
ECONOMY                                                ABSTRACT
also known as: resources                                 DRAFT

  The accrued gold and experience available to a player or team...

  KIND OF        value
  KINDS          yield · income
  PART OF        —
  PARTS          gold · experience
  SEE ALSO       tempo · trade
  REFERENCED BY  6 concepts
```

- Headword flush left. Category flush right, same baseline, mono uppercase.
- Also-known-as sits under the headword, flush left with it.
- Stub marker (`complete: false`) sits under the category, flush right, mono
  uppercase, `--color-ink-3`. It says the prose is unfinished, not that the concept
  is unimportant.
- Definition indented from the headword by `1.5rem`, capped at `--measure`.
- Cross-references inside the definition are inline links in signal color, 1px
  underline at 40% opacity.
- **Relation sections** follow the definition. Label in mono uppercase, targets in
  signal. One line per relation type. Omit a section entirely when empty rather than
  rendering an em dash — an absent relation should not occupy space.

**The relation sections carry the structure, not the graph.** Text states the
relation exactly; a graph only suggests it. A reader who never opens the graph must
still be able to see how the vocabulary decomposes. This is the load-bearing part of
the design.

### 3.2 Index

One continuous column, not a stack of objects. Headword, category, and the 200-char
summary from `index.json`. No relation sections — those live on the term page.

- Entries separated by `--spacing-entry` and a single hairline rule at
  `--color-rule`. No box, no shadow, no radius.

### Implementation constraints

These are places the obvious implementation is silently wrong.

**Measure.** `ch` resolves against the font size of the element carrying the
rule, so `--measure` must sit on the definition itself (1.0625rem), not on a
wrapper. Put indentation on the wrapper instead — the two must not share an
element.

**Tailwind v4 custom property syntax.** `max-w-(--measure)` compiles to
`var(--measure)`. `max-w-[--measure]` compiles to the bare token `--measure`,
which browsers drop silently: no error, no effect, no visible failure. Use the
paren form. This applies to every arbitrary custom-property reference.

**Entry spacing.** `space-y` and margin are one-sided — v4 applies them to
`:not(:last-child)` on the bottom edge only — so they cannot center the hairline
in the gap. Use `divide-y` for the rule and split the gap across both sides of
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
rule is quietly overriding it. Keep one source of truth per property.

**Multiple collections.** Show only the first as the category label. Joining them
recreates the pill row the entry is meant to remove.

**Cross-reference labels come from `refs`.** Each concept file carries the
`prefLabel` and `slug` of everything it references. Never load a second concept file
to resolve a label.

---

## 4. Chrome

The header should be a wordmark and a search field. That's close to all of it.

- **Search:** always-visible input, `bg-paper-2`, 1px `--color-rule` border,
  no radius above 2px. Placeholder: `Search terms`. It is the primary action of a
  glossary and should be the largest interactive element on the page.

  It lives in `Header.tsx`, but renders only on `/`, `/term/*`, and the glossary
  views. Omit it on `/about` and `/credits`.

  Search matches `prefLabel`, `altLabel`, and `hiddenLabel`. Hidden labels match but
  never display. Selecting a result navigates to `/term/{slug}`.

  Keep the ⌘K shortcut; remove the badge that advertises it.
- **View switcher:** two text labels, `Index` and `Graph`. No icons. Active state is
  ink weight plus a 2px signal underline, not a filled pill.

  The mode toggle (Explore / View All) is removed with Explore mode — see §8.
- **Graph controls** (zoom, fit, fullscreen) live inside the graph view,
  bottom-right, and only render there.
- Delete the help `?` icon button; put a one-line instruction under the graph.

---

## 5. The graph

Hand-rolled HTML5 Canvas force simulation in `GraphView.tsx`, not a library.

**The graph is currently sparse and that is correct.** Automatic linking was deleted
in Phase 1. Until wikilink conversion finishes, most nodes are isolated. Do not add
derived edges to make it look fuller. Do not judge this design against the current
render.

### 5.1 Two graphs, two jobs

**Local graph** — embedded on the term page. One concept and its immediate
neighbours. Typed edges are legible at this scale. This is navigation.

**Global graph** — a separate view showing the whole vocabulary. This is a
demonstration of structure, viewed once, not a working tool. It needs to be legible
and zoomable. It does not need state tracking, search-within-graph, or session
persistence.

### 5.2 Four edge types

Each makes a different claim and must render distinctly.

| Relation | Direction | Treatment |
|---|---|---|
| `broader` / `narrower` | directed | solid, arrowhead, `--color-ink-2` |
| `partOf` / `hasPart` | directed | solid, open diamond at whole end, `--color-ink-3` |
| `related` | undirected | dotted, `--color-ink-3`, lighter |
| `dependsOn` | directed | thin, arrowhead, `--color-rule` |

Encode with **weight, dash, and terminal** — not hue. The two-color rule holds:
`--color-ink` for nodes, `--color-signal` for hover and selection.

Each type gets an independent toggle. Default: hierarchy and part relations on,
`dependsOn` off. `dependsOn` is the densest and drowns the others when everything is
visible at once.

`related` edges arrive collapsed — the build merges `A→B` and `B→A` into one
undirected edge. The other three stay directed.

### 5.3 Node size encodes betweenness

Radius scales with betweenness centrality computed over the `dependsOn` graph, not
with raw degree. Betweenness measures how often a concept sits on a path between
other concepts — it finds bridges, where degree finds hubs.

This is not only a layout choice. It is the visual form of a claim about the
vocabulary, and it must report what the numbers say rather than what would look
good. If the prominent nodes turn out to be abstract terms rather than tactical ones,
render that. See `docs/adr/ADR0010-meso-derived.md`.

Until Phase 3 computes real metrics, size uniformly. Do not substitute degree as a
placeholder — a wrong signal reads as a real one.

### 5.4 Layered layout

The `broader` hierarchy is acyclic by construction and the build enforces it. Lay out
by hierarchy depth rather than by force.

`dependsOn` is not acyclic. Mutually-defined concepts will exist. Do not error on
them — collapse each strongly-connected component into a single layer and note it in
the UI. Mutual definition is an interesting finding about the vocabulary, not a data
bug.

Ship force-directed and layered as two toggleable modes.

### 5.5 Node color

`--color-ink` default, `--color-signal` on hover and selection. Two colors total.
Stub concepts (`complete: false`) render outline-only rather than filled — value, not
hue.

**Do not color-code nodes by collection.** That reintroduces a legend and a
twelve-color palette, and it is the single biggest contributor to the look this
document exists to remove.

---

## 6. The landing page

`/` is a front door, not a view switcher. Neither Index nor Graph works as one:
Index is a lookup surface that assumes you know what you want, Graph is orientation
that assumes you already have terms.

Structure, top to bottom:

1. **Two or three sentences** on what the glossary is. Not the About essay — a
   compressed version, with a link to the full one.
2. **One featured entry, rendered in full** using the §3.1 treatment. Not a card, not
   a teaser — the actual entry, so a visitor sees what the material looks like and
   the cross-references inside it become their first clicks.
3. **A quiet line** into Index and Graph.

The featured term is drawn from a **curated set**, not chosen at random and not
computed from graph position. The set should favor concepts whose definitions are
dense with cross-references — an entry with four live links is a better doorway than
a precise one with none.

Store the set explicitly (`src/config/featured.config.ts` or a frontmatter flag).
Deterministic daily rotation is fine; random per-load is not, since it breaks sharing
and makes the page feel unstable.

---

## 7. Front matter page

A reference work explains its own organization. This page states three things:

1. What each relation type means.
2. What the hierarchy claims.
3. What the structure of the vocabulary appears to show.

The third item is conditional on what the betweenness numbers actually show. If they
do not support the claim, the paragraph does not appear.

Report counts from the data rather than asserting them: how many concepts are
complete, how many are marked stubs. The site should describe its own state rather
than claim a state.

---

## 8. Explore mode — being removed

Explore mode is deleted in the presentation phase. Cross-reference following happens
on term pages now, which makes its state tracking redundant.

Do not invest in it. Do not restyle it. Do not extend it. If a task would touch
Explore mode, the correct move is usually to delete the code path rather than update
it.

Its `localStorage` keys under the `glossary_*` prefix go with it.

---

## 9. Reference-work furniture

These signal authorship and maintenance, which is most of what credibility is.

- Stable slug per concept; `/term/{slug}` permalinks; anchor links on headwords.
- Inbound reference count per concept ("referenced by 6 concepts"), linking to the
  referrers. The build already computes `backlinks` on each concept file.
- Previous and next in alphabetical order, over active concepts only.
- An A–Z index rail on the index view.
- A `revision` or edition number for the glossary as a whole.

Backlinks preserve asymmetry rather than repairing it. If A lists B and B does not
list A, that shows. It is unreviewed migration data, not a rendering fault.

---

## 10. Sequencing

Visual work is sequenced by the phase table in `RESTRUCTURE-PLAN.md`. This document
does not maintain a parallel numbering.

Completed: tokens, typography and entry rebuild, chrome restructuring.

Remaining visual work sits in the presentation phase, in this order:

1. Term page with relation sections (§3.1) — carries the argument
2. Chrome cleanup: remove `tagColors`, delete Explore mode, demote the list
3. Local graph on the term page (§5.1)
4. Global graph with typed edges (§5.2)
5. Toggles and betweenness sizing (§5.3)

Item 1 is the one that matters. If graph work slips, the structure is still fully
visible as text.

### 10.1 Verification

Checks live in `scripts/check-design.sh`, not in this document. Duplicating them
here guarantees the two copies drift.

```bash
./scripts/check-design.sh 1    # checks required by a given pass
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

`tags.config.ts` is the expected color exception; its values are removed when
collections are resolved.

---

## 11. Quality floor

Not worth stating in a commit message, just do it: responsive to 375px, visible
keyboard focus rings (signal color, 2px offset), `prefers-reduced-motion`
respected, real `<dl>`/`<dt>`/`<dd>` semantics for the entry list.

**Contrast.** Measured against `--color-paper`: `--color-ink` 16.6:1,
`--color-ink-2` 8.5:1, `--color-signal` 6.1:1. All clear AA comfortably.

`--color-ink-3` was `#85807A` at **3.59:1**, which fails AA for normal text — and
it is used at 11px and 13px, well below the large-text exemption. §1 specifies
`#75706A` (4.50:1). Darken rather than enlarge; the small sizes are load-bearing.

Non-text UI (hairline rules, stub node outlines) needs only 3:1 and is exempt.

**Relation type must not rely on color alone.** Weight, dash pattern, and terminal
marker carry the distinction. A reader who cannot distinguish the edge colors must
still be able to read the graph.
