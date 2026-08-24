import indexJson from './generated/index.json';
import graphJson from './generated/graph.json';
import labelsJson from './generated/labels.json';

/**
 * Typed access to the generated vocabulary artifacts.
 *
 * `index.json`, `graph.json` and `labels.json` are whole-set artifacts and are
 * imported directly - every surface that needs them needs all of them.
 *
 * Per-concept files are NOT imported here - they are read from disk by
 * `getConcept` in `vocab.server.ts`. Importing all 81 into the client bundle
 * would defeat the split.
 */

export interface ConceptRef {
  id: string;
  prefLabel: string;
  slug: string;
}

export interface IndexEntry {
  id: string;
  slug: string;
  prefLabel: string;
  altLabel: string[];
  collection: string[];
  active: boolean;
  complete: boolean;
  /** First sentence of the definition, as plain text. Never Markdown. */
  summary: string;
  /** Whether the definition continues past `summary`, so cards can say so. */
  truncated: boolean;
}

export interface GraphNode {
  id: string;
  slug: string;
  prefLabel: string;
  collection: string[];
  complete: boolean;
}

/**
 * The four relation types. `mentions` is derived from prose wikilinks and is
 * the only one the build computes; the rest are authored in frontmatter.
 */
export type RelationType =
  | 'related'
  | 'broader'
  | 'narrower'
  | 'partOf'
  | 'hasPart'
  | 'mentions';

export interface GraphEdge {
  source: string;
  target: string;
  type: RelationType;
}

export interface Concept {
  id: string;
  slug: string;
  prefLabel: string;
  altLabel: string[];
  hiddenLabel: string[];
  collection: string[];
  active: boolean;
  complete: boolean;
  related: string[];
  broader: string[];
  narrower: string[];
  partOf: string[];
  hasPart: string[];
  /**
   * Concepts this entry's prose links to. Derived from wikilinks at build time,
   * never authored. Records usage only - it makes no claim that this concept
   * depends on those. See `docs/adr/ADR0016-mentions-not-depends-on.md`.
   */
  mentions: string[];
  relatedReviewed: boolean;
  /**
   * Resolved Markdown, not raw prose. The build has already rewritten every
   * `[[C####|label]]` wikilink into a `[label](/term/slug)` link, so this must
   * be rendered as Markdown - printing it as text shows link syntax.
   */
  definition: string;
  refs: Record<string, ConceptRef>;
  /** The reverse of `mentions`: concepts whose prose links to this one. */
  backlinks: ConceptRef[];
}

export const vocabIndex = indexJson as IndexEntry[];
export const vocabGraph = graphJson as { nodes: GraphNode[]; edges: GraphEdge[] };
export const vocabLabels = labelsJson as Record<string, string[]>;

/**
 * The shape the client surfaces (graph, list, search) work with.
 *
 * `index.json` plus the adjacency derived from `graph.json`. Deliberately
 * prose-light: `summary` is the definition's first sentence as plain text, not
 * the full text - the full text lives in the per-concept files the term page
 * reads.
 */
export interface ConceptView extends IndexEntry {
  related: string[];
}

/**
 * Authored relations only. `mentions` is excluded deliberately: it carries 216
 * of the graph's 229 edges, and folding derived prose links into what the list
 * view presents as editorial cross-references would drown them.
 */
const adjacency = new Map<string, Set<string>>();
for (const edge of vocabGraph.edges) {
  if (edge.type === 'mentions') continue;
  if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
  if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
  // `related` is undirected; the build emits one edge per pair.
  adjacency.get(edge.source)!.add(edge.target);
  adjacency.get(edge.target)!.add(edge.source);
}

export const conceptViews: ConceptView[] = vocabIndex.map((entry) => ({
  ...entry,
  related: [...(adjacency.get(entry.id) ?? [])].sort(),
}));
