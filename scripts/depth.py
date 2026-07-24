"""
Compute prerequisite depth over the glossary's definitional graph.

Edge A -> B means "A's definition uses B", so B is a prerequisite of A.
Primitives are sinks: terms defined without invoking any other defined term.
depth(v) = 0 for sinks, else 1 + max(depth(successors)).
Cycles are condensed into single nodes (Tarjan SCC) before the longest-path pass.

Writes depth.json: {slug: {"depth": int, "uses": [slug, ...]}}

--- Running it against the repo ---

As written, this parses OCR'd text and detects edges by scanning definitions for
term names. That is approximate: terms that are also common English words (value,
object, fight, play, give, contest, trade, crash) produce false edges. It exists
to get a first look without touching the repo.

For real numbers, replace load_body() + parse() + build_edges() with a read of the
generated data and use the authored autoLinks as the edge set:

    import json
    data  = json.load(open("glossary.json"))        # or parse glossaryData.ts
    defs  = {t["term"]: t["definition"] for t in data}
    edges = {t["term"]: set(t["autoLinks"]) for t in data}

Everything downstream — tarjan(), compute(), the report — is unchanged.

Worth running both ways once and diffing. An edge the mention-scan finds that
autoLinks doesn't is usually a backtick you forgot, so this doubles as a linter.
Note that autoLinks is directional and definitional; the curated `links` field is
associative and should be left out of the depth computation entirely.
"""
import re, sys, json
from collections import defaultdict

# --- 1. Term inventory -------------------------------------------------------
# (canonical name, [alternates])
TERMS = [
    # Game Mechanics
    ("Attack Reset", ["auto reset"]),
    ("Attack Cancel", ["auto cancel"]),
    ("Bounceback", ["bounce"]),
    ("Buffer", ["input buffer", "buffer window"]),
    ("CC Buffer", ["buffering through CC"]),
    ("Crash", []),
    ("Flashcast", []),
    ("Flash Buffer", []),
    # Strategy
    ("All-in", []),
    ("Ability Rotation", ["full rotation"]),
    ("Bait", []),
    ("Collapse", []),
    ("Contest", ["contesting"]),
    ("Counterpick", []),
    ("Dive", ["redive"]),
    ("Duel", []),
    ("Freeze", ["true freeze"]),
    ("Give", ["giving"]),
    ("Overextend", ["overextension", "overextending"]),
    ("Trade", []),
    ("Matchup", []),
    ("Peel", ["peeling"]),
    ("Play", []),
    ("Siege", []),
    ("Skirmish", []),
    ("Slow Push", ["slow pushing"]),
    ("Spacing", []),
    ("Engage", ["initiation"]),
    ("Re-engage", []),
    ("Shove", ["hard push", "fast push", "shoving"]),
    ("Split Map", []),
    ("Strongside", ["strongsiding"]),
    ("Teamfight", ["teamfighting"]),
    ("Wave Thinning", ["trimming", "thinning"]),
    ("Weakside", ["weaksiding"]),
    # Abstract Concepts
    ("Actor", []),
    ("Combat", ["in-combat"]),
    ("Expected Value", ["EV"]),
    ("Fight", []),
    ("Interaction", []),
    ("Key Ability", []),
    ("Kill Pressure", []),
    ("Object", []),
    ("Pressure", []),
    ("Tempo", []),
    ("Tension", []),
    ("Threat", []),
    ("Value", []),
    ("Variance", []),
    # Vernacular
    ("Backstep", ["sidestep"]),
    ("Dance", []),
    ("One-trick", []),
    ("High Elo", []),
    ("Squishy", ["squishies"]),
    ("Tanky", []),
    ("Hook", []),
]

SECTIONS = {"Game Mechanics", "Strategy", "Abstract Concepts", "Vernacular"}


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# --- 2. Parse the OCR text into term -> definition ---------------------------
def load_body():
    chunks = []
    for page in range(3, 14):  # pages 1-2 are the table of contents
        try:
            with open(f"src/{page}.txt", encoding="utf-8") as fh:
                chunks.append(fh.read())
        except FileNotFoundError:
            pass
    text = "\n".join(chunks).replace("\r", "")
    text = text.replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    return text


def parse(text):
    canon = {t[0] for t in TERMS}
    header_re = {}
    for name in canon:
        # a header is the term alone on its line, optionally with a status marker
        header_re[name] = re.compile(
            r"^\s*" + re.escape(name) + r"\s*(\(strategy\)|\(Engine\))?\s*(\(IN PROG(RESS)?\))?\s*$",
            re.IGNORECASE,
        )

    defs, current, buf = {}, None, []
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped in SECTIONS:
            continue
        hit = next((n for n, rx in header_re.items() if rx.match(stripped)), None)
        if hit:
            if current:
                defs[current] = "\n".join(buf).strip()
            current, buf = hit, []
        elif current:
            buf.append(line)
    if current:
        defs[current] = "\n".join(buf).strip()
    return defs


# --- 3. Detect definitional edges -------------------------------------------
def mention_pattern(surface):
    """Match a term plus common inflections, on word boundaries."""
    parts = surface.split()
    head, tail = parts[:-1], parts[-1]
    stem = re.escape(tail)
    if tail.lower().endswith("e"):
        stem = re.escape(tail[:-1]) + "e?"
    infl = stem + r"(?:s|es|ing|ed|d)?"
    body = r"[\s\-]+".join([re.escape(p) for p in head] + [infl])
    return re.compile(r"\b" + body + r"\b", re.IGNORECASE)


def build_edges(defs):
    surfaces = {}
    for name, alts in TERMS:
        surfaces[name] = [mention_pattern(s) for s in [name] + alts]

    edges = defaultdict(set)
    for src, body in defs.items():
        # strip the "Also known as" line so a term's own aliases don't self-match
        body = re.sub(r"^Also known as:.*$", "", body, flags=re.MULTILINE)
        for tgt, pats in surfaces.items():
            if tgt == src:
                continue
            if any(p.search(body) for p in pats):
                edges[src].add(tgt)
    return edges


# --- 4. SCC condensation + longest-path depth --------------------------------
def tarjan(nodes, edges):
    index, low, onstack, stack, out = {}, {}, set(), [], []
    counter = [0]

    def walk(v):
        work = [(v, 0)]
        while work:
            node, pi = work[-1]
            if pi == 0:
                index[node] = low[node] = counter[0]
                counter[0] += 1
                stack.append(node)
                onstack.add(node)
            recurse = False
            succs = sorted(edges.get(node, ()))
            for i in range(pi, len(succs)):
                w = succs[i]
                if w not in index:
                    work[-1] = (node, i + 1)
                    work.append((w, 0))
                    recurse = True
                    break
                elif w in onstack:
                    low[node] = min(low[node], index[w])
            if recurse:
                continue
            if low[node] == index[node]:
                comp = []
                while True:
                    w = stack.pop()
                    onstack.discard(w)
                    comp.append(w)
                    if w == node:
                        break
                out.append(comp)
            work.pop()
            if work:
                parent = work[-1][0]
                low[parent] = min(low[parent], low[node])

    for n in nodes:
        if n not in index:
            walk(n)
    return out


def compute(defs, edges):
    nodes = sorted(defs)
    comps = tarjan(nodes, edges)
    comp_of = {n: i for i, c in enumerate(comps) for n in c}

    cedges = defaultdict(set)
    for src, tgts in edges.items():
        for t in tgts:
            if comp_of[src] != comp_of[t]:
                cedges[comp_of[src]].add(comp_of[t])

    memo = {}

    def depth(ci):
        if ci in memo:
            return memo[ci]
        memo[ci] = 0  # guard
        succs = cedges.get(ci, ())
        memo[ci] = 0 if not succs else 1 + max(depth(s) for s in succs)
        return memo[ci]

    return {n: depth(comp_of[n]) for n in nodes}, comps, comp_of, cedges


# --- 5. Report ---------------------------------------------------------------
if __name__ == "__main__":
    text = load_body()
    defs = parse(text)
    missing = [n for n, _ in TERMS if n not in defs]
    edges = build_edges(defs)
    depths, comps, comp_of, cedges = compute(defs, edges)

    indeg = defaultdict(int)
    for s, ts in edges.items():
        for t in ts:
            indeg[t] += 1

    print(f"parsed {len(defs)} terms; unmatched headers: {missing or 'none'}")
    print(f"definitional edges: {sum(len(v) for v in edges.values())}")
    cycles = [sorted(c) for c in comps if len(c) > 1]
    print(f"cycles (SCCs > 1): {len(cycles)}\n")

    by_depth = defaultdict(list)
    for n, d in depths.items():
        by_depth[d].append(n)
    for d in sorted(by_depth):
        names = sorted(by_depth[d])
        print(f"depth {d}  ({len(names)})")
        print("   " + ", ".join(names) + "\n")

    print("most-referenced (in-degree):")
    for n, c in sorted(indeg.items(), key=lambda kv: -kv[1])[:12]:
        print(f"   {c:3d}  {n}")

    print("\nlargest cycles:")
    for c in sorted(cycles, key=len, reverse=True)[:5]:
        print(f"   [{len(c)}] " + ", ".join(c))

    json.dump(
        {slug(n): {"depth": d, "uses": sorted(slug(x) for x in edges.get(n, []))}
         for n, d in depths.items()},
        open("depth.json", "w"), indent=2,
    )
