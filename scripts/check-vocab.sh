#!/usr/bin/env bash
# Vocabulary integrity checks for the SKOS-inspired term notes.
#
#   scripts/check-vocab.sh [expected_count]
#
# Exits non-zero if any check fails. Asymmetric `related` pairs are reported
# but never auto-fixed, and do not fail the run.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

TERMS="src/data/terms"
REGISTRY="docs/id-registry.csv"
EXPECTED="${1:-97}"

python3 - "$TERMS" "$REGISTRY" "$EXPECTED" <<'PY'
import csv, re, sys
from pathlib import Path
from collections import defaultdict

terms_dir, registry_path, expected = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])

SCHEMA = ["id", "prefLabel", "altLabel", "hiddenLabel", "aliases", "collection",
          "active", "complete", "broader", "narrower", "partOf", "hasPart",
          "related", "relatedReviewed"]

failures, warnings = [], []
def fail(m): failures.append(m)
def warn(m): warnings.append(m)


def parse(v):
    v = v.strip()
    if v in ("true", "false"):
        return v == "true"
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        if not inner:
            return []
        return [p.strip().strip('"').strip("'") for p in
                re.split(r",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", inner) if p.strip()]
    return v.strip('"').strip("'")


files = sorted(terms_dir.glob("*.md"))
notes = {}

for p in files:
    # 1. filename pattern
    if not re.fullmatch(r"C\d{4}\.md", p.name):
        fail(f"filename does not match ^C\\d{{4}}\\.md$: {p.name}")
        continue

    raw = p.read_text(encoding="utf-8")
    lines = raw.split("\n")
    if lines[0].strip() != "---":
        fail(f"{p.name}: no frontmatter")
        continue
    try:
        close = lines.index("---", 1)
    except ValueError:
        fail(f"{p.name}: unterminated frontmatter")
        continue

    fm, order = {}, []
    for ln in lines[1:close]:
        if not ln.strip() or ":" not in ln:
            continue
        k, v = ln.split(":", 1)
        fm[k.strip()] = parse(v)
        order.append(k.strip())

    # 9. all schema fields present
    missing = [f for f in SCHEMA if f not in fm]
    if missing:
        fail(f"{p.name}: missing schema field(s): {', '.join(missing)}")
    extra = [k for k in order if k not in SCHEMA]
    if extra:
        fail(f"{p.name}: unexpected field(s): {', '.join(extra)}")

    # 2. id equals filename stem
    if fm.get("id") != p.stem:
        fail(f"{p.name}: id {fm.get('id')!r} != filename stem {p.stem!r}")

    # 6. prefLabel non-empty
    if not str(fm.get("prefLabel", "")).strip():
        fail(f"{p.name}: empty prefLabel")

    notes[p.stem] = fm

# 10. count
if len(files) != expected:
    fail(f"note count {len(files)} != expected {expected}")

# 3. ids unique  (filenames are unique by definition; catch duplicate id values)
seen = defaultdict(list)
for stem, fm in notes.items():
    seen[fm.get("id")].append(stem)
for i, owners in seen.items():
    if len(owners) > 1:
        fail(f"duplicate id {i!r} in: {', '.join(owners)}")

# 4/5. registry cross-check
if not registry_path.exists():
    fail(f"registry not found: {registry_path}")
    rows = []
else:
    rows = list(csv.DictReader(registry_path.open(encoding="utf-8")))

reg_ids = [r["id"] for r in rows]
for rid in reg_ids:
    if rid not in notes:
        fail(f"registry row {rid} has no corresponding note")
for stem in notes:
    if stem not in reg_ids:
        fail(f"note {stem} is not in the registry")

dupe_reg = {i for i in reg_ids if reg_ids.count(i) > 1}
for i in dupe_reg:
    fail(f"duplicate registry id: {i}")

slugs = [r["legacy_slug"] for r in rows]
for s in {x for x in slugs if slugs.count(x) > 1}:
    fail(f"duplicate legacy_slug in registry: {s}")

# 7. related targets resolve
for stem, fm in notes.items():
    for t in fm.get("related", []) or []:
        if t not in notes:
            fail(f"{stem}: related target {t!r} does not resolve")

# 8. symmetry (report only)
asym = []
for stem, fm in notes.items():
    for t in fm.get("related", []) or []:
        if t in notes and stem not in (notes[t].get("related", []) or []):
            asym.append((stem, t))

# ---- generated artifacts -------------------------------------------------
import json

GEN = Path("src/data/generated")
artifacts_checked = False
n_index = n_concepts = n_nodes = n_edges = n_labels = 0

active_ids = {s for s, fm in notes.items() if fm.get("active") is True}
inactive_ids = {s for s, fm in notes.items() if fm.get("active") is not True}

if not GEN.exists():
    fail(f"generated artifacts not found: {GEN} (run `npm run build-vocab`)")
else:
    artifacts_checked = True

    def load(name):
        p = GEN / name
        if not p.exists():
            fail(f"missing artifact: {p}")
            return None
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            fail(f"{p}: invalid JSON ({e})")
            return None

    index = load("index.json")
    graph = load("graph.json")
    labels = load("labels.json")

    concept_files = sorted((GEN / "concepts").glob("*.json")) if (GEN / "concepts").exists() else []
    n_concepts = len(concept_files)
    if not concept_files:
        fail("no per-concept files emitted")

    # index covers exactly the active notes
    if index is not None:
        n_index = len(index)
        index_ids = [e["id"] for e in index]
        for i in index_ids:
            if i not in notes:
                fail(f"index.json: {i} has no note")
            elif i in inactive_ids:
                fail(f"index.json: {i} is inactive but was emitted")
        for i in sorted(active_ids - set(index_ids)):
            fail(f"index.json: active note {i} is missing")

        # every concept in index has a per-concept file
        have = {p.stem for p in concept_files}
        for i in index_ids:
            if i not in have:
                fail(f"index.json: {i} has no concepts/{i}.json")
        for stem in sorted(have - set(index_ids)):
            fail(f"concepts/{stem}.json has no index.json entry")

        # slugs unique and non-empty
        slug_owners = defaultdict(list)
        for e in index:
            if not e.get("slug"):
                fail(f"index.json: {e['id']} has an empty slug")
            slug_owners[e.get("slug")].append(e["id"])
        for s, ids in slug_owners.items():
            if len(ids) > 1:
                fail(f"slug collision: {s!r} <- {', '.join(ids)}")

    # graph nodes/edges resolve
    if graph is not None:
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        n_nodes, n_edges = len(nodes), len(edges)
        node_ids = {n["id"] for n in nodes}
        for i in sorted(node_ids - active_ids):
            fail(f"graph.json: node {i} is not an active note")
        for i in sorted(active_ids - node_ids):
            fail(f"graph.json: active note {i} has no node")
        for e in edges:
            if e.get("source") not in node_ids:
                fail(f"graph.json: edge source {e.get('source')!r} does not resolve")
            if e.get("target") not in node_ids:
                fail(f"graph.json: edge target {e.get('target')!r} does not resolve")

    # labels map to real concepts, one-to-many shape
    if labels is not None:
        n_labels = len(labels)
        for label, ids in labels.items():
            if not isinstance(ids, list):
                fail(f"labels.json: {label!r} maps to a non-list")
                continue
            for i in ids:
                if i not in active_ids:
                    fail(f"labels.json: {label!r} -> {i} is not an active concept")

    # per-concept internals
    for p in concept_files:
        try:
            c = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            fail(f"{p.name}: invalid JSON ({e})")
            continue
        if c.get("id") != p.stem:
            fail(f"{p.name}: id {c.get('id')!r} != filename stem")
        for t in c.get("related", []) or []:
            if t not in active_ids:
                fail(f"{p.name}: related target {t} is not an active concept")
            if t not in (c.get("refs") or {}):
                fail(f"{p.name}: related target {t} missing from refs")

ambiguous_labels = (
    {l: ids for l, ids in (labels or {}).items() if isinstance(ids, list) and len(ids) > 1}
    if artifacts_checked and labels else {}
)

print("=" * 60)
print("Vocabulary check")
print("=" * 60)
print(f"  Notes:          {len(files)}")
print(f"  Registry rows:  {len(rows)}")
print(f"  Failures:       {len(failures)}")
print(f"  Asymmetric:     {len(asym)} (reported, not auto-fixed)")
if artifacts_checked:
    print()
    print("  Artifacts")
    print(f"    concepts/     {n_concepts}")
    print(f"    index.json    {n_index}")
    print(f"    graph.json    {n_nodes} nodes, {n_edges} edges")
    print(f"    labels.json   {n_labels}")
    print()
    print(f"  Rendered {len(active_ids)} of {len(files)} concepts "
          f"({len(inactive_ids)} inactive, excluded by design)")
    if inactive_ids:
        print(f"    inactive: {', '.join(sorted(inactive_ids))}")
    if ambiguous_labels:
        print(f"  Ambiguous labels: {len(ambiguous_labels)}")
        for l, ids in sorted(ambiguous_labels.items()):
            print(f"    {l!r} -> {', '.join(ids)}")
print()

if asym:
    print("Asymmetric `related` pairs:")
    for a, b in sorted(asym):
        la = notes[a].get("prefLabel"); lb = notes[b].get("prefLabel")
        print(f"  {a} ({la}) -> {b} ({lb});  {b} does not list {a}")
    print()

if failures:
    print("FAILURES:")
    for f in failures:
        print(f"  ✗ {f}")
    print()
    print("RESULT: FAIL")
    sys.exit(1)

print("All checks passed.")
print("RESULT: PASS")
PY
