/**
 * Reading and writing note frontmatter.
 *
 * gray-matter only. Never regex the frontmatter path — ADR0014 records what
 * happened the last time a script parsed `aliases:` with `^aliases:[ \t]*(.*)$`
 * and silently corrupted three notes, one of which stayed valid YAML while
 * carrying a stale label. Nothing detected it.
 *
 * FIELD_ORDER lived in three scripts before this file existed, kept in sync by
 * a comment. That is the same class of hazard one step removed.
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { TERMS_DIR } from './paths';

/**
 * Field order in emitted frontmatter. Anything unlisted follows, sorted.
 *
 * gray-matter preserves insertion order rather than imposing one, so without
 * this the schema order drifts note by note depending on which tool wrote last.
 */
export const FIELD_ORDER = [
  'id',
  'prefLabel',
  'altLabel',
  'hiddenLabel',
  'aliases',
  'collection',
  'active',
  'complete',
  'broader',
  'narrower',
  'partOf',
  'hasPart',
  'related',
  'relatedReviewed',
] as const;

export type FieldName = (typeof FIELD_ORDER)[number];

/** Frontmatter as parsed. Values are whatever YAML produced. */
export type Frontmatter = Record<string, unknown>;

export interface Note {
  /** Filename stem, which is also the id: `C0042`. */
  id: string;
  /** Absolute path to the note. */
  filepath: string;
  /** The file exactly as read. */
  raw: string;
  /** Parsed frontmatter. */
  data: Frontmatter;
  /** The prose body, as gray-matter returns it. */
  content: string;
}

/** Coerces a frontmatter value to a list of strings. A bare scalar becomes one item. */
export function asList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

/** Listed fields first in FIELD_ORDER sequence, then anything unlisted, sorted. */
export function orderFields(data: Frontmatter): Frontmatter {
  const ordered: Frontmatter = {};
  for (const key of FIELD_ORDER) {
    if (key in data) ordered[key] = data[key];
  }
  for (const key of Object.keys(data).sort()) {
    if (!(key in ordered)) ordered[key] = data[key];
  }
  return ordered;
}

/** Every term note, sorted by id. Throws if the vault is empty. */
export function readNotes(dir: string = TERMS_DIR): Note[] {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
  if (files.length === 0) throw new Error(`No term notes found in ${dir}`);

  return files.map((file) => {
    const filepath = path.join(dir, file);
    const raw = fs.readFileSync(filepath, 'utf-8');
    const parsed = matter(raw);
    return {
      id: file.replace(/\.md$/, ''),
      filepath,
      raw,
      data: parsed.data as Frontmatter,
      content: parsed.content,
    };
  });
}

/** The result of rendering a note back to text. */
export interface RenderResult {
  /** The emitted file text. */
  out: string;
  /** True when the body would change — the caller must not write. */
  bodyDrift: boolean;
  /** True when `out` is byte-identical to what was read. */
  unchanged: boolean;
}

/**
 * Renders a note back to text with `data` as its frontmatter.
 *
 * Does not write. The body-preservation guard compares prose rather than raw
 * bytes: gray-matter always emits a trailing newline, so a gained or lost final
 * newline is not drift. One note (C0049) lacks one today.
 */
export function renderNote(note: Note, data: Frontmatter): RenderResult {
  const out = matter.stringify(note.content, orderFields(data));
  return {
    out,
    bodyDrift: matter(out).content.trimEnd() !== note.content.trimEnd(),
    unchanged: out === note.raw,
  };
}

/**
 * Writes a note, unless the body would change or nothing would change.
 *
 * Returns what happened, so callers can report counts without re-deriving it.
 */
export function writeNote(
  note: Note,
  data: Frontmatter,
  opts: { dryRun?: boolean } = {}
): 'written' | 'unchanged' | 'body-drift' {
  const { out, bodyDrift, unchanged } = renderNote(note, data);
  if (bodyDrift) return 'body-drift';
  if (unchanged) return 'unchanged';
  if (!opts.dryRun) fs.writeFileSync(note.filepath, out, 'utf-8');
  return 'written';
}
