import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { SUBSTRATE_CONCEPTS } from '../src/config/substrate.config';
import * as PATHS from './lib/paths';

/**
 * Graph metrics over the derived `mentions` relation.
 *
 *   npx tsx scripts/metrics.ts
 *
 * Writes `reports/metrics.md` and `reports/missing.md`. Reports only - this
 * script never fails a build and never influences an exit code. Validation
 * lives in `check-vocab.ts`; keeping the two apart means a surprising number
 * can never block a commit.
 *
 * Every figure is reported twice: over the full `mentions` graph, and over the
 * same graph with `SUBSTRATE_CONCEPTS` removed. See `substrate.config.ts` for
 * why, and ADR0016 for what `mentions` claims.
 */

const GEN = PATHS.GENERATED_DIR;
const TERMS_DIR = PATHS.TERMS_DIR;
const REPORTS = PATHS.REPORTS_DIR;

interface GraphNode {
  id: string;
  prefLabel: string;
}
interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

// ---- graph ---------------------------------------------------------------

const graphPath = path.join(GEN, 'graph.json');
if (!fs.existsSync(graphPath)) {
  console.error(`❌ ${graphPath} not found. Run \`npm run build-vocab\` first.`);
  process.exit(1);
}
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8')) as {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const labelOf = new Map(graph.nodes.map((n) => [n.id, n.prefLabel]));
const name = (id: string) => `${labelOf.get(id) ?? '?'} (${id})`;

const mentionEdges = graph.edges.filter((e) => e.type === 'mentions');

/**
 * One view of the mentions graph: a node set and the edges among them.
 *
 * Substrate concepts are removed as *nodes*, not merely ignored as edge
 * targets. Both readings coincide today because every substrate concept has
 * zero outbound mentions, but node removal is the stricter one and stays
 * correct if that changes.
 */
interface View {
  title: string;
  nodes: string[];
  edges: Array<{ source: string; target: string }>;
}

const buildView = (title: string, drop: ReadonlySet<string>): View => {
  const nodes = graph.nodes.map((n) => n.id).filter((id) => !drop.has(id));
  const keep = new Set(nodes);
  return {
    title,
    nodes,
    edges: mentionEdges
      .filter((e) => keep.has(e.source) && keep.has(e.target))
      .map((e) => ({ source: e.source, target: e.target })),
  };
};

const substrate = new Set<string>(SUBSTRATE_CONCEPTS);
const views: View[] = [
  buildView('Full graph', new Set()),
  buildView('Substrate-free', substrate),
];

// ---- metrics -------------------------------------------------------------

const inDegree = (v: View): Map<string, number> => {
  const d = new Map(v.nodes.map((id) => [id, 0]));
  for (const e of v.edges) d.set(e.target, (d.get(e.target) ?? 0) + 1);
  return d;
};

const outDegree = (v: View): Map<string, number> => {
  const d = new Map(v.nodes.map((id) => [id, 0]));
  for (const e of v.edges) d.set(e.source, (d.get(e.source) ?? 0) + 1);
  return d;
};

/**
 * Brandes' algorithm for betweenness centrality on an unweighted directed
 * graph. Counts how often a node lies on a shortest path between two others,
 * which finds bridges where degree finds hubs (DESIGN.md 5.3).
 *
 * Note a structural consequence: a node with no outbound edges can never sit
 * *between* two others, so its betweenness is necessarily 0. Both substrate
 * concepts are such sinks today.
 */
const betweenness = (v: View): Map<string, number> => {
  const adj = new Map<string, string[]>(v.nodes.map((id) => [id, []]));
  for (const e of v.edges) adj.get(e.source)!.push(e.target);

  const cb = new Map<string, number>(v.nodes.map((id) => [id, 0]));

  for (const s of v.nodes) {
    const stack: string[] = [];
    const preds = new Map<string, string[]>(v.nodes.map((id) => [id, []]));
    const sigma = new Map<string, number>(v.nodes.map((id) => [id, 0]));
    const dist = new Map<string, number>(v.nodes.map((id) => [id, -1]));

    sigma.set(s, 1);
    dist.set(s, 0);
    const queue: string[] = [s];

    for (let head = 0; head < queue.length; head++) {
      const w = queue[head];
      stack.push(w);
      for (const t of adj.get(w)!) {
        if (dist.get(t)! < 0) {
          dist.set(t, dist.get(w)! + 1);
          queue.push(t);
        }
        if (dist.get(t) === dist.get(w)! + 1) {
          sigma.set(t, sigma.get(t)! + sigma.get(w)!);
          preds.get(t)!.push(w);
        }
      }
    }

    const delta = new Map<string, number>(v.nodes.map((id) => [id, 0]));
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const p of preds.get(w)!) {
        delta.set(p, delta.get(p)! + (sigma.get(p)! / sigma.get(w)!) * (1 + delta.get(w)!));
      }
      if (w !== s) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }
  return cb;
};

const ranked = (m: Map<string, number>, limit = 20) =>
  [...m.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || labelOf.get(a[0])!.localeCompare(labelOf.get(b[0])!))
    .slice(0, limit);

const table = (rows: Array<[string, number]>, heading: string, fmt = (n: number) => String(n)) => {
  if (rows.length === 0) return `_No concept has a non-zero ${heading.toLowerCase()}._\n`;
  const lines = [`| ${heading} | Concept |`, '|---:|---|'];
  for (const [id, n] of rows) lines.push(`| ${fmt(n)} | ${name(id)} |`);
  return lines.join('\n') + '\n';
};

// ---- mutual pairs and isolates -------------------------------------------

const full = views[0];
const edgeKeys = new Set(full.edges.map((e) => `${e.source}|${e.target}`));
const mutual = full.edges
  .filter((e) => e.source < e.target && edgeKeys.has(`${e.target}|${e.source}`))
  .map((e) => [e.source, e.target] as const);

const isolatesOf = (v: View) => {
  const touched = new Set(v.edges.flatMap((e) => [e.source, e.target]));
  return v.nodes.filter((id) => !touched.has(id));
};

// ---- metrics.md ----------------------------------------------------------

const out: string[] = [];
out.push('# Mentions graph metrics\n');
out.push(
  'Generated by `scripts/metrics.ts` from `src/data/generated/graph.json`.',
  'Regenerate with `npm run metrics`. This file is gitignored.\n'
);
out.push(
  '`mentions` records that one entry\'s prose links to another concept. It is a fact',
  'about the text, not a claim that one concept depends on another (ADR0016).\n'
);

out.push('## Summary\n');
out.push('| View | Nodes | Edges | Isolated |');
out.push('|---|---:|---:|---:|');
for (const v of views) {
  out.push(`| ${v.title} | ${v.nodes.length} | ${v.edges.length} | ${isolatesOf(v).length} |`);
}
out.push('');

const excluded = [...substrate].map(name).join(', ');
out.push(
  `Substrate concepts excluded from the second view: ${excluded}.`,
  'These terms serve a grammatical role, so their degree measures ubiquity',
  'rather than structural importance. See `src/config/substrate.config.ts`.\n'
);

for (const v of views) {
  const ind = inDegree(v);
  const btw = betweenness(v);
  out.push(`## ${v.title}\n`);
  out.push('### In-degree\n');
  out.push('How many entries link to this concept.\n');
  out.push(table(ranked(ind), 'In'));
  out.push('\n### Betweenness\n');
  out.push('How often this concept sits on a shortest path between two others.\n');
  out.push(table(ranked(btw), 'Betweenness', (n) => n.toFixed(1)));
  out.push('');
}

out.push('## Mutually-mentioning pairs\n');
out.push(
  'Both entries link to each other. `mentions` is not acyclic, and mutual definition',
  'is a finding about the vocabulary rather than a data fault (DESIGN.md 5.4).\n'
);
for (const [a, b] of mutual.sort((x, y) => labelOf.get(x[0])!.localeCompare(labelOf.get(y[0])!))) {
  out.push(`- ${name(a)} ↔ ${name(b)}`);
}
out.push('');

out.push('## Isolated concepts\n');
out.push(
  'No prose links in or out, in the full graph. Counted over `mentions` alone, so this',
  'is higher than the build\'s isolated-node figure, which counts every edge type.\n'
);
const iso = isolatesOf(full);
for (const id of iso.sort((a, b) => labelOf.get(a)!.localeCompare(labelOf.get(b)!))) {
  out.push(`- ${name(id)}`);
}
if (iso.length === 0) out.push('_None._');
out.push('');

// A sink cannot lie between two other nodes, so its betweenness is 0 by
// construction. Worth stating, so the substrate exclusion is not read as
// having changed a number it cannot yet change.
const sinks = [...substrate].filter((id) => (outDegree(full).get(id) ?? 0) === 0);
if (sinks.length > 0) {
  out.push('## Note on the substrate exclusion\n');
  out.push(
    `${sinks.map(name).join(' and ')} ${sinks.length === 1 ? 'has' : 'have'} no outbound`,
    'mentions. A node with no outbound edges cannot sit between two others, so its',
    'betweenness is already 0. The exclusion therefore changes the in-degree ranking',
    'today and would only affect betweenness if a substrate concept later gained',
    'outbound links.\n'
  );
}

// ---- missing.md ----------------------------------------------------------

const WIKILINK = /\[\[(C\d{4})\|([^\]]+)\]\]/g;

const notes = new Map<string, { prefLabel: string; active: boolean; body: string }>();
for (const file of fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith('.md'))) {
  const parsed = matter(fs.readFileSync(path.join(TERMS_DIR, file), 'utf-8'));
  notes.set(file.replace(/\.md$/, ''), {
    prefLabel: String(parsed.data.prefLabel ?? '?'),
    active: parsed.data.active === true,
    body: parsed.content,
  });
}

/** Inactive concepts the prose links to: linked but unpublished. */
const gaps = new Map<string, string[]>();
for (const [id, note] of notes) {
  if (!note.active) continue;
  const seen = new Set<string>();
  for (const m of note.body.matchAll(WIKILINK)) {
    const target = m[1];
    if (seen.has(target)) continue;
    seen.add(target);
    const t = notes.get(target);
    if (t && !t.active) gaps.set(target, [...(gaps.get(target) ?? []), id]);
  }
}

const missing: string[] = [];
missing.push('# Missing terms\n');
missing.push(
  'Concepts the prose links to that are `active: false`, so the link renders as',
  'plain text. Ranked by how many entries want them. Generated by',
  '`scripts/metrics.ts`; this file is gitignored.\n'
);
missing.push(
  'A target several entries link to leaves a hole in the hierarchy and should be',
  'written. A target mentioned once is a known gap and can be published as one.\n'
);

const ranking = [...gaps.entries()].sort(
  (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
);
if (ranking.length === 0) {
  missing.push('_No active entry links to an inactive concept._\n');
} else {
  missing.push('| Links | Target | Linked from |');
  missing.push('|---:|---|---|');
  for (const [target, sources] of ranking) {
    const label = notes.get(target)!.prefLabel;
    const from = sources
      .map((s) => `${notes.get(s)!.prefLabel} (${s})`)
      .sort()
      .join(', ');
    missing.push(`| ${sources.length} | ${label} (${target}) | ${from} |`);
  }
  missing.push('');
}

const inactiveUnlinked = [...notes]
  .filter(([id, n]) => !n.active && !gaps.has(id))
  .map(([id, n]) => `${n.prefLabel} (${id})`)
  .sort();
missing.push('## Inactive and unlinked\n');
missing.push('Switched off, and no active entry links to them.\n');
for (const s of inactiveUnlinked) missing.push(`- ${s}`);
if (inactiveUnlinked.length === 0) missing.push('_None._');
missing.push('');

// ---- write ---------------------------------------------------------------

fs.mkdirSync(REPORTS, { recursive: true });
fs.writeFileSync(path.join(REPORTS, 'metrics.md'), out.join('\n'));
fs.writeFileSync(path.join(REPORTS, 'missing.md'), missing.join('\n'));

console.log('📊 Metrics written.');
for (const v of views) {
  console.log(`   ${v.title.padEnd(15)} ${v.nodes.length} nodes, ${v.edges.length} edges`);
}
console.log(`   ✓ reports/metrics.md`);
console.log(`   ✓ reports/missing.md  ${ranking.length} linked-but-inactive target(s)`);
