import * as fs from 'fs';
import * as path from 'path';

/**
 * Regenerates the `aliases` field on every term note.
 *
 * `aliases` is Obsidian's field, not the site build's. It exists so the quick
 * switcher and `[[` autocomplete can find a note by name rather than by C####.
 *
 * Rule: aliases = prefLabel + every altLabel that is unique across the whole
 * vault. Obsidian cannot hold one alias pointing at two notes, so shared labels
 * are omitted. The site build reads prefLabel/altLabel directly and is
 * unaffected by the omission.
 *
 * Uniqueness is checked across ALL notes, active or not. Obsidian indexes every
 * file in the vault; `active` only governs what the site renders.
 *
 * Rewrites only the `aliases:` line. Every other byte of the file is preserved.
 *
 *   npx tsx scripts/regen-aliases.ts --dry-run
 *   npx tsx scripts/regen-aliases.ts
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const DRY_RUN = process.argv.includes('--dry-run');

interface Parsed {
  file: string;
  frontmatter: string;
  prefLabel: string;
  altLabel: string[];
  hasAliasLine: boolean;
}

/** Split off the frontmatter block. Returns null if the file has none. */
function splitFrontmatter(raw: string): { fm: string; start: number; end: number } | null {
  if (!raw.startsWith('---\n')) return null;
  const close = raw.indexOf('\n---', 3);
  if (close === -1) return null;
  return { fm: raw.slice(4, close + 1), start: 4, end: close + 1 };
}

/** Read a single-line scalar or inline-array value for a key. */
function readKey(fm: string, key: string): string | null {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  return m ? m[1].trim() : null;
}

/** Parse an inline YAML array, or a bare scalar, into strings. */
function parseList(value: string | null): string[] {
  if (value === null || value === '') return [];
  const trimmed = value.trim();
  if (trimmed === '[]') return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return [trimmed.replace(/^["']|["']$/g, '')];
}

/** Quote only when YAML needs it. */
function fmtList(items: string[]): string {
  const needsQuote = (s: string) => /[:#,\[\]{}&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s);
  return '[' + items.map((s) => (needsQuote(s) ? JSON.stringify(s) : s)).join(', ') + ']';
}

function main(): void {
  const files = fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) throw new Error('No term notes found');

  // --- pass 1: read every note -----------------------------------------
  const notes: Parsed[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(TERMS_DIR, file), 'utf-8');
    const split = splitFrontmatter(raw);
    if (!split) throw new Error(`${file}: no frontmatter block`);

    const prefLabel = parseList(readKey(split.fm, 'prefLabel'))[0] ?? '';
    if (!prefLabel) throw new Error(`${file}: empty or missing prefLabel`);

    return {
      file,
      frontmatter: split.fm,
      prefLabel,
      altLabel: parseList(readKey(split.fm, 'altLabel')),
      hasAliasLine: readKey(split.fm, 'aliases') !== null,
    };
  });

  // --- pass 2: count label usage across the whole vault -----------------
  const count = new Map<string, string[]>();
  for (const n of notes) {
    for (const label of [n.prefLabel, ...n.altLabel]) {
      const key = label.trim();
      if (!key) continue;
      count.set(key, [...(count.get(key) ?? []), n.file]);
    }
  }

  const shared = [...count.entries()].filter(([, fs_]) => fs_.length > 1);

  // --- pass 3: rewrite the aliases line ---------------------------------
  let changed = 0;
  const omitted: Array<{ file: string; label: string }> = [];

  for (const n of notes) {
    const candidates = [n.prefLabel, ...n.altLabel];
    const aliases: string[] = [];

    for (const label of candidates) {
      const key = label.trim();
      if (!key) continue;
      if ((count.get(key) ?? []).length > 1) {
        omitted.push({ file: n.file, label: key });
        continue;
      }
      if (!aliases.includes(key)) aliases.push(key);
    }

    const line = `aliases: ${fmtList(aliases)}`;
    const filepath = path.join(TERMS_DIR, n.file);
    const raw = fs.readFileSync(filepath, 'utf-8');
    const split = splitFrontmatter(raw)!;

    let newFm: string;
    if (n.hasAliasLine) {
      newFm = split.fm.replace(/^aliases:[ \t]*.*$/m, line);
    } else {
      // Insert after altLabel if present, else after prefLabel.
      const anchor = /^altLabel:[ \t]*.*$/m.test(split.fm) ? /^(altLabel:[ \t]*.*)$/m : /^(prefLabel:[ \t]*.*)$/m;
      newFm = split.fm.replace(anchor, `$1\n${line}`);
    }

    if (newFm === split.fm) continue;

    const updated = raw.slice(0, split.start) + newFm + raw.slice(split.end);
    changed++;
    if (!DRY_RUN) fs.writeFileSync(filepath, updated, 'utf-8');
  }

  // --- report -----------------------------------------------------------
  console.log(`${DRY_RUN ? '[dry run] ' : ''}${notes.length} notes read`);
  console.log(`${DRY_RUN ? 'would update' : 'updated'} ${changed} notes`);

  if (shared.length > 0) {
    console.log(`\n${shared.length} label(s) shared by more than one note:`);
    for (const [label, fs_] of shared) {
      console.log(`  "${label}" -> ${fs_.join(', ')}`);
    }
    console.log('  These are omitted from aliases. Obsidian cannot hold a duplicate alias.');
    console.log('  altLabel keeps them; the site build reads altLabel, not aliases.');
  } else {
    console.log('\nNo shared labels. Every label went into aliases.');
  }

  if (omitted.length > 0) {
    console.log(`\n${omitted.length} omission(s) by note:`);
    for (const o of omitted) console.log(`  ${o.file}: "${o.label}"`);
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
