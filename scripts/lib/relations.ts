/**
 * The relation model: which fields are authored, which invert which, and
 * cycle detection over a directed relation.
 *
 * Lifted from check-vocab.ts so apply-hierarchy and check-roundtrip share one
 * definition with the checker rather than each carrying a copy. See ADR0003 for
 * what the four relation types claim, and ADR0016 for why `mentions` is not
 * among them.
 */

import { asList, type Frontmatter } from './frontmatter';

/** The authored relation fields. `mentions` is derived and is not among them. */
export const RELATION_FIELDS = [
  'related',
  'broader',
  'narrower',
  'partOf',
  'hasPart',
] as const;

/**
 * The four hierarchy fields, owned by the outline files.
 *
 * `related` is excluded: it is authored in frontmatter and reviewed in Phase 4d,
 * not written by apply-hierarchy. Anything touching these four is writing
 * derived data.
 */
export const HIERARCHY_FIELDS = ['broader', 'narrower', 'partOf', 'hasPart'] as const;

export type HierarchyField = (typeof HIERARCHY_FIELDS)[number];

/** The field a human authors, per tree, and the field derived from it. */
export const AUTHORED: Record<'broader' | 'partOf', HierarchyField> = {
  broader: 'narrower',
  partOf: 'hasPart',
};

export const INVERSE: Record<string, string> = {
  broader: 'narrower',
  narrower: 'broader',
  partOf: 'hasPart',
  hasPart: 'partOf',
};

/** Collapses each field and its inverse to one name, so a correct pair is one claim. */
export const claimOf = (field: string): string =>
  field === 'narrower' ? 'broader' : field === 'hasPart' ? 'partOf' : field;

/** A relation field's targets, as a list of ids. */
export const targetsOf = (data: Frontmatter | undefined, field: string): string[] =>
  asList(data?.[field]);

/**
 * Finds a cycle in a directed relation, or returns null.
 *
 * A cycle means A is above B is above A, which is incoherent under either
 * hierarchy relation. Returns the cycle as a path whose first and last elements
 * are the same id, so the caller can print it directly.
 *
 * Targets that do not resolve are skipped: a dangling id cannot form a cycle,
 * and the caller reports it separately.
 *
 * `mentions` is deliberately never checked. It is cyclic by design — ten
 * mutually mentioning pairs exist today, and mutual definition is a finding
 * about the vocabulary rather than a fault.
 */
export function findCycle(
  edges: Map<string, string[]>,
  known: (id: string) => boolean
): string[] | null {
  const WHITE = 0,
    GREY = 1,
    BLACK = 2;
  const colour = new Map<string, number>();
  const stack: string[] = [];

  const walk = (id: string): string[] | null => {
    colour.set(id, GREY);
    stack.push(id);

    for (const next of edges.get(id) ?? []) {
      if (!known(next)) continue;
      const c = colour.get(next) ?? WHITE;
      if (c === GREY) {
        // Found it. Slice from where `next` sits on the stack to close the loop.
        return [...stack.slice(stack.indexOf(next)), next];
      }
      if (c === WHITE) {
        const found = walk(next);
        if (found) return found;
      }
    }

    stack.pop();
    colour.set(id, BLACK);
    return null;
  };

  for (const id of edges.keys()) {
    if ((colour.get(id) ?? WHITE) === WHITE) {
      const found = walk(id);
      if (found) return found;
    }
  }
  return null;
}
