import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

/**
 * Builds the vocabulary artifacts from the SKOS-inspired term notes.
 *
 * Reads:  src/data/terms/C####.md
 * Writes: src/data/generated/
 *           concepts/C####.json   one file per active concept
 *           index.json            list view + search
 *           graph.json            nodes and edges, no prose
 *           labels.json           label -> concept ids (one-to-many by design)
 *
 * Cross-references come from `related` only. Nothing is auto-derived.
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const OUT_DIR = path.join(process.cwd(), 'src/data/generated');
const CONCEPTS_DIR = path.join(OUT_DIR, 'concepts');

const SUMMARY_LENGTH = 200;

interface Note {
  id: string;
  prefLabel: string;
  altLabel: string[];
  hiddenLabel: string[];
  aliases: string[];
  collection: string[];
  active: boolean;
  complete: boolean;
  broader: string[];
  narrower: string[];
  partOf: string[];
  hasPart: string[];
  related: string[];
  relatedReviewed: boolean;
  definition: string;
}

/** Relation fields carried into the graph. Hierarchy fields are empty today. */
const RELATION_FIELDS = ['related', 'broader', 'narrower', 'partOf', 'hasPart'] as const;
type RelationField = (typeof RELATION_FIELDS)[number];

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (v === undefined || v === null || v === '') return [];
  return [String(v)];
}

function asBool(v: unknown, file: string, field: string): boolean {
  if (typeof v === 'boolean') return v;
  throw new Error(`${file}: \`${field}\` must be a boolean, got ${JSON.stringify(v)}`);
}

/** URL slug from a prefLabel. Human-readable; ids stay internal. */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Backticks escape a span from linking. Strip the markers, keep the text. */
function stripBackticks(text: string): string {
  return text.replace(/`([^`]+)`/g, '$1');
}

function summarize(definition: string): string {
  const clean = stripBackticks(definition).replace(/\s+/g, ' ').trim();
  if (clean.length <= SUMMARY_LENGTH) return clean;
  const cut = clean.slice(0, SUMMARY_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

function readNotes(): Note[] {
  if (!fs.existsSync(TERMS_DIR)) {
    throw new Error(`Terms directory not found: ${TERMS_DIR}`);
  }

  const files = fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) throw new Error('No term notes found');

  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(TERMS_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);

    const id = String(data.id ?? '').trim();
    if (!/^C\d{4}$/.test(id)) {
      throw new Error(`${filename}: id ${JSON.stringify(data.id)} is not a C#### identifier`);
    }
    if (id !== filename.replace(/\.md$/, '')) {
      throw new Error(`${filename}: id ${id} does not match filename stem`);
    }

    const prefLabel = String(data.prefLabel ?? '').trim();
    if (!prefLabel) throw new Error(`${filename}: empty prefLabel`);

    return {
      id,
      prefLabel,
      altLabel: asArray(data.altLabel),
      hiddenLabel: asArray(data.hiddenLabel),
      aliases: asArray(data.aliases),
      collection: asArray(data.collection),
      active: asBool(data.active, filename, 'active'),
      complete: asBool(data.complete, filename, 'complete'),
      broader: asArray(data.broader),
      narrower: asArray(data.narrower),
      partOf: asArray(data.partOf),
      hasPart: asArray(data.hasPart),
      related: asArray(data.related),
      relatedReviewed: asBool(data.relatedReviewed, filename, 'relatedReviewed'),
      definition: content.trim(),
    };
  });
}

function writeJson(file: string, value: unknown): void {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf-8');
}

function main(): void {
  console.log('🔨 Building vocabulary artifacts...');

  const notes = readNotes();
  console.log(`   Read ${notes.length} notes`);

  const active = notes.filter((n) => n.active);
  const inactive = notes.filter((n) => !n.active);
  console.log(`   ${active.length} active, ${inactive.length} inactive (excluded)`);

  // Slugs must be unique across ACTIVE concepts - those are the ones with URLs.
  const bySlug = new Map<string, Note[]>();
  for (const n of active) {
    const s = slugify(n.prefLabel);
    if (!s) {
      throw new Error(`${n.id}: prefLabel ${JSON.stringify(n.prefLabel)} slugifies to empty`);
    }
    bySlug.set(s, [...(bySlug.get(s) ?? []), n]);
  }

  const collisions = [...bySlug.entries()].filter(([, ns]) => ns.length > 1);
  if (collisions.length > 0) {
    const detail = collisions
      .map(([s, ns]) => `  ${s} <- ${ns.map((n) => `${n.id} (${n.prefLabel})`).join(', ')}`)
      .join('\n');
    throw new Error(`Slug collision - refusing to build:\n${detail}`);
  }

  const slugOf = new Map(active.map((n) => [n.id, slugify(n.prefLabel)]));
  const activeIds = new Set(active.map((n) => n.id));
  const labelOf = new Map(active.map((n) => [n.id, n.prefLabel]));

  // Relation targets pointing at inactive or unknown concepts cannot render.
  const dropped: Array<{ from: string; field: string; to: string; reason: string }> = [];
  const resolveTargets = (n: Note, field: RelationField): string[] =>
    n[field].filter((t) => {
      if (activeIds.has(t)) return true;
      const reason = notes.some((o) => o.id === t) ? 'inactive' : 'unknown';
      dropped.push({ from: n.id, field, to: t, reason });
      return false;
    });

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(CONCEPTS_DIR, { recursive: true });

  // --- per-concept files -----------------------------------------------
  // Each carries the prefLabel of everything it references, so the term page
  // never needs to load a second concept file.
  for (const n of active) {
    const refs: Record<string, { id: string; prefLabel: string; slug: string }> = {};
    const relations: Record<string, string[]> = {};

    for (const field of RELATION_FIELDS) {
      const targets = resolveTargets(n, field);
      relations[field] = targets;
      for (const t of targets) {
        refs[t] = { id: t, prefLabel: labelOf.get(t)!, slug: slugOf.get(t)! };
      }
    }

    // Concepts that reference this one, so the page can show backlinks
    // without loading the whole set. Asymmetry is preserved, not repaired.
    const backlinks = active
      .filter((o) => o.id !== n.id && RELATION_FIELDS.some((f) => o[f].includes(n.id)))
      .map((o) => ({ id: o.id, prefLabel: o.prefLabel, slug: slugOf.get(o.id)! }));

    writeJson(path.join(CONCEPTS_DIR, `${n.id}.json`), {
      id: n.id,
      slug: slugOf.get(n.id),
      prefLabel: n.prefLabel,
      altLabel: n.altLabel,
      hiddenLabel: n.hiddenLabel,
      collection: n.collection,
      active: n.active,
      complete: n.complete,
      ...relations,
      relatedReviewed: n.relatedReviewed,
      definition: n.definition,
      refs,
      backlinks,
    });
  }

  // --- index.json -------------------------------------------------------
  const index = active
    .slice()
    .sort((a, b) => a.prefLabel.localeCompare(b.prefLabel))
    .map((n) => ({
      id: n.id,
      slug: slugOf.get(n.id),
      prefLabel: n.prefLabel,
      altLabel: n.altLabel,
      collection: n.collection,
      active: n.active,
      complete: n.complete,
      summary: summarize(n.definition),
    }));
  writeJson(path.join(OUT_DIR, 'index.json'), index);

  // --- graph.json -------------------------------------------------------
  // Edges from `related` (and the hierarchy fields once they are filled).
  // Nothing derived. Undirected duplicates are collapsed per relation type.
  const nodes = active.map((n) => ({
    id: n.id,
    slug: slugOf.get(n.id),
    prefLabel: n.prefLabel,
    collection: n.collection,
    complete: n.complete,
  }));

  const seenEdge = new Set<string>();
  const edges: Array<{ source: string; target: string; type: string }> = [];
  for (const n of active) {
    for (const field of RELATION_FIELDS) {
      for (const t of resolveTargets(n, field)) {
        // `related` is undirected: collapse A->B and B->A into one edge.
        const key =
          field === 'related'
            ? `related:${[n.id, t].sort().join('|')}`
            : `${field}:${n.id}|${t}`;
        if (seenEdge.has(key)) continue;
        seenEdge.add(key);
        edges.push({ source: n.id, target: t, type: field });
      }
    }
  }
  writeJson(path.join(OUT_DIR, 'graph.json'), { nodes, edges });

  // --- labels.json ------------------------------------------------------
  // One-to-many by design: a label may map to several concepts. None do today.
  const labels: Record<string, string[]> = {};
  const addLabel = (label: string, id: string, kind: string) => {
    const key = label.trim();
    if (!key) return;
    (labels[key] ??= []).push(`${id}`);
    void kind;
  };
  for (const n of active) {
    addLabel(n.prefLabel, n.id, 'pref');
    n.altLabel.forEach((l) => addLabel(l, n.id, 'alt'));
    n.hiddenLabel.forEach((l) => addLabel(l, n.id, 'hidden'));
  }
  for (const key of Object.keys(labels)) {
    labels[key] = [...new Set(labels[key])].sort();
  }
  writeJson(path.join(OUT_DIR, 'labels.json'), labels);

  const ambiguous = Object.entries(labels).filter(([, ids]) => ids.length > 1);

  // --- summary ----------------------------------------------------------
  console.log(`   ✓ ${active.length} concept files`);
  console.log(`   ✓ index.json      ${index.length} entries`);
  console.log(`   ✓ graph.json      ${nodes.length} nodes, ${edges.length} edges`);
  console.log(`   ✓ labels.json     ${Object.keys(labels).length} labels`);

  const isolated = nodes.filter(
    (n) => !edges.some((e) => e.source === n.id || e.target === n.id)
  ).length;
  console.log(`   ℹ ${isolated} isolated nodes (no relations yet)`);

  if (ambiguous.length > 0) {
    console.log(`   ⚠ ${ambiguous.length} ambiguous label(s):`);
    ambiguous.forEach(([l, ids]) => console.log(`      "${l}" -> ${ids.join(', ')}`));
  }

  if (dropped.length > 0) {
    const unique = [...new Map(dropped.map((d) => [`${d.from}|${d.field}|${d.to}`, d])).values()];
    console.log(`   ⚠ ${unique.length} relation target(s) dropped:`);
    unique.forEach((d) =>
      console.log(`      ${d.from}.${d.field} -> ${d.to} (${d.reason})`)
    );
  }

  if (inactive.length > 0) {
    console.log(`   ℹ excluded ${inactive.length} inactive: ${inactive.map((n) => n.id).join(', ')}`);
  }

  console.log('✨ Done.');
}

try {
  main();
} catch (err) {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
