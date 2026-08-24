# ADR0016 — The derived relation is `mentions`, not `dependsOn`

Status: accepted
Date: 2026-08-24

Supersedes the fourth relation type of ADR0003. The other three — `broader`/`narrower`,
`partOf`/`hasPart`, and `related` — are unaffected.

## Context

ADR0003 named four relation types. The fourth, derived from prose rather than authored,
was called *dependent* and justified as *"useful for showing fundamentalness."* Working
notes and `DESIGN.md` referred to it as `dependsOn`.

Phase 2c is the first phase to compute it, which is the first occasion to check the name
against what the computation actually produces.

It does not produce fundamentalness. It produces this: **the prose of entry A contains a
wikilink to concept B.** That is a fact about the text. Whether A's *meaning* requires B
is a separate claim, and one the build has no way to establish — a link may be a genuine
conceptual dependency, a passing example, a contrast, or an aside.

The gap is not academic. The most-linked concept in the vault is `player` (C0059) at
in-degree 44, 2.6× the runner-up. Almost every definition mentions a player because a
player is the medium the game is played in, not because 44 concepts depend on the
concept of a player. Under the name `dependsOn`, that number reads as a finding about
the vocabulary's structure. Under the name `mentions`, it reads as what it is.

## Decision

**The derived relation is named `mentions`.** It records that one entry's prose links to
another concept. It makes no claim about dependency, fundamentalness, or priority.

The name appears as: the `mentions` field on each concept JSON, the `"mentions"` edge
type in `graph.json`, and the term used throughout `DESIGN.md`, `CLAUDE.md`, and
`RESTRUCTURE-PLAN.md`.

`dependsOn` never reached executable code — it existed only in documentation — so the
rename cost nothing beyond prose edits.

**`backlinks` is the reverse of `mentions` alone.** It previously scanned the five
relation fields. It no longer does. A backlink now answers one question: whose prose
links here.

**Metrics over `mentions` exclude substrate concepts.** `SUBSTRATE_CONCEPTS` in
`src/config/substrate.config.ts` lists terms whose degree measures ubiquity rather than
structural importance — `player` and `target` today. The exclusion applies to metrics
only. The graph and the concept files still carry every real prose link, because hiding
one would misrepresent the vault. Reports show both figures, full graph first.

## Consequences

**The relation is honest about its epistemic status.** ADR0003 §"Why four types matter"
holds that each type makes a different claim and the types may disagree. That argument
requires each type to state its claim accurately. `mentions` states a fact about the
text; `broader` states an argument about the vocabulary. The disagreement between them
stays interesting precisely because neither overstates itself.

**A prose link is no longer evidence of hierarchy.** This was already true and is now
visible in the name. Phase 4 assigns `broader` by the all-and-some test, not by counting
links. The in-degree ranking remains an empirical prior worth reading before drawing the
tree — it is simply a prior about what the corpus talks about, not about what sits near
the root.

**The meso hypothesis test is unchanged in substance.** ADR0010 holds that meso-level
structure should fall out of the relations rather than be labelled by hand. Betweenness
over `mentions` is still the blind test, computed over prose written before the
hypothesis existed. Renaming the relation does not weaken the test; it clarifies what
the test measures — bridging in what the corpus discusses.

**Backlinks changed meaning, and the term page stopped rendering them.** The
"Referenced by" list previously showed ~17 relation-derived referrers across the whole
vault. As the reverse of `mentions` it would show 216, unevenly distributed. Whether and
how to display that is a presentation question, deferred to Phase 5a. The data ships in
the concept files either way, and the graph is the better surface for reverse
navigation.

## Alternatives considered

**Keep `dependsOn` and document the caveat.** Rejected. A name that has to be explained
away in prose will be read at face value by anyone who skips the prose — including a
future Claude Code session working from `CLAUDE.md`.

**`references` or `links`.** Both accurate. `references` collides with the term-page
label "Referenced by" and with `refs`, which is a different structure. `links` is
overloaded by the old `links` frontmatter field retired in Phase M, and by Markdown
links generally.

**Split into `mentions` and a hand-authored `dependsOn`.** A fifth relation type, and
ADR0003's instruction is to use exactly four. If a genuine dependency claim is wanted
later, `broader` and `partOf` already carry most of it.

**Exclude substrate concepts from the graph as well as the metrics.** Rejected. A prose
link to `player` is a real link. The graph's job is to show the vault; the metric's job
is to rank. Only the second needs the exclusion.
