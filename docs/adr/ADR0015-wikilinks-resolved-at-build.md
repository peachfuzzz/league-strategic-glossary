# ADR0015 — Wikilinks resolve at build time; entries render as restricted Markdown

Status: accepted
Date: 2026-08-21

## Context

Phase W rewrote every cross-reference in the vault as an explicit
`[[C####|label]]` wikilink — 218 of them across 82 notes. Nothing consumed them.
`build-vocab.ts` stored the note body verbatim, so term pages displayed the literal
text `[[C0091|wave]]`, and that string leaked into `<meta name="description">` and
OpenGraph cards.

Two questions had to be answered together: where a wikilink turns into a link, and
what a definition is allowed to contain once it is rendered as Markdown rather than
as plain text.

## Decision

**Wikilinks resolve in the build, not in the renderer.** `[[C####|label]]` becomes a
standard Markdown link `[label](/term/slug)` in the emitted concept JSON. No consumer
ever sees wikilink syntax. Resolution branches on the target:

| Target | Result |
|---|---|
| active | `[label](/term/slug)`, and the target joins the concept's `refs` |
| inactive | bare `label`, unlinked; reported by the build |
| unknown | build fails |

A wikilink is an Obsidian authoring convenience. It exists so cross-references are
easy to type next to the prose they belong to. Nothing downstream needs to know the
notation existed.

**The term page renders Markdown**, because the term page is the primary surface
(ADR0007). Prose gets real paragraphs, lists, and emphasis rather than one
undifferentiated block of text.

**What an entry may contain is restricted.** Allowed: `p`, `ul`, `ol`, `li`, `em`,
`strong`, `a`, `code`. Headings, images, tables, blockquotes, horizontal rules, and
code fences are rejected by the build with a named error.

**`index.json`'s `summary` is the first sentence**, not a 200-character truncation.
Entries follow genus-differentia, so the opening sentence is a definition rather than
an arbitrary cut. It is extracted from label-stripped prose, never from resolved
Markdown, and carries a `truncated` flag so navigational surfaces can show that an
entry continues.

## Consequences

`Concept.definition` is **resolved Markdown, not raw prose**. Printing it as text
shows link syntax. This is invisible in the type — `string` either way — so it is
documented at the field.

Rejecting forbidden blocks at build time rather than dropping them at render time is
deliberate. `allowedElements` drops disallowed nodes from the tree, but without
`remark-gfm` a table is never parsed as a table at all: it survives as a paragraph of
literal pipe characters. Only a build-time check catches that. The renderer keeps its
allowlist as defense in depth, so both layers have to fail before a heading can appear
inside an entry.

`TermPageContent` became a server component. Its `'use client'` directive was
vestigial — no state, no effects, no handlers — so removing it costs nothing and keeps
the entire Markdown renderer out of the client bundle. The `/term/[slug]` route ships
0 B of route-specific JavaScript.

The build now reports wikilinks pointing at inactive concepts instead of failing on
them. This surfaces the missing-terms signal early: `space` (C0074), `roam` (C0067),
`wave direction` (C0093), and `lethal` (C0044) are each linked from several entries
and are the strongest candidates for Phase 4's hierarchy work.

`stripBackticks` and `SUMMARY_LENGTH` are deleted, along with three inline copies of
the backtick regex in `GraphView`, `ListView`, and the term page. The vault contains
no backticks and the mechanism they served was removed in Phase 1.

## Alternatives considered

**Resolve wikilinks in the renderer.** Would have required either a custom remark
plugin or a hand-rolled parser in a client component, and would have shipped the
resolution logic to every visitor. The build already knows every label and slug.

**A hand-rolled renderer instead of `react-markdown`.** Roughly 40 lines for the
syntax the vault uses today. Rejected because the term page is the primary surface and
paragraph, list, and emphasis handling should not be re-derived. Since the component
renders on the server, the dependency costs no client bytes.

**Keep 200-character truncation.** Rejected: it cuts mid-word and mid-clause, and the
corpus is written in a form whose first sentence is already the definition.
