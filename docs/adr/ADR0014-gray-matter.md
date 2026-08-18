---
date: 2026-08-18 16:09:22
---

Reformatted the .md files into block style for smoother maintenance.

## Problem

Term notes are edited by two writers: the build tooling and Obsidian. They disagreed on YAML formatting. The build wrote inline arrays (collection: [strategy]); Obsidian rewrites the same field as a block sequence whenever a property is edited in its UI:


collection:
  - strategy
Both are valid YAML and parse identically. The problem was a script that assumed one of them.

regen-aliases.ts read frontmatter with line-oriented regex, matching ^aliases:[ \t]*(.*)$. Against a block sequence, that pattern captures the empty string after the colon — the list items on following lines are invisible to it. The script concluded aliases was empty, computed a replacement, and substituted a single line. Because . does not match newlines in JavaScript regex, the substitution replaced only the key line and left its former list items stranded:


aliases: [play]
  - play (strategy)     # orphaned: invalid YAML
Three notes were affected. Two were structurally corrupt. A third (C0037) stayed valid YAML but silently carried a stale label, which is the worse failure — nothing detected it. check-vocab.sh also passed on the corrupt files, because its parser skips lines without a colon and never tried a real YAML parse.

## Rationale

Parse and emit frontmatter with gray-matter, never with regex. It is already a build dependency, handles both styles, and round-trips through a real YAML serializer.
Normalize all 97 notes to gray-matter's output format, which is block-sequence style — the same style Obsidian produces. Both writers now agree, so a note's shape no longer depends on which tool touched it last.
Field order is enforced explicitly by a FIELD_ORDER list shared between the two scripts. gray-matter preserves insertion order rather than imposing one, so without this the schema order would drift.
Consequences

One-time reformat: 97 files, +283 frontmatter lines (~21% growth). Non-empty arrays become block sequences; empty ones stay []; redundant quotes are dropped.
No semantic change. The build, checks, and Obsidian all read identical data.
Scripts that write notes now carry a body-preservation guard, comparing prose before and after and skipping any note that would change. Trailing-newline differences are excluded, since gray-matter always emits one.
The class of bug is closed structurally, not by convention: no hand-rolled YAML parsing remains in the note-writing path.
Known gap: check-vocab.sh still parses frontmatter with its own line-oriented Python, so it would not catch a recurrence. Closing that means asserting each note parses as YAML. Not done here.

Follow-up. check-vocab was the last component parsing frontmatter by hand. Its line-oriented Python skipped any line without a colon, so orphaned block-sequence items were invisible to it and it reported PASS on files that were not valid YAML. After the normalization to block style it was additionally reading four list fields as empty, silently disabling the relation and symmetry checks.

It has been ported to TypeScript (scripts/check-vocab.ts) and parses with gray-matter. A parse failure is now itself a check. Type assertions were added for booleans and lists, which the string-comparing parser could not express. PyYAML was not available in the environment, so keeping the script in Python would have required either a new dependency or a third hand-rolled YAML parser — both at odds with this ADR.