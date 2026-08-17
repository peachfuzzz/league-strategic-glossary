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

print("=" * 60)
print("Vocabulary check")
print("=" * 60)
print(f"  Notes:          {len(files)}")
print(f"  Registry rows:  {len(rows)}")
print(f"  Failures:       {len(failures)}")
print(f"  Asymmetric:     {len(asym)} (reported, not auto-fixed)")
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
