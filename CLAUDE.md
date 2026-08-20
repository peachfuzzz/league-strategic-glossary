# CLAUDE.md — League Strategic Glossary

Next.js 14+ (App Router) · TypeScript · Tailwind **v4** · HTML5 Canvas · Lucide React

A reference work formalizing League of Legends strategic terminology. Concepts are
authored as Markdown notes in an Obsidian vault inside this repo, built to JSON
artifacts, and rendered as term pages with a supporting graph.

---

## Where this project is

The repo is mid-restructure. The full plan is `RESTRUCTURE-PLAN.md`.

Read this section before scoping any task. Several past scoping passes were locally
correct and globally wrong because the phase arc was not visible.

| Phase | State |
|---|---|
| M — Migrate to Obsidian, assign identifiers | Done |
| 0 — Audit | Mostly done. Genus draft remains |
| 1 — Build from the vault | Done |
| **W — Convert prose to wikilinks** | **Current** |
| 2 — Render wikilinks, add checks | Not started |
| 3 — Derived relations and metrics | Not started |
| 4 — Write hierarchy by hand | Not started |
| 5 — Presentation | Not started |
| 6 — Guardrails | Not started |

97 concepts, `C0001`–`C0097`. 81 active. 12 graph edges.

**The graph is sparse on purpose.** Automatic linking was deleted in Phase 1. Every
cross-reference is being rewritten as an explicit wikilink. Until Phase W finishes,
most concepts are isolated nodes. This is expected. Do not add derived edges to
compensate, and do not judge visual work against the current graph.

**What is coming.** Four typed relations — `broader`/`narrower`, `partOf`/`hasPart`,
`related`, and a computed `dependsOn` from wikilinks. The hierarchy fields are empty
today and will be written by hand in Phase 4. Do not populate them from existing data;
the migrated `related` data is unreviewed and does not indicate hierarchy.

---

## Working agreements

Deliver what was asked, at the scope intended. Make routine judgment calls yourself;
check in only when different readings of the request would lead to materially
different work. If a better approach exists, say so in a sentence and continue with
the task as asked rather than quietly widening it.

Scope to one phase per session. Update the table above before finishing.

Visual and styling work is governed by `DESIGN.md`. Where `DESIGN.md` and
`RESTRUCTURE-PLAN.md` disagree, `DESIGN.md` wins.

Architectural decisions are recorded in `docs/adr/`. If a task would reverse one,
say so rather than reversing it silently.

---

## Sources of truth

The most common failure in this repo is editing a generated file.

| Concern | Edit this | Never edit |
|---|---|---|
| Concept prose and structure | `src/data/terms/C####.md` | anything in `src/data/generated/` |
| Identifier registry | `docs/id-registry.csv` (append only) | — |
| Tag definitions and colors | `src/config/tags.config.ts` | — |
| Graph physics | `src/config/graph.config.ts` | constants inlined in `GraphView.tsx` |
| Shuffle behavior | `src/config/shuffle.config.ts` | — |
| Design tokens | `@theme` block in `src/app/globals.css` | — |

`src/data/generated/` is deleted and rewritten on every build. Nothing there survives.

Tailwind v4 has no color config in `tailwind.config.ts`. To add a color, add a token
to `@theme`.

---

## Data model

The model separates **concepts** (meanings) from **labels** (strings). A concept has a
permanent identifier that never changes. Labels attach to concepts and may change.
This follows SKOS. See `docs/adr/ADR0002-SKOS-model.md`.

### Note frontmatter

```yaml
---
id: C0042              # permanent. matches filename. never changes, never reused
prefLabel: Economy     # display headword. may change
altLabel: [resources]  # other labels for this same concept
hiddenLabel: [eco]     # search only, never displayed
aliases: [Economy]     # read by Obsidian's quick switcher, not by the build
collection: [abstract] # ids must exist in tags.config.ts
active: true           # controls whether the concept appears on the site
complete: false        # author's judgement on whether the prose is finished
broader: []            # hierarchical. written by hand in Phase 4
narrower: []
partOf: []             # meronymic. written by hand in Phase 4
hasPart: []
related: [C0031]       # associative, symmetric
relatedReviewed: false # migration artifact. cleared per note during Phase 4d
---
```

`active` and `complete` are independent. A concept can be visible and marked as a
draft. See `docs/adr/ADR0009-active-vs-complete.md`.

`relatedReviewed` marks the migrated `related` data as untrusted. The original data
had dangling targets, one-way assertions, and obvious omissions. Phase 4d reviews it
note by note. The field is deleted in Phase 6 once every note reads `true`.

### The four relation types

Each makes a different claim, and they must not be mixed.

- **`broader` / `narrower`** — hierarchical, directed, acyclic. Test before asserting:
  *all A are B* and *some B are A* must both be true.
- **`partOf` / `hasPart`** — meronymic, directed. A part or phase of something.
- **`related`** — associative, symmetric, no hierarchy implied.
- **`dependsOn`** — derived from wikilinks in the prose. Never authored, never stored
  in frontmatter. Computed at build time.

`related` and wikilinks mean different things and will diverge. `related` is an
editorial assertion. A wikilink is usage. See `docs/adr/ADR0003-four-relation-types.md`.

### Generated artifacts

`scripts/build-vocab.ts` emits four shapes to `src/data/generated/`:

| Artifact | Contents | Consumer |
|---|---|---|
| `concepts/C####.json` | one active concept, plus a `refs` map of the label and slug of everything it references, plus `backlinks` | term page |
| `index.json` | id, slug, labels, 200-char summary | list view, search |
| `graph.json` | nodes and typed edges, no prose | graph |
| `labels.json` | label → array of concept ids | ambiguity check |

Each surface reads only what it needs. There is no combined data object.
See `docs/adr/ADR0008-build-artifacts.md`.

`labels.json` is one-to-many by design. No label currently maps to more than one
concept, so the ambiguity check finds nothing. Keep the shape. It fires the first time
a label is shared, which "resources" will do as soon as both `economy` and `mana`
exist.

### Build behavior worth knowing

- **Inactive concepts are excluded entirely.** They get no file, no node, no index row.
- **Relation targets pointing at inactive or unknown concepts are dropped**, and the
  build reports each one. This is not silent.
- **Slug uniqueness is enforced across active concepts only.** A collision fails the
  build rather than resolving arbitrarily.
- **`related` edges are collapsed** — `A→B` and `B→A` become one undirected edge.
  Hierarchy edges stay directed.
- **`backlinks` preserve asymmetry.** They are not repaired. Eight asymmetric pairs
  exist from migration and are resolved by hand in Phase 4d.

---

## Pipeline

```
src/data/terms/C####.md          Obsidian vault, also the repo folder
   ↓  scripts/build-vocab.ts     (npm run build-vocab; prebuild hook)
src/data/generated/*.json
   ↓
components
```

There is no external authoring surface. The vault is the source. The Google Docs
pipeline and every script serving it were deleted in Phase M.

Term notes are edited in Obsidian or any text editor. Wikilinks use the
`[[C0091|wave]]` form — target by identifier, display by label. Obsidian's `aliases`
field makes them findable by name when typing `[[`.

---

## Modules

**`src/data/vocab.ts`** holds artifact imports and shared types. Client-safe.
**`src/data/vocab.server.ts`** holds filesystem reads. Server only.

These must stay split. A module that imports `fs` cannot also be imported by a client
component; doing so breaks the browser bundle. See `docs/adr/ADR0011-vocab-split.md`.

---

## Components

| File | Role |
|---|---|
| `GlossaryGraph.tsx` | State orchestrator: view mode, selection, discovery set, tag filters |
| `GraphView.tsx` | Canvas force simulation and rendering |
| `ListView.tsx` | Alphabetical list. Being demoted to an index in Phase 5 |
| `SearchOverlay.tsx` | Search across labels, definitions, collections |
| `TagSidebar.tsx` | Collection filtering, AND logic |
| `Header.tsx` / `Footer.tsx` | Persistent chrome |
| `HelpCard.tsx` | First-visit onboarding |

Routes: `/`, `/about`, `/credits`, `/term/[slug]`.

`/term/[slug]` is a **server component**. It reads one concept file through
`vocab.server.ts` and passes props down. It never loads a second concept file — the
`refs` map supplies every label it needs to render cross-references.

The term page is the primary surface. The graph is a navigation aid, not a co-equal
view. See `docs/adr/ADR0007-term-page-primary.md`.

### Graph render loop

Three `useEffect`s in `GraphView.tsx`: node initialization on data change, physics via
`requestAnimationFrame`, and canvas draw on any of nodes/zoom/pan/selection. Draw order
is links → trail lines → nodes → labels. Zoom clamps to 0.5×–3×.

The physics loop must clean up its animation frame on unmount or on node
reinitialization. Failing to do so freezes the graph when it is reseeded.

`shuffle.config.ts`'s `minConnections` was lowered to 0 in Phase 1 because 12 edges
left nothing to pick from. Raise it in Phase 5 once wikilinks supply real edges.

---

## Explore mode

Progressive discovery from a starting concept. State persists in `localStorage` under
the `glossary_*` prefix.

**Slated for deletion in Phase 5b.** Cross-reference following happens on term pages
now, which makes its state tracking redundant. Do not invest in it.

---

## Commands

```bash
npm run dev
npm run build-vocab      # rebuild artifacts from the vault
./scripts/check-vocab.ts # structural validation
./scripts/check-design.sh
```

`check-vocab.ts` validates identifiers, filenames, registry consistency, slug
uniqueness, relation targets, and artifact integrity. It has been mutation-tested
against corrupted copies — it is not passing vacuously. Extend it rather than adding
parallel checks.

---

## Decisions

Architectural decisions live in `docs/adr/`, numbered and append-only. A decision is
superseded by a new ADR, never edited in place.

| ADR | Subject |
|---|---|
| 0001 | ADRs in the repo rather than a GitHub wiki |
| 0002 | The SKOS model |
| 0003 | Four relation types |
| 0004 | Permanent identifiers |
| 0005 | Obsidian as the authoring surface |
| 0006 | Frontmatter as the source of truth |
| 0007 | Term page as the primary surface |
| 0008 | Separate build artifacts |
| 0009 | `active` and `complete` as independent fields |
| 0010 | The meso claim derived, not authored |
| 0011 | The `vocab.ts` / `vocab.server.ts` split |

---

## Known loose ends

- **Backticks in prose are now inert.** `stripBackticks` removes the markers and keeps
  the text. They previously created autolinks; that mechanism is gone. Decide during
  Phase W whether to strip them or repurpose them as a "do not link" marker.
- **`scripts/requirements.txt`** remains with no Python in the repo.
- **`C0026 Execute (damage)`** is an empty stub, inactive.
- **`Actor` (C0002) and `Object` (C0051)** may be duplicates of `Player` and `Target`,
  or may need `prefLabel` updates. Unresolved.
- **Eight asymmetric `related` pairs** from migration, unreviewed.
- **`MediaGallery.tsx` was deleted** in Phase 1. Video is the genre standard for game
  glossaries; revisiting it is a post-restructure question.
