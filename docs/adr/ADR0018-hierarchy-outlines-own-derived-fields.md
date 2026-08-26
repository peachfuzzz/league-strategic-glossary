# ADR0018 — The hierarchy outlines own the four hierarchy fields

Status: accepted
Date: 2026-08-25

Qualifies ADR0006 for four of the fourteen frontmatter fields. `prefLabel`, `altLabel`,
`hiddenLabel`, `collection`, `active`, `complete`, `related` and `relatedReviewed` are
unaffected and remain authored in frontmatter.

## Context

Phase 4 writes the hierarchy by hand. `broader`, `narrower`, `partOf` and `hasPart` are
empty on all 97 notes, and 93 active concepts need parents.

The first design for Phase 4a was a review file: one stanza per concept, with a
`broader:` line to fill in. It was scoped, costed, and rejected before implementation.
The reason is worth recording, because it is an argument about the work rather than
about the tooling.

**A form treats hierarchy as 93 independent decisions. It is one structure.** A stanza
file cannot show that `fight` has eleven children and `value` has none. An outline can,
because indentation *is* the relation. The author needs to see the shape taking form to
judge whether it is coherent, and a per-concept form withholds exactly that.

That choice determines where the data lives. An outline is only an outline if the
nesting is the source; deriving it from ninety-three separate frontmatter fields and
re-rendering would make it a report, not a document to think in.

## Decision

**Two hand-authored outline files are the source of the hierarchy:**

- `src/data/vault/hierarchy/broader.md` — the is-a tree
- `src/data/vault/hierarchy/partof.md` — the part-of tree

They are separate files because they are separate relations. Mixing them in one tree
would lose the distinction that ADR0003 exists to preserve.

**`broader`, `narrower`, `partOf` and `hasPart` in note frontmatter are derived from
them** by `scripts/apply-hierarchy.ts`. A hand edit to any of the four is overwritten on
the next apply.

**The author writes only `broader` and `partOf`** — by nesting. `narrower` and `hasPart`
are computed as the inverse, recomputed from scratch on every apply so that removing a
child from the outline removes the parent's entry. Authoring both ends by hand would
mean writing every edge twice in two places across a dozen sessions, and `check-vocab`'s
one-sided-edge report would fill with routine noise.

**Each file has two regions, and they are not interchangeable.** An item at the top level
of `## Hierarchy` is a claim: this concept has nothing above it. An item under
`## Unplaced` is undecided. Unplaced emptying to zero is the progress indicator for
Phase 4b.

**One parent per concept.** A duplicate item is a parse error naming both line numbers,
not a merge. No genuine two-parent case could be constructed; if one appears, the error
surfaces it and the convention gets revisited then.

**The outlines live in the vault** so `[[` autocomplete resolves against `aliases` and
inserts `[[C0028|fight]]` — target by identifier, display by label, produced by tooling
rather than typed by hand. This is why Step 0 moved the vault root to `src/data/vault/`:
a vault rooted at `terms/` cannot see a sibling `hierarchy/`.

## Consequences

**Opening a note and editing `broader` is now a mistake that produces nothing.** This is
a real hazard and the reason this ADR exists. It is the ADR0014 failure mode — an edit
that appears to work and silently vanishes.

The obvious mitigation, a comment on the four fields in each note, **does not work**.
gray-matter round-trips YAML through js-yaml, which does not preserve comments, so
`matter.stringify` would strip it on the very next write. Emitting one would mean
post-processing the serialised frontmatter as a string, which is the practice ADR0014
closed off.

**So `check-vocab` compares frontmatter against the outlines and fails on divergence,
and its message is the only place the rule is stated at the moment it is needed.** It
names the cause and the fix rather than reporting a mismatch. It distinguishes three
states — hand-edited to a different value, hand-added where the outline has none,
hand-cleared where the outline asserts one — and a fourth that is not an error: an
outline edited but not yet applied, which is the normal mid-session state during Phase
4b. Classifying that as a hand edit would train the reader to ignore the check, so it is
detected by coverage (every asserted relation diverging, not merely all in the same
direction) and reported without failing.

**`check-roundtrip.ts` mutation-tests the guard**, including a hand edit to each of the
three divergence states. Every other guard in this phase is mutation-tested; the one
replacing the comment had to be too. A guard never seen to fail is not known to work.

**`related` is unaffected.** It stays authored in frontmatter, reviewed note by note in
Phase 4d. It is symmetric rather than hierarchical, the eight known-asymmetric pairs are
a deliberate signal, and auto-symmetrising them now would bless them as intentional.

**`normalize-frontmatter.ts` and `regen-aliases.ts` set the precedent.** `aliases` has
been script-owned since Phase M. This decision extends an existing pattern to four more
fields rather than introducing a new one.

## Alternatives considered

**A stanza review file, one block per concept.** The original plan. Rejected above: it
cannot show the shape of the tree, which is the thing being judged. It also required
machinery this design does not — a vault fingerprint, stale-clear detection, an
unapplied-edit guard, and a dump/edit/apply/re-dump cycle — all of it existing to keep a
generated working copy in sync with the vault. There is no dump step here. The outline
is authored.

**One outline file with both relations.** Rejected. The distinction between *is a kind
of* and *is a part of* is the distinction ADR0003 turns on.

**A single YAML document.** Rejected on failure locality. A mis-indented line fails the
whole thousand-line file, and this file is edited across many sessions. A line-oriented
format fails one item, which the parser names by id and line.

**Frontmatter stays the source; generate the outline as a read-only view.** Rejected.
The author would then edit ninety-three files to restructure a subtree, which is the
cost the outline exists to remove. Obsidian's outliner handles indent, outdent and
subtree drag natively; a generated view discards that.

**Multi-parent support.** Deferred, not rejected. Building for a case that could not be
named would add merge semantics to every validation path for no demonstrated need. The
duplicate-item error is the trigger to revisit.
