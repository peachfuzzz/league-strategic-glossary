# Glossary Sync Script

This script syncs glossary terms from a Google Doc to markdown files for the website.

## Quick Start

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# First run (will open browser for auth)
python scripts/sync_glossary.py

# Preview changes without writing
python scripts/sync_glossary.py --dry-run

# Verbose output for debugging
python scripts/sync_glossary.py --verbose
```

## One-Time Setup

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "glossary-sync")
3. In the search bar, search for "Google Docs API" and enable it
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "Glossary Sync" (or whatever you like)
   - User support email: your email
   - Developer contact: your email
   - Scopes: no changes needed
   - Test users: add your Google account email
7. Back in Credentials, create OAuth client ID:
   - Application type: **Desktop app**
   - Name: "Glossary Sync"
8. Download the JSON file
9. Rename it to `credentials.json` and place it in the `scripts/` folder

### 2. Configure the Script

Open `scripts/sync_glossary.py` and update the `CONFIG` section:

```python
CONFIG = {
    "doc_id": "YOUR_DOC_ID_HERE",  # <-- Replace this
    ...
}
```

To find your Doc ID, look at your Google Doc URL:
```
https://docs.google.com/document/d/1ABC123xyz.../edit
                                   ^^^^^^^^^^^
                                   This is your doc ID
```

### 3. First Run

```bash
python scripts/sync_glossary.py
```

On first run, a browser window will open asking you to sign in and grant access. This only happens once - credentials are saved to `scripts/token.json`.

## Google Doc Format

The script expects your Google Doc to follow this structure:

```
Game Mechanics                    ← Heading 1 (section, becomes default tag)

Attack Reset ✓                    ← Heading 2 (term name, ✓ = completed)
Also known as: auto reset         ← Optional: alternates
Tags: game-mechanics, advanced    ← Optional: override default tag
See also: attack-cancel           ← Optional: manual links
                                  ← Blank line ends metadata
The act of resetting a champion's ← Definition body starts here
basic attack timer *after* damage
occurs...

Authors' note: Sometimes used...  ← Part of definition body

Attack Cancel (IN PROGRESS)       ← Heading 2 (skipped - not completed)
...
```

### Status Markers

- **✓** after term name = completed, will be synced
- **(IN PROGRESS)** or **(IN PROG)** = work in progress, skipped
- No marker = skipped (add ✓ when ready)

### Optional Metadata Lines

All metadata is optional. Place immediately after the term name (Heading 2):

| Line | Purpose | Example |
|------|---------|---------|
| `Also known as:` | Alternate names | `Also known as: auto reset, AA reset` |
| `Tags:` | Override section-based tag | `Tags: game-mechanics, advanced` |
| `See also:` | Manual links to other terms | `See also: buffer, flash-buffer` |

If `Tags:` is not specified, the script uses the section header (Heading 1) converted to a tag (e.g., "Game Mechanics" → "game-mechanics").

## Output

The script generates markdown files in `src/data/terms/`:

```markdown
---
id: attack-reset
term: Attack Reset
tags: [game-mechanics]
alternates: ["auto reset"]
links: [attack-cancel]
---

The act of resetting a champion's basic attack timer *after* damage occurs...
```

## Troubleshooting

### "credentials.json not found"
Download OAuth credentials from Google Cloud Console (see setup step 1).

### "Tab 'Written Definitions' not found"
Update `CONFIG["tab_name"]` in the script to match your doc's tab name exactly.

### "YOUR_DOC_ID_HERE"
You need to paste your actual Google Doc ID into the CONFIG section.

### Terms not appearing
- Make sure term uses Heading 2 style
- Add ✓ after the term name to mark as completed
- Check `--verbose` output to see what's being parsed

### Auth issues after changing scopes
Delete `scripts/token.json` and run again to re-authenticate.

## Files

| File | Purpose |
|------|---------|
| `sync_glossary.py` | Main sync script |
| `requirements.txt` | Python dependencies |
| `credentials.json` | Google OAuth credentials (you create this) |
| `token.json` | Cached auth token (auto-generated, gitignored) |
