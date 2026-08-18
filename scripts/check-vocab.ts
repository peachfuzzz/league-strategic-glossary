import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

/**
 * Vocabulary integrity checks for the SKOS-inspired term notes.
 *
 *   npx tsx scripts/check-vocab.ts [expected_count]
 *
 * Exits non-zero if any check fails. Asymmetric `related` pairs are reported
 * but never auto-fixed, and do not fail the run.
 *
 * Frontmatter is parsed with gray-matter (see ADR0014). A note that is not
 * valid YAML throws during parsing and is reported as a failure, rather than
 * being silently skipped the way a line-oriented parser would.
 */

const ROOT = path.join(__dirname, '..');
const TERMS_DIR = path.join(ROOT, 'src/data/terms');
const REGISTRY = path.join(ROOT, 'docs/id-registry.csv');
const GEN = path.join(ROOT, 'src/data/generated');

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
    data = matter(raw).data as Note;
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

// ---- generated artifacts -------------------------------------------------

const activeIds = new Set([...notes].filter(([, fm]) => fm.active === true).map(([s]) => s));
const inactiveIds = new Set([...notes].filter(([, fm]) => fm.active !== true).map(([s]) => s));

let artifactsChecked = false;
let nIndex = 0, nConcepts = 0, nNodes = 0, nEdges = 0, nLabels = 0;
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
    for (const e of gEdges) {
      if (!nodeIds.has(e.source)) fail(`graph.json: edge source ${JSON.stringify(e.source)} does not resolve`);
      if (!nodeIds.has(e.target)) fail(`graph.json: edge target ${JSON.stringify(e.target)} does not resolve`);
    }
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
  }
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

if (failures.length > 0) {
  console.log('FAILURES:');
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log();
  console.log('RESULT: FAIL');
  process.exit(1);
}

console.log('All checks passed.');
console.log('RESULT: PASS');
