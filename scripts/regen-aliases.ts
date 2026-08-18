import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

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
 * Frontmatter is parsed and re-emitted with gray-matter rather than by regex,
 * so block-sequence style (what Obsidian writes) and inline style both work.
 * Body prose is preserved.
 *
 *   npx tsx scripts/regen-aliases.ts --dry-run
 *   npx tsx scripts/regen-aliases.ts
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const DRY_RUN = process.argv.includes('--dry-run');

/** Field order in the emitted frontmatter, matching normalize-frontmatter.ts. */
const FIELD_ORDER = [
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
];

function orderFields(data: Record<string, unknown>): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of FIELD_ORDER) {
    if (key in data) ordered[key] = data[key];
  }
  for (const key of Object.keys(data).sort()) {
    if (!(key in ordered)) ordered[key] = data[key];
  }
  return ordered;
}

/** gray-matter gives back whatever YAML held: a list, a bare scalar, or nothing. */
function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [String(value).trim()];
}

interface Note {
  file: string;
  data: Record<string, unknown>;
  content: string;
  prefLabel: string;
  altLabel: string[];
}

function main(): void {
  const files = fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) throw new Error('No term notes found');

  // --- pass 1: read every note -----------------------------------------
  const notes: Note[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(TERMS_DIR, file), 'utf-8');
    const parsed = matter(raw);

    const prefLabel = String(parsed.data.prefLabel ?? '').trim();
    if (!prefLabel) throw new Error(`${file}: empty or missing prefLabel`);

    return {
      file,
      data: parsed.data as Record<string, unknown>,
      content: parsed.content,
      prefLabel,
      altLabel: asList(parsed.data.altLabel),
    };
  });

  // --- pass 2: count label usage across the whole vault -----------------
  const owners = new Map<string, string[]>();
  for (const n of notes) {
    for (const label of [n.prefLabel, ...n.altLabel]) {
      const key = label.trim();
      if (!key) continue;
      owners.set(key, [...(owners.get(key) ?? []), n.file]);
    }
  }

  const shared = [...owners.entries()].filter(([, fs_]) => fs_.length > 1);

  // --- pass 3: rewrite the aliases field --------------------------------
  let changed = 0;
  const omitted: Array<{ file: string; label: string }> = [];

  for (const n of notes) {
    const aliases: string[] = [];

    for (const label of [n.prefLabel, ...n.altLabel]) {
      const key = label.trim();
      if (!key) continue;
      if ((owners.get(key) ?? []).length > 1) {
        omitted.push({ file: n.file, label: key });
        continue;
      }
      if (!aliases.includes(key)) aliases.push(key);
    }

    const before = asList(n.data.aliases);
    const same =
      before.length === aliases.length && before.every((a, i) => a === aliases[i]);
    if (same) continue;

    const filepath = path.join(TERMS_DIR, n.file);
    const out = matter.stringify(n.content, orderFields({ ...n.data, aliases }));

    // The body must survive. gray-matter guarantees a trailing newline, so a
    // gained or lost final newline is not drift.
    if (matter(out).content.trimEnd() !== n.content.trimEnd()) {
      console.error(`  ! ${n.file}: body would change - skipped`);
      continue;
    }

    changed++;
    if (!DRY_RUN) fs.writeFileSync(filepath, out, 'utf-8');
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
