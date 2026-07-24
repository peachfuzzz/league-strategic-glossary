# CLAUDE.md — League Strategic Glossary

Next.js 14+ (App Router) · TypeScript · Tailwind **v4** · HTML5 Canvas · Lucide React

A glossary of League of Legends strategic terminology. Terms are authored in Google
Docs, synced to Markdown, built to TypeScript, and rendered in two views (Graph,
List) with an optional progressive-discovery mode (Explore).

---

## Working agreements

Deliver what was asked, at the scope intended. Make routine judgment calls
yourself; check in only when different readings of the request would lead to
materially different work. If a better approach exists, say so in a sentence and
continue with the task as asked rather than quietly widening it.

One phase per session (see `REWORK_PLAN.md`). Update the completion table before
finishing.

Visual and styling work is governed by `DESIGN.md`. Where `DESIGN.md` and
`REWORK_PLAN.md` disagree, `DESIGN.md` wins.

---

## Sources of truth

The most common failure in this repo is editing a generated file. Before writing to
anything, check this table.

| Concern | Edit this | Never edit |
|---|---|---|
| Term content | Google Doc → `scripts/sync_glossary.py` → `src/data/terms/*.md` | — |
| Term data | `src/data/terms/*.md` | `src/data/glossaryData.ts` (generated) |
| Tag definitions & colors | `src/config/tags.config.ts` | the `tagColors` map in `glossaryData.ts` (generated) |
| Graph physics | `src/config/graph.config.ts` | constants inlined in `GraphView.tsx` |
| Shuffle behavior | `src/config/shuffle.config.ts` | — |
| Design tokens | `@theme` block in `src/app/globals.css` | — |

Tailwind v4 has no color config in `tailwind.config.ts`. If a task calls for adding
a color, add a token to `@theme`.

---

## Data model

```typescript
interface GlossaryTerm {
  id: string;              // kebab-case, unique
  term: string;            // display name
  definition: string;
  tags: string[];          // kebab-case tag ids, must exist in tags.config.ts
  links: string[];         // curated "Also see" refs from frontmatter
  autoLinks: string[];     // terms in backticks, detected from definition text
  alternates?: string[];   // alternative names, used by search and link resolution
  media?: MediaItem[];     // images now, video later
}
```

Frontmatter, canonical form — tag values are **kebab-case ids**, not display labels:

```markdown
---
id: last-hit
term: "Last Hit"
tags: [game-mechanics, economy]
links: [minion-waves, creep-score]
alternates: ["Last-hitting", "Lasthit"]
---
Definition text, with `wave-management` in backticks to create an inline autolink.
```

### The two link types matter

`links` and `autoLinks` are semantically different and should stay that way.
`autoLinks` is *definitional* and directional — term B is used to define term A.
`links` is *associative* and undirected. Together they form a near-DAG over the
vocabulary, which is what the layered graph mode in `DESIGN.md` §5 is built on.

A third state, *undiscovered*, exists only in Explore mode and is a render concern,
not a data field.

---

## Pipeline

```
Google Doc
   ↓  scripts/sync_glossary.py     (see docs/LINK_NORMALIZATION.md)
src/data/terms/*.md
   ↓  src/data/buildGlossary.ts    (npm run generate-glossary; also a prebuild hook)
src/data/glossaryData.ts
   ↓
components
```

`sync_glossary.py` reads Google **Docs** (not Sheets). It resolves human-readable
"See also" names to term ids, validates that targets exist, and skips terms not
marked complete. `--dry-run --verbose` shows what would change without writing.

Tag inheritance: a Heading 1 section name in the Doc becomes a tag on every term
under it. Per-term `Tags:` values append to it rather than replacing it.

---

## Components

| File | Role |
|---|---|
| `GlossaryGraph.tsx` | State orchestrator: view mode, selection, discovery set, tag filters |
| `GraphView.tsx` | Canvas force simulation + rendering |
| `ListView.tsx` | Alphabetical list |
| `SearchOverlay.tsx` | Fuzzy search across terms, definitions, tags, alternates |
| `TagSidebar.tsx` | Tag filtering, AND logic |
| `Header.tsx` / `Footer.tsx` | Persistent chrome |
| `MediaGallery.tsx` | Per-term media, full / compact / lightbox variants |
| `HelpCard.tsx` | First-visit onboarding |

Routes: `/`, `/about`, `/credits`, `/term/[slug]` (static, with per-term OG
metadata; OG *image* generation is deferred — needs a server runtime).

### Graph render loop

Three `useEffect`s in `GraphView.tsx`: node initialization on data change, physics
via `requestAnimationFrame`, and canvas draw on any of nodes/zoom/pan/selection.
Draw order is links → trail lines → nodes → labels. Zoom clamps to 0.5×–3×.

The physics loop must clean up its animation frame on unmount or on node
reinitialization; failing to do so causes a freeze when the graph is reseeded.

---

## Explore mode

Progressive discovery. Start from one term, reveal others by following links.
Undiscovered neighbors render as dashed trails. State persists in `localStorage`
under the `glossary_*` key prefix (`viewMode`, `discoveredTerms`, `startingTerm`,
`searchOnlyDiscovered`, `hasSeenHelp`, `sidebarOpen`).

Reset clears discoveries and keeps the starting term. Shuffle picks a new starting
term subject to `shuffle.config.ts`'s `minConnections` floor.

---

## Commands

```bash
npm run dev
npm run generate-glossary          # rebuild glossaryData.ts from Markdown
npm run manage-tags list|usage|unused|undefined
python scripts/sync_glossary.py [--dry-run] [--verbose]
```

`manage-tags undefined` reports tags used in Markdown but missing from
`tags.config.ts`. The build does not fail on these, so check it after a sync.

---

## Further reading

- `DESIGN.md` — visual constraints. Authoritative for anything that renders.
- `REWORK_PLAN.md` — phased roadmap and completion tracking.
- `docs/LINK_NORMALIZATION.md` — how the sync script resolves "See also" names.
- `docs/TAG_MANAGEMENT.md` — tag config schema and CLI. Note: its color
  recommendations are superseded by `DESIGN.md`.

---

## Unverified — confirm against the repo before relying on

This file was reconciled from four docs that disagreed with each other. These
points were inferred, not checked:

- The import path for tag helpers. `TAG_MANAGEMENT.md` shows
  `@/data/tags.config`, but the file lives at `src/config/tags.config.ts`, which
  implies `@/config/tags.config`. One of the two is wrong.
- Whether `graph.config.ts` is actually wired into `GraphView.tsx`, or whether the
  physics constants are still hardcoded there. Both were documented as live.
- Whether `buildGlossary.ts` still reads a `tagColors` map from anywhere, now that
  `tags.config.ts` is the stated source of truth.
- Whether Tailwind v4's `@theme` has been set up yet, or the repo is still on a v3
  config shape.
