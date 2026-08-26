/**
 * Turning the two outline files into frontmatter.
 *
 * The outlines are source; `broader`, `narrower`, `partOf` and `hasPart` are
 * derived from them (ADR0018). This module holds the whole derivation — parse,
 * validate, close the inverses, diff against the vault — so apply-hierarchy,
 * check-vocab and check-roundtrip all agree by construction rather than by
 * three parallel implementations agreeing today and drifting tomorrow.
 *
 * Nothing here writes. The caller decides.
 */

import * as fs from 'fs';
import { BROADER_FILE, PARTOF_FILE } from './paths';
import { asList, type Frontmatter, type Note } from './frontmatter';
import { findCycle, HIERARCHY_FIELDS, type HierarchyField } from './relations';
import {
  allIds,
  parentMap,
  parseOutline,
  OutlineError,
  type Outline,
  type OutlineItem,
} from './outline';

/** One tree: the authored field, the field derived from it, and its file. */
export interface Tree {
  /** The field a human authors by nesting: `broader` or `partOf`. */
  authored: 'broader' | 'partOf';
  /** The field derived by inversion: `narrower` or `hasPart`. */
  derived: HierarchyField;
  filepath: string;
  label: string;
}

export const TREES: Tree[] = [
  { authored: 'broader', derived: 'narrower', filepath: BROADER_FILE, label: 'broader.md' },
  { authored: 'partOf', derived: 'hasPart', filepath: PARTOF_FILE, label: 'partof.md' },
];

export interface Problem {
  severity: 'fail' | 'warn';
  message: string;
}

/** The hierarchy the outlines assert: id -> field -> sorted target ids. */
export type Derived = Map<string, Record<HierarchyField, string[]>>;

const emptyFields = (): Record<HierarchyField, string[]> => ({
  broader: [],
  narrower: [],
  partOf: [],
  hasPart: [],
});

export interface ReadResult {
  outlines: Map<string, Outline>;
  problems: Problem[];
}

/** Reads and parses both outlines. A parse error becomes a fail Problem. */
export function readOutlines(source?: Map<string, string>): ReadResult {
  const outlines = new Map<string, Outline>();
  const problems: Problem[] = [];

  for (const tree of TREES) {
    const text = source?.get(tree.filepath) ?? readIfPresent(tree.filepath);
    if (text === null) {
      problems.push({
        severity: 'fail',
        message:
          `${tree.label} is missing.\n` +
          `    The hierarchy outlines are the source for ${tree.authored} and ${tree.derived}.\n` +
          `    Create them with: npm run bootstrap-hierarchy`,
      });
      continue;
    }
    try {
      outlines.set(tree.filepath, parseOutline(text, tree.label));
    } catch (err) {
      if (err instanceof OutlineError) {
        problems.push({ severity: 'fail', message: `${err.file}:${err.line}: ${err.message}` });
      } else {
        throw err;
      }
    }
  }

  return { outlines, problems };
}

function readIfPresent(filepath: string): string | null {
  return fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf-8') : null;
}

/**
 * Validates both outlines against the vault and derives the frontmatter they
 * imply, with inverses closed.
 *
 * `narrower` is recomputed from scratch as every note whose `broader` names
 * this one, so removing a child from the outline removes the parent's entry.
 * Incremental addition would leave orphans behind.
 */
export function deriveHierarchy(
  outlines: Map<string, Outline>,
  notes: Note[]
): { derived: Derived; problems: Problem[] } {
  const problems: Problem[] = [];
  const byId = new Map(notes.map((n) => [n.id, n]));
  const label = (id: string) => String(byId.get(id)?.data.prefLabel ?? '?');
  const name = (id: string) => `${id} (${label(id)})`;

  const derived: Derived = new Map(notes.map((n) => [n.id, emptyFields()]));

  for (const tree of TREES) {
    const outline = outlines.get(tree.filepath);
    if (!outline) continue;

    const items = allIds(outline);
    const seen = new Map<string, OutlineItem>();

    for (const item of items) {
      // Unknown id. The outline names a concept that does not exist.
      if (!byId.has(item.id)) {
        problems.push({
          severity: 'fail',
          message: `${tree.label}:${item.line}: ${item.id} is not a concept in the vault`,
        });
        continue;
      }

      // Duplicate within one tree. Name both locations - a merge would be a
      // guess about which placement was intended.
      const first = seen.get(item.id);
      if (first) {
        problems.push({
          severity: 'fail',
          message:
            `${tree.label}: ${name(item.id)} appears twice, on lines ${first.line} and ${item.line}.\n` +
            `    A concept has one parent. Delete whichever placement is wrong.`,
        });
        continue;
      }
      seen.set(item.id, item);

      const note = byId.get(item.id)!;
      if (note.data.active !== true) {
        problems.push({
          severity: 'warn',
          message: `${tree.label}:${item.line}: ${name(item.id)} is inactive; the build drops its edges`,
        });
      }
      if (item.label && item.label !== label(item.id)) {
        problems.push({
          severity: 'warn',
          message:
            `${tree.label}:${item.line}: label "${item.label}" is stale; ${item.id} is now "${label(item.id)}"`,
        });
      }
    }

    // An id in both regions is contradictory: placed and undecided at once.
    const placed = new Set(outline.hierarchy.map((i) => i.id));
    for (const item of outline.unplaced) {
      if (placed.has(item.id)) {
        problems.push({
          severity: 'fail',
          message:
            `${tree.label}:${item.line}: ${name(item.id)} is in both Hierarchy and Unplaced.\n` +
            `    Placed and undecided are different claims. Remove one.`,
        });
      }
    }

    // Every active concept must appear somewhere, or it would silently lose an
    // existing relation on the next apply.
    const named = new Set(items.map((i) => i.id));
    if (tree.authored === 'broader') {
      for (const note of notes) {
        if (note.data.active === true && !named.has(note.id)) {
          problems.push({
            severity: 'fail',
            message:
              `${tree.label}: ${name(note.id)} appears in neither Hierarchy nor Unplaced.\n` +
              `    Every active concept must be listed. Add it under ## Unplaced if undecided.`,
          });
        }
      }
    }

    // Build the edges, then check for a cycle before deriving anything from them.
    const parents = parentMap(outline);
    const edges = new Map<string, string[]>();
    for (const [child, parent] of parents) {
      if (!byId.has(child) || !byId.has(parent)) continue;
      edges.set(child, [parent]);
    }

    const cycle = findCycle(edges, (id) => byId.has(id));
    if (cycle) {
      problems.push({
        severity: 'fail',
        message:
          `${tree.label}: ${tree.authored} contains a cycle: ${cycle.map(name).join(' -> ')}.\n` +
          `    A concept cannot sit above itself.`,
      });
      continue;
    }

    for (const [child, parent] of parents) {
      if (!byId.has(child) || !byId.has(parent)) continue;
      derived.get(child)![tree.authored].push(parent);
      derived.get(parent)![tree.derived].push(child); // inverse closure
    }
  }

  // A pair asserted in both trees is a judgement call, not a fault - the same
  // policy check-vocab applies to dual-typed pairs.
  const pairs = new Map<string, Set<string>>();
  for (const [id, fields] of derived) {
    for (const tree of TREES) {
      for (const target of fields[tree.authored]) {
        const key = [id, target].sort().join('|');
        if (!pairs.has(key)) pairs.set(key, new Set());
        pairs.get(key)!.add(tree.authored);
      }
    }
  }
  for (const [key, types] of pairs) {
    if (types.size > 1) {
      const [a, b] = key.split('|');
      problems.push({
        severity: 'warn',
        message: `${name(a)} and ${name(b)} are related in both trees (${[...types].sort().join(' + ')})`,
      });
    }
  }

  for (const fields of derived.values()) {
    for (const field of HIERARCHY_FIELDS) fields[field].sort();
  }

  return { derived, problems };
}

export interface Change {
  id: string;
  field: HierarchyField;
  before: string[];
  after: string[];
}

/** What would change in the vault, per note and field. */
export function diffAgainstVault(derived: Derived, notes: Note[]): Change[] {
  const changes: Change[] = [];
  for (const note of notes) {
    const target = derived.get(note.id);
    if (!target) continue;
    for (const field of HIERARCHY_FIELDS) {
      const before = asList(note.data[field]).slice().sort();
      const after = target[field];
      if (before.join(',') !== after.join(',')) {
        changes.push({ id: note.id, field, before, after });
      }
    }
  }
  return changes;
}

/**
 * The frontmatter a note should carry, given the outlines.
 *
 * Only the four hierarchy fields are touched. Everything else passes through,
 * and the caller asserts that (the blast-radius check in apply-hierarchy).
 */
export function applyToData(note: Note, derived: Derived): Frontmatter {
  const target = derived.get(note.id);
  if (!target) return note.data;
  return { ...note.data, ...target };
}
