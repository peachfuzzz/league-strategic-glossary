# League Strategic Glossary — Restructure Plan

Written in Simplified Technical English.
Short sentences. One idea per sentence. Consistent terms.

Version 2. This version uses Obsidian instead of Google Docs.

## Progress

| Phase | State |
|---|---|
| M — Finish the migration | Done |
| 0 — Audit | Done |
| 1 — Build from the vault | Done |
| W — Convert prose to wikilinks | Done |
| 2 — Render, derive, measure | Done |
| **4 — Hierarchy** | **Current** |
| 5 — Presentation | Not started |
| 6 — Guardrails | Not started |

Phase 3 has been merged into Phase 2. Both operate on the same wikilink parse.

97 concepts. Identifiers C0001 to C0097. 93 active; `actor`, `object`,
`execute (damage)` and `power budget` are inactive.

Frontmatter is block style YAML, not inline arrays. Obsidian and the build tooling
disagreed on inline formatting. `check-vocab` is TypeScript now, using `gray-matter`.

---

## 1. Terms used in this document

Use these words with these meanings. Do not use other words for the same things.

- **Concept** — one meaning. A concept is what an entry defines.
- **Label** — one word or phrase. A label points to a concept.
- **Main label** — the label the site displays as the headword.
- **Extra label** — another label for the same concept.
- **Hidden label** — a label used for search only. The site does not display it.
- **Entry** — the prose that defines a concept.
- **Note** — one Markdown file in the vault. One note holds one concept.
- **Relation** — a link between two concepts.
- **Identifier** — a permanent code for a concept. The code never changes.
- **Vault** — the Obsidian folder that holds all notes.

---

## 2. The problem

Today a term and a page are the same thing.
One word makes one page.
One page holds one word.

Some words have more than one meaning.
The word "resources" means gold and experience.
The word "resources" also means mana.
The word "resources" also means map presence.

The site cannot store one word with three meanings.
So the automatic linker must guess.
Sometimes the linker guesses wrong.
You do not see the error.

There is a second problem.
The site has one kind of relation.
Every link between concepts looks the same.
So the graph shows connections but says nothing about them.

There is a third problem.
The slug contains the word.
If you rename a term, every link to that term breaks.
You renamed "actor" to "player".
You renamed "object" to "target".
You will rename more terms during formalization work.

There is a fourth problem.
Google Docs cannot hold explicit links.
So you cannot correct a wrong link by hand.

---

## 3. The solution

Stop treating a word as a page.
Treat a meaning as a page.
Attach words to meanings.

This is the SKOS model. SKOS is a W3C standard for structured vocabularies.

The model has three parts:

1. **Concepts have identifiers.** The identifier never changes. The label can change.
2. **Labels attach to concepts.** One concept can have many labels. One label can point to many concepts.
3. **Relations have types.** Different relations make different claims.

Move authoring to Obsidian.
Obsidian already works this way.
The note filename is the identifier.
The frontmatter holds the labels.
The link syntax `[[identifier|label]]` points at an identifier and shows a label.

### Why use a standard instead of a custom design

- The problem is old. Libraries and thesauri solved it many times.
- The standard names the parts. You do not invent vocabulary for your data model.
- The standard states rules you can check.
- The standard is a signal of seriousness. Riot readers may recognize it.

### Why move to Obsidian

- Explicit links work with no code. Google Docs cannot do this.
- The sync script disappears. Notes are already Markdown.
- Frontmatter holds structure. You do not maintain a second file by hand.
- Notes live in the repository. Git tracks every change.
- You already have a vault.

### Why not move to Obsidian for the graph

The Obsidian graph does not show relation types.
Every link looks the same in it.
That is the problem you are leaving.
Do not treat the Obsidian graph as a preview.

### What the move costs

- Prose editing in Obsidian is worse than in Google Docs.
- Comments and suggestions are worse.
- Mobile editing needs setup.
- Obsidian cannot autocomplete a label that points to two concepts. You type those links by hand.

The last item affects about a dozen labels. It does not affect correctness.
Your build reads the frontmatter. Your build does its own resolution.

---

## 4. The four relation types

Use exactly these four. Do not add more.

**Broader and narrower.**
One concept sits above another concept.
Example: "duel" is a kind of "fight".
This relation has a direction.
You write this relation by hand.

Test before you assert it. Both sentences must be true:
- All A are B.
- Some B are A.

**Part and whole.**
One concept is a part or a phase of another concept.
Example: "bounceback" is a phase of a wave cycle.
This relation has a direction.
You write this relation by hand.

**Related.**
Two concepts connect. Neither sits above the other.
This is the current "see also".
This relation has no direction.
You write this relation by hand.

**Mentions.**
The prose of one entry links to another concept.
Example: the entry for "freeze" links to "crash".
This relation has a direction.
The computer finds this relation. You do not write it.
It records usage only. It does not claim that one concept depends on another.

### Why four types matter

Each type makes a different claim.

- "Mentions" is a fact about your text. A machine can check it.
- "Related" is a note for readers.
- "Broader" is your argument about how the vocabulary divides.
- "Part of" is your argument about what contains what.

The types can disagree.
You may say "economy" sits under "value".
The prose of "economy" may never mention "value".
The build can find this disagreement.
The disagreement is useful.

---

## 5. Which surface is primary

The term page is the primary surface.
A reader arrives at one term. The reader reads it. The reader follows a link to another term.

The other surfaces support the term page. They do not compete with it.

- **Term page** — primary. Holds the entry, the labels, and the relations.
- **Local graph** — inside the term page. Shows the current concept and its neighbours only.
- **Global graph** — a separate view. Shows the whole vocabulary once. This is a demonstration, not a tool.
- **List view** — demoted. An A to Z index. A way to find a term by name.
- **Search** — finds a term by any label.

### What this decision removes

- Explore mode and its state tracking. Readers follow links on term pages instead.
- The need for the global graph to be a working interface. It only needs to be legible.

### Why the term page carries the relations as text

Write the relations as labelled sections on the page.
Example: "Kind of: fight". Example: "Parts: crash, bounceback".

Text states the relation exactly. A graph only suggests it.
So the structure of the vocabulary is visible even if no graph loads.
The graph then shows what the page already says.

This lowers risk. Graph work can slip. The argument still lands.

---

## 6. Where data lives

**Prose lives in the note body.**

**Structure lives in the note frontmatter.** This is the source of truth.

**A review file gives you one view of all relations.** A script builds this file from the notes. You edit the file. A second script writes your edits back to the notes.

Use the review file for bulk work.
Assigning parents to ninety concepts is faster in one file than in ninety notes.

### The build emits separate data files

Today one file holds all data for all surfaces.
Each surface loads data it does not use.
The graph loads prose it never draws.
The term page loads eighty-nine entries it never shows.

The size cost is small. The coupling cost is not.
You are about to change the schema many times.
Today every change affects every surface.

So emit one file per need:

- **One file per concept** — the term page reads only its own concept.
- **`index.json`** — identifiers, labels, and short definitions. Feeds the list view and search.
- **`graph.json`** — nodes, typed edges, and metrics. No prose.
- **`labels.json`** — label to identifier map. Feeds the resolver and the disambiguation pages.

`check-vocab.ts` reads `graph.json` and `labels.json`.
The validation script does not need to run the site build.

Example frontmatter:

```yaml
---
id: C0042
prefLabel: Economy
altLabel: [resources]
hiddenLabel: [eco]
aliases: [Economy]
collection: [abstract]
active: true
complete: true
broader: []
narrower: []
partOf: []
hasPart: []
related: [C0031]
relatedReviewed: false
---
```

**Two fields hold labels. They have different readers.**

`prefLabel` and `altLabel` are read by your build.
`aliases` is read by Obsidian for the quick switcher.

They are not the same list.
Obsidian cannot hold one alias that points to two notes.
So an ambiguous label like "resources" goes in `altLabel` but not in `aliases`.
A script writes `aliases` from the other two fields. Do not maintain it by hand.

### What `active` means

`active: true` means the prose is complete.
`active: false` means the prose is not complete.

Decide one thing before Phase 1: does an inactive concept appear on the site?

Showing inactive concepts is the better choice.
A reference work that marks its own gaps reads as more rigorous than one that hides them.
A stub node with real relations is more truthful than a missing node.

So show inactive concepts. Mark them clearly as incomplete.

Validation treats them differently.
Run every check on active concepts.
Do not require an inactive concept to have a parent.

---

## 7. Scope

### In scope

- Migration from Google Docs to Obsidian
- Concept and label separation
- Permanent identifiers
- Four relation types
- Link resolution with an ambiguity gate
- Hierarchy written by hand for all concepts
- Part and whole relations where they are true
- Separate build data files, one per surface
- Term page that states relations as labelled text
- Local graph inside the term page
- Global graph that draws relation types differently
- Backlinks on entry pages
- Front matter page
- Validation script

### Out of scope

- The remaining missing entries. Mark them as known gaps.
- The tree navigation view. The term page already states hierarchy.
- Explore mode and its state tracking. Delete it.
- The full essay about the meso layer.
- Gamification.

### Priority order

Build in this order. Cut from the bottom.

1. Term page with relations as text
2. Separate build data files
3. Local graph on the term page
4. Global graph with typed edges
5. Relation toggles and node sizing by betweenness

Disambiguation pages are cut. No label is ambiguous.
Keep the ambiguity check. It costs nothing and will fire later.

Item 1 carries the argument. Items 3 to 5 make it easier to see.
If time runs out, ship items 1 and 2 with the old graph.

### Deadline

Target: end of August.

If the work slips, cut scope. Do not ship rough work.
No one is waiting. A late finished product costs nothing.
An early half-built product costs a warm contact.

---

## 8. Phases

Do the phases in order.
Phase 5 can start before Phase 4 finishes.

---

### Phase M — Finish the migration (DONE)

**Completed 2026-08-17.** 97 concepts, identifiers C0001–C0097, no gaps.
Registry at `docs/id-registry.csv`. Verifier at `scripts/check-vocab.ts`.
All bodies byte-identical to the originals. The site build is broken until Phase 1.

Two findings changed the plan. See below.


The vault now exists. It points at the `terms` folder in the repository.
All entries are imported from Google Docs.
Every note has an `active` field.

What remains: identifiers, frontmatter fields, and old scripts.

#### M1. Vault settings

- [ ] Decide whether to commit `.obsidian/`. Commit it if you want shared settings. (15 min)
- [ ] Check that no script assumes the repository root is the vault root. (30 min)
- [ ] Fix any path that does. (30 min)

#### M2. Assign identifiers

Do this before you write any wikilinks.
A script rename does not update wikilinks. An Obsidian rename does.
So assign identifiers while no wikilinks exist.

- [ ] Choose the prefix and digit count. Record the choice. (15 min)
- [ ] Write a script that reads all notes and sorts them by headword. (1 hr)
- [ ] Make the script assign identifiers in that sorted order. (30 min)
- [ ] Make the script write `id` into each note frontmatter. (30 min)
- [ ] Make the script write a registry file of every identifier issued. (1 hr)
- [ ] Run the script into a copy of the folder. Read the output. (30 min)
- [ ] Rename each note file to its identifier. (30 min)
- [ ] Write `aliases` into each note so the quick switcher still works. (30 min)
- [ ] Open the vault. Confirm you can find notes by name. (30 min)
- [ ] Commit. (15 min)

#### M3. Complete the frontmatter

- [ ] Add `prefLabel` to every note from the current headword. (1 hr)
- [ ] Parse "also known as" lines into `altLabel`. (1 hr)
- [ ] Migrate `links` into `related`, resolved to identifiers. (1 hr)
- [ ] Set `relatedReviewed: false` on every note. (15 min)
- [ ] Add empty `broader` and `partOf` fields to every note. (30 min)
- [ ] Decide what `active: false` means for the site. See Section 6. (30 min)
- [ ] Record the frontmatter schema in `DESIGN.md`. (30 min)

#### M4. Retire old scripts

The migration is done. There is no abort window. Delete rather than quarantine.

- [ ] List every script in the repository. (30 min)
- [ ] Mark each script as keep, modify, or delete. (30 min)
- [ ] Delete the Google Docs fetch and auth scripts. (30 min)
- [ ] Delete the slug generation scripts. (30 min)
- [ ] Delete the Doc parsing scripts. (30 min)
- [ ] Update `CLAUDE.md` to describe the vault as the only source. (1 hr)
- [ ] Commit. (15 min)

Git holds the history. Deletion is reversible.

### Phase 0 — Audit (DONE)

Goal: learn the true shape of the current data.

The migration already reported the census, the dangling links, the asymmetric pairs,
and the ambiguous labels. Do not build those again.

#### What the migration found

**No dangling links.** Every `links` target resolved.

**No ambiguous labels.** Every label is unique across all 97 concepts.

This does not mean the concept and label split was unnecessary.
It means the check is preventive, not corrective.
The first term that needs two labels will trip it.
"Resources" is the likely first case: it belongs to both economy and mana.

**Eight asymmetric related pairs.** A lists B. B does not list A.

| From | To |
|---|---|
| C0003 All-in | C0089 Trade |
| C0007 Bait | C0054 Overextend |
| C0009 Buffer | C0011 CC Buffer |
| C0028 Fight | C0017 Contest |
| C0028 Fight | C0022 Dance |
| C0066 Reliability | C0090 Value |
| C0067 Roam | C0032 Gank |
| C0090 Value | C0027 Expected Value |

These are hierarchy candidates, not errors.
A specific concept names the general concept in its definition.
A general concept does not list every specific case.
So a one way link often means one concept is broader than the other.

Note the direction is not reliable.
These links were authored as "see also", so the link may run from broader to narrower
or the reverse. Do not read direction as hierarchy.

Start Phase 4b with these eight. You already have an intuition about them.

What remains is the hierarchy draft.

- [ ] Write a script that extracts the first noun phrase of each entry. (1 hr)
- [ ] Run it. Save the output to `reports/genus-draft.md`. (30 min)
- [ ] Read the genus draft. Mark entries that have no clear parent. (1 hr)
- [ ] Read the migration dry run again. Write notes on what surprises you. (1 hr)

**Why the genus draft matters.** Your entries already name a parent.
"A small scale fight involving one player from each team."
The parent is "fight".
You are not inventing a hierarchy. You are extracting one you already wrote.

---

### Phase 1 — Build from the vault (DONE)

**Completed 2026-08-17.** Typecheck clean. Build succeeds. All checks pass.

Built:

- `scripts/build-vocab.ts` replaces the old generator.
- `src/data/generated/concepts/C####.json` — one file per concept, each carrying its
  own definition, a `refs` map of everything it references, and a `backlinks` array.
- `index.json` — one entry per active concept, with a 200 character summary.
- `graph.json` — nodes and typed edges.
- `labels.json` — label to identifier map, always one to many in shape.
- `term/[slug]/page.tsx` is a server component. It reads one concept file.

Deleted: `glossaryData.ts`, `buildGlossary.ts`, `generate-glossary-data.ts`,
`migrate-to-markdown.ts`, `MediaGallery.tsx`.

#### What this phase found

**Automatic linking was load bearing.** The old `autoLinks` field supplied about half
the graph edges, the node sizing input, and the prose cross-references. It was dropped,
not replaced. Phase W supplies the replacement.

**The graph is now sparse.** 81 nodes and 12 edges. 60 nodes are isolated.
This is the honest picture. Almost every real connection in the glossary is unrecorded.
Do not judge any visual work against the graph until Phase W is well underway.

**`vocab.ts` had to split in two.** A module that reads the filesystem cannot also be
imported by a client component. `vocab.ts` holds artifacts and types. `vocab.server.ts`
holds filesystem reads. Record this in `DESIGN.md`. It will bite again.

**16 concepts are `active: false`.** 15 of them have finished prose and were never
marked active. Only `C0026 Execute (damage)` is empty.

**The earlier missing terms list was wrong.** It was built from an old export.
`Roam`, `Space`, `Lane Priority`, `Wave State` and `Wave Direction` all exist as
inactive concepts. Rebuild the known gaps list from the vault, not from the old list.

#### Remaining cleanup

- [ ] Read the 15 inactive concepts with prose. (30 min)
- [ ] Flip them to `active: true, complete: false` unless genuinely unfinished. (30 min)
- [ ] Leave `C0026 Execute (damage)` inactive. (5 min)
- [ ] Resolve `Actor` and `Object`. See below. (1 hr)
- [ ] Remove `import-terms` from `package.json`. (15 min)
- [ ] Record the `vocab.ts` split in `DESIGN.md`. (30 min)
- [ ] Record the video question in `deferred.md`. `MediaGallery` is in git history. (15 min)
- [ ] Rebuild the known gaps list from the vault. (1 hr)
- [ ] Update `CLAUDE.md` to describe the new pipeline and the phase list. (2 hr)

#### The Actor and Object question

`C0002 Actor` and `C0051 Object` both still exist.
You renamed these to `Player` and `Target` at some point.

Check which case applies:

- If `Player` and `Target` exist as separate concepts, these two are duplicates.
  Retire them. Set `status: retired` in the registry. Move their labels onto the new
  concepts as `altLabel` or `hiddenLabel`.
- If they do not exist, the rename happened in prose only. Update `prefLabel` on both.

Do this before Phase W. Otherwise you will write wikilinks pointing at a concept you
are about to retire.

This is the first real test of the identifier scheme. A retired concept keeps its
identifier forever. A renamed concept keeps its identifier and changes its label.

**What `CLAUDE.md` most needs.** A short section stating where the project is going:
the phase list and the current position. Every scoping pass so far has been locally
correct and globally uninformed. That is the fix.

---

### Phase W — Convert prose to wikilinks (DONE)

**Complete.** All 97 concepts reviewed. Roughly 20 entries per 40 minutes.

Every cross-reference is now an explicit `[[C####|label]]` wikilink.
The build no longer guesses which concept a word means.

#### What this phase produced

**A real missing terms list.** Built from the vault, not from the old export.
Some of the missing terms are structurally important.
Sort them before Phase 4: a term that several entries link to leaves a hole in the
hierarchy and should be written. A term mentioned once is a known gap and gets
published as one.

**Do not write them all now.** The hierarchy pass tells you which ones matter.

#### Decisions made during this phase

- Link the first occurrence per entry, not every occurrence.
- Headwords are natural case, not title case. Lowercase unless inherently
  capitalised.
- Parenthetical disambiguations in `prefLabel` are unnecessary. The identifier
  disambiguates. Drop the parenthetical where nothing competes; keep the bare form as
  an `altLabel` otherwise.
- Backticks are inert. Nothing uses them. Removal deferred.

---

### Phase 2 — Render, derive, measure

Goal: parse the wikilinks once. Get four things from that one pass.

**Phase 3 is merged here.** Rendering, the dead link check, `mentions`, and the
metrics all come from the same parse. Splitting them means writing the parser,
shipping, then reopening the same code the next day.

#### Current state

**Phase 2 is complete.** 2a and 2b resolved wikilinks in the build and rendered them
with `react-markdown` under a restricted allowlist (ADR0015). 2c derived `mentions`
from the same parse (ADR0016), 2d measured the resulting graph, and 2e added the
structural checks. Next is Phase 4.

#### 2a. Parse and render (DONE)

- [x] Parse `[[C####|label]]` out of the definition.
- [x] Render each as a link. Target by identifier, display by label.
- [x] ~~Handle the bare `[[C####]]` form.~~ Not needed — the vault has none, and the
      bare form is now rejected by both the build and `check-vocab`.
- [x] Add every wikilink target to the concept's `refs` map.
- [x] Check term pages by eye.

Beyond the original list:

- Definitions render as **full Markdown** — paragraphs, lists, emphasis — not one
  flat block. The renderer allows `p`/`ul`/`ol`/`li`/`em`/`strong`/`a`/`code` only.
- The build **rejects** headings, images, tables, blockquotes, horizontal rules, and
  code fences by name. A table is not parsed as one without GFM, so it would otherwise
  survive as literal pipes; the build-time check is what catches it.
- `TermPageContent` became a **server component** (its `'use client'` was vestigial),
  so `react-markdown` ships 0 B to the browser.
- `summary` is now the **first sentence**, extracted from label-stripped prose with an
  abbreviation guard (`vs.`, `etc.`, `e.g.`, `i.e.`) and restricted to the first
  paragraph, plus a `truncated` flag for card affordances.
- The meta description no longer leaks raw wikilinks into OpenGraph/Twitter cards.
- `stripBackticks`, `SUMMARY_LENGTH`, and three inline copies of the backtick regex
  are deleted.

`refs` currently covers relation field targets only. It must also carry the label and
slug of everything the prose links to, so the term page never loads a second file.

#### 2b. Check (DONE)

- [x] Fail the build on a wikilink pointing at a concept that does not exist.
- [x] Report, but do not fail, on a wikilink pointing at an inactive concept.
- [x] Check that the ambiguous label report still runs.

A dead link is an error. A link to an inactive concept is a decision you have not made
yet, so report it and move on.

Also added: malformed `[[…]]` forms fail; prose targets must appear in `refs`; and
every `/term/<slug>` the build emits must resolve to an active slug, so a `slugify`
change cannot silently 404 prose links. All mutation-tested.

**13 wikilinks point at inactive concepts.** Four targets carry most of them and are
the strongest missing-term candidates for Phase 4:

| Target | Links |
|---|---|
| `space` (C0074) | 4 |
| `roam` (C0067) | 3 |
| `wave direction` (C0093) | 3 |
| `lethal` (C0044) | 2 |

#### 2c. Derive (DONE)

- [x] Collect wikilink targets into a `mentions` list per concept. (1 hr)
- [x] Emit `mentions` edges into `graph.json`, typed. (1 hr)
- [x] Rebuild `backlinks` as the reverse of `mentions`. (1 hr)
- [x] ~~Add a backlinks section to the term page.~~ Deferred to Phase 5a. The data is
      emitted; whether to display it is a presentation decision, and the graph is the
      better surface for reverse navigation.

`mentions` is never stored in frontmatter. It is computed on every build.

**The relation named `mentions`, not `dependsOn`.** `dependsOn` asserts that A's
meaning requires B. The computation establishes only that A's prose links to B.
See `docs/adr/ADR0016-mentions-not-depends-on.md`.

**`backlinks` is the reverse of `mentions` only.** It no longer includes the relation
fields. One field, one meaning; mixing an editorial assertion with prose usage would
need a provenance tag to stay honest.

**What this phase produced.** 216 `mentions` edges over 93 active concepts, on top of
13 authored `related` edges. Isolated nodes fell from 60 to 6. Ten pairs mention each
other, so `mentions` is cyclic — as expected, and not collapsed.

The term page no longer renders "Referenced by". `TermPageContent` stays a server
component and `/term/[slug]` still ships 0 B.

#### 2d. Measure (DONE)

- [x] Compute in-degree for every concept. (30 min)
- [x] Compute betweenness centrality over `mentions`. (1 hr)
- [x] Report both with and without substrate concepts. (30 min)
- [x] Save both to `reports/metrics.md`. (30 min)
- [x] Read the report. Compare against your expectations. (1 hr)
- [x] Save the missing terms list to `reports/missing.md`. (30 min)

**What the numbers said.** The prediction below was half right.

`fight`, `wave` and `combat` do rank high, as expected. Two things did not:

- **`player` (C0059) leads in-degree at 44**, against 17 for `fight`. It is the term
  every definition presupposes, not a parent concept. `target` (C0084) behaves the
  same way at lower frequency. Both are now excluded from metrics via
  `src/config/substrate.config.ts`; excluding them removes 25% of all edges and leaves
  a tightly-spaced ranking with no outlier.
- **`value` did not rank near the top** — 7 inbound, below `crash` at 8.

**Betweenness ranks differently from in-degree**, which is the point of computing it.
`tension` and `threat` lead on betweenness while sitting 10th and 7th by in-degree.
Bridges are not hubs. Whether that supports the meso claim is a Phase 5e question;
do not read the numbers while assigning hierarchy in Phase 4.

**No prose links to an inactive concept**, so `reports/missing.md` is empty. The four
candidates named in Phase 2b — `space`, `roam`, `wave direction`, `lethal` — were all
activated during the Phase 1 cleanup.

**Read the in-degree ranking before Phase 4.**
It is an empirical prior on what sits near the root of the hierarchy.
Expect `combat`, `fight`, `wave`, `value` and `threat` near the top.
If something unexpected ranks high, that is worth knowing before you draw the tree.

**Betweenness tests the meso hypothesis.**
It is computed over prose written before the hypothesis existed, so the test is blind.
Do not tag timescale by hand. Do not look at the numbers while assigning hierarchy.

#### 2e. Optional, cheap now (DONE)

`check-vocab` is TypeScript with real parsing, so these are a few lines each.
Having the acyclicity check before you write hierarchy is better than after.

- [x] Check `broader` for cycles. (30 min)
- [x] Check `partOf` for cycles. (30 min)
- [x] Check that no pair holds two relation types. (30 min)
- [x] Check that `related` is symmetric. Report, do not fix. (30 min)

Cycles **fail** the run: A above B above A is incoherent under any reading. The other
two **report only**, because each is a judgement for Phase 4 rather than a fault.

Added beyond the list:

- A hierarchy edge asserted from one end only — `broader` on A without `narrower` on B.
  Reported, since a half-written edge is normal while Phase 4 is in progress.
- `mentions` must match the prose it was derived from exactly, and `backlinks` must be
  its true inverse across the whole set. Both catch build-versus-check drift.
- Every graph edge type must be known, and no edge may point at itself.

All seven new checks were mutation-tested against corrupted copies — cycles of two and
three notes, a self-loop, a dropped `mentions` entry, a broken backlink, and a missing
graph edge. `mentions` is deliberately **not** checked for cycles; it is cyclic by
design.

---

### Phase 4 — Hierarchy

Goal: write the structure by hand.
This phase is yours. Little code.

#### 4a. Build the review file

Block style YAML makes hand editing a single note easier than inline arrays did.
The review file is still worth building. Assigning parents across 95 concepts is
faster in one file than in 95 notes.

- [ ] Write a script that dumps all relations into one file. (1 hr)
- [ ] Write a script that reads the file and writes changes back. (2 hr)
- [ ] Test the round trip on five concepts. (30 min)
- [ ] Add a check that the round trip changes nothing else. (1 hr)

#### 4b. Assign broader and narrower

- [ ] Start with the eight asymmetric pairs from Phase 0. (1 hr)

Work in batches of about fifteen concepts.
Use the genus draft from Phase 0 as a starting point.
Apply the all-and-some test to every assignment.

- [ ] Batch 1: the combat cluster. (2 hr)
- [ ] Batch 2: the wave cluster. (2 hr)
- [ ] Batch 3: the input and timing cluster. (2 hr)
- [ ] Batch 4: the map and lane cluster. (2 hr)
- [ ] Batch 5: the abstract cluster. (2 hr)
- [ ] Batch 6: everything left. (2 hr)
- [ ] Mark concepts that have no parent as top concepts. (1 hr)

#### 4c. Assign part and whole

Assign only where the relation is true. Do not force it.

- [ ] Wave cycle phases. (1 hr)
- [ ] Combat sequence parts. (1 hr)
- [ ] Ability and animation parts. (1 hr)

#### 4d. Review migrated relations

- [ ] Review batch 1 of migrated relations. Keep, delete, or retype. (1 hr)
- [ ] Review batch 2. (1 hr)
- [ ] Review batch 3. (1 hr)
- [ ] Add relations that are missing. The old data was incomplete. (1 hr)
- [ ] Make every kept relation symmetric. (30 min)
- [ ] Set `relatedReviewed: true` on each note as you finish it. (ongoing)

#### 4e. Keep the hierarchy honest

- [ ] Do not look at timescale while assigning hierarchy. (rule, not task)
- [ ] Record every new question in `deferred.md` instead of acting on it. (ongoing)

**Warning about this phase.** This work is interesting.
Interesting work expands.
When assigning a parent makes you want to rewrite an entry, write the idea in `deferred.md`.
Do not rewrite the entry now.

---

### Phase 5 — Presentation

Goal: make the term page carry the structure.
Build in the priority order from Section 7.

#### 5a. Term page

Do this first. It carries the argument.

- [ ] Decide a heading for each relation type. (30 min)
- [ ] Add a "broader" section to the term page. (1 hr)
- [ ] Add a "narrower" section. (30 min)
- [ ] Add a "parts" and "part of" section. (1 hr)
- [ ] Add a "related" section. (30 min)
- [ ] Add a "referenced by" section from backlinks. (1 hr)
- [ ] Show main label and extra labels at the top. (1 hr)
- [ ] Add previous and next links in alphabetical order. (1 hr)
- [ ] Read ten term pages. Check that the structure is clear. (1 hr)

#### 5b. Chrome cleanup

- [ ] Remove `tagColors` from all six components. (2 hr)
- [ ] Demote categories to collections or delete them. (1 hr)
- [ ] Delete Explore mode and its state tracking. (2 hr)
- [ ] Demote the list view to an A to Z index. (2 hr)
- [ ] Add extra labels and hidden labels to the search index. (1 hr)

#### 5c. Local graph

- [ ] Decide a visual encoding for each of the four relation types. (1 hr)
- [ ] Record the encodings in `DESIGN.md`. (30 min)
- [ ] Build a local graph component. Show one concept and its neighbours. (3 hr)
- [ ] Draw each relation type in its own style. (2 hr)
- [ ] Add the local graph to the term page. (1 hr)
- [ ] Check contrast for every new colour. (1 hr)

#### 5d. Global graph

- [ ] Change the global graph to read typed edges. (2 hr)
- [ ] Draw each relation type in its own style. (2 hr)
- [ ] Add a toggle for each relation type. (2 hr)
- [ ] Size nodes by betweenness. (1 hr)
- [ ] Raise `minConnections` in shuffle. Phase 1 lowered it to 0 for sparsity. (30 min)
- [ ] Make every node link to its term page. (1 hr)

#### 5e. Front matter

Disambiguation pages are cut. No label is currently ambiguous.

- [ ] Build a front matter page. (1 hr)
- [ ] Write the front matter copy. (2 hr)

**About the front matter.**
Every serious reference work explains its own organization.
The glossary does not have this page.
Write a short page that states three things:
- What each relation type means.
- What the hierarchy claims.
- What the structure of the vocabulary appears to show.

The third item carries the meso claim.
Write that paragraph only if the betweenness numbers support it.
If the numbers do not support it, leave the paragraph out.

---

### Phase 6 — Guardrails

Goal: stop the structure from breaking later.

Several structural checks moved forward into Phase 2e. What remains:

- [ ] Write a check that every concept is reachable from a top concept. (1 hr)
- [ ] Relax that check for concepts marked `complete: false`. (30 min)
- [ ] Write a check that every note has valid frontmatter. (1 hr)
- [ ] Write a check that no note still has `relatedReviewed: false`. (30 min)
- [ ] Combine the checks into `check-vocab.ts`. (1 hr)
- [ ] Add `check-vocab.ts` to the build. (30 min)
- [ ] Extend `DESIGN.md` with the graph encodings. (1 hr)
- [ ] Write a `vocab-reviewer` subagent definition. (1 hr)
- [ ] Final read of `CLAUDE.md`. Confirm it matches the code. (1 hr)

**Update `CLAUDE.md` at the end of every phase.**
Do not wait until Phase 6.
Claude Code will work from a wrong model of the data if you wait.

---

## 9. Risks

**Old scripts confuse Claude Code.**
Delete them in Phase M.
Update `CLAUDE.md` in the same commit.

**A script rename breaks wikilinks.**
Obsidian updates links on rename. A script does not.
Assign identifiers before you write any wikilinks.

**The hierarchy phase expands.**
This is the most likely failure, and now the only large unknown.
Phase W finished close to estimate. Phase 4 has no comparable estimate.
Control it with batches and `deferred.md`.

**The missing terms list grows.**
Phase W found terms that should exist. Writing one reveals more.
Write only what the hierarchy needs. Publish the rest as known gaps.

**The betweenness result does not support the meso claim.**
The bridges may be abstract concepts instead of tactical concepts.
That result is still honest and still interesting.
Render by betweenness anyway. Leave the meso paragraph out.

**Graph work slips.**
This is now survivable.
The term page states every relation as text.
Ship items 1 and 2 from the priority order with the old graph.

**Prose writing in Obsidian feels worse than in Google Docs.**
You will write five new entries in Phase 4.
If Obsidian slows that work, draft in Google Docs and paste the result.

---

## 10. What to do when you have thirty minutes

Pick any of these. They do not need a long session.

- Read one report and write notes.
- Review migrated relations for five concepts.
- Assign parents for five concepts.
- Fix five ambiguous links.
- Add hidden labels for one cluster.
- Mark five scripts as keep, modify, or delete.
- Add a known gap to `deferred.md`.
- Check contrast for one colour.
- Write one paragraph of front matter.
