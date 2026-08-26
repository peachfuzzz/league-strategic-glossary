import { asList, readNotes, writeNote, type Note } from './lib/frontmatter';

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

const DRY_RUN = process.argv.includes('--dry-run');

/** Labels are trimmed and empties dropped, which the shared asList does not do. */
const labelList = (value: unknown): string[] =>
  asList(value)
    .map((v) => v.trim())
    .filter(Boolean);

interface LabelledNote extends Note {
  prefLabel: string;
  altLabel: string[];
}

function main(): void {
  // --- pass 1: read every note -----------------------------------------
  const notes: LabelledNote[] = readNotes().map((note) => {
    const prefLabel = String(note.data.prefLabel ?? '').trim();
    if (!prefLabel) throw new Error(`${note.id}: empty or missing prefLabel`);
    return { ...note, prefLabel, altLabel: labelList(note.data.altLabel) };
  });

  // --- pass 2: count label usage across the whole vault -----------------
  const owners = new Map<string, string[]>();
  for (const n of notes) {
    for (const label of [n.prefLabel, ...n.altLabel]) {
      const key = label.trim();
      if (!key) continue;
      owners.set(key, [...(owners.get(key) ?? []), n.id]);
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
        omitted.push({ file: n.id, label: key });
        continue;
      }
      if (!aliases.includes(key)) aliases.push(key);
    }

    const before = labelList(n.data.aliases);
    const same =
      before.length === aliases.length && before.every((a, i) => a === aliases[i]);
    if (same) continue;

    const result = writeNote(n, { ...n.data, aliases }, { dryRun: DRY_RUN });
    if (result === 'body-drift') {
      console.error(`  ! ${n.id}: body would change - skipped`);
      continue;
    }
    if (result === 'written') changed++;
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
