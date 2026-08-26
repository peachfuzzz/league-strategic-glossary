import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import * as PATHS from './lib/paths';

/**
 * Vocabulary integrity checks for the SKOS-inspired term notes.
 *
 *   npx tsx scripts/check-vocab.ts [expected_count]
 *
 * Exits non-zero if any check fails.
 *
 * Three things are reported but never fail the run, because each is a judgement
 * for Phase 4 rather than a fault: asymmetric `related` pairs, pairs carrying
 * two relation types, and hierarchy edges asserted from one end only. Cycles in
 * `broader` or `partOf` do fail - those are incoherent under any reading.
 *
 * Frontmatter is parsed with gray-matter (see ADR0014). A note that is not
 * valid YAML throws during parsing and is reported as a failure, rather than
 * being silently skipped the way a line-oriented parser would.
 */

const ROOT = path.join(__dirname, '..');
const TERMS_DIR = PATHS.TERMS_DIR;
const REGISTRY = path.join(ROOT, 'docs/id-registry.csv');
const GEN = PATHS.GENERATED_DIR;

const EXPECTED = Number(process.argv[2] ?? 97);

const SCHEMA = [
  'id', 'prefLabel', 'altLabel', 'hiddenLabel', 'aliases', 'collection',
  'active', 'complete', 'broader', 'narrower', 'partOf', 'hasPart',
  'related', 'relatedReviewed',
] as const;

/** Fields that must be lists of strings. */
const LIST_FIELDS = [
  'altLabel', 'hiddenLabel', 'aliases', 'collection',
  'broader', 'narrower', 'partOf', 'hasPart', 'related',
] as const;

/** Fields that must be real booleans, not the strings "true"/"false". */
const BOOL_FIELDS = ['active', 'complete', 'relatedReviewed'] as const;

const failures: string[] = [];
const fail = (m: string) => failures.push(m);

type Note = Record<string, unknown>;

// ---- notes ---------------------------------------------------------------

const files = fs.existsSync(TERMS_DIR)
  ? fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith('.md')).sort()
  : [];

if (files.length === 0) fail(`no term notes found in ${TERMS_DIR}`);

const notes = new Map<string, Note>();
/** Note bodies, kept so prose wikilinks can be validated against the vault. */
const bodies = new Map<string, string>();

for (const file of files) {
  const stem = file.replace(/\.md$/, '');

  // 1. filename pattern
  if (!/^C\d{4}\.md$/.test(file)) {
    fail(`filename does not match ^C\\d{4}\\.md$: ${file}`);
    continue;
  }

  const raw = fs.readFileSync(path.join(TERMS_DIR, file), 'utf-8');

  // Parsing failure IS a check: malformed YAML must fail, never be skipped.
  let data: Note;
  try {
    const parsed = matter(raw);
    data = parsed.data as Note;
    bodies.set(stem, parsed.content);
  } catch (err) {
    fail(`${file}: frontmatter is not valid YAML (${err instanceof Error ? err.message.split('\n')[0] : err})`);
    continue;
  }

  if (Object.keys(data).length === 0) {
    fail(`${file}: no frontmatter`);
    continue;
  }

  // 9. all schema fields present, nothing extra
  const missing = SCHEMA.filter((f) => !(f in data));
  if (missing.length > 0) fail(`${file}: missing schema field(s): ${missing.join(', ')}`);

  const extra = Object.keys(data).filter((k) => !SCHEMA.includes(k as typeof SCHEMA[number]));
  if (extra.length > 0) fail(`${file}: unexpected field(s): ${extra.join(', ')}`);

  // Types. The old line-oriented parser compared strings and could not tell a
  // real boolean from the text "true", nor a list from an empty value.
  for (const f of BOOL_FIELDS) {
    if (f in data && typeof data[f] !== 'boolean') {
      fail(`${file}: \`${f}\` must be a boolean, got ${JSON.stringify(data[f])}`);
    }
  }
  for (const f of LIST_FIELDS) {
    if (f in data && !Array.isArray(data[f])) {
      fail(`${file}: \`${f}\` must be a list, got ${JSON.stringify(data[f])}`);
    }
  }

  // 2. id equals filename stem
  if (data.id !== stem) {
    fail(`${file}: id ${JSON.stringify(data.id)} != filename stem ${JSON.stringify(stem)}`);
  }

  // 6. prefLabel non-empty
  if (!String(data.prefLabel ?? '').trim()) fail(`${file}: empty prefLabel`);

  notes.set(stem, data);
}

// 10. count
if (files.length !== EXPECTED) {
  fail(`note count ${files.length} != expected ${EXPECTED}`);
}

// 3. ids unique
const byId = new Map<string, string[]>();
for (const [stem, fm] of notes) {
  const id = String(fm.id);
  byId.set(id, [...(byId.get(id) ?? []), stem]);
}
for (const [id, owners] of byId) {
  if (owners.length > 1) fail(`duplicate id ${JSON.stringify(id)} in: ${owners.join(', ')}`);
}

const listOf = (fm: Note | undefined, field: string): string[] => {
  const v = fm?.[field];
  return Array.isArray(v) ? v.map(String) : [];
};

// ---- registry ------------------------------------------------------------

interface RegistryRow { id: string; legacy_slug: string; status: string }

let rows: RegistryRow[] = [];
if (!fs.existsSync(REGISTRY)) {
  fail(`registry not found: ${REGISTRY}`);
} else {
  const lines = fs.readFileSync(REGISTRY, 'utf-8').trim().split('\n');
  const header = lines[0].split(',').map((h) => h.trim());
  rows = lines.slice(1).map((line) => {
    // Registry values may be quoted if they contain a comma.
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) =>
      c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')
    ) ?? [];
    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row as unknown as RegistryRow;
  });
}

const regIds = rows.map((r) => r.id);
for (const rid of regIds) {
  if (!notes.has(rid)) fail(`registry row ${rid} has no corresponding note`);
}
for (const stem of notes.keys()) {
  if (!regIds.includes(stem)) fail(`note ${stem} is not in the registry`);
}
for (const id of new Set(regIds.filter((i) => regIds.filter((x) => x === i).length > 1))) {
  fail(`duplicate registry id: ${id}`);
}
const legacySlugs = rows.map((r) => r.legacy_slug);
for (const s of new Set(legacySlugs.filter((x) => legacySlugs.filter((y) => y === x).length > 1))) {
  fail(`duplicate legacy_slug in registry: ${s}`);
}

// ---- relations -----------------------------------------------------------

// 7. related targets resolve
for (const [stem, fm] of notes) {
  for (const t of listOf(fm, 'related')) {
    if (!notes.has(t)) fail(`${stem}: related target ${JSON.stringify(t)} does not resolve`);
  }
}

// 8. symmetry (report only)
const asym: Array<[string, string]> = [];
for (const [stem, fm] of notes) {
  for (const t of listOf(fm, 'related')) {
    if (notes.has(t) && !listOf(notes.get(t), 'related').includes(stem)) asym.push([stem, t]);
  }
}

/** The authored relation fields. `mentions` is derived and is not among them. */
const RELATION_FIELDS = ['related', 'broader', 'narrower', 'partOf', 'hasPart'] as const;

/**
 * 11. `broader` and `partOf` are acyclic.
 *
 * A cycle means A is above B is above A, which is incoherent under either
 * relation. This runs before Phase 4 writes any hierarchy on purpose: catching
 * the first bad edge as it is authored is cheaper than untangling a loop later.
 *
 * Targets that do not resolve are skipped rather than reported here - the build
 * drops them with its own warning, and a dangling id cannot form a cycle.
 *
 * `mentions` is deliberately not checked. It is cyclic by design: ten mutually
 * mentioning pairs exist today, and mutual definition is a finding about the
 * vocabulary rather than a fault (DESIGN.md 5.4).
 */
const findCycle = (field: string): string[] | null => {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const colour = new Map<string, number>();
  const path: string[] = [];

  const walk = (id: string): string[] | null => {
    colour.set(id, GREY);
    path.push(id);
    for (const t of listOf(notes.get(id), field)) {
      if (!notes.has(t)) continue;
      const c = colour.get(t) ?? WHITE;
      if (c === GREY) return [...path.slice(path.indexOf(t)), t];
      if (c === WHITE) {
        const found = walk(t);
        if (found) return found;
      }
    }
    path.pop();
    colour.set(id, BLACK);
    return null;
  };

  for (const stem of notes.keys()) {
    if ((colour.get(stem) ?? WHITE) === WHITE) {
      const found = walk(stem);
      if (found) return found;
    }
  }
  return null;
};

for (const field of ['broader', 'partOf'] as const) {
  const cycle = findCycle(field);
  if (cycle) {
    const trail = cycle.map((id) => `${id} (${notes.get(id)?.prefLabel})`).join(' -> ');
    fail(`${field} contains a cycle: ${trail}`);
  }
}

/**
 * 12. No pair carries two relation types (report only).
 *
 * Each type makes a different claim, and asserting two at once about the same
 * pair usually means one of them is wrong. Usually, not always - "A is a kind
 * of B" and "see also" can both be defensible - so this is a warning for Phase
 * 4 to adjudicate, not a failure.
 *
 * Pairs are normalised unordered, so `broader` on one note and `narrower` on
 * the other - which is the correct way to write one hierarchy edge - is not
 * reported. Those two are treated as one relation for this purpose.
 */
const INVERSE: Record<string, string> = {
  broader: 'narrower',
  narrower: 'broader',
  partOf: 'hasPart',
  hasPart: 'partOf',
};
/** Collapses each field and its inverse to one name, so a correct pair is one claim. */
const claimOf = (field: string) =>
  field === 'narrower' ? 'broader' : field === 'hasPart' ? 'partOf' : field;

const claims = new Map<string, Set<string>>();
for (const [stem, fm] of notes) {
  for (const field of RELATION_FIELDS) {
    for (const t of listOf(fm, field)) {
      if (!notes.has(t)) continue;
      const key = [stem, t].sort().join('|');
      if (!claims.has(key)) claims.set(key, new Set());
      claims.get(key)!.add(claimOf(field));
    }
  }
}
const dualTyped = [...claims.entries()]
  .filter(([, types]) => types.size > 1)
  .map(([key, types]) => [key, [...types].sort()] as [string, string[]]);

/**
 * 13. A hierarchy edge is asserted from both ends (report only).
 *
 * `broader` on A should be matched by `narrower` on B. The build emits these as
 * two separate directed edges, so a one-sided assertion renders as half a
 * relation. Reported rather than failed: the fields are empty today, and Phase
 * 4 fills them note by note, where a half-written edge is work in progress.
 */
const oneSided: Array<[string, string, string]> = [];
for (const [stem, fm] of notes) {
  for (const field of ['broader', 'narrower', 'partOf', 'hasPart'] as const) {
    for (const t of listOf(fm, field)) {
      if (notes.has(t) && !listOf(notes.get(t), INVERSE[field]).includes(stem)) {
        oneSided.push([stem, field, t]);
      }
    }
  }
}

// ---- generated artifacts -------------------------------------------------

const activeIds = new Set([...notes].filter(([, fm]) => fm.active === true).map(([s]) => s));
const inactiveIds = new Set([...notes].filter(([, fm]) => fm.active !== true).map(([s]) => s));

// ---- prose wikilinks -----------------------------------------------------

const WIKILINK = /\[\[(C\d{4})\|([^\]]+)\]\]/g;
const ANY_WIKILINK = /\[\[[^\]]*\]\]/g;

/** Links to concepts that exist but are switched off. Reported, not failed. */
const inactiveLinks: Array<[string, string]> = [];
/** id -> ids it links to in prose. Reused for the refs cross-check below. */
const proseTargets = new Map<string, Set<string>>();

for (const [stem, body] of bodies) {
  // Obsidian writes bare `[[label]]` by default; only the piped identifier
  // form survives the build, so anything else is an authoring error.
  for (const found of body.match(ANY_WIKILINK) ?? []) {
    if (!/^\[\[C\d{4}\|[^\]]+\]\]$/.test(found)) {
      fail(`${stem}.md: wikilink ${found} is not the [[C####|label]] form`);
    }
  }

  const targets = new Set<string>();
  for (const m of body.matchAll(WIKILINK)) {
    const target = m[1];
    if (!notes.has(target)) {
      fail(`${stem}.md: wikilink [[${target}|${m[2]}]] points at no such concept`);
    } else if (inactiveIds.has(target)) {
      inactiveLinks.push([stem, target]);
    } else {
      targets.add(target);
    }
  }
  if (targets.size > 0) proseTargets.set(stem, targets);
}

let artifactsChecked = false;
let nIndex = 0, nConcepts = 0, nNodes = 0, nEdges = 0, nLabels = 0;
/** Per-concept `mentions` and `backlinks`, to check the two are true inverses. */
const emittedMentions = new Map<string, Set<string>>();
const emittedBacklinks = new Map<string, Set<string>>();
/** `source|target` for every `mentions` edge in graph.json. */
let graphMentionEdges: Set<string> | null = null;
/** Slugs of active concepts, so prose link URLs can be checked to resolve. */
const activeSlugs = new Set<string>();
let labels: Record<string, string[]> | null = null;

const loadJson = (name: string): any => {
  const p = path.join(GEN, name);
  if (!fs.existsSync(p)) { fail(`missing artifact: ${name}`); return null; }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (err) {
    fail(`${name}: invalid JSON (${err instanceof Error ? err.message : err})`);
    return null;
  }
};

if (!fs.existsSync(GEN)) {
  fail(`generated artifacts not found: ${GEN} (run \`npm run build-vocab\`)`);
} else {
  artifactsChecked = true;

  const index = loadJson('index.json');
  const graph = loadJson('graph.json');
  labels = loadJson('labels.json');

  const conceptsDir = path.join(GEN, 'concepts');
  const conceptFiles = fs.existsSync(conceptsDir)
    ? fs.readdirSync(conceptsDir).filter((f) => f.endsWith('.json')).sort()
    : [];
  nConcepts = conceptFiles.length;
  if (conceptFiles.length === 0) fail('no per-concept files emitted');

  if (index) {
    nIndex = index.length;
    const indexIds: string[] = index.map((e: any) => e.id);
    for (const i of indexIds) {
      if (!notes.has(i)) fail(`index.json: ${i} has no note`);
      else if (inactiveIds.has(i)) fail(`index.json: ${i} is inactive but was emitted`);
    }
    for (const i of [...activeIds].filter((x) => !indexIds.includes(x)).sort()) {
      fail(`index.json: active note ${i} is missing`);
    }

    const have = new Set(conceptFiles.map((f) => f.replace(/\.json$/, '')));
    for (const i of indexIds) {
      if (!have.has(i)) fail(`index.json: ${i} has no concepts/${i}.json`);
    }
    for (const stem of [...have].filter((x) => !indexIds.includes(x)).sort()) {
      fail(`concepts/${stem}.json has no index.json entry`);
    }

    const slugOwners = new Map<string, string[]>();
    for (const e of index) {
      if (!e.slug) fail(`index.json: ${e.id} has an empty slug`);
      else activeSlugs.add(e.slug);
      slugOwners.set(e.slug, [...(slugOwners.get(e.slug) ?? []), e.id]);
    }
    for (const [slug, ids] of slugOwners) {
      if (ids.length > 1) fail(`slug collision: ${JSON.stringify(slug)} <- ${ids.join(', ')}`);
    }
  }

  if (graph) {
    const gNodes = graph.nodes ?? [];
    const gEdges = graph.edges ?? [];
    nNodes = gNodes.length;
    nEdges = gEdges.length;
    const nodeIds = new Set<string>(gNodes.map((n: any) => n.id));
    for (const i of [...nodeIds].filter((x) => !activeIds.has(x)).sort()) {
      fail(`graph.json: node ${i} is not an active note`);
    }
    for (const i of [...activeIds].filter((x) => !nodeIds.has(x)).sort()) {
      fail(`graph.json: active note ${i} has no node`);
    }
    const EDGE_TYPES = new Set([...RELATION_FIELDS, 'mentions']);
    for (const e of gEdges) {
      if (!nodeIds.has(e.source)) fail(`graph.json: edge source ${JSON.stringify(e.source)} does not resolve`);
      if (!nodeIds.has(e.target)) fail(`graph.json: edge target ${JSON.stringify(e.target)} does not resolve`);
      if (!EDGE_TYPES.has(e.type)) fail(`graph.json: unknown edge type ${JSON.stringify(e.type)}`);
      if (e.source === e.target) fail(`graph.json: ${e.type} edge from ${e.source} to itself`);
    }
    graphMentionEdges = new Set(
      gEdges.filter((e: any) => e.type === 'mentions').map((e: any) => `${e.source}|${e.target}`)
    );
  }

  if (labels) {
    nLabels = Object.keys(labels).length;
    for (const [label, ids] of Object.entries(labels)) {
      if (!Array.isArray(ids)) { fail(`labels.json: ${JSON.stringify(label)} maps to a non-list`); continue; }
      for (const i of ids) {
        if (!activeIds.has(i)) fail(`labels.json: ${JSON.stringify(label)} -> ${i} is not an active concept`);
      }
    }
  }

  for (const file of conceptFiles) {
    const stem = file.replace(/\.json$/, '');
    let c: any;
    try {
      c = JSON.parse(fs.readFileSync(path.join(conceptsDir, file), 'utf-8'));
    } catch (err) {
      fail(`${file}: invalid JSON (${err instanceof Error ? err.message : err})`);
      continue;
    }
    if (c.id !== stem) fail(`${file}: id ${JSON.stringify(c.id)} != filename stem`);
    for (const t of c.related ?? []) {
      if (!activeIds.has(t)) fail(`${file}: related target ${t} is not an active concept`);
      if (!(t in (c.refs ?? {}))) fail(`${file}: related target ${t} missing from refs`);
    }

    // The term page renders cross-references from `refs` alone, so every
    // concept the prose links to has to be in there.
    for (const t of proseTargets.get(stem) ?? []) {
      if (!(t in (c.refs ?? {}))) fail(`${file}: prose wikilink target ${t} missing from refs`);
    }

    // `mentions` is derived, so it must agree with the prose it was derived
    // from - no more, no less. A drift here means the build and this script
    // disagree about what the vault says.
    const emitted = new Set<string>(c.mentions ?? []);
    const expected = proseTargets.get(stem) ?? new Set<string>();
    emittedMentions.set(stem, emitted);
    emittedBacklinks.set(
      stem,
      new Set<string>((c.backlinks ?? []).map((b: { id: string }) => b.id))
    );
    for (const t of emitted) {
      if (!activeIds.has(t)) fail(`${file}: mentions target ${t} is not an active concept`);
      if (!(t in (c.refs ?? {}))) fail(`${file}: mentions target ${t} missing from refs`);
      if (t === stem) fail(`${file}: mentions includes itself`);
      if (!expected.has(t)) fail(`${file}: mentions ${t}, which the prose does not link to`);
    }
    for (const t of expected) {
      if (t !== stem && !emitted.has(t)) fail(`${file}: prose links to ${t}, missing from mentions`);
    }

    // No wikilink may survive into the artifact, and every URL the build wrote
    // has to resolve - a slugify change could otherwise 404 prose links while
    // refs still looked correct.
    const definition = String(c.definition ?? '');
    if (/\[\[/.test(definition)) {
      fail(`${file}: definition still contains an unresolved wikilink`);
    }
    for (const m of definition.matchAll(/\]\(\/term\/([^)]+)\)/g)) {
      if (!activeSlugs.has(m[1])) {
        fail(`${file}: definition links to /term/${m[1]}, which is not an active slug`);
      }
    }
  }

  // `backlinks` is the reverse of `mentions` and nothing else (ADR0016), so
  // the two have to be exact inverses across the whole set. Checking it here
  // rather than per file is what makes it a real check: a single file cannot
  // see whether someone else claims to mention it.
  for (const [stem, mentioned] of emittedMentions) {
    for (const t of mentioned) {
      if (!emittedBacklinks.get(t)?.has(stem)) {
        fail(`concepts/${t}.json: backlinks omits ${stem}, whose prose mentions it`);
      }
    }
  }
  for (const [stem, back] of emittedBacklinks) {
    for (const src of back) {
      if (!emittedMentions.get(src)?.has(stem)) {
        fail(`concepts/${stem}.json: backlinks claims ${src}, which does not mention it`);
      }
    }
  }

  // Every `mentions` edge in the graph must correspond to a concept file's
  // `mentions`, and vice versa. The two are written from the same source in
  // the build; this catches one being changed without the other.
  if (graphMentionEdges) {
    const fromFiles = new Set<string>();
    for (const [stem, mentioned] of emittedMentions) {
      for (const t of mentioned) fromFiles.add(`${stem}|${t}`);
    }
    for (const key of graphMentionEdges) {
      if (!fromFiles.has(key)) fail(`graph.json: mentions edge ${key} is in no concept file`);
    }
    for (const key of fromFiles) {
      if (!graphMentionEdges.has(key)) fail(`graph.json: missing mentions edge ${key}`);
    }
  }
}

// ---- term links in components --------------------------------------------

// Routes are generated per slug, so `/term/${x.id}` builds fine and 404s only
// when a user clicks it. Catch the shape in source instead.
const COMPONENT_DIRS = ['src/components', 'src/app'];

const walk = (dir: string): string[] => {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(path.join(dir, e.name))
      : e.name.endsWith('.tsx') || e.name.endsWith('.ts')
        ? [path.join(dir, e.name)]
        : []
  );
};

for (const rel of COMPONENT_DIRS.flatMap(walk)) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  src.split('\n').forEach((text, i) => {
    if (/\/term\/\$\{[^}]*\.id\}/.test(text)) {
      fail(`${rel}:${i + 1}: links to /term/ by id; routes are generated by slug`);
    }
  });
}

const ambiguousLabels = labels
  ? Object.entries(labels).filter(([, ids]) => Array.isArray(ids) && ids.length > 1)
  : [];

// ---- report --------------------------------------------------------------

const line = '='.repeat(60);
console.log(line);
console.log('Vocabulary check');
console.log(line);
console.log(`  Notes:          ${files.length}`);
console.log(`  Registry rows:  ${rows.length}`);
console.log(`  Failures:       ${failures.length}`);
console.log(`  Asymmetric:     ${asym.length} (reported, not auto-fixed)`);
console.log(`  Dual-typed:     ${dualTyped.length} (reported, for Phase 4 to judge)`);
console.log(`  One-sided:      ${oneSided.length} hierarchy edge(s) (reported)`);

const wikilinkCount = [...bodies.values()]
  .reduce((n, b) => n + [...b.matchAll(WIKILINK)].length, 0);
console.log(`  Wikilinks:      ${wikilinkCount} in ${proseTargets.size} notes`);

if (artifactsChecked) {
  console.log();
  console.log('  Artifacts');
  console.log(`    concepts/     ${nConcepts}`);
  console.log(`    index.json    ${nIndex}`);
  console.log(`    graph.json    ${nNodes} nodes, ${nEdges} edges`);
  console.log(`    labels.json   ${nLabels}`);
  console.log();
  console.log(`  Rendered ${activeIds.size} of ${files.length} concepts ` +
              `(${inactiveIds.size} inactive, excluded by design)`);
  if (inactiveIds.size > 0) {
    console.log(`    inactive: ${[...inactiveIds].sort().join(', ')}`);
  }
  if (ambiguousLabels.length > 0) {
    console.log(`  Ambiguous labels: ${ambiguousLabels.length}`);
    for (const [l, ids] of ambiguousLabels.sort()) {
      console.log(`    ${JSON.stringify(l)} -> ${ids.join(', ')}`);
    }
  }
}

// A link to an inactive concept is a decision not yet made, not an error:
// the label renders as plain text until the target is written or switched on.
if (inactiveLinks.length > 0) {
  console.log();
  console.log(`  Wikilinks to inactive concepts: ${inactiveLinks.length} (rendered unlinked)`);
  for (const [from, to] of [...inactiveLinks].sort()) {
    console.log(`    ${from} -> ${to} (${notes.get(to)?.prefLabel ?? '?'})`);
  }
}
console.log();

if (asym.length > 0) {
  console.log('Asymmetric `related` pairs:');
  for (const [a, b] of [...asym].sort()) {
    const la = notes.get(a)?.prefLabel;
    const lb = notes.get(b)?.prefLabel;
    console.log(`  ${a} (${la}) -> ${b} (${lb});  ${b} does not list ${a}`);
  }
  console.log();
}

// Two claims about one pair. Usually one is wrong, but not always - Phase 4
// decides, so this reports rather than fails.
if (dualTyped.length > 0) {
  console.log('Pairs carrying more than one relation type:');
  for (const [key, types] of [...dualTyped].sort()) {
    const [a, b] = key.split('|');
    const la = notes.get(a)?.prefLabel;
    const lb = notes.get(b)?.prefLabel;
    console.log(`  ${a} (${la}) <-> ${b} (${lb}):  ${types.join(' + ')}`);
  }
  console.log();
}

// A hierarchy edge asserted from one end only. Expected while Phase 4 is in
// progress; it means the relation renders as half an edge until the other note
// is written.
if (oneSided.length > 0) {
  console.log('Hierarchy edges asserted from one end only:');
  for (const [a, field, b] of [...oneSided].sort()) {
    const la = notes.get(a)?.prefLabel;
    const lb = notes.get(b)?.prefLabel;
    console.log(`  ${a} (${la}).${field} -> ${b} (${lb});  ${b} does not answer with ${INVERSE[field]}`);
  }
  console.log();
}

if (failures.length > 0) {
  console.log('FAILURES:');
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log();
  console.log('RESULT: FAIL');
  process.exit(1);
}

console.log('All checks passed.');
console.log('RESULT: PASS');
