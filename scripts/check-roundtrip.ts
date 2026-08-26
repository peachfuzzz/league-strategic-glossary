import { readNotes, renderNote, type Note } from './lib/frontmatter';
import { HIERARCHY_FIELDS } from './lib/relations';
import { serialiseOutline, parseOutline, type Outline, type OutlineItem } from './lib/outline';
import { BROADER_FILE, PARTOF_FILE } from './lib/paths';
import {
  readOutlines,
  deriveHierarchy,
  diffAgainstVault,
  applyToData,
  type Change,
} from './lib/hierarchy';

/**
 * Proves the outline round trip changes nothing it should not.
 *
 *   npm run check-roundtrip
 *
 * Two layers.
 *
 * Layer 1 is the identity: outlines describing the current vault, applied back,
 * must change zero notes.
 *
 * Layer 2 exists because layer 1 passes trivially while every hierarchy field
 * is empty, and this repository has been bitten by exactly that before — the
 * ADR0014 corruption survived because the checker passed on the corrupt files.
 * So each mutation below asserts the mutation *and only* the mutation survives.
 *
 * Everything runs in memory. Copying the vault to a temp directory to test a
 * script that writes to vaults is one bad path away from writing to the real
 * one.
 */

let failures = 0;
let checks = 0;

function check(name: string, ok: boolean, detail?: string): void {
  checks++;
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
  }
}

/** Applies outline text to the notes, in memory. Returns changes and problems. */
function applyInMemory(
  files: Map<string, string>,
  notes: Note[]
): { changes: Change[]; fails: string[]; warns: string[] } {
  const { outlines, problems: parseProblems } = readOutlines(files);
  const unparseable = parseProblems.some((p) => p.severity === 'fail');
  const { derived, problems: deriveProblems } = unparseable
    ? { derived: new Map(), problems: [] }
    : deriveHierarchy(outlines, notes);

  const problems = [...parseProblems, ...deriveProblems];
  return {
    changes: unparseable ? [] : diffAgainstVault(derived, notes),
    fails: problems.filter((p) => p.severity === 'fail').map((p) => p.message),
    warns: problems.filter((p) => p.severity === 'warn').map((p) => p.message),
  };
}

/** The outlines as they currently sit on disk, as text. */
function currentFiles(): Map<string, string> {
  const { outlines } = readOutlines();
  const files = new Map<string, string>();
  for (const [filepath, outline] of outlines) {
    files.set(filepath, rebuild(outline));
  }
  return files;
}

/** Serialises an outline back to text, keeping each item's own label. */
function rebuild(outline: Outline): string {
  const labels = new Map(
    [...outline.hierarchy, ...outline.unplaced].map((i) => [i.id, i.label])
  );
  return serialiseOutline(outline, (id) => labels.get(id) ?? '');
}

/** Edits broader.md's parsed form and returns the new text. */
function editBroader(files: Map<string, string>, fn: (o: Outline) => void): Map<string, string> {
  const outline = parseOutline(files.get(BROADER_FILE)!, 'broader.md');
  fn(outline);
  const next = new Map(files);
  next.set(BROADER_FILE, rebuild(outline));
  return next;
}

const item = (id: string, label: string, depth: number): OutlineItem => ({
  id,
  label,
  depth,
  line: 0,
});

/** Moves an id out of Unplaced and nests it in Hierarchy at `depth`. */
function place(o: Outline, id: string, label: string, depth: number, after?: string): void {
  o.unplaced = o.unplaced.filter((i) => i.id !== id);
  const entry = item(id, label, depth);
  if (after === undefined) {
    o.hierarchy.unshift(entry);
    return;
  }
  const at = o.hierarchy.findIndex((i) => i.id === after);
  o.hierarchy.splice(at + 1, 0, entry);
}

function summarise(changes: Change[]): string {
  return changes
    .map((c) => `${c.id}.${c.field}[${c.before.join(' ')}→${c.after.join(' ')}]`)
    .sort()
    .join(' ');
}

function main(): void {
  const notes = readNotes();
  const base = currentFiles();

  if (base.size !== 2) {
    console.error('Both outline files must exist. Run: npm run bootstrap-hierarchy');
    process.exit(1);
  }

  // --- layer 1 ---------------------------------------------------------
  console.log('Layer 1 — identity round trip');

  const identity = applyInMemory(base, notes);
  check(
    'outlines describing the vault apply to zero changes',
    identity.changes.length === 0 && identity.fails.length === 0,
    identity.fails[0] ?? summarise(identity.changes)
  );

  // Re-serialising must be stable, or every apply would churn the files.
  const twice = currentFiles();
  check(
    'serialise is idempotent',
    [...base].every(([k, v]) => twice.get(k) === v)
  );

  // Rendering every note through the write path with the skip disabled proves
  // dump and apply do not share a compensating bug.
  let byteIdentical = 0;
  for (const note of notes) {
    if (renderNote(note, note.data).out === note.raw) byteIdentical++;
  }
  check(
    `all notes render byte-identically (${byteIdentical}/${notes.length})`,
    byteIdentical >= notes.length - 1,
    `${notes.length - byteIdentical} note(s) differ; only C0049 (no trailing newline) is expected`
  );

  // --- layer 2 ---------------------------------------------------------
  console.log('\nLayer 2 — perturbed round trip');

  // A concept must exist to be nested. These three are the manual test chain.
  const L = (id: string) => String(notes.find((n) => n.id === id)?.data.prefLabel ?? '?');

  // add: nesting fight under combat changes exactly two notes.
  const added = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    place(o, 'C0028', L('C0028'), 1, 'C0016');
  });
  const addResult = applyInMemory(added, notes);
  check(
    'adding one edge changes exactly 2 notes (authored + inverse)',
    summarise(addResult.changes) === 'C0016.narrower[→C0028] C0028.broader[→C0016]',
    summarise(addResult.changes)
  );

  // remove: undoing it returns to the identity.
  const removed = applyInMemory(base, notes);
  check(
    'removing it again returns to zero changes',
    removed.changes.length === 0,
    summarise(removed.changes)
  );

  // move a subtree: all-in from under fight to under combat.
  const deep = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    place(o, 'C0028', L('C0028'), 1, 'C0016');
    place(o, 'C0003', L('C0003'), 2, 'C0028');
  });
  const moved = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    place(o, 'C0028', L('C0028'), 1, 'C0016');
    place(o, 'C0003', L('C0003'), 1, 'C0028');
  });
  const deepResult = applyInMemory(deep, notes);
  const movedResult = applyInMemory(moved, notes);
  check(
    'moving a subtree updates both the old and new parent',
    summarise(deepResult.changes) ===
      'C0003.broader[→C0028] C0016.narrower[→C0028] C0028.broader[→C0016] C0028.narrower[→C0003]' &&
      summarise(movedResult.changes) ===
        'C0003.broader[→C0016] C0016.narrower[→C0003 C0028] C0028.broader[→C0016]',
    `deep: ${summarise(deepResult.changes)}\n      moved: ${summarise(movedResult.changes)}`
  );

  // reorder siblings: no semantic change, because targets are sorted on write.
  const reordered = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    place(o, 'C0003', L('C0003'), 1, 'C0016');
    place(o, 'C0028', L('C0028'), 1, 'C0003');
  });
  const swapped = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    place(o, 'C0028', L('C0028'), 1, 'C0016');
    place(o, 'C0003', L('C0003'), 1, 'C0028');
  });
  check(
    'reordering siblings changes nothing',
    summarise(applyInMemory(reordered, notes).changes) ===
      summarise(applyInMemory(swapped, notes).changes),
    summarise(applyInMemory(reordered, notes).changes)
  );

  // duplicate: a parse-level fault, nothing written.
  const duped = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    o.hierarchy.push(item('C0016', L('C0016'), 0));
  });
  const dupResult = applyInMemory(duped, notes);
  check(
    'a duplicate item fails and writes nothing',
    dupResult.fails.some((f) => f.includes('appears twice')) && dupResult.changes.length === 0,
    dupResult.fails[0] ?? 'no failure raised'
  );

  // unknown id.
  const ghost = editBroader(base, (o) => {
    o.unplaced.push(item('C9999', 'ghost', 0));
  });
  const ghostResult = applyInMemory(ghost, notes);
  check(
    'an unknown id fails and writes nothing',
    ghostResult.fails.some((f) => f.includes('C9999')) && ghostResult.changes.length === 0,
    ghostResult.fails[0] ?? 'no failure raised'
  );

  // a concept named nowhere would silently lose its relations.
  const dropped = editBroader(base, (o) => {
    o.unplaced = o.unplaced.filter((i) => i.id !== 'C0044');
  });
  const dropResult = applyInMemory(dropped, notes);
  check(
    'a concept in neither region fails and writes nothing',
    dropResult.fails.some((f) => f.includes('C0044')) && dropResult.changes.length === 0,
    dropResult.fails[0] ?? 'no failure raised'
  );

  // an item in both regions is placed and undecided at once.
  const both = editBroader(base, (o) => {
    place(o, 'C0016', L('C0016'), 0);
    o.unplaced.push(item('C0016', L('C0016'), 0));
  });
  const bothResult = applyInMemory(both, notes);
  check(
    'an item in both regions fails and writes nothing',
    bothResult.fails.some((f) => f.includes('both Hierarchy and Unplaced')) &&
      bothResult.changes.length === 0,
    bothResult.fails[0] ?? 'no failure raised'
  );

  // malformed line: the case a line-oriented parser must never skip silently.
  const malformed = new Map(base);
  malformed.set(
    BROADER_FILE,
    base.get(BROADER_FILE)!.replace('## Hierarchy\n', '## Hierarchy\n\n- not an item\n')
  );
  const malformedResult = applyInMemory(malformed, notes);
  check(
    'a malformed line fails and writes nothing',
    malformedResult.fails.some((f) => f.includes('must be exactly')) &&
      malformedResult.changes.length === 0,
    malformedResult.fails[0] ?? 'no failure raised'
  );

  // stale label warns but still applies: the vault may have been relabelled.
  const stale = editBroader(base, (o) => {
    const target = o.unplaced.find((i) => i.id === 'C0044')!;
    target.label = 'stale name';
  });
  const staleResult = applyInMemory(stale, notes);
  check(
    'a stale label warns without failing',
    staleResult.warns.some((w) => w.includes('stale')) && staleResult.fails.length === 0,
    staleResult.warns[0] ?? 'no warning raised'
  );

  // --- blast radius ----------------------------------------------------
  console.log('\nBlast radius');

  const { outlines } = readOutlines(deep);
  const { derived } = deriveHierarchy(outlines, notes);
  const stray = new Set<string>();
  for (const note of notes) {
    const data = applyToData(note, derived);
    for (const key of new Set([...Object.keys(note.data), ...Object.keys(data)])) {
      if (JSON.stringify(note.data[key]) !== JSON.stringify(data[key])) stray.add(key);
    }
  }
  const outside = [...stray].filter(
    (k) => !(HIERARCHY_FIELDS as readonly string[]).includes(k)
  );
  check(
    'applying touches only the four hierarchy fields',
    outside.length === 0,
    `also touched: ${outside.join(', ')}`
  );

  console.log(
    `\n${checks - failures}/${checks} checks passed.\nRESULT: ${failures === 0 ? 'PASS' : 'FAIL'}`
  );
  if (failures > 0) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
