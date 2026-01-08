# Tag Management Guide

This guide explains how tags work in the League Strategic Glossary and how to manage them effectively.

## Overview

Tags are used to categorize glossary terms and provide visual organization in both Graph and List views. The tag system is **centrally managed** through a single configuration file, making it easy to:

- See all available tags at a glance
- Manage tag colors consistently
- Add metadata like descriptions and categories
- Validate tag usage during builds

## Tag Configuration File

**Location:** [`src/data/tags.config.ts`](../src/data/tags.config.ts)

This is the **single source of truth** for all tags. Every tag used in the glossary must be defined here.

### Tag Structure

```typescript
{
  id: 'strategy',              // Kebab-case identifier (used in markdown)
  label: 'Strategy',           // Display name (shown in UI)
  color: '#3b82f6',           // Hex color for graph nodes
  description: '...',          // What this tag represents (optional)
  category: 'Content Type'     // Grouping for organization (optional)
}
```

### Adding a New Tag

1. Open [`src/data/tags.config.ts`](../src/data/tags.config.ts)
2. Add your tag to the `TAGS` array:

```typescript
{
  id: 'my-new-tag',
  label: 'My New Tag',
  color: '#ff6b6b',
  description: 'Description of what this tag represents',
  category: 'Game System'
},
```

3. Rebuild the glossary: `npm run generate-glossary`
4. Use the tag in your term markdown files

### Choosing Colors

Use hex colors that:
- Are visually distinct from existing tags
- Have good contrast on dark backgrounds
- Follow a logical color scheme (e.g., blue for strategy, green for fundamentals)

**Recommended Tailwind CSS colors:**
- Blue: `#3b82f6` - Strategy, general concepts
- Green: `#10b981` - Fundamentals, basics
- Purple: `#a855f7` - Advanced concepts, special cases
- Amber: `#f59e0b` - Economy, resources
- Red: `#ef4444` - Combat, aggressive
- Indigo: `#6366f1` - Vision, information

## Using Tags in Terms

### In Markdown Files

Tags are defined in the frontmatter of each term's markdown file:

```markdown
---
id: last-hit
term: Last Hit
tags: [game-mechanics, economy, fundamentals]
---
```

### Tag Inheritance (Google Docs Sync)

When using `sync_glossary.py` to import from Google Docs:

1. **Section headers** (Heading 1) automatically become tags
   - "Game Mechanics" → `game-mechanics` tag
2. **Additional tags** can be specified in the term metadata:
   ```
   Tags: economy, fundamentals
   ```
3. These tags **append** to the section tag (they don't override)

**Example:**
```
# Game Mechanics          ← Becomes "game-mechanics" tag

## Last Hit ✓
Tags: economy, fundamentals

Result: tags: [game-mechanics, economy, fundamentals]
```

## Tag Management Commands

Use the CLI tool to manage and analyze tags:

### List All Tags
```bash
npm run manage-tags list
```
Shows all defined tags grouped by category with colors and descriptions.

### Show Usage Statistics
```bash
npm run manage-tags usage
```
Displays how many terms use each tag, sorted by frequency.

### Find Unused Tags
```bash
npm run manage-tags unused
```
Shows tags that are defined but not used in any terms. Consider removing these or adding terms that use them.

### Find Undefined Tags
```bash
npm run manage-tags undefined
```
Shows tags used in markdown files that aren't defined in `tags.config.ts`. **These should be added to the config.**

## Tag Validation

Tags are automatically validated during the build process:

```bash
npm run generate-glossary
```

If any undefined tags are found, you'll see warnings:

```
⚠️  Found 2 undefined tag(s):
   - "unknown-tag"
   - "typo-tag"

   Add missing tags to src/data/tags.config.ts
```

**Important:** The build will complete successfully even with undefined tags, but they won't have proper colors or metadata.

## Tag Categories

Tags can be organized into categories for better management. Current categories:

### Content Type
Tags that describe the nature of the content:
- `abstract-concepts` - Theoretical concepts and mental models
- `fundamentals` - Core concepts every player should know
- `vernacular` - Common terminology and slang
- `strategy` - Strategic concepts and decision-making

### Game System
Tags related to specific game mechanics:
- `game-mechanics` - Core game mechanics and systems
- `economy` - Gold, items, and economic concepts
- `vision` - Vision control and map awareness
- `minions` - Minion waves and wave management

### Game Element
Tags for specific in-game elements:
- `jungle` - Jungle-specific concepts
- `item` - Items and item interactions
- `stat` - Champion statistics and attributes
- `summoner-spell` - Summoner spells and their usage
- `role` - Champion roles and positions
- `map` - Map locations and objectives

## How Tags Work Internally

### Build Pipeline

1. **Developer edits** `tags.config.ts` to add/modify tags
2. **Build script** (`generate-glossary-data.ts`) reads the config
3. **Validation** checks all term tags against the config
4. **Generation** creates `glossaryData.ts` with tag color mappings
5. **Components** import and use tag colors throughout the app

### Component Usage

Components can import tag utilities:

```typescript
import { getTagColor, getTagConfig, TAGS } from '@/data/tags.config';

// Get a tag's color
const color = getTagColor('strategy'); // Returns '#3b82f6'

// Get full tag configuration
const tag = getTagConfig('strategy');
console.log(tag.label);        // 'Strategy'
console.log(tag.description);  // 'Strategic concepts...'

// Get all tags
TAGS.forEach(tag => {
  console.log(`${tag.id}: ${tag.color}`);
});
```

## Best Practices

### 1. Be Consistent
- Use kebab-case for tag IDs: `game-mechanics`, not `gameMechanics` or `Game Mechanics`
- Follow the existing color scheme
- Write clear, concise descriptions

### 2. Don't Over-Tag
- Most terms should have 1-3 tags
- Focus on the term's primary categorization
- Section tags provide baseline categorization

### 3. Reuse Existing Tags
- Before adding a new tag, check if an existing tag fits
- Run `npm run manage-tags list` to see all available tags
- Similar tags create confusion and clutter

### 4. Keep Colors Distinct
- Test colors in both graph and list views
- Ensure good contrast on dark backgrounds
- Avoid similar shades of the same color

### 5. Regular Maintenance
- Periodically run `npm run manage-tags unused` to find orphaned tags
- Review tag descriptions for clarity
- Update the category structure as the glossary grows

## Migration from Old System

If you have existing tags that aren't in the config:

1. Run `npm run manage-tags undefined` to find them
2. Add missing tags to `tags.config.ts`
3. Rebuild: `npm run generate-glossary`
4. Verify: `npm run manage-tags undefined` should show "All used tags are properly defined!"

## Troubleshooting

### "Unknown tag" warnings during build
**Solution:** Add the tag to `src/data/tags.config.ts` and rebuild.

### Tag colors not updating
**Solution:** Run `npm run generate-glossary` to regenerate `glossaryData.ts`.

### Tags not showing in UI
**Solution:** Ensure the term's markdown file has valid frontmatter with a `tags` array.

### Sync script creating wrong tags
**Solution:** Check that section headers in your Google Doc match tag IDs in `tags.config.ts`.

## Future Enhancements

Potential future features for tag management:

- **Web UI** for tag configuration (no need to edit TypeScript)
- **Tag hierarchies** (parent/child relationships)
- **Custom tag metadata** (difficulty level, learning path, etc.)
- **Tag analytics** (most common combinations, tag coverage)
- **Auto-suggest tags** based on term content
- **Tag synonyms** (multiple IDs for the same tag)
- **Color themes** (swap entire color palettes)

## Questions?

If you have questions about tag management, check:
- The [main CLAUDE.md](../CLAUDE.md) for overall architecture
- The [tags.config.ts](../src/data/tags.config.ts) source code
- Run `npm run manage-tags` for CLI help
