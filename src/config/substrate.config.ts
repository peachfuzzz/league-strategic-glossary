/**
 * Substrate Concepts
 *
 * Terms that nearly every definition invokes because serve a grammatical role.
 * Their degree in the `mentions` graph measures ubiquity, not
 * structural importance, and including them swamps the ranking that Phase 4
 * reads as an empirical prior on the hierarchy.
 *
 * **This list is metrics-only.** It must not filter `graph.json`, the concept
 * files, or anything rendered. A prose link to `player` is a real link, and
 * hiding it would misrepresent the vault. Only `scripts/metrics.ts` reads this,
 * and it reports every figure twice - full graph first, substrate-free second -
 * so the exclusion always reads as a delta rather than as the only number.
 *
 * This is an editorial judgement, not a computed result. Keep the list short,
 * and justify each addition here.
 *
 * See `docs/adr/ADR0016-mentions-not-depends-on.md`.
 */
export const SUBSTRATE_CONCEPTS = [
  'C0059', // player - the actor every definition presupposes
  'C0084', // target - the thing acted upon; same role, lower frequency
] as const;
