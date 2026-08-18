import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

/**
 * Normalizes every term note's frontmatter to the format gray-matter emits.
 *
 * Obsidian rewrites frontmatter to block-sequence style whenever a property is
 * edited in its UI. The build reads notes with gray-matter, which emits the same
 * style. Normalizing once means both writers agree, so a note no longer changes
 * shape depending on which tool touched it last.
 *
 * Body prose is preserved byte for byte - only the frontmatter block is rewritten.
 *
 *   npx tsx scripts/normalize-frontmatter.ts --dry-run
 *   npx tsx scripts/normalize-frontmatter.ts
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const DRY_RUN = process.argv.includes('--dry-run');

/** Field order in the emitted frontmatter. Anything unlisted follows, sorted. */
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

function main(): void {
  const files = fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) throw new Error('No term notes found');

  let changed = 0;
  let bodyDrift = 0;
  const extras = new Map<string, string[]>();

  for (const file of files) {
    const filepath = path.join(TERMS_DIR, file);
    const raw = fs.readFileSync(filepath, 'utf-8');

    const parsed = matter(raw);

    // Anything outside the documented schema is worth surfacing rather than
    // silently reordering.
    const unknown = Object.keys(parsed.data).filter((k) => !FIELD_ORDER.includes(k));
    if (unknown.length > 0) extras.set(file, unknown);

    const out = matter.stringify(parsed.content, orderFields(parsed.data));

    // The body must survive untouched. gray-matter normalizes whitespace around
    // the delimiters (it guarantees a trailing newline), so compare the prose
    // itself rather than raw bytes - a gained or lost final newline is not drift.
    if (matter(out).content.trimEnd() !== parsed.content.trimEnd()) {
      console.error(`  ! ${file}: body would change - skipped`);
      bodyDrift++;
      continue;
    }

    if (out !== raw) {
      changed++;
      if (!DRY_RUN) fs.writeFileSync(filepath, out, 'utf-8');
    }
  }

  console.log(`${DRY_RUN ? '[dry run] ' : ''}${files.length} notes read`);
  console.log(`${DRY_RUN ? 'would rewrite' : 'rewrote'} ${changed} notes`);
  if (bodyDrift > 0) console.log(`skipped ${bodyDrift} note(s) whose body would have changed`);

  if (extras.size > 0) {
    console.log(`\n${extras.size} note(s) carry fields outside the schema:`);
    for (const [file, keys] of extras) console.log(`  ${file}: ${keys.join(', ')}`);
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
