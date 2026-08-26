import * as fs from 'fs';
import * as path from 'path';
import { SUBSTRATE_CONCEPTS } from '../src/config/substrate.config';
import { BROADER_FILE, PARTOF_FILE, GENERATED_DIR, HIERARCHY_DIR } from './lib/paths';
import { readNotes } from './lib/frontmatter';

/**
 * Writes the starting hierarchy outlines. One shot — after this the files are
 * hand-authored and this script is irrelevant.
 *
 *   npx tsx scripts/bootstrap-hierarchy.ts
 *
 * Refuses to overwrite an existing file. Losing hand-written hierarchy to a
 * re-run would be the worst failure this phase could have.
 *
 * `broader.md` starts with every active concept under Unplaced. `partof.md`
 * starts with Unplaced empty: meronymy applies to a minority of concepts, and
 * an exhaustive list would imply every concept is a part of something.
 */

const FORCE = process.argv.includes('--force');

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

/**
 * In-degree over `mentions`, excluding substrate concepts.
 *
 * Read from graph.json rather than recomputed. This is an empirical prior on
 * what sits near the root: a concept many definitions invoke is a candidate for
 * the upper tree. Substrate terms are excluded because `player` leads at 44,
 * 2.6x the runner-up, and it is a term every definition presupposes rather than
 * a parent (see substrate.config.ts and reports/metrics.md).
 */
function topByInDegree(limit: number): Array<[string, number]> {
  const graphPath = path.join(GENERATED_DIR, 'graph.json');
  if (!fs.existsSync(graphPath)) return [];

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8')) as { edges: GraphEdge[] };
  const inDegree = new Map<string, number>();
  const substrate = new Set<string>(SUBSTRATE_CONCEPTS);

  for (const e of graph.edges) {
    if (e.type !== 'mentions') continue;
    if (substrate.has(e.target) || substrate.has(e.source)) continue;
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  return [...inDegree.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function header(relation: 'broader' | 'partOf', notes: Map<string, string>): string {
  const derived =
    relation === 'broader' ? '`broader` and `narrower`' : '`partOf` and `hasPart`';
  const test =
    relation === 'broader'
      ? [
          'Before nesting A under B, both sentences must be true:',
          '',
          '- All A are B.',
          '- Some B are A.',
        ]
      : ['Nest A under B only where A is genuinely a part or a phase of B.', 'Do not force it.'];

  const lines = [
    relation === 'broader' ? '# Broader' : '# Part of',
    '',
    "Indentation is the relation. A child's parent is the item it sits under.",
    `Generated from this file: ${derived} in note frontmatter.`,
    'Do not edit those fields in Obsidian. This file owns them.',
    '',
    'Apply with `npm run apply-hierarchy`. Check with `npm run check-vocab`.',
    '',
    ...test,
    '',
    'An item at the top level of Hierarchy is a claim: this concept has nothing',
    'above it. An item under Unplaced is undecided. They are not the same.',
  ];

  if (relation === 'broader') {
    const top = topByInDegree(10);
    if (top.length > 0) {
      lines.push(
        '',
        'Most-invoked concepts, by inbound `mentions`, substrate excluded. An',
        'empirical prior on what sits near the root — not an instruction:',
        ''
      );
      for (const [id, n] of top) {
        lines.push(`  ${String(n).padStart(3)}  ${id} ${notes.get(id) ?? '?'}`);
      }
    }
  }

  return lines.join('\n');
}

function main(): void {
  const notes = readNotes();
  const active = notes.filter((n) => n.data.active === true);

  const labels = new Map(active.map((n) => [n.id, String(n.data.prefLabel ?? '')]));
  const sorted = [...active].sort((a, b) =>
    String(a.data.prefLabel ?? '').localeCompare(String(b.data.prefLabel ?? ''))
  );

  fs.mkdirSync(HIERARCHY_DIR, { recursive: true });

  const files: Array<{ filepath: string; relation: 'broader' | 'partOf'; seed: boolean }> = [
    { filepath: BROADER_FILE, relation: 'broader', seed: true },
    { filepath: PARTOF_FILE, relation: 'partOf', seed: false },
  ];

  let written = 0;
  for (const { filepath, relation, seed } of files) {
    const name = path.basename(filepath);
    if (fs.existsSync(filepath) && !FORCE) {
      console.log(`  ! ${name} exists — not overwriting`);
      continue;
    }

    const unplaced = seed
      ? sorted.map((n) => `- [[${n.id}|${n.data.prefLabel}]]`)
      : [];

    const text =
      [header(relation, labels), '', '## Hierarchy', '', '## Unplaced', '', ...unplaced]
        .join('\n')
        .trimEnd() + '\n';

    fs.writeFileSync(filepath, text, 'utf-8');
    console.log(`  ✓ ${name}  ${unplaced.length} unplaced`);
    written++;
  }

  console.log(
    written === 0
      ? '\nNothing written. Pass --force to overwrite, which discards hand-written hierarchy.'
      : `\nWrote ${written} file(s) to src/data/vault/hierarchy/.`
  );
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
