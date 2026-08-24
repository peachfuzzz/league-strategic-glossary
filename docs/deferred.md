# Deferred

Intentionally deferred things.

## Deferred by decision

The meso essay. The argument that League is meso-heavy and that its vocabulary underdescribes the operational layer. Deferred because the evidence is the glossary itself — betweenness over the mentions graph. Writing it after the restructure means the argument rests on computed structure rather than assertion. The military parallel (operational level of war, formalized in FM 100-5, 1982) is the precedent to cite.

Tree navigation view. A view organized by hierarchy rather than alphabet. Cut because the term page states hierarchy as text and the graph shows it visually. Revisit if neither turns out to be legible enough.

Video and media. MediaGallery.tsx was deleted in Phase 1. Video is the genre standard for game glossaries — Infil's Fighting Game Glossary is cited for its clips more than its prose — and the wave-cycle terms are exactly the ones prose describes poorly. The component is in git history.

Gamification. Not a rigorous reference work concern. Long deferred.

Disambiguation pages. Cut from V2 because no label is currently ambiguous. labels.json is one-to-many in shape and the ambiguity check runs, so this becomes live work the first time a label is shared. "Resources" belonging to both economy and mana is the likely first case.

Runtime data fetching. Phase 1 chose static JSON imports over fetching from /public. The artifacts are already separate, so switching later does not mean redoing the generator. Revisit if bundle size becomes real.

General editing pass. I don't have time for this right now lol, a strict readthrough of all terms for editing would take a minute.

"player" editing pass and differentiation. Right now, "player" represents multiple related-but-distinct concepts, and in the interest of formalization, should be separated into its constituents. Need to look through all appearances of "player" and decide on what representation to choose. Also maybe write definitions for "player" as summoner and "player" as champion in-game.

## Deferred cleanup

Backtick handling. stripBackticks in build-vocab.ts removes markers and keeps the text. It previously created autolinks; that mechanism is gone and no entry uses backticks. Harmless, but it is dead code with a misleading name.

## Open questions

Do collections survive at all? collection currently carries the seven old tag values. They encode little and the category label on an entry is being reduced to mono uppercase text. The options are: keep as a filing shelf, delete entirely, or replace with something derived from the hierarchy. Decide during the presentation phase.

hiddenLabel is empty everywhere. Misspellings, abbreviations, and variants that should match in search but never display. Worth a pass at some point; nothing depends on it.

last_revised per entry. Reference-work furniture that signals maintenance. Dropped from DESIGN.md during the rewrite because nothing populates it. Needs a source before it can render.

A–Z index rail, revision number. Reference-work furniture. Cheap, but not load-bearing for the V2 send.

Full ADR rationale. ADRs 0001–0011 exist as one-liners. Context and consequences sections are unwritten. The decisions are recorded, which was the point; the reasoning is recoverable from this conversation for now.

Editorial decision records. A parallel to the ADRs covering editorial policy rather than architecture — when to mint a term, when to formalize versus document, the all-and-some test, the genus-differentia convention. Deferred until editorial decisions start feeling directional rather than local.

A style guide. Most of it already exists as latent convention: genus-differentia openings, the authors' note appearing exactly where community usage was deviated from, the also-known-as register. This is closer to documentation than authoring. The hierarchy pass is the natural time, since it means reading all 97 entries anyway.

Real small caps. Newsreader and Spectral do not ship smcp. EB Garamond and Cormorant do. Only relevant if synthesized caps become unacceptable.

## Missing terms

- opportunity cost
- resource
- input
- string
- bread-and-butter
- skillshot
- crowd control
- inactionable
- recall
- lane
- lane phase
- information asymmetry
- soft contest
- window
- numbers advantage
- cast
- cast time
- lane assignment
- scaling
- target-agnostic
- marksmen
- class
- job
- risk
- state
- jungle proximity
- off-meta
- gamestate
- sequence
- farm
- timer
- effective range
- payoff
- snowball
- setup
- agency
- push
- wave position