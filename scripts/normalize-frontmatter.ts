import { FIELD_ORDER, readNotes, writeNote } from './lib/frontmatter';

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

const DRY_RUN = process.argv.includes('--dry-run');

function main(): void {
  const notes = readNotes();

  let changed = 0;
  let bodyDrift = 0;
  const extras = new Map<string, string[]>();

  for (const note of notes) {
    // Anything outside the documented schema is worth surfacing rather than
    // silently reordering.
    const unknown = Object.keys(note.data).filter(
      (k) => !(FIELD_ORDER as readonly string[]).includes(k)
    );
    if (unknown.length > 0) extras.set(note.id, unknown);

    // Rendering with the note's own data is the whole normalization: writeNote
    // applies FIELD_ORDER and guards the body.
    const result = writeNote(note, note.data, { dryRun: DRY_RUN });
    if (result === 'body-drift') {
      console.error(`  ! ${note.id}: body would change - skipped`);
      bodyDrift++;
    } else if (result === 'written') {
      changed++;
    }
  }

  console.log(`${DRY_RUN ? '[dry run] ' : ''}${notes.length} notes read`);
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
