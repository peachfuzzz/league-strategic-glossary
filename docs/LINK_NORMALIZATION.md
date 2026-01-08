# Link Normalization Guide

The `sync_glossary.py` script automatically normalizes "See also" links from human-readable names to proper term IDs. This makes it much easier to write links in Google Docs without worrying about exact formatting.

## How It Works

### Before (Manual ID Management)
You had to write links using exact kebab-case IDs:

```
See also: wave-management, cs, minion-waves
```

This was error-prone because:
- Multi-word terms need exact hyphenation
- Easy to make typos
- Hard to remember exact IDs

### After (Automatic Normalization)
You can now write links using natural term names:

```
See also: Wave Management, CS, Minion Waves
```

The script automatically:
1. Normalizes to proper IDs (`wave-management`, `cs`, `minion-waves`)
2. Validates that linked terms exist
3. Reports any links that couldn't be resolved

## Normalization Rules

The script tries multiple strategies to resolve each link:

### 1. Exact ID Match
If you write the exact ID, it's used as-is:
```
See also: wave-management  →  wave-management ✓
```

### 2. Term Name Normalization
Human-readable names are converted to IDs:
```
See also: Wave Management   →  wave-management ✓
See also: Last Hit          →  last-hit ✓
See also: CC Buffer         →  cc-buffer ✓
```

### 3. Alternate Name Lookup
Works with alternate names defined in "Also known as":
```
Term: Creep Score
Also known as: CS

Other term can link as:
See also: Creep Score  →  creep-score ✓
See also: CS           →  creep-score ✓
```

### 4. Case-Insensitive Matching
Capitalization doesn't matter:
```
See also: wave management  →  wave-management ✓
See also: WAVE MANAGEMENT  →  wave-management ✓
See also: Wave MANAGEMENT  →  wave-management ✓
```

### 5. Special Character Handling
Punctuation and special characters are removed:
```
See also: CC-Buffer        →  cc-buffer ✓
See also: One-Trick        →  one-trick ✓
See also: Wave Management! →  wave-management ✓
```

## Validation

After normalization, the script validates all links:

### Valid Links
Links that resolve to existing completed terms:
```
[4/5] Normalizing and validating links...
  ✓ Normalized 5 link(s) to proper IDs
  ✓ All links are valid
```

### Invalid Links
Links that couldn't be resolved are reported:
```
[4/5] Normalizing and validating links...
  ✓ Normalized 3 link(s) to proper IDs

  ⚠️  Warning: Found 2 term(s) with invalid links:
    • Wave Management:
      - 'Minon Waves' (not found)
    • Last Hit:
      - 'Creep Scor' (not found)

  These links will be excluded from the synced files.
  Check spelling or ensure the linked terms are marked as completed (✓).
```

**Common reasons for invalid links:**
1. **Typo** - "Minon Waves" should be "Minion Waves"
2. **Term not completed** - Linked term exists but isn't marked with ✓
3. **Term doesn't exist** - Linked term hasn't been written yet

## Examples

### Example 1: Simple Links

**Google Doc:**
```
# Game Mechanics

## Wave Management ✓
See also: Last Hit, Minion Waves, CS

Definition here...
```

**Result:**
```markdown
---
id: wave-management
term: Wave Management
tags: [game-mechanics]
links: [last-hit, minion-waves, cs]
---
```

### Example 2: Mixed Formats

**Google Doc:**
```
## Last Hit ✓
See also: wave-management, CS, Minion Waves

Definition here...
```

**Result:**
All formats work - ID, uppercase, capitalized:
```markdown
links: [wave-management, cs, minion-waves]
```

### Example 3: Using Alternates

**Google Doc:**
```
## Creep Score ✓
Also known as: CS

## Last Hit ✓
See also: Creep Score, CS

Definition here...
```

**Result:**
Both "Creep Score" and "CS" link to `creep-score`:
```markdown
# In last-hit.md
links: [creep-score]
```

### Example 4: Verbose Output

Run with `--verbose` to see each normalization:

```bash
python scripts/sync_glossary.py --verbose
```

Output:
```
[4/5] Normalizing and validating links...
  ✓ Normalized 'Wave Management' → 'wave-management' in Last Hit
  ✓ Normalized 'Minion Waves' → 'minion-waves' in Last Hit
  ✓ Normalized 'CS' → 'creep-score' in Last Hit
  ✓ Normalized 3 link(s) to proper IDs
  ✓ All links are valid
```

## Best Practices

### 1. Use Natural Names
Write links as you would naturally refer to the term:
```
✅ See also: Wave Management, Last Hit
❌ See also: wave-management, last-hit
```

Both work, but natural names are easier to read and write.

### 2. Match Term Names Exactly
Use the exact term name for best results:
```
Term: "Wave Management"
✅ See also: Wave Management
❌ See also: Wave Mgmt
```

The script will normalize capitalization and punctuation, but the words should match.

### 3. Check Validation Output
Always review the validation output after syncing:
- ✓ Green checks mean links were normalized successfully
- ⚠️ Warnings mean some links couldn't be resolved

### 4. Fix Invalid Links Immediately
If you see invalid links:
1. Check for typos in the Google Doc
2. Ensure linked terms are marked with ✓
3. Re-run the sync script

### 5. Use Alternates for Common Abbreviations
If a term has multiple common names, add them as alternates:
```
## Creep Score ✓
Also known as: CS, Farm

# Now all of these work:
See also: Creep Score  →  creep-score
See also: CS           →  creep-score
See also: Farm         →  creep-score
```

## Troubleshooting

### "Link not found" Errors

**Problem:**
```
⚠️ Warning: Found 1 term(s) with invalid links:
  • Wave Management:
    - 'Last Hitting' (not found)
```

**Solutions:**
1. **Check spelling** - Should be "Last Hit" not "Last Hitting"
2. **Check term status** - Ensure "Last Hit" is marked with ✓
3. **Check term exists** - The term might not be in the doc yet

### Links Not Normalizing

**Problem:**
Links stay in original format instead of converting to IDs.

**Solution:**
The script only normalizes links for **completed** terms (marked with ✓). Terms without status markers are skipped entirely.

### Case Sensitivity Issues

**Problem:**
"CS" doesn't link to "Creep Score"

**Solution:**
Make sure "CS" is in the "Also known as" field of the Creep Score term:
```
## Creep Score ✓
Also known as: CS
```

## Testing

To test normalization without writing files:

```bash
python scripts/sync_glossary.py --dry-run --verbose
```

This shows:
- What links would be normalized
- What the final IDs would be
- Any validation errors
- No files are actually written

## Advanced Features

### Multiple Formats Supported

All of these resolve to the same term:
```
See also: Wave Management     (natural name)
See also: wave management     (lowercase)
See also: WAVE MANAGEMENT     (uppercase)
See also: wave-management     (exact ID)
See also: Wave-Management     (mixed case with hyphen)
```

### Comma and Spacing

Links are parsed by commas, whitespace is trimmed:
```
See also: Wave Management, Last Hit, CS
See also: Wave Management,Last Hit,CS
See also: Wave Management ,  Last Hit  , CS
```

All produce: `[wave-management, last-hit, cs]`

### Special Characters Removed

Punctuation is stripped during normalization:
```
See also: Wave Management!    →  wave-management
See also: CC-Buffer?          →  cc-buffer
See also: One "Trick"         →  one-trick
```

## Integration with Build Process

After syncing from Google Docs:

1. **Sync from Docs** - `python scripts/sync_glossary.py`
   - Normalizes links
   - Creates markdown files

2. **Build Glossary** - `npm run generate-glossary`
   - Validates links again
   - Generates TypeScript

3. **Auto-linking** - Build process also detects:
   - Terms mentioned in definitions (auto-links)
   - Manual links from frontmatter (your "See also" links)

All three types of links work together in the final app!

## Questions?

- Check the script source: [`scripts/sync_glossary.py`](../scripts/sync_glossary.py)
- See the normalization function: `normalize_and_validate_links()`
- Run with `--verbose` to see exactly what's happening
