/**
 * Filesystem paths, in one place.
 *
 * Every script imports from here. No script keeps its own copy of a path
 * constant — that is how `src/data/terms` ended up hardcoded in five files and
 * two docs before the Phase 4a restructure.
 *
 * The Obsidian vault root is VAULT_DIR. It holds both the term notes and the
 * hierarchy outlines, so `[[` autocomplete resolves across both.
 */

import path from 'path';

const ROOT = process.cwd();

/** Obsidian vault root. Holds terms/, hierarchy/, and .obsidian/. */
export const VAULT_DIR = path.join(ROOT, 'src/data/vault');

/** The term notes: C0001.md … C0097.md. One note, one concept. */
export const TERMS_DIR = path.join(VAULT_DIR, 'terms');

/** The hand-authored hierarchy outlines: broader.md, partof.md. */
export const HIERARCHY_DIR = path.join(VAULT_DIR, 'hierarchy');

/** Build output. Deleted and rewritten on every build; nothing here survives. */
export const GENERATED_DIR = path.join(ROOT, 'src/data/generated');

/** Report output. Gitignored. */
export const REPORTS_DIR = path.join(ROOT, 'reports');

/** The two outline files, by relation. */
export const BROADER_FILE = path.join(HIERARCHY_DIR, 'broader.md');
export const PARTOF_FILE = path.join(HIERARCHY_DIR, 'partof.md');
