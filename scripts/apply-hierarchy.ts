import { readNotes, writeNote, renderNote } from './lib/frontmatter';
import { HIERARCHY_FIELDS } from './lib/relations';
import {
  readOutlines,
  deriveHierarchy,
  diffAgainstVault,
  applyToData,
  type Problem,
  type Derived,
} from './lib/hierarchy';

/**
 * Writes the hierarchy outlines into note frontmatter.
 *
 *   npm run apply-hierarchy -- --dry-run
 *   npm run apply-hierarchy
 *
 * `src/data/vault/hierarchy/broader.md` and `partof.md` are the source. This
 * script derives `broader`, `narrower`, `partOf` and `hasPart` from them and
 * writes all four. Hand edits to those fields are overwritten (ADR0018);
 * check-vocab reports the divergence before that happens.
 *
 * Nothing is written until every validation passes across both files. A run
 * that wrote 40 notes then died on the 41st would leave a state nobody could
 * reason about, and there is no test suite to reconstruct it from.
 */

const DRY_RUN = process.argv.includes('--dry-run');
const prefix = DRY_RUN ? '[dry run] ' : '';

function report(problems: Problem[]): { fails: number; warns: number } {
  const fails = problems.filter((p) => p.severity === 'fail');
  const warns = problems.filter((p) => p.severity === 'warn');

  if (fails.length > 0) {
    console.error(`\n${fails.length} failure(s):`);
    for (const p of fails) console.error(`  ✗ ${p.message}`);
  }
  if (warns.length > 0) {
    console.log(`\n${warns.length} warning(s):`);
    for (const p of warns) console.log(`  ! ${p.message}`);
  }
  return { fails: fails.length, warns: warns.length };
}

function main(): void {
  const notes = readNotes();
  const byId = new Map(notes.map((n) => [n.id, n]));
  const label = (id: string) => String(byId.get(id)?.data.prefLabel ?? '?');

  const { outlines, problems: parseProblems } = readOutlines();

  // A parse failure means the outlines cannot be trusted to say anything, so
  // derivation is skipped rather than run against half a file.
  const unparseable = parseProblems.some((p) => p.severity === 'fail');
  const { derived, problems: deriveProblems }: { derived: Derived; problems: Problem[] } =
    unparseable ? { derived: new Map(), problems: [] } : deriveHierarchy(outlines, notes);

  const problems = [...parseProblems, ...deriveProblems];
  const changes = diffAgainstVault(derived, notes);

  console.log(`${prefix}${notes.length} notes, ${outlines.size} outline file(s)`);

  const { fails } = report(problems);
  if (fails > 0) {
    console.error(`\nNothing written. Fix the failures above and run again.`);
    process.exit(1);
  }

  if (changes.length === 0) {
    console.log('\nNo changes. Frontmatter already matches the outlines.');
    return;
  }

  // Group by note so the report reads per-file, and mark which side of each
  // edge was authored rather than derived by inversion.
  const byNote = new Map<string, typeof changes>();
  for (const c of changes) {
    byNote.set(c.id, [...(byNote.get(c.id) ?? []), c]);
  }

  console.log(`\n${byNote.size} note(s) would change:`);
  for (const [id, cs] of [...byNote].sort()) {
    const parts = cs.map((c) => {
      const added = c.after.filter((t) => !c.before.includes(t)).map((t) => `+${t}`);
      const removed = c.before.filter((t) => !c.after.includes(t)).map((t) => `-${t}`);
      const kind = c.field === 'narrower' || c.field === 'hasPart' ? ' (derived)' : '';
      return `${c.field} ${[...added, ...removed].join(' ')}${kind}`;
    });
    console.log(`  ${id} ${label(id)}: ${parts.join('   ')}`);
  }

  // Blast radius. Everything outside the four hierarchy fields must survive
  // untouched; this makes "changes nothing else" a runtime invariant rather
  // than a claim about the code.
  let written = 0;
  let drift = 0;

  for (const note of notes) {
    if (!byNote.has(note.id)) continue;
    const data = applyToData(note, derived);

    const before = new Set(Object.keys(note.data));
    const after = new Set(Object.keys(data));
    const touched = [...new Set([...before, ...after])].filter((k) => {
      const a = JSON.stringify(note.data[k]);
      const b = JSON.stringify(data[k]);
      return a !== b;
    });
    const stray = touched.filter((k) => !(HIERARCHY_FIELDS as readonly string[]).includes(k));
    if (stray.length > 0) {
      console.error(
        `\n✗ ${note.id}: would modify ${stray.join(', ')}, outside the hierarchy fields.`
      );
      console.error('  Nothing written. This is a bug in apply-hierarchy.');
      process.exit(1);
    }

    // Check the body guard before writing anything at all.
    if (renderNote(note, data).bodyDrift) {
      console.error(`\n✗ ${note.id}: body would change. Nothing written.`);
      process.exit(1);
    }
  }

  for (const note of notes) {
    if (!byNote.has(note.id)) continue;
    const result = writeNote(note, applyToData(note, derived), { dryRun: DRY_RUN });
    if (result === 'written') written++;
    else if (result === 'body-drift') drift++;
  }

  console.log(`\n${DRY_RUN ? 'would write' : 'wrote'} ${written} note(s)`);
  if (drift > 0) console.log(`skipped ${drift} note(s) whose body would have changed`);
  if (DRY_RUN) console.log('\nRun without --dry-run to write.');
  else console.log('Then: npm run check-vocab && npm run build-vocab');
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
