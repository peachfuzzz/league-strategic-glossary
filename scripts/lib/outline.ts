/**
 * The hierarchy outline format: parse and serialise.
 *
 * An outline file is the source for one hierarchy relation. Indentation is the
 * relation — a child's parent is the item it sits under. Two regions:
 *
 *   ## Hierarchy   a placement. A top-level item claims "no broader concept".
 *   ## Unplaced    undecided. Not a claim.
 *
 * The distinction is load-bearing. Conflating them destroys the progress
 * signal, which is Unplaced emptying to zero.
 *
 * Every parse failure names the file and line. A line-oriented format is chosen
 * over YAML precisely so a fat-fingered edit damages one item rather than the
 * whole file, and this parser must honour that: nothing is silently skipped.
 */

import * as fs from 'fs';

/** One placed concept and its depth in the tree. */
export interface OutlineItem {
  id: string;
  /** The label as written, for checking against prefLabel. Empty if bare. */
  label: string;
  /** 0 for a top-level item. */
  depth: number;
  /** 1-indexed line in the source file. */
  line: number;
}

export interface Outline {
  /** Placed items, in file order, with depth. */
  hierarchy: OutlineItem[];
  /** Undecided items. Order is not meaningful. */
  unplaced: OutlineItem[];
  /** Everything above `## Hierarchy`, preserved verbatim on rewrite. */
  header: string;
}

/** id -> parent id. Absent means top-level (a claim of no parent). */
export type ParentMap = Map<string, string>;

export class OutlineError extends Error {
  constructor(
    message: string,
    readonly file: string,
    readonly line: number
  ) {
    super(message);
    this.name = 'OutlineError';
  }
}

const ITEM = /^(\s*)-\s+\[\[(C\d{4})(?:\|([^\]]*))?\]\]\s*$/;
const HEADING = /^##\s+(.+?)\s*$/;

/** A tab is one level; so are two spaces. Obsidian's outliner emits tabs. */
function depthOf(indent: string, file: string, line: number): number {
  const tabs = indent.replace(/ {2}/g, '\t');
  if (/[^\t]/.test(tabs)) {
    throw new OutlineError(
      `indentation must be tabs or pairs of spaces, found ${JSON.stringify(indent)}`,
      file,
      line
    );
  }
  return tabs.length;
}

/**
 * Parses an outline file.
 *
 * Throws OutlineError on anything it cannot read as a heading, an item, or
 * blank/prose. Depth jumps of more than one level are an error: an item
 * indented twice past its predecessor has no unambiguous parent.
 */
export function parseOutline(text: string, file: string): Outline {
  const lines = text.split('\n');
  const hierarchy: OutlineItem[] = [];
  const unplaced: OutlineItem[] = [];
  const headerLines: string[] = [];

  let region: 'header' | 'hierarchy' | 'unplaced' = 'header';
  let lastDepth = -1;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1;

    const heading = HEADING.exec(raw);
    if (heading) {
      const name = heading[1].toLowerCase();
      if (name === 'hierarchy') {
        region = 'hierarchy';
        lastDepth = -1;
        continue;
      }
      if (name === 'unplaced') {
        region = 'unplaced';
        lastDepth = -1;
        continue;
      }
      if (region === 'header') {
        headerLines.push(raw);
        continue;
      }
      throw new OutlineError(
        `unexpected heading "${heading[1]}" — the only sections are "## Hierarchy" and "## Unplaced"`,
        file,
        lineNo
      );
    }

    if (region === 'header') {
      headerLines.push(raw);
      continue;
    }

    if (raw.trim() === '') continue;

    const item = ITEM.exec(raw);
    if (!item) {
      // A list item that did not match is the dangerous case: it looks like
      // data and would otherwise vanish. Name it rather than skip it.
      const hint = /^\s*-/.test(raw)
        ? 'each item must be exactly `- [[C####|label]]`'
        : 'expected a list item, a heading, or a blank line';
      throw new OutlineError(`${hint}, found ${JSON.stringify(raw)}`, file, lineNo);
    }

    const [, indent, id, label] = item;
    const depth = depthOf(indent, file, lineNo);

    if (region === 'unplaced' && depth > 0) {
      throw new OutlineError(
        `${id} is indented under Unplaced, which has no structure — remove the indent`,
        file,
        lineNo
      );
    }
    if (depth > lastDepth + 1) {
      throw new OutlineError(
        `${id} is indented ${depth - lastDepth} levels past the item above it, so its parent is ambiguous`,
        file,
        lineNo
      );
    }

    const entry: OutlineItem = { id, label: label ?? '', depth, line: lineNo };
    (region === 'hierarchy' ? hierarchy : unplaced).push(entry);
    lastDepth = depth;
  }

  return { hierarchy, unplaced, header: headerLines.join('\n').trimEnd() };
}

/** Reads and parses an outline file. */
export function readOutline(filepath: string): Outline {
  return parseOutline(fs.readFileSync(filepath, 'utf-8'), filepath);
}

/**
 * Walks the hierarchy region and returns id -> parent id.
 *
 * An item at depth 0 is absent from the map, which is the claim that it has no
 * broader concept. Items under Unplaced are absent too — undecided, not a
 * claim. The caller distinguishes the two by consulting `unplaced`.
 */
export function parentMap(outline: Outline): ParentMap {
  const parents: ParentMap = new Map();
  const ancestry: string[] = [];

  for (const item of outline.hierarchy) {
    ancestry.length = item.depth;
    if (item.depth > 0) parents.set(item.id, ancestry[item.depth - 1]);
    ancestry[item.depth] = item.id;
  }
  return parents;
}

/** Every id the outline names, in either region. */
export function allIds(outline: Outline): OutlineItem[] {
  return [...outline.hierarchy, ...outline.unplaced];
}

/**
 * Renders an outline back to text.
 *
 * Indents with tabs, matching what Obsidian's outliner produces, so a
 * script-written file and a hand-edited one look the same in a diff.
 */
export function serialiseOutline(
  outline: Outline,
  labelFor: (id: string) => string
): string {
  const item = (o: OutlineItem) => `${'\t'.repeat(o.depth)}- [[${o.id}|${labelFor(o.id)}]]`;

  const parts = [outline.header, '', '## Hierarchy', ''];
  parts.push(...outline.hierarchy.map(item));
  parts.push('', '## Unplaced', '');
  parts.push(...outline.unplaced.map(item));
  return parts.join('\n').trimEnd() + '\n';
}
