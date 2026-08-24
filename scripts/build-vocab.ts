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
 * Cross-references come from `related` and from prose wikilinks. Nothing else is
 * auto-derived - no term is linked because it merely appears in another's text.
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const OUT_DIR = path.join(process.cwd(), 'src/data/generated');
const CONCEPTS_DIR = path.join(OUT_DIR, 'concepts');

/** A sentence this long is a run-on; cut it rather than fill a card with it. */
const SUMMARY_MAX = 300;

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

/**
 * Block syntax an entry must not contain. The renderer drops these from the
 * tree, but a table is not even parsed as one without GFM - it would survive as
 * a paragraph of literal pipes. Catching it here makes the mistake visible at
 * build time instead of shipping mangled prose.
 */
const FORBIDDEN_BLOCKS: Array<[RegExp, string]> = [
  [/^#{1,6}\s/m, 'heading'],
  [/^>\s/m, 'blockquote'],
  [/^\|.*\|\s*$/m, 'table'],
  [/!\[[^\]]*\]\(/, 'image'],
  [/^(-{3,}|\*{3,}|_{3,})\s*$/m, 'horizontal rule'],
  [/^```/m, 'code fence'],
];

/**
 * Wikilinks are an Obsidian authoring convenience, always `[[C####|label]]`.
 * They are resolved here and never reach any consumer.
 */
const WIKILINK = /\[\[(C\d{4})\|([^\]]+)\]\]/g;

/** Any `[[...]]` that is not the piped identifier form is an authoring error. */
const ANY_WIKILINK = /\[\[[^\]]*\]\]/g;

/** Reduce every wikilink to its bare display label. Feeds the summary. */
function stripWikilinks(text: string): string {
  return text.replace(WIKILINK, (_m, _id, label) => label);
}

/**
 * Summaries render as plain text in cards, so emphasis markers would show up
 * literally - C0004's `*before*` is the live case. Drop the markers, keep the
 * words. The full definition keeps its emphasis; only the preview is flattened.
 */
function stripEmphasis(text: string): string {
  return text.replace(/(\*\*|__)(.+?)\1/g, '$2').replace(/(\*|_)(?!\s)(.+?)(?<!\s)\1/g, '$2');
}

/**
 * `]` and `)` would terminate the Markdown link early. No label needs this
 * today; escaping keeps a future one from silently emitting broken Markdown.
 */
function escapeLinkText(label: string): string {
  return label.replace(/([[\]])/g, '\\$1');
}

/**
 * Abbreviations whose trailing period does not end a sentence. Without these,
 * C0028 ("player vs. player") and C0093 ("i.e. \"away from\"") both truncate
 * at the abbreviation.
 */
const ABBREVIATIONS = ['vs', 'etc', 'e.g', 'i.e', 'approx', 'cf', 'ie', 'eg'];

/**
 * First sentence of the first paragraph, used as the list/graph preview.
 *
 * Entries follow genus-differentia, so the opening sentence is a real
 * definition rather than an arbitrary 200-character cut. Restricting to the
 * first paragraph is what keeps C0009's bullet list and the "Authors' note:"
 * paragraphs out of previews.
 *
 * Expects wikilinks already reduced to labels - never run this on resolved
 * Markdown, or link syntax lands in the preview text.
 */
function firstSentence(plainText: string): string {
  const paragraph = plainText.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  if (!paragraph) return '';

  const terminator = /[.!?]/g;
  let match: RegExpExecArray | null;

  while ((match = terminator.exec(paragraph)) !== null) {
    const end = match.index + 1;

    // A terminator ends the sentence only if the text runs out or the next
    // word starts a new one. `5-30 seconds.` mid-string is not a boundary.
    const rest = paragraph.slice(end);
    if (rest && !/^\s+["“'(]?[A-Z]/.test(rest)) continue;

    const preceding = paragraph.slice(0, match.index);
    const lastWord = preceding.split(/[\s(]+/).pop() ?? '';
    if (ABBREVIATIONS.includes(lastWord.toLowerCase())) continue;

    return paragraph.slice(0, end);
  }

  // No boundary found: the paragraph is one sentence, possibly unterminated.
  if (paragraph.length <= SUMMARY_MAX) return paragraph;
  const cut = paragraph.slice(0, SUMMARY_MAX);
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

  // Wikilinks resolve here, once. A link to an active concept becomes a
  // Markdown link; to an inactive one, plain text, since there is no page to
  // reach. A link to nothing at all is an authoring error and stops the build.
  const proseDropped: Array<{ from: string; to: string }> = [];

  const resolveWikilinks = (n: Note): { markdown: string; targets: string[] } => {
    const targets: string[] = [];

    for (const [pattern, name] of FORBIDDEN_BLOCKS) {
      if (pattern.test(n.definition)) {
        throw new Error(`${n.id}: definition contains a ${name}; entries are prose and lists only`);
      }
    }

    const malformed = (n.definition.match(ANY_WIKILINK) ?? []).filter(
      (w) => !/^\[\[C\d{4}\|[^\]]+\]\]$/.test(w)
    );
    if (malformed.length > 0) {
      throw new Error(
        `${n.id}: wikilink must be the [[C####|label]] form, found ${malformed.join(', ')}`
      );
    }

    const markdown = n.definition.replace(WIKILINK, (_m, id: string, label: string) => {
      if (activeIds.has(id)) {
        targets.push(id);
        return `[${escapeLinkText(label)}](/term/${slugOf.get(id)})`;
      }
      if (notes.some((o) => o.id === id)) {
        proseDropped.push({ from: n.id, to: id });
        return label;
      }
      throw new Error(`${n.id}: wikilink [[${id}|${label}]] points at no such concept`);
    });

    return { markdown, targets: [...new Set(targets)] };
  };

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(CONCEPTS_DIR, { recursive: true });

  const resolved = new Map(active.map((n) => [n.id, resolveWikilinks(n)]));

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

    // Prose targets join relation targets, so the term page still renders
    // every cross-reference from this one file.
    for (const t of resolved.get(n.id)!.targets) {
      refs[t] = { id: t, prefLabel: labelOf.get(t)!, slug: slugOf.get(t)! };
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
      // Resolved Markdown, not raw prose. Wikilinks are already links.
      definition: resolved.get(n.id)!.markdown,
      refs,
      backlinks,
    });
  }

  // --- index.json -------------------------------------------------------
  // `summary` is the first sentence, taken from label-stripped prose - never
  // from the resolved Markdown. `truncated` tells a card whether the entry
  // continues, so one-sentence entries are not given a misleading ellipsis.
  const index = active
    .slice()
    .sort((a, b) => a.prefLabel.localeCompare(b.prefLabel))
    .map((n) => {
      const plain = stripEmphasis(stripWikilinks(n.definition)).trim();
      const summary = firstSentence(plain);
      return {
        id: n.id,
        slug: slugOf.get(n.id),
        prefLabel: n.prefLabel,
        altLabel: n.altLabel,
        collection: n.collection,
        active: n.active,
        complete: n.complete,
        summary,
        truncated: summary.replace(/…$/, '').length < plain.replace(/\s+/g, ' ').length,
      };
    });
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

  if (proseDropped.length > 0) {
    const unique = [...new Map(proseDropped.map((d) => [`${d.from}|${d.to}`, d])).values()];
    console.log(`   ⚠ ${unique.length} prose wikilink(s) rendered unlinked (inactive target):`);
    unique.forEach((d) => console.log(`      ${d.from} -> ${d.to}`));
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
